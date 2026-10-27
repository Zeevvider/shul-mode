import React, { useState } from 'react';
import {
  Check,
  Clock,
  Edit3,
  MapPin,
  Moon,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ActivationConditionType,
  AppSettings,
  SavedLocation,
  ScheduleRule,
} from '../types/shulmode';
import { translations } from '../i18n/translations';
import {
  formatTimeDisplay,
  isTimeWindowActive,
  parseTimeMinutes,
} from '../utils/ruleEngine';

interface SchedulesViewProps {
  now: Date;
  schedules: ScheduleRule[];
  locations: SavedLocation[];
  settings: AppSettings;
  onAddSchedule: (sched: Omit<ScheduleRule, 'id'>) => void;
  onUpdateSchedule: (id: string, patch: Partial<ScheduleRule>) => void;
  onDeleteSchedule: (id: string) => void;
}

export const SchedulesView: React.FC<SchedulesViewProps> = ({
  now,
  schedules,
  locations,
  settings,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
}) => {
  const t = translations[settings.language];
  const isHe = settings.language === 'he';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:30');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [conditionType, setConditionType] =
    useState<ActivationConditionType>('TIME_ONLY');
  const [linkedLocationId, setLinkedLocationId] = useState<string>(
    locations[0]?.id || ''
  );

  const crossesMidnight =
    parseTimeMinutes(endTime) <= parseTimeMinutes(startTime) &&
    startTime !== endTime;

  const handleToggleDay = (dayIdx: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(dayIdx)
        ? prev.filter((d) => d !== dayIdx)
        : [...prev, dayIdx].sort()
    );
  };

  const handleStartEdit = (sched: ScheduleRule) => {
    setEditingId(sched.id);
    setName(sched.name);
    setStartTime(sched.startTime);
    setEndTime(sched.endTime);
    setDaysOfWeek(sched.daysOfWeek);
    setConditionType(sched.conditionType);
    setLinkedLocationId(sched.linkedLocationId || locations[0]?.id || '');
  };

  const handleReset = () => {
    setEditingId(null);
    setName('');
    setStartTime('07:00');
    setEndTime('08:30');
    setDaysOfWeek([0, 1, 2, 3, 4, 5]);
    setConditionType('TIME_ONLY');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName =
      name.trim() || (isHe ? 'תזמון תפילה' : 'Prayer Schedule');

    const payload: Omit<ScheduleRule, 'id'> = {
      name: cleanName,
      startTime,
      endTime,
      daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : [0, 1, 2, 3, 4],
      enabled: true,
      conditionType,
      linkedLocationId:
        conditionType !== 'TIME_ONLY'
          ? linkedLocationId || locations[0]?.id
          : undefined,
    };

    if (editingId) {
      onUpdateSchedule(editingId, payload);
    } else {
      onAddSchedule(payload);
    }
    handleReset();
  };

  const handleQuickPreset = (
    preset: 'shacharit' | 'learning' | 'mincha' | 'night'
  ) => {
    if (preset === 'shacharit') {
      onAddSchedule({
        name: isHe ? 'שחרית' : 'Shacharit',
        startTime: '07:00',
        endTime: '08:30',
        daysOfWeek: [0, 1, 2, 3, 4, 5],
        enabled: true,
        conditionType: 'TIME_ONLY',
      });
    } else if (preset === 'learning') {
      onAddSchedule({
        name: isHe ? 'סדר בוקר' : 'Morning Learning',
        startTime: '09:00',
        endTime: '13:00',
        daysOfWeek: [0, 1, 2, 3, 4],
        enabled: true,
        conditionType: 'TIME_ONLY',
      });
    } else if (preset === 'mincha') {
      onAddSchedule({
        name: isHe ? 'מנחה ומעריב' : 'Mincha & Maariv',
        startTime: '18:00',
        endTime: '19:00',
        daysOfWeek: [0, 1, 2, 3, 4],
        enabled: true,
        conditionType: 'TIME_ONLY',
      });
    } else if (preset === 'night') {
      onAddSchedule({
        name: isHe ? 'משמר ליל שישי' : 'Late Night Seder (Mishmar)',
        startTime: '23:00',
        endTime: '01:30',
        daysOfWeek: [4],
        enabled: true,
        conditionType: locations[0] ? 'TIME_AND_LOCATION' : 'TIME_ONLY',
        linkedLocationId: locations[0]?.id,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
          {t.schedulesTitle}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          {t.schedulesSubtitle}
        </p>
      </div>

      {/* Quick Presets Row */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {t.presetsTitle}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleQuickPreset('shacharit')}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.presetShacharit} · 7:00–8:30 AM</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('learning')}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.presetLearning} · 9:00 AM–1:00 PM</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('mincha')}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.presetMinchaMaariv} · 6:00–7:00 PM</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('night')}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <Moon className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.presetNightSeder} · 11:00 PM–1:30 AM</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout: Editor on Left, Unlimited Schedules List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Schedule Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
        >
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {editingId
              ? isHe
                ? 'עריכת תזמון'
                : 'Edit Schedule'
              : t.addScheduleBtn}
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.scheduleNameLabel}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isHe ? 'לדוגמה: שחרית / סדר ערב' : 'e.g., Shacharit, Daf Yomi, Mincha'}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.startTimeLabel}
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-mono-tabular rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.endTimeLabel}
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-mono-tabular rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {crossesMidnight && (
            <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 shrink-0" />
              <span>{t.crossesMidnightNote}</span>
            </div>
          )}

          {/* Days of the Week */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.daysOfWeekLabel}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {t.daysShort.map((label, idx) => {
                const active = daysOfWeek.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggleDay(idx)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 Scheduling Conditions */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.conditionTypeLabel}
            </label>
            <div className="space-y-2">
              {(
                [
                  { id: 'TIME_ONLY', label: t.condTimeOnly },
                  { id: 'TIME_AND_LOCATION', label: t.condTimeAndLocation },
                  { id: 'LOCATION_ONLY', label: t.condLocationOnly },
                ] as { id: ActivationConditionType; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setConditionType(opt.id)}
                  className={`w-full p-3 rounded-xl border text-start text-xs font-medium transition-colors flex items-center justify-between gap-2 ${
                    conditionType === opt.id
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span>{opt.label}</span>
                  {conditionType === opt.id && (
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {conditionType !== 'TIME_ONLY' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.linkedLocationLabel}
              </label>
              <select
                value={linkedLocationId}
                onChange={(e) => setLinkedLocationId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.radiusMeters}m)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={handleReset}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                {t.cancelBtn}
              </button>
            )}
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold flex items-center gap-2 hover:opacity-95 transition-opacity whitespace-nowrap"
            >
              {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{t.saveScheduleBtn}</span>
            </button>
          </div>
        </form>

        {/* Schedules List */}
        <div className="lg:col-span-7 space-y-3">
          {schedules.map((sched) => {
            const linkedLoc = locations.find(
              (l) => l.id === sched.linkedLocationId
            );
            const isTimeActiveNow = isTimeWindowActive(
              now,
              sched.startTime,
              sched.endTime,
              sched.daysOfWeek
            );
            const isOvernight =
              parseTimeMinutes(sched.endTime) <=
                parseTimeMinutes(sched.startTime) &&
              sched.startTime !== sched.endTime;

            return (
              <div
                key={sched.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-colors ${
                  isTimeActiveNow && sched.enabled
                    ? 'border-amber-500/70 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {sched.name}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono-tabular">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-slate-200">
                        {formatTimeDisplay(sched.startTime, settings.language)} –{' '}
                        {formatTimeDisplay(sched.endTime, settings.language)}
                      </span>
                      {isOvernight && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-600 dark:text-amber-400">
                            {isHe ? 'חוצה חצות' : 'Overnight'}
                          </span>
                        </>
                      )}
                      {isTimeActiveNow && sched.enabled && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                            {isHe ? 'בחלון זמן פעיל כעת' : 'In active window now'}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Days & Condition Metadata (unboxed with · separator) */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span>
                        {sched.daysOfWeek
                          .map((d) => t.daysShort[d])
                          .join(', ')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {sched.conditionType === 'TIME_ONLY' &&
                          (isHe ? 'לפי זמן בלבד' : 'Time Only')}
                        {sched.conditionType === 'LOCATION_ONLY' &&
                          (isHe ? 'לפי מיקום בלבד' : 'Location Only')}
                        {sched.conditionType === 'TIME_AND_LOCATION' &&
                          (isHe ? 'זמן + מיקום' : 'Time AND Location')}
                      </span>
                      {linkedLoc && sched.conditionType !== 'TIME_ONLY' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            {linkedLoc.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Enable / Disable Toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={sched.enabled}
                    onClick={() =>
                      onUpdateSchedule(sched.id, { enabled: !sched.enabled })
                    }
                    className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 flex items-center ${
                      sched.enabled
                        ? 'bg-slate-900 dark:bg-amber-500 justify-end'
                        : 'bg-slate-200 dark:bg-slate-700 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-950 shadow-xs" />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(sched)}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t.editBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSchedule(sched.id)}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.deleteBtn}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
