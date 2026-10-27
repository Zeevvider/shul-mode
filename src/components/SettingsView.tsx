import React from 'react';
import {
  BatteryCharging,
  BellOff,
  Globe,
  MapPin,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sun,
} from 'lucide-react';
import {
  AllowedCaller,
  AndroidPermissionsState,
  AppSettings,
} from '../types/shulmode';
import { translations } from '../i18n/translations';
import { AllowedCallersManager } from './AllowedCallersManager';

interface SettingsViewProps {
  settings: AppSettings;
  permissions: AndroidPermissionsState;
  allowedCallers: AllowedCaller[];
  isShulModeActive: boolean;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onUpdatePermissions: (patch: Partial<AndroidPermissionsState>) => void;
  onAddCaller: (caller: Omit<AllowedCaller, 'id'>) => void;
  onUpdateCaller: (id: string, patch: Partial<AllowedCaller>) => void;
  onDeleteCaller: (id: string) => void;
  onLogCallEvent: (params: {
    callerLabel: string;
    phoneNumber: string;
    allowed: boolean;
    reason: string;
  }) => void;
  onReopenOnboarding: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  permissions,
  allowedCallers,
  isShulModeActive,
  onUpdateSettings,
  onUpdatePermissions,
  onAddCaller,
  onUpdateCaller,
  onDeleteCaller,
  onLogCallEvent,
  onReopenOnboarding,
}) => {
  const t = translations[settings.language];
  const isHe = settings.language === 'he';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
            {t.settingsTitle}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {t.settingsSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onReopenOnboarding}
          className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap self-start sm:self-center"
        >
          {isHe ? 'הפעל אשף הגדרה מחדש' : 'Run 4-Step Onboarding Wizard'}
        </button>
      </div>

      {/* Priority Allowed Callers (Numbers that can still call during Shul Mode) */}
      <AllowedCallersManager
        allowedCallers={allowedCallers}
        settings={settings}
        isShulModeActive={isShulModeActive}
        onAddCaller={onAddCaller}
        onUpdateCaller={onUpdateCaller}
        onDeleteCaller={onDeleteCaller}
        onUpdateSettings={onUpdateSettings}
        onLogCallEvent={onLogCallEvent}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Do Not Disturb Behavior & Appearance */}
        <div className="lg:col-span-6 space-y-6">
          {/* 1. Do Not Disturb Behavior */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              <BellOff className="w-4 h-4 text-amber-600" />
              <h2>{t.dndBehaviorSection}</h2>
            </div>

            <div className="space-y-2">
              {(
                [
                  { id: 'PRIORITY_ONLY', label: t.dndPriorityOnly },
                  { id: 'TOTAL_SILENCE', label: t.dndTotalSilence },
                  { id: 'ALARMS_ONLY', label: t.dndAlarmsOnly },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onUpdateSettings({ dndBehavior: mode.id })}
                  className={`w-full p-3.5 rounded-2xl border text-start text-xs font-semibold transition-colors flex items-center justify-between ${
                    settings.dndBehavior === mode.id
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span>{mode.label}</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      settings.dndBehavior === mode.id
                        ? 'border-amber-600 bg-amber-600'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {settings.dndBehavior === mode.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </button>
              ))}
            </div>

            {/* Exceptions Toggles */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2">
              {[
                {
                  key: 'allowAlarms' as const,
                  label: t.allowAlarmsLabel,
                  value: settings.allowAlarms,
                },
                {
                  key: 'allowSelectedContacts' as const,
                  label: t.allowContactsLabel,
                  value: settings.allowSelectedContacts,
                },
                {
                  key: 'allowRepeatCallers' as const,
                  label: t.allowRepeatCallersLabel,
                  value: settings.allowRepeatCallers,
                },
                {
                  key: 'emergencyExceptions' as const,
                  label: t.emergencyExceptionsLabel,
                  value: settings.emergencyExceptions,
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.value}
                    onClick={() =>
                      onUpdateSettings({ [item.key]: !item.value })
                    }
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                      item.value
                        ? 'bg-slate-900 dark:bg-amber-500 justify-end'
                        : 'bg-slate-200 dark:bg-slate-700 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-950 shadow-xs" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Appearance & Language (Full RTL Support) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              <Globe className="w-4 h-4 text-amber-600" />
              <h2>{t.appearanceSection}</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  {isHe ? 'ערכת נושא' : 'Theme'}
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                  {(
                    [
                      { id: 'light', label: t.themeLight, icon: Sun },
                      { id: 'dark', label: t.themeDark, icon: Moon },
                      { id: 'system', label: t.themeSystem, icon: Sliders },
                    ] as const
                  ).map((th) => {
                    const Icon = th.icon;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => onUpdateSettings({ theme: th.id })}
                        className={`min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                          settings.theme === th.id
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{th.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  {isHe ? 'שפה וכיוון תצוגה (RTL / LTR)' : 'Language & Layout Direction'}
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ language: 'en' })}
                    className={`min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                      settings.language === 'en'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t.langEnglish}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ language: 'he' })}
                    className={`min-h-[38px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                      settings.language === 'he'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t.langHebrew}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Automation & Android System Permissions Diagnostics */}
        <div className="lg:col-span-6 space-y-6">
          {/* 3. Automation & Geofence Sensitivity */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              <MapPin className="w-4 h-4 text-amber-600" />
              <h2>{t.automationSection}</h2>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                {
                  key: 'locationAutomationEnabled' as const,
                  label: t.locationAutoToggle,
                  value: settings.locationAutomationEnabled,
                },
                {
                  key: 'schedulingEnabled' as const,
                  label: t.scheduleAutoToggle,
                  value: settings.schedulingEnabled,
                },
                {
                  key: 'startOnBoot' as const,
                  label: t.startOnBootToggle,
                  value: settings.startOnBoot,
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.value}
                    onClick={() =>
                      onUpdateSettings({ [item.key]: !item.value })
                    }
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                      item.value
                        ? 'bg-slate-900 dark:bg-amber-500 justify-end'
                        : 'bg-slate-200 dark:bg-slate-700 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-950 shadow-xs" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 space-y-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.geofenceSensitivityLabel}
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                {([15, 30, 60] as const).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ geofenceSensitivitySeconds: sec })
                    }
                    className={`min-h-[36px] py-1.5 rounded-lg text-xs font-semibold tabular-nums transition-colors ${
                      settings.geofenceSensitivitySeconds === sec
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {sec}s {isHe ? 'שהייה' : 'Dwell'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                <BatteryCharging className="w-4 h-4 text-amber-600" />
                <span>{t.batteryGuidanceTitle}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.batteryGuidanceText}
              </p>
            </div>
          </div>

          {/* 4. Android System Permissions & Edge-Case Diagnostics */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <h2>{t.permissionsSection}</h2>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isHe
                ? 'בדוק כיצד האפליקציה מגיבה כאשר הרשאת DND נשללת או שירותי המיקום כבויים במכשיר:'
                : 'Inspect or simulate Android OS permission revocation & hardware states to verify error handling:'}
            </p>

            <div className="space-y-2.5">
              {[
                {
                  key: 'dndAccessGranted' as const,
                  title: t.permDndTitle,
                  sub: 'NotificationManager.isNotificationPolicyAccessGranted',
                  granted: permissions.dndAccessGranted,
                },
                {
                  key: 'locationServicesEnabled' as const,
                  title: isHe
                    ? 'שירותי מיקום במכשיר (GPS / Play Services)'
                    : 'Device Location Services (GPS Enabled)',
                  sub: 'LocationManager.isLocationEnabled',
                  granted: permissions.locationServicesEnabled,
                },
                {
                  key: 'backgroundLocationGranted' as const,
                  title: t.permLocationTitle,
                  sub: 'ACCESS_FINE_LOCATION + ACCESS_BACKGROUND_LOCATION',
                  granted:
                    permissions.fineLocationGranted &&
                    permissions.backgroundLocationGranted,
                },
                {
                  key: 'nativeBridgeConnected' as const,
                  title: isHe
                    ? 'חיבור גשר אנדרואיד מקורי (Hardware AutomaticZenRule)'
                    : 'Native Android APK Bridge (Hardware DND Confirmation)',
                  sub: 'AndroidShulModeBridge / AutomaticZenRule',
                  granted: permissions.nativeBridgeConnected,
                },
              ].map((perm) => (
                <div
                  key={perm.key}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {perm.title}
                    </div>
                    <div className="text-[11px] font-mono-tabular text-slate-400 truncate">
                      {perm.sub}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (perm.key === 'backgroundLocationGranted') {
                        const nextVal = !perm.granted;
                        onUpdatePermissions({
                          fineLocationGranted: nextVal,
                          backgroundLocationGranted: nextVal,
                        });
                      } else {
                        onUpdatePermissions({
                          [perm.key]: !perm.granted,
                        });
                      }
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                      perm.granted
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60'
                    }`}
                  >
                    {perm.granted ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    )}
                    <span>{perm.granted ? t.permGranted : t.permRevoked}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
