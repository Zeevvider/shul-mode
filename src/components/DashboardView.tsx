import React, { useState } from 'react';
import {
  AlertTriangle,
  BellOff,
  CalendarClock,
  CheckCircle2,
  FastForward,
  MapPin,
  PhoneCall,
  Plus,
  Power,
  Smartphone,
} from 'lucide-react';
import {
  ActiveEvaluationResult,
  AllowedCaller,
  AndroidPermissionsState,
  AppSettings,
  ManualActivationState,
  SavedLocation,
  ScheduleRule,
} from '../types/shulmode';
import { translations } from '../i18n/translations';
import { formatTimeDisplay } from '../utils/ruleEngine';
import { SanctuaryAnimation } from './SanctuaryAnimation';

interface DashboardViewProps {
  now: Date;
  evaluation: ActiveEvaluationResult;
  manualState: ManualActivationState;
  locations: SavedLocation[];
  schedules: ScheduleRule[];
  allowedCallers: AllowedCaller[];
  settings: AppSettings;
  permissions: AndroidPermissionsState;
  onToggleManual: (duration: 15 | 30 | 60 | 120 | 'UNTIL_OFF' | 'OFF') => void;
  onSimulateGeofence: (locationId: string, enter: boolean, skipDwell?: boolean) => void;
  onAddCaller: (caller: Omit<AllowedCaller, 'id'>) => void;
  onNavigateTab: (tab: 'locations' | 'schedules' | 'settings' | 'activity' | 'native') => void;
}

const QUICK_DURATIONS: (15 | 30 | 60 | 120)[] = [15, 30, 60, 120];

