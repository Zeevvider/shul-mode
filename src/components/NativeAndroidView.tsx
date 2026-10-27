import React, { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Cpu,
  Download,
  Share2,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import {
  NATIVE_ANDROID_FILES,
  SELF_CONTAINED_GITHUB_ACTION_YAML,
} from '../data/nativeAndroidCode';

interface NativeAndroidViewProps {
  lang: 'en' | 'he';
  nativeBridgeConnected: boolean;
  onToggleSimulatedBridge: () => void;
}

export const NativeAndroidView: React.FC<NativeAndroidViewProps> = ({
  lang,
  nativeBridgeConnected,
  onToggleSimulatedBridge,
}) => {
  const [selectedFileId, setSelectedFileId] = useState(NATIVE_ANDROID_FILES[0].id);
  const [copied, setCopied] = useState(false);
  const [copiedYaml, setCopiedYaml] = useState(false);

  const isHe = lang === 'he';
  const currentFile =
    NATIVE_ANDROID_FILES.find((f) => f.id === selectedFileId) ||
    NATIVE_ANDROID_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAllInOneYaml = () => {
    navigator.clipboard.writeText(SELF_CONTAINED_GITHUB_ACTION_YAML);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2500);
  };

  const handleDownloadAllFilesBundle = () => {
    const bundleContent = NATIVE_ANDROID_FILES.map(
      (f) =>
        `# ==========================================\n# FILE: ${f.path}\n# ${f.title}\n# ==========================================\n\n${f.code}\n\n`
    ).join('\n');

    const blob = new Blob([bundleContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ShulMode-Android-Native-Source-Bundle.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Architecture & Web vs Native Transparency Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
              {isHe
                ? 'בניית קובץ APK ב-GitHub Actions (בדיוק דרך Android CI)'
                : 'One-Step GitHub "Android CI" APK Builder'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isHe
                ? 'העתק את קובץ ה-YAML המוכן למטה והדבק אותו לאחר לחיצה על Configure בכרטיס ה-Android CI ב-GitHub.'
                : 'Click "Configure" on the Android CI card in GitHub, paste our All-in-One YAML below, and GitHub will build your installable ShulMode.apk automatically.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyAllInOneYaml}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-2 hover:bg-amber-400 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            >
              {copiedYaml ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {isHe
                      ? 'הועתק! הדבק ב-GitHub Configure'
                      : 'Copied! Paste into GitHub Configure'}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>
                    {isHe
                      ? 'העתק קוד מוכן ל-Android CI ב-GitHub'
                      : 'Copy All-in-One GitHub Android CI Code'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadAllFilesBundle}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-amber-600" />
              <span>
                {isHe ? 'הורד קבצים' : 'Download Bundle'}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleSimulatedBridge}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                nativeBridgeConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>
                {nativeBridgeConnected
                  ? isHe
                    ? 'גשר אנדרואיד מחובר'
                    : 'Android OS Bridge Connected'
                  : isHe
                  ? 'בדוק גשר אנדרואיד'
                  : 'Test Android Bridge'}
              </span>
            </button>
          </div>
        </div>

        {/* Exact 3-Step Instructions for the GitHub "Android CI -> Configure" Card */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Share2 className="w-4 h-4 text-amber-600" />
            <span>
              {isHe
                ? 'מה לעשות עכשיו ב-GitHub לאחר שמצאת את הכרטיס "Android CI":'
                : 'Exact steps after clicking "Configure" on that Android CI box in GitHub:'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-white">
                {isHe
                  ? '1. לחץ על Configure ב-Android CI'
                  : '1. Click "Configure" on Android CI'}
              </div>
              <p>
                {isHe
                  ? 'במסך ששלחת בצילום המסך, לחץ על הכפתור Configure. ייפתח עורך טקסט של הקובץ android.yml. מחק את כל הטקסט המובנה שמופיע שם.'
                  : 'Click the "Configure" button in your screenshot. GitHub will open a text editor for android.yml. Select all the default text inside it and delete it.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-white">
                {isHe
                  ? '2. הדבק את הקוד שלנו ולחץ Commit'
                  : '2. Paste Our Code & Click "Commit changes"'}
              </div>
              <p>
                {isHe
                  ? 'לחץ על הכפתור הכתום למעלה ("העתק קוד מוכן ל-Android CI"), הדבק אותו בעורך של GitHub, ולחץ על הכפתור הירוק Commit changes בפינה הימנית העליונה.'
                  : 'Click the gold "Copy All-in-One GitHub Android CI Code" button above, paste it into GitHub’s editor, and click the green "Commit changes..." button in the top-right.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-white">
                {isHe
                  ? '3. הורד את ה-APK ושלח לאנשים!'
                  : '3. Download Your APK from Actions'}
              </div>
              <p>
                {isHe
                  ? 'עבור ללשונית Actions ב-GitHub, המתן כ-2 דקות לסיום הריצה הירוקה, ובתחתית הדף תחת Artifacts הורד את הקובץ ShulMode-Installable-APK ושלח אותו לכל מי שתרצה!'
                  : 'Click the "Actions" tab at the top of GitHub, wait ~2 minutes for the green checkmark, scroll down to "Artifacts", and download ShulMode-Installable-APK!'}
              </p>
            </div>
          </div>
        </div>

        {/* Clear Matrix of Web Prototype vs Native Android Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-2 min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
              <Cpu className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isHe
                  ? 'פועל מיד בקישור ה-Web הנוכחי (ללא התקנה)'
                  : 'Works Immediately via Shared Web Link'}
              </span>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
              <li>
                · {isHe ? 'מנוע חישוב חוקים בזמן אמת (ידני, תזמונים חוצי חצות, ומיקום)' : 'Real-time multi-rule arbitration engine (Manual, Midnight-crossing Schedules, Locations)'}
              </li>
              <li>
                · {isHe ? 'חיפוש בתי כנסת אמיתי ב-Google Maps Places API ובחירת רדיוס' : 'Live Google Maps Places API (New) synagogue search & interactive geofence circles'}
              </li>
              <li>
                · {isHe ? 'ניהול מספרים מורשים להתקשר ובדיקת סינון שיחות' : 'Allowed Priority Callers list, GPS drift dwell timer, and Activity Log'}
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 space-y-2 min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isHe
                  ? 'מופעל אוטומטית ברגע שמתקינים כקובץ APK'
                  : 'Unlocked Automatically Inside the Android APK'}
              </span>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed break-words">
              <li>
                · <span className="font-mono-tabular break-all">NotificationManager.setAutomaticZenRuleState</span> — {isHe ? 'השתקת חומרת הצלצול של אנדרואיד' : 'Hardware OS Do Not Disturb control without overriding global settings'}
              </li>
              <li>
                · <span className="font-mono-tabular break-all">GeofencingClient + CallScreeningService</span> — {isHe ? 'זיהוי כניסה לבית הכנסת ברקע וסינון שיחות אמיתי' : 'Screen-off hardware geofence detection & real incoming call bypass'}
              </li>
              <li>
                · <span className="font-mono-tabular break-all">BOOT_COMPLETED & TIMEZONE_CHANGED</span> — {isHe ? 'שחזור אוטומטי לאחר כיבוי והדלקה' : 'Automatic background recovery after device reboot or DST shift'}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* File Selector & Code Viewer */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex flex-wrap items-center gap-1.5">
            {NATIVE_ANDROID_FILES.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => setSelectedFileId(file.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-tabular font-medium transition-colors whitespace-nowrap ${
                  selectedFileId === file.id
                    ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {file.filename}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isHe ? 'הועתק' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{isHe ? 'העתק קוד' : 'Copy File'}</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-600" />
              <span>{currentFile.title}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentFile.description}
            </p>
          </div>
          <span className="text-xs font-mono-tabular text-slate-400 shrink-0">
            {currentFile.path}
          </span>
        </div>

        <div dir="ltr" className="p-4 bg-slate-950 text-slate-100 overflow-x-auto">
          <pre className="text-xs font-mono-tabular leading-relaxed">
            <code>{currentFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
