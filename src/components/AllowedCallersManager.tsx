import React, { useState } from 'react';
import {
  Check,
  Edit3,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Plus,
  Trash2,
  Vibrate,
  Volume2,
} from 'lucide-react';
import {
  AllowedCaller,
  AppSettings,
  CallerBypassBehavior,
  CallerCategory,
} from '../types/shulmode';
import { translations } from '../i18n/translations';

interface AllowedCallersManagerProps {
  allowedCallers: AllowedCaller[];
  settings: AppSettings;
  isShulModeActive: boolean;
  onAddCaller: (caller: Omit<AllowedCaller, 'id'>) => void;
  onUpdateCaller: (id: string, patch: Partial<AllowedCaller>) => void;
  onDeleteCaller: (id: string) => void;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onLogCallEvent: (params: {
    callerLabel: string;
    phoneNumber: string;
    allowed: boolean;
    reason: string;
  }) => void;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export const AllowedCallersManager: React.FC<AllowedCallersManagerProps> = ({
  allowedCallers,
  settings,
  isShulModeActive,
  onAddCaller,
  onUpdateCaller,
  onDeleteCaller,
  onUpdateSettings,
  onLogCallEvent,
}) => {
  const t = translations[settings.language];
  const isHe = settings.language === 'he';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [category, setCategory] = useState<CallerCategory>('FAMILY');
  const [bypassBehavior, setBypassBehavior] =
    useState<CallerBypassBehavior>('RING_AUDIBLE');
  const [alwaysBypassEvenInTotalSilence, setAlwaysBypassEvenInTotalSilence] =
    useState(true);

  // Incoming Call Simulator state
  const [testNumberInput, setTestNumberInput] = useState('');
  const [recentCallAttempts, setRecentCallAttempts] = useState<
    Record<string, number[]>
  >({});
  const [lastCallResult, setLastCallResult] = useState<{
    callerName: string;
    phoneNumber: string;
    allowed: boolean;
    deliveryMode: 'RING_AUDIBLE' | 'VIBRATE_ONLY' | 'SILENCED';
    explanation: string;
  } | null>(null);

  const handleStartEdit = (caller: AllowedCaller) => {
    setEditingId(caller.id);
    setName(caller.name);
    setPhoneNumber(caller.phoneNumber);
    setCategory(caller.category);
    setBypassBehavior(caller.bypassBehavior);
    setAlwaysBypassEvenInTotalSilence(caller.alwaysBypassEvenInTotalSilence);
  };

  const handleReset = () => {
    setEditingId(null);
    setName('');
    setPhoneNumber('');
    setCategory('FAMILY');
    setBypassBehavior('RING_AUDIBLE');
    setAlwaysBypassEvenInTotalSilence(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    const cleanName =
      name.trim() || (isHe ? 'איש קשר מועדף' : 'Priority Contact');
    const cleanPhone = phoneNumber.trim();

    if (editingId) {
      onUpdateCaller(editingId, {
        name: cleanName,
        phoneNumber: cleanPhone,
        category,
        bypassBehavior,
        alwaysBypassEvenInTotalSilence,
      });
    } else {
      onAddCaller({
        name: cleanName,
        phoneNumber: cleanPhone,
        category,
        bypassBehavior,
        alwaysBypassEvenInTotalSilence,
        enabled: true,
      });
      // Automatically ensure allowSelectedContacts is enabled when adding a number
      if (!settings.allowSelectedContacts) {
        onUpdateSettings({ allowSelectedContacts: true });
      }
    }
    handleReset();
  };

  const handleSimulateIncomingCall = (inputPhone: string) => {
    const rawPhone = inputPhone.trim() || '+1 (555) 890-1234';
    const normInput = normalizePhone(rawPhone);
    const nowMs = Date.now();

    // Record attempt for Repeat Caller tracking (within 15 min window)
    const prevAttempts = (recentCallAttempts[normInput] || []).filter(
      (ts) => nowMs - ts < 15 * 60 * 1000
    );
    const updatedAttempts = [...prevAttempts, nowMs];
    setRecentCallAttempts((prev) => ({
      ...prev,
      [normInput]: updatedAttempts,
    }));

    const matchedCaller = allowedCallers.find(
      (c) =>
        c.enabled &&
        normalizePhone(c.phoneNumber) === normInput &&
        normInput.length > 0
    );

    const callerDisplayName = matchedCaller
      ? matchedCaller.name
      : isHe
      ? 'מספר לא שמור ברשימה'
      : 'Unlisted Caller';

    // Case 1: Shul Mode is currently OFF
    if (!isShulModeActive) {
      const explanation = isHe
        ? 'מצב בית כנסת כבוי כעת — השיחה מצלצלת כרגיל.'
        : 'Shul Mode is currently OFF — call rings normally.';
      setLastCallResult({
        callerName: callerDisplayName,
        phoneNumber: rawPhone,
        allowed: true,
        deliveryMode: 'RING_AUDIBLE',
        explanation,
      });
      onLogCallEvent({
        callerLabel: callerDisplayName,
        phoneNumber: rawPhone,
        allowed: true,
        reason: explanation,
      });
      return;
    }

    // Case 2: Shul Mode is ON and caller matches an enabled AllowedCaller
    if (matchedCaller && settings.allowSelectedContacts) {
      if (
        settings.dndBehavior === 'TOTAL_SILENCE' &&
        !matchedCaller.alwaysBypassEvenInTotalSilence
      ) {
        const explanation = isHe
          ? `המספר של ${matchedCaller.name} מורשה, אך מצב "שקט מוחלט" פעיל ולמספר זה לא הוגדרה עקיפת שקט מוחלט.`
          : `${matchedCaller.name} is on your Allowed List, but Total Silence mode is active and emergency override is off for this number.`;
        setLastCallResult({
          callerName: matchedCaller.name,
          phoneNumber: rawPhone,
          allowed: false,
          deliveryMode: 'SILENCED',
          explanation,
        });
        onLogCallEvent({
          callerLabel: matchedCaller.name,
          phoneNumber: rawPhone,
          allowed: false,
          reason: explanation,
        });
        return;
      }

      const explanation =
        matchedCaller.bypassBehavior === 'RING_AUDIBLE'
          ? isHe
            ? `שיחה אושרה: ${matchedCaller.name} מופיע ברשימת המספרים המורשים — הטלפון מצלצל.`
            : `Call Allowed Through: ${matchedCaller.name} is on your Allowed Numbers list — phone rings audibly.`
          : isHe
          ? `שיחה אושרה (רטט): ${matchedCaller.name} מופיע ברשימת המספרים המורשים — הטלפון רוטט.`
          : `Call Allowed Through (Vibrate): ${matchedCaller.name} is on your Allowed Numbers list — phone vibrates discreetly.`;

      setLastCallResult({
        callerName: matchedCaller.name,
        phoneNumber: rawPhone,
        allowed: true,
        deliveryMode: matchedCaller.bypassBehavior,
        explanation,
      });
      onLogCallEvent({
        callerLabel: matchedCaller.name,
        phoneNumber: rawPhone,
        allowed: true,
        reason: explanation,
      });
      return;
    }

    // Case 3: Repeat Caller Rule (2nd call from same number within 15 minutes)
    if (
      settings.allowRepeatCallers &&
      updatedAttempts.length >= 2 &&
      settings.dndBehavior !== 'TOTAL_SILENCE'
    ) {
      const explanation = isHe
        ? `שיחה שנייה מאותו מספר (${rawPhone}) תוך 15 דקות — אושרה לפי חוק מתקשרים חוזרים.`
        : `2nd call from ${rawPhone} within 15 minutes — allowed through by Repeat Caller protection.`;
      setLastCallResult({
        callerName: callerDisplayName,
        phoneNumber: rawPhone,
        allowed: true,
        deliveryMode: 'RING_AUDIBLE',
        explanation,
      });
      onLogCallEvent({
        callerLabel: callerDisplayName,
        phoneNumber: rawPhone,
        allowed: true,
        reason: explanation,
      });
      return;
    }

    // Case 4: Silenced by ShulMode
    const explanation =
      matchedCaller && !settings.allowSelectedContacts
        ? isHe
          ? 'האפשרות "אפשר מספרים מורשים" כבויה בהגדרות DND — השיחה הושתקה.'
          : '"Allow Listed Priority Numbers" is disabled in DND settings — call silenced.'
        : settings.allowRepeatCallers
        ? isHe
          ? `שיחה הושתקה ע״י ShulMode (שיחה ראשונה). חיוג נוסף תוך 15 דקות יעבור בזכות חוק מתקשרים חוזרים.`
          : `Call silenced by ShulMode (Attempt 1 of 2). Calling again within 15 minutes will ring through.`
        : isHe
        ? 'המספר אינו ברשימת המספרים המורשים — השיחה הושתקה ע״י ShulMode.'
        : 'Number is not on the Allowed Callers list — call silenced by ShulMode.';

    setLastCallResult({
      callerName: callerDisplayName,
      phoneNumber: rawPhone,
      allowed: false,
      deliveryMode: 'SILENCED',
      explanation,
    });
    onLogCallEvent({
      callerLabel: callerDisplayName,
      phoneNumber: rawPhone,
      allowed: false,
      reason: explanation,
    });
  };

  const getCategoryLabel = (cat: CallerCategory) => {
    switch (cat) {
      case 'FAMILY':
        return t.catFamily;
      case 'EMERGENCY':
        return t.catEmergency;
      case 'SCHOOL_CHILDCARE':
        return t.catSchool;
      default:
        return t.catOther;
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
      {/* Header & Master Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <PhoneCall className="w-5 h-5 text-amber-600" />
            <h2>{t.allowedCallersTitle}</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.allowedCallersSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {isHe ? 'אפשר שיחות ממספרים אלו' : 'Bypass Enabled'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.allowSelectedContacts}
            onClick={() =>
              onUpdateSettings({
                allowSelectedContacts: !settings.allowSelectedContacts,
              })
            }
            className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 flex items-center ${
              settings.allowSelectedContacts
                ? 'bg-slate-900 dark:bg-amber-500 justify-end'
                : 'bg-slate-200 dark:bg-slate-700 justify-start'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-950 shadow-xs" />
          </button>
        </div>
      </div>

      {/* 2-Column Grid: Add/Edit Allowed Number Form + Saved Priority Numbers List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form to Add or Edit a Phone Number */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-4"
        >
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {editingId
              ? isHe
                ? 'עריכת מספר מורשה'
                : 'Edit Allowed Number'
              : t.addCallerBtn}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.callerNameLabel}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.callerNamePlaceholder}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.callerPhoneLabel}
            </label>
            <input
              type="tel"
              required
              dir="ltr"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t.callerPhonePlaceholder}
              className="w-full px-3.5 py-2 text-sm font-mono-tabular rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.callerCategoryLabel}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CallerCategory)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="FAMILY">{t.catFamily}</option>
                <option value="EMERGENCY">{t.catEmergency}</option>
                <option value="SCHOOL_CHILDCARE">{t.catSchool}</option>
                <option value="OTHER">{t.catOther}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.bypassModeLabel}
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setBypassBehavior('RING_AUDIBLE')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${
                    bypassBehavior === 'RING_AUDIBLE'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{t.bypassRing}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBypassBehavior('VIBRATE_ONLY')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${
                    bypassBehavior === 'VIBRATE_ONLY'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Vibrate className="w-3.5 h-3.5" />
                  <span>{t.bypassVibrate}</span>
                </button>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={alwaysBypassEvenInTotalSilence}
              onChange={(e) =>
                setAlwaysBypassEvenInTotalSilence(e.target.checked)
              }
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-amber-500"
            />
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {t.overrideTotalSilenceLabel}
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={handleReset}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                {t.cancelBtn}
              </button>
            )}
            <button
              type="submit"
              className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold flex items-center gap-1.5 hover:opacity-95 transition-opacity whitespace-nowrap"
            >
              {editingId ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>
                {editingId
                  ? isHe
                    ? 'עדכן מספר'
                    : 'Update Number'
                  : t.addCallerBtn}
              </span>
            </button>
          </div>
        </form>

        {/* Right Column: Allowed Numbers List + Live Incoming Call Filter Simulator */}
        <div className="lg:col-span-7 space-y-4">
          {allowedCallers.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
              {t.noAllowedCallers}
            </div>
          ) : (
            <div className="space-y-2.5">
              {allowedCallers.map((caller) => (
                <div
                  key={caller.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        caller.enabled
                          ? 'bg-slate-900 dark:bg-amber-500/20 text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {caller.name}
                      </div>
                      {/* Clean unboxed metadata with · separators */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span
                          dir="ltr"
                          className="font-mono-tabular font-medium text-slate-700 dark:text-slate-300"
                        >
                          {caller.phoneNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{getCategoryLabel(caller.category)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-700 dark:text-amber-400 font-medium">
                          {caller.bypassBehavior === 'RING_AUDIBLE'
                            ? t.bypassRing
                            : t.bypassVibrate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleSimulateIncomingCall(caller.phoneNumber)
                      }
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <PhoneIncoming className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isHe ? 'בדוק שיחה' : 'Test Call'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(caller)}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      title={t.editBtn}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteCaller(caller.id)}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      title={t.deleteBtn}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={caller.enabled}
                      onClick={() =>
                        onUpdateCaller(caller.id, { enabled: !caller.enabled })
                      }
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                        caller.enabled
                          ? 'bg-slate-900 dark:bg-amber-500 justify-end'
                          : 'bg-slate-200 dark:bg-slate-700 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-950 shadow-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Incoming Call Filter Tester */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.testCallSectionTitle}
              </span>
              <span className="text-xs text-slate-500">
                {isShulModeActive
                  ? isHe
                    ? 'מצב בית כנסת: פעיל'
                    : 'Shul Mode: ON'
                  : isHe
                  ? 'מצב בית כנסת: כבוי'
                  : 'Shul Mode: OFF'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="tel"
                dir="ltr"
                value={testNumberInput}
                onChange={(e) => setTestNumberInput(e.target.value)}
                placeholder={t.testCallPlaceholder}
                className="flex-1 px-3.5 py-2 text-xs font-mono-tabular rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleSimulateIncomingCall(testNumberInput)}
                className="min-h-[38px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <PhoneIncoming className="w-3.5 h-3.5" />
                <span>{t.testCallBtn}</span>
              </button>
            </div>

            {lastCallResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                  lastCallResult.allowed
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70 text-emerald-950 dark:text-emerald-200'
                    : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/70 text-amber-950 dark:text-amber-200'
                }`}
              >
                {lastCallResult.allowed ? (
                  <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <PhoneOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="font-semibold">
                    {lastCallResult.callerName} ({lastCallResult.phoneNumber})
                  </div>
                  <p className="leading-relaxed">{lastCallResult.explanation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