export const DashboardView: React.FC<DashboardViewProps> = ({
  now,
  evaluation,
  manualState,
  locations,
  schedules,
  allowedCallers,
  settings,
  permissions,
  onToggleManual,
  onSimulateGeofence,
  onAddCaller,
  onNavigateTab,
}) => {
  const t = translations[settings.language];
  const isHe = settings.language === 'he';
  const isActive = evaluation.isShulModeDesired;

  // Quick Add Priority Number state directly on Dashboard
  const [showQuickAddCaller, setShowQuickAddCaller] = useState(false);
  const [quickCallerName, setQuickCallerName] = useState('');
  const [quickCallerPhone, setQuickCallerPhone] = useState('');

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCallerPhone.trim()) return;
    onAddCaller({
      name:
        quickCallerName.trim() ||
        (isHe ? 'איש קשר מועדף' : 'Priority Contact'),
      phoneNumber: quickCallerPhone.trim(),
      category: 'FAMILY',
      bypassBehavior: 'RING_AUDIBLE',
      alwaysBypassEvenInTotalSilence: true,
      enabled: true,
    });
    setQuickCallerName('');
    setQuickCallerPhone('');
    setShowQuickAddCaller(false);
  };

  // Format remaining manual countdown if active with expiration
  let manualRemainingText = '';
  if (manualState.active && manualState.expiresAt) {
    const diffSec = Math.max(
      0,
      Math.floor((manualState.expiresAt - now.getTime()) / 1000)
    );
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    manualRemainingText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const enabledCallers = allowedCallers.filter((c) => c.enabled);

  return (
    <div className="space-y-6">
      {/* Blocking Permission or Location Error Banner */}
      {evaluation.blockingError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-red-900 dark:text-red-200 font-medium">
              {evaluation.blockingError}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('settings')}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-red-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 self-start sm:self-center"
          >
            {isHe ? 'תקן בהגדרות' : 'Fix in Settings'}
          </button>
        </div>
      )}

      {/* GPS Drift Hysteresis Dwell Verification Banner */}
      {evaluation.driftPendingLocations.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-amber-900 dark:text-amber-300">
              {t.dwellPendingBadge} · {evaluation.driftPendingLocations[0].location.name}
            </div>
            <p className="text-xs text-amber-800/80 dark:text-amber-400/80 tabular-nums">
              {isHe
                ? `מאמת יציבות קליטת GPS בתוך הרדיוס: ${evaluation.driftPendingLocations[0].elapsedSeconds} / ${evaluation.driftPendingLocations[0].requiredSeconds} שניות`
                : `Verifying sustained geofence dwell to prevent GPS drift switching: ${evaluation.driftPendingLocations[0].elapsedSeconds}s / ${evaluation.driftPendingLocations[0].requiredSeconds}s`}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onSimulateGeofence(
                evaluation.driftPendingLocations[0].location.id,
                true,
                true
              )
            }
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{isHe ? 'אמת שהייה מיד' : 'Complete Dwell Now'}</span>
          </button>
        </div>
      )}

      {/* Main Hero Grid: Dominant Status & Manual Activation Control + Active Rules Context */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left/Primary Column: Sanctuary Status & Interactive Master Control */}
        <div
          className={`lg:col-span-7 p-6 md:p-8 rounded-3xl border transition-colors duration-300 flex flex-col justify-between ${
            isActive
              ? 'bg-slate-900 text-white border-amber-500/40 shadow-lg'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800'
          }`}
        >
          {/* Top Honest OS State Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-6 border-b border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-xs">
              {evaluation.isOsDndConfirmed ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t.osHardwareDndConfirmed}</span>
                </span>
              ) : (
                <span
                  className={`flex items-center gap-1.5 ${
                    isActive
                      ? 'text-amber-300/90'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>{t.osWebPreviewNotice}</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('settings')}
              className={`text-xs font-medium underline underline-offset-4 whitespace-nowrap ${
                isActive
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.navSettings}
            </button>
          </div>

          {/* Center Sanctuary Status & Large Interactive Toggle */}
          <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-start gap-5">
              <SanctuaryAnimation active={isActive} />
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-amber-500 flex items-center justify-center sm:justify-start gap-1.5">
                  <span>
                    {settings.dndBehavior === 'TOTAL_SILENCE'
                      ? isHe
                        ? 'שקט מוחלט'
                        : 'Total Silence'
                      : settings.dndBehavior === 'ALARMS_ONLY'
                      ? isHe
                        ? 'שעונים מעוררים בלבד'
                        : 'Alarms Only'
                      : isHe
                      ? 'נא לא להפריע (עדיפות)'
                      : 'Priority Do Not Disturb'}
                  </span>
                  {manualRemainingText && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        {t.remainingTime}: {manualRemainingText}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                  {isActive ? t.statusActive : t.statusInactive}
                </h1>
                <p
                  className={`text-sm max-w-md ${
                    isActive
                      ? 'text-slate-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isActive ? t.statusSubActive : t.statusSubInactive}
                </p>
              </div>
            </div>

            {/* Large Accessible Master Toggle Button */}
            <button
              type="button"
              onClick={() =>
                manualState.active
                  ? onToggleManual('OFF')
                  : onToggleManual('UNTIL_OFF')
              }
              aria-pressed={manualState.active}
              className={`min-h-[64px] px-6 py-4 rounded-2xl font-semibold text-sm flex items-center gap-3 transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer ${
                manualState.active
                  ? 'bg-amber-400 text-slate-950 shadow-md hover:bg-amber-300'
                  : isActive
                  ? 'bg-slate-800 text-amber-300 border border-amber-400/40 hover:bg-slate-700'
                  : 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:opacity-95 shadow-sm'
              }`}
            >
              <Power className="w-5 h-5" />
              <span>
                {manualState.active ? t.deactivateNow : t.activateNow}
              </span>
            </button>
          </div>

          {/* Quick Duration Buttons: 15, 30, 60, 120 minutes, or Until Turned Off */}
          <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span
                className={
                  isActive
                    ? 'text-slate-300 font-medium'
                    : 'text-slate-600 dark:text-slate-400 font-medium'
                }
              >
                {t.quickDurationTitle}
              </span>
              {manualState.active && (
                <button
                  type="button"
                  onClick={() => onToggleManual('OFF')}
                  className="text-amber-400 hover:underline font-medium"
                >
                  {isHe ? 'בטל הפעלה ידנית' : 'Clear Manual Timer'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {QUICK_DURATIONS.map((mins) => {
                const isSelected =
                  manualState.active && manualState.durationMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onToggleManual(mins)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold tabular-nums transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950'
                        : isActive
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {mins} {t.minutesShort}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => onToggleManual('UNTIL_OFF')}
                className={`col-span-2 sm:col-span-1 min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap truncate ${
                  manualState.active &&
                  manualState.durationMinutes === 'UNTIL_OFF'
                    ? 'bg-amber-400 text-slate-950'
                    : isActive
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                {t.untilTurnedOff}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Active Reason Breakdown, Current Location Rule, Next Scheduled Activation */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          {/* Card 1: Current Active Reason(s) */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t.activeReasonsLabel}
              </span>
              <BellOff className="w-4 h-4 text-amber-600" />
            </div>

            {evaluation.activeReasons.length === 0 ? (
              <div className="text-sm text-slate-600 dark:text-slate-400 py-1">
                {t.reasonNone}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {evaluation.activeReasons.map((reason, idx) => (
                    <React.Fragment key={reason}>
                      {idx > 0 && (
                        <span className="text-slate-400" aria-hidden="true">
                          ·
                        </span>
                      )}
                      <span className="text-amber-700 dark:text-amber-400">
                        {reason === 'MANUAL' && t.reasonManual}
                        {reason === 'LOCATION' && t.reasonLocation}
                        {reason === 'SCHEDULE' && t.reasonSchedule}
                      </span>
                    </React.Fragment>
                  ))}
                </div>

                {evaluation.activeScheduleRules.length > 0 && (
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {isHe ? 'תזמון פעיל:' : 'Active Schedule:'}{' '}
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {evaluation.activeScheduleRules.map((s) => s.name).join(', ')}
                    </span>
                  </div>
                )}

                {evaluation.activeReasons.length > 1 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                    {t.multiRuleNotice}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Current Location Rule & Quick Geofence Arrival Simulator */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t.currentLocationRule}
              </span>
              <MapPin className="w-4 h-4 text-amber-600" />
            </div>

            {evaluation.activeLocationRules.length > 0 ? (
              <div className="space-y-2">
                {evaluation.activeLocationRules.map((loc) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {loc.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {t.insideGeofenceBadge} · {loc.radiusMeters}m
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSimulateGeofence(loc.id, false)}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                    >
                      {t.simulateExitBtn}
                    </button>
                  </div>
                ))}
              </div>
            ) : locations.length > 0 ? (
              <div className="space-y-2.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isHe
                    ? 'אין נוכחות פעילה כעת בתוך רדיוס בית כנסת שמור. ניתן לבדוק כניסה:'
                    : 'Not currently inside a saved synagogue radius. Test geofence entry:'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {locations.slice(0, 2).map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => onSimulateGeofence(loc.id, true, true)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {isHe ? `היכנס ל-${loc.name}` : `Arrive at ${loc.name}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {isHe ? 'טרם נוספו בתי כנסת' : 'No saved synagogues yet'}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('locations')}
                  className="text-xs font-semibold text-amber-600 hover:underline"
                >
                  {t.addLocationBtn}
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Next Scheduled Activation */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t.nextScheduledLabel}
              </span>
              <CalendarClock className="w-4 h-4 text-amber-600" />
            </div>

            {evaluation.nextScheduledActivation ? (
              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  <div className="text-base font-semibold text-slate-900 dark:text-white">
                    {evaluation.nextScheduledActivation.schedule.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular mt-0.5">
                    {evaluation.nextScheduledActivation.formattedStart} –{' '}
                    {formatTimeDisplay(
                      evaluation.nextScheduledActivation.schedule.endTime,
                      settings.language
                    )}
                  </div>
                </div>
                <div className="text-end text-xs font-mono-tabular text-amber-700 dark:text-amber-400 font-medium whitespace-nowrap">
                  {t.startsIn}{' '}
                  {evaluation.nextScheduledActivation.startsInMinutes >= 60
                    ? `${Math.floor(
                        evaluation.nextScheduledActivation.startsInMinutes / 60
                      )}${t.hoursShort} ${
                        evaluation.nextScheduledActivation.startsInMinutes % 60
                      }${t.minutesShort}`
                    : `${evaluation.nextScheduledActivation.startsInMinutes} ${t.minutesShort}`}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t.noUpcomingSchedules}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('schedules')}
                  className="text-xs font-semibold text-amber-600 hover:underline"
                >
                  {t.addScheduleBtn}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Summary Strip: Saved Locations, Active Schedules & Priority Allowed Callers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t.navLocations}
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {locations.filter((l) => l.enabled).length}{' '}
              <span className="text-xs font-normal text-slate-500">
                / {locations.length} {isHe ? 'פעילים' : 'enabled'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('locations')}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200/70 transition-colors"
          >
            {isHe ? 'נהל מיקומים' : 'Manage'}
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t.navSchedules}
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {schedules.filter((s) => s.enabled).length}{' '}
              <span className="text-xs font-normal text-slate-500">
                / {schedules.length} {isHe ? 'פעילים' : 'enabled'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('schedules')}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200/70 transition-colors"
          >
            {isHe ? 'נהל תזמונים' : 'Schedules'}
          </button>
        </div>

        {/* Priority Allowed Callers Card with Quick Add */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.allowedCallersTitle}</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {enabledCallers.length}{' '}
                <span className="text-xs font-normal text-slate-500">
                  {enabledCallers.length > 0
                    ? `· ${enabledCallers.map((c) => c.name).slice(0, 2).join(', ')}`
                    : isHe
                    ? 'מספרים מורשים'
                    : 'numbers allowed'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowQuickAddCaller((v) => !v)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isHe ? 'הוסף מספר' : 'Add Number'}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 whitespace-nowrap"
              >
                {isHe ? 'כל המספרים' : 'All'}
              </button>
            </div>
          </div>

          {showQuickAddCaller && (
            <form
              onSubmit={handleQuickAddSubmit}
              className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2"
            >
              <input
                type="text"
                required
                value={quickCallerName}
                onChange={(e) => setQuickCallerName(e.target.value)}
                placeholder={isHe ? 'שם (למשל: אשתי)' : 'Name (e.g., Spouse)'}
                className="sm:col-span-4 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <input
                type="tel"
                required
                dir="ltr"
                value={quickCallerPhone}
                onChange={(e) => setQuickCallerPhone(e.target.value)}
                placeholder="+1 (555) 234-5678"
                className="sm:col-span-5 px-3 py-1.5 text-xs font-mono-tabular rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="sm:col-span-3 min-h-[34px] px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold whitespace-nowrap"
              >
                {isHe ? 'שמור' : 'Save'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
