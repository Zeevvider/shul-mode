import React, { useState } from 'react';
import {
  BellOff,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  ShieldCheck,
  VolumeX,
  X,
} from 'lucide-react';
import {
  AndroidPermissionsState,
  GeofenceRadius,
  SavedLocation,
  ScheduleRule,
} from '../types/shulmode';
import { GoogleMapSelector } from './GoogleMapSelector';
import { SanctuaryAnimation } from './SanctuaryAnimation';

interface OnboardingModalProps {
  isOpen: boolean;
  lang: 'en' | 'he';
  permissions: AndroidPermissionsState;
  onUpdatePermissions: (patch: Partial<AndroidPermissionsState>) => void;
  onAddLocation: (loc: Omit<SavedLocation, 'id'>) => SavedLocation;
  onAddSchedule: (sched: Omit<ScheduleRule, 'id'>) => void;
  onComplete: () => void;
}

const RADIUS_OPTIONS: GeofenceRadius[] = [50, 100, 200, 500];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  lang,
  permissions,
  onUpdatePermissions,
  onAddLocation,
  onAddSchedule,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 3 state: Add Your Shul
  const [shulName, setShulName] = useState('');
  const [shulAddress, setShulAddress] = useState('');
  const [shulCoords, setShulCoords] = useState<{ lat: number; lng: number }>({
    lat: 31.7767,
    lng: 35.2345,
  });
  const [shulRadius, setShulRadius] = useState<GeofenceRadius>(100);
  const [createdLocationId, setCreatedLocationId] = useState<string | undefined>(
    undefined
  );

  // Step 4 state: First schedule presets
  const [selectedPresets, setSelectedPresets] = useState<{
    shacharit: boolean;
    learning: boolean;
    minchaMaariv: boolean;
  }>({
    shacharit: true,
    learning: false,
    minchaMaariv: true,
  });

  if (!isOpen) return null;

  const isHe = lang === 'he';

  const handleRequestBrowserLocation = () => {
    if (!navigator.geolocation) {
      onUpdatePermissions({
        fineLocationGranted: true,
        backgroundLocationGranted: true,
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setShulCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        onUpdatePermissions({
          fineLocationGranted: true,
          backgroundLocationGranted: true,
          locationServicesEnabled: true,
        });
      },
      () => {
        // Still allow user to toggle permission state for testing in sandbox
        onUpdatePermissions({
          fineLocationGranted: true,
          backgroundLocationGranted: true,
        });
      },
      { timeout: 6000 }
    );
  };

  const handleSaveStep3Shul = () => {
    if (shulName.trim()) {
      const created = onAddLocation({
        name: shulName.trim(),
        address:
          shulAddress.trim() ||
          `${shulCoords.lat.toFixed(5)}, ${shulCoords.lng.toFixed(5)}`,
        lat: shulCoords.lat,
        lng: shulCoords.lng,
        radiusMeters: shulRadius,
        enabled: true,
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        simulatedInside: false,
        enteredAtMs: null,
      });
      setCreatedLocationId(created.id);
    }
    setStep(4);
  };

  const handleFinishOnboarding = () => {
    if (selectedPresets.shacharit) {
      onAddSchedule({
        name: isHe ? 'שחרית' : 'Shacharit',
        startTime: '07:00',
        endTime: '08:30',
        daysOfWeek: [0, 1, 2, 3, 4, 5],
        enabled: true,
        conditionType: createdLocationId ? 'TIME_AND_LOCATION' : 'TIME_ONLY',
        linkedLocationId: createdLocationId,
      });
    }
    if (selectedPresets.learning) {
      onAddSchedule({
        name: isHe ? 'סדר בוקר' : 'Morning Learning',
        startTime: '09:00',
        endTime: '13:00',
        daysOfWeek: [0, 1, 2, 3, 4],
        enabled: true,
        conditionType: 'TIME_ONLY',
      });
    }
    if (selectedPresets.minchaMaariv) {
      onAddSchedule({
        name: isHe ? 'מנחה ומעריב' : 'Mincha & Maariv',
        startTime: '18:00',
        endTime: '19:00',
        daysOfWeek: [0, 1, 2, 3, 4],
        enabled: true,
        conditionType: 'TIME_ONLY',
      });
    }
    onComplete();
  };

  return (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
        {/* Top Step Progress Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{isHe ? `שלב ${step} מתוך 4` : `Step ${step} of 4`}</span>
            <span aria-hidden="true">·</span>
            <span>
              {step === 1 && (isHe ? 'ברוכים הבאים' : 'Welcome')}
              {step === 2 && (isHe ? 'הרשאות אנדרואיד' : 'Android Permissions')}
              {step === 3 && (isHe ? 'הוסף בית כנסת' : 'Add Your Shul')}
              {step === 4 && (isHe ? 'זמני תפילה' : 'First Schedule')}
            </span>
          </div>
          <button
            type="button"
            onClick={onComplete}
            className="min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title={isHe ? 'דלג ללוח הבקרה' : 'Skip to Dashboard'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center">
                <SanctuaryAnimation active={true} />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {isHe ? 'שׁוּל-מוֹד · ShulMode' : 'ShulMode · Android Sanctuary Silence'}
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white text-balance">
                  {isHe
                    ? '״הטלפון שלך יודע מתי הגיע זמן השקט.״'
                    : '“Your phone knows when it’s time for quiet.”'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                  {isHe
                    ? 'הפעלה אוטומטית של מצב ״נא לא להפריע״ באנדרואיד בכניסה לבית הכנסת, בזמני תפילה קבועים ובסדרי לימוד – ללא צורך לזכור להשתיק את המכשיר.'
                    : 'Automatically activates Android’s native Do Not Disturb when you enter synagogue, during scheduled prayer windows, or on manual command—and releases cleanly when you leave.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-start pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                  <MapPin className="w-4 h-4 text-amber-600 mb-2" />
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {isHe ? 'זיהוי מיקום חכם' : 'Geofence Arrival'}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isHe
                      ? 'מזהה כניסה ויציאה מבית הכנסת בחיסכון מרבי בסוללה.'
                      : 'Battery-efficient Android geofencing with GPS drift protection.'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                  <Clock className="w-4 h-4 text-amber-600 mb-2" />
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {isHe ? 'זמני תפילה וסדרים' : 'Prayer Schedules'}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isHe
                      ? 'שחרית, מנחה, מעריב וסדרי לימוד כולל חציית חצות.'
                      : 'Time-only or combined Time + Location rules for Shacharit, Mincha & Maariv.'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                  <VolumeX className="w-4 h-4 text-amber-600 mb-2" />
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {isHe ? 'כבוד להגדרות שלך' : 'Respects Your DND'}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isHe
                      ? 'משתמש בחוק ייעודי מבלי לדרוס הגדרות מערכת אחרות.'
                      : 'Uses an app-owned AutomaticZenRule without overriding personal rules.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-semibold text-sm flex items-center gap-2 hover:opacity-95 transition-opacity whitespace-nowrap"
                >
                  <span>{isHe ? 'המשך להגדרת הרשאות' : 'Continue to Permissions'}</span>
                  <ChevronRight className={`w-4 h-4 ${isHe ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PERMISSIONS */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
                  {isHe
                    ? 'הרשאות נדרשות באנדרואיד'
                    : 'Required Android Permissions'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {isHe
                    ? 'ShulMode זקוקה לגישה למדיניות ״נא לא להפריע״ ולהרשאת מיקום ברקע כדי להשתיק את הטלפון אוטומטית כשהמסך כבוי.'
                    : 'ShulMode requires Notification Policy Access to manage its AutomaticZenRule and Background Location to detect synagogue arrival when your screen is off.'}
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. DND Access */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-amber-400 shrink-0">
                      <BellOff className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isHe
                          ? 'גישה למדיניות ״נא לא להפריע״ (NotificationManager)'
                          : 'Do Not Disturb Policy Access'}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isHe
                          ? 'פותח את Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS באנדרואיד.'
                          : 'Opens Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS on Android.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePermissions({
                        dndAccessGranted: !permissions.dndAccessGranted,
                      })
                    }
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      permissions.dndAccessGranted
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                    }`}
                  >
                    {permissions.dndAccessGranted
                      ? isHe
                        ? 'מאושר ✓'
                        : 'Access Granted ✓'
                      : isHe
                      ? 'אשר גישה'
                      : 'Grant DND Access'}
                  </button>
                </div>

                {/* 2. Background Location */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-amber-400 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {isHe
                          ? 'מיקום מדויק ומיקום ברקע (Geofencing)'
                          : 'Fine & Background Location Access'}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isHe
                          ? 'משמש אך ורק לזיהוי כניסה ויציאה מרדיוס בתי הכנסת השמורים שלך.'
                          : 'Used strictly for hardware geofence entry/exit around your saved synagogues.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestBrowserLocation}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      permissions.fineLocationGranted &&
                      permissions.backgroundLocationGranted
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                    }`}
                  >
                    {permissions.fineLocationGranted &&
                    permissions.backgroundLocationGranted
                      ? isHe
                        ? 'מאושר ✓'
                        : 'Location Granted ✓'
                      : isHe
                      ? 'אשר מיקום'
                      : 'Grant Location'}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {isHe
                    ? 'הערת אמינות: כל המיקומים וההיסטוריה נשמרים מקומית במכשיר שלך בלבד.'
                    : 'Privacy guarantee: All saved synagogues, schedules, and activity logs stay 100% locally on your device.'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[42px] px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  {isHe ? 'חזרה' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                >
                  <span>{isHe ? 'המשך לבחירת בית כנסת' : 'Next: Add Your Shul'}</span>
                  <ChevronRight className={`w-4 h-4 ${isHe ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ADD YOUR SHUL */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
                  {isHe ? 'בחר את בית הכנסת שלך על המפה' : 'Select Your Synagogue on the Map'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  {isHe
                    ? 'חפש כתובת או לחץ על המפה ובחר את רדיוס ההפעלה האוטומטית.'
                    : 'Search for your synagogue or click any point on the map, then choose your activation radius.'}
                </p>
              </div>

              <GoogleMapSelector
                selectedCenter={shulCoords}
                radiusMeters={shulRadius}
                searchPlaceholder={
                  isHe
                    ? 'חפש בית כנסת או כתובת ב-Google Maps...'
                    : 'Search synagogue or address on Google Maps...'
                }
                heightClassName="h-[240px]"
                onCoordinateSelect={(c) => {
                  setShulCoords({ lat: c.lat, lng: c.lng });
                  if (c.name && !shulName) setShulName(c.name);
                  if (c.address) setShulAddress(c.address);
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {isHe ? 'שם בית הכנסת / בית המדרש' : 'Synagogue Name'}
                  </label>
                  <input
                    type="text"
                    value={shulName}
                    onChange={(e) => setShulName(e.target.value)}
                    placeholder={isHe ? 'לדוגמה: בית כנסת מרכזי' : 'e.g., Main Shul / Beit Midrash'}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {isHe ? 'רדיוס הפעלה (מטרים)' : 'Activation Radius'}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                    {RADIUS_OPTIONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setShulRadius(r)}
                        className={`py-1.5 text-xs font-medium rounded-lg tabular-nums transition-colors ${
                          shulRadius === r
                            ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                        }`}
                      >
                        {r}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[42px] px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  {isHe ? 'חזרה' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveStep3Shul}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                >
                  <span>
                    {shulName.trim()
                      ? isHe
                        ? 'שמור והמשך'
                        : 'Save Shul & Continue'
                      : isHe
                      ? 'דלג לשלב הבא'
                      : 'Skip for Now'}
                  </span>
                  <ChevronRight className={`w-4 h-4 ${isHe ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CREATE YOUR FIRST SCHEDULE */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
                  {isHe ? 'בחר זמני תפילה או לימוד ראשונים' : 'Create Your First Schedules'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {isHe
                    ? 'בחר אילו זמני תפילה להוסיף כעת. תוכל לערוך ולהוסיף תזמונים ללא הגבלה בכל עת.'
                    : 'Select optional prayer or Torah study schedules to activate automatically. You can customize or add more anytime.'}
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    key: 'shacharit' as const,
                    title: isHe ? 'שחרית (ימים א׳–ו׳)' : 'Shacharit (Sun–Fri)',
                    time: '07:00 – 08:30',
                    desc: createdLocationId
                      ? isHe
                        ? 'יופעל בזמן זה כאשר אתה בבית הכנסת'
                        : 'Activates during time window when at your saved Shul'
                      : isHe
                      ? 'יופעל אוטומטית לפי זמן'
                      : 'Activates automatically by schedule time',
                  },
                  {
                    key: 'learning' as const,
                    title: isHe ? 'סדר בוקר / לימוד תורה (א׳–ה׳)' : 'Morning Learning (Sun–Thu)',
                    time: '09:00 – 13:00',
                    desc: isHe ? 'שקט רציף בזמן לימוד הבוקר' : 'Uninterrupted quiet during morning study block',
                  },
                  {
                    key: 'minchaMaariv' as const,
                    title: isHe ? 'מנחה ומעריב (א׳–ה׳)' : 'Mincha & Maariv (Sun–Thu)',
                    time: '18:00 – 19:00',
                    desc: isHe ? 'השתקה אוטומטית לתפילות הערב' : 'Automatic silence for afternoon and evening prayers',
                  },
                ].map((item) => {
                  const checked = selectedPresets[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setSelectedPresets((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key],
                        }))
                      }
                      className={`w-full p-4 rounded-2xl border text-start transition-colors flex items-center justify-between gap-4 ${
                        checked
                          ? 'border-amber-500/70 bg-amber-50/40 dark:bg-amber-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-mono-tabular font-medium text-amber-700 dark:text-amber-400">
                            {item.time}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.desc}</span>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          checked
                            ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                            : 'border border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="min-h-[42px] px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  {isHe ? 'חזרה' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
                >
                  <span>{isHe ? 'סיים ופתח את ShulMode' : 'Finish & Open Dashboard'}</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
