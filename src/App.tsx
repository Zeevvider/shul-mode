/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  BellOff,
  CalendarClock,
  Code2,
  History,
  MapPin,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  ActivityLogEntry,
  AllowedCaller,
  AndroidPermissionsState,
  AppSettings,
  ManualActivationState,
  SavedLocation,
  ScheduleRule,
} from './types/shulmode';
import { translations } from './i18n/translations';
import { evaluateShulModeState } from './utils/ruleEngine';
import { DashboardView } from './components/DashboardView';
import { LocationsView } from './components/LocationsView';
import { SchedulesView } from './components/SchedulesView';
import { ActivityHistoryView } from './components/ActivityHistoryView';
import { SettingsView } from './components/SettingsView';
import { NativeAndroidView } from './components/NativeAndroidView';
import { OnboardingModal } from './components/OnboardingModal';

const STORAGE_KEYS = {
  LOCATIONS: 'shulmode_locations_v1',
  SCHEDULES: 'shulmode_schedules_v1',
  ALLOWED_CALLERS: 'shulmode_allowed_callers_v1',
  SETTINGS: 'shulmode_settings_v1',
  PERMISSIONS: 'shulmode_permissions_v1',
  MANUAL: 'shulmode_manual_v1',
  LOGS: 'shulmode_logs_v1',
};

const DEFAULT_SCHEDULES: ScheduleRule[] = [
  {
    id: 'sched-shacharit',
    name: 'Shacharit',
    startTime: '07:00',
    endTime: '08:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5],
    enabled: true,
    conditionType: 'TIME_ONLY',
  },
  {
    id: 'sched-learning',
    name: 'Morning Learning',
    startTime: '09:00',
    endTime: '13:00',
    daysOfWeek: [0, 1, 2, 3, 4],
    enabled: true,
    conditionType: 'TIME_ONLY',
  },
  {
    id: 'sched-mincha-maariv',
    name: 'Mincha & Maariv',
    startTime: '18:00',
    endTime: '19:00',
    daysOfWeek: [0, 1, 2, 3, 4],
    enabled: true,
    conditionType: 'TIME_ONLY',
  },
];

const DEFAULT_ALLOWED_CALLERS: AllowedCaller[] = [
  {
    id: 'caller-spouse',
    name: 'Spouse',
    phoneNumber: '+1 (555) 234-5678',
    category: 'FAMILY',
    bypassBehavior: 'RING_AUDIBLE',
    alwaysBypassEvenInTotalSilence: true,
    enabled: true,
  },
  {
    id: 'caller-hatzalah',
    name: 'Hatzalah / Emergency',
    phoneNumber: '+1 (718) 230-1000',
    category: 'EMERGENCY',
    bypassBehavior: 'RING_AUDIBLE',
    alwaysBypassEvenInTotalSilence: true,
    enabled: true,
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  dndBehavior: 'PRIORITY_ONLY',
  allowAlarms: true,
  allowSelectedContacts: true,
  allowRepeatCallers: true,
  emergencyExceptions: true,
  locationAutomationEnabled: true,
  schedulingEnabled: true,
  startOnBoot: true,
  geofenceSensitivitySeconds: 15,
  theme: 'light',
  language: 'en',
  onboardingCompleted: false,
};

const DEFAULT_PERMISSIONS: AndroidPermissionsState = {
  dndAccessGranted: true,
  fineLocationGranted: true,
  backgroundLocationGranted: true,
  exactAlarmGranted: true,
  batteryUnrestricted: true,
  locationServicesEnabled: true,
  nativeBridgeConnected: Boolean((window as any).AndroidShulModeBridge),
};

const DEFAULT_MANUAL: ManualActivationState = {
  active: false,
  activatedAt: null,
  expiresAt: null,
  durationMinutes: 'UNTIL_OFF',
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'locations' | 'schedules' | 'activity' | 'settings' | 'native'
  >('dashboard');
  const [now, setNow] = useState<Date>(() => new Date());

  // Persistent App State
  const [locations, setLocations] = useState<SavedLocation[]>(() =>
    loadJson(STORAGE_KEYS.LOCATIONS, [])
  );
  const [schedules, setSchedules] = useState<ScheduleRule[]>(() =>
    loadJson(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES)
  );
  const [allowedCallers, setAllowedCallers] = useState<AllowedCaller[]>(() =>
    loadJson(STORAGE_KEYS.ALLOWED_CALLERS, DEFAULT_ALLOWED_CALLERS)
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadJson(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );
  const [permissions, setPermissions] = useState<AndroidPermissionsState>(() =>
    loadJson(STORAGE_KEYS.PERMISSIONS, DEFAULT_PERMISSIONS)
  );
  const [manualState, setManualState] = useState<ManualActivationState>(() =>
    loadJson(STORAGE_KEYS.MANUAL, DEFAULT_MANUAL)
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(() =>
    loadJson(STORAGE_KEYS.LOGS, [])
  );

  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => !loadJson(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS).onboardingCompleted
  );

  // Listen for Google Maps Platform Demo Key Quota Event
  useEffect(() => {
    const handleQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Tick clock every 1 second for live countdowns, schedule boundaries, and GPS dwell timer
  useEffect(() => {
    const interval = setInterval(() => {
      const current = new Date();
      setNow(current);

      // Auto-expire manual timer if needed
      setManualState((prev) => {
        if (prev.active && prev.expiresAt && prev.expiresAt <= current.getTime()) {
          return {
            active: false,
            activatedAt: null,
            expiresAt: null,
            durationMinutes: 'UNTIL_OFF',
          };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Persist state changes to localStorage & sync to Native Android APK Bridge if running in Android APK
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
    const bridge = (window as any).AndroidShulModeBridge;
    if (bridge?.syncLocationsJson) {
      try {
        bridge.syncLocationsJson(
          JSON.stringify(locations),
          settings.geofenceSensitivitySeconds
        );
      } catch (e) {
        console.error('Native bridge syncLocationsJson error:', e);
      }
    }
  }, [locations, settings.geofenceSensitivitySeconds]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }, [schedules]);
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.ALLOWED_CALLERS,
      JSON.stringify(allowedCallers)
    );
    const bridge = (window as any).AndroidShulModeBridge;
    if (bridge?.syncAllowedCallersJson) {
      try {
        bridge.syncAllowedCallersJson(JSON.stringify(allowedCallers));
      } catch (e) {
        console.error('Native bridge syncAllowedCallersJson error:', e);
      }
    }
  }, [allowedCallers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(permissions));
  }, [permissions]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MANUAL, JSON.stringify(manualState));
  }, [manualState]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Apply Light / Dark / System Theme to documentElement
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (settings.theme === 'dark') {
      applyTheme(true);
    } else if (settings.theme === 'light') {
      applyTheme(false);
    } else {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(media.matches);
    }
  }, [settings.theme]);

  // Evaluate ShulMode Rules
  const evaluation = evaluateShulModeState({
    now,
    manualState,
    locations,
    schedules,
    settings,
    permissions,
    userCoords,
  });

  // Track state transitions for Activity History Log
  const prevActiveRef = useRef<boolean>(evaluation.isShulModeDesired);
  const prevReasonCountRef = useRef<number>(evaluation.activeReasons.length);

  const appendLog = (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    setActivityLogs((prev) => [
      {
        ...entry,
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
      },
      ...prev.slice(0, 99),
    ]);
  };

  useEffect(() => {
    const wasActive = prevActiveRef.current;
    const isNowActive = evaluation.isShulModeDesired;

    // If running inside the Native Android APK wrapper, invoke Android NotificationManager directly
    const bridge = (window as any).AndroidShulModeBridge;
    if (bridge?.syncShulModeDnd) {
      try {
        bridge.syncShulModeDnd(
          isNowActive,
          settings.dndBehavior,
          settings.allowAlarms,
          settings.allowSelectedContacts,
          settings.allowRepeatCallers
        );
      } catch (e) {
        console.error('Native bridge syncShulModeDnd error:', e);
      }
    }

    if (!wasActive && isNowActive) {
      const reasons = evaluation.activeReasons.join(' + ');
      const ruleNames = [
        ...(manualState.active ? ['Manual Activation'] : []),
        ...evaluation.activeLocationRules.map((l) => l.name),
        ...evaluation.activeScheduleRules.map((s) => s.name),
      ].join(', ');

      appendLog({
        eventType: evaluation.blockingError ? 'ERROR' : 'ACTIVATED',
        triggerSource:
          evaluation.activeReasons.length > 1
            ? 'COMBINED'
            : evaluation.activeReasons[0] || 'MANUAL',
        ruleName: ruleNames || 'ShulMode Activated',
        details: evaluation.blockingError
          ? `Rule triggered (${reasons}) but blocked: ${evaluation.blockingError}`
          : `ShulMode silence engaged via ${reasons}.`,
      });
    } else if (wasActive && !isNowActive) {
      appendLog({
        eventType: 'DEACTIVATED',
        triggerSource: 'SYSTEM',
        ruleName: 'ShulMode Released',
        details:
          'All active location, schedule, and manual rules have concluded. Released app-owned DND rule.',
        deactivatedAt: Date.now(),
      });
    } else if (
      isNowActive &&
      evaluation.activeReasons.length > 1 &&
      prevReasonCountRef.current === 1
    ) {
      appendLog({
        eventType: 'RULE_OVERLAP',
        triggerSource: 'COMBINED',
        ruleName: 'Multi-Rule Overlap Arbitrated',
        details: `Overlapping triggers active (${evaluation.activeReasons.join(
          ' + '
        )}). ShulMode will stay ON until all active rules conclude.`,
      });
    }

    prevActiveRef.current = isNowActive;
    prevReasonCountRef.current = evaluation.activeReasons.length;
  }, [
    evaluation.isShulModeDesired,
    evaluation.activeReasons.length,
    evaluation.blockingError,
  ]);

  // Handlers
  const handleToggleManual = (
    duration: 15 | 30 | 60 | 120 | 'UNTIL_OFF' | 'OFF'
  ) => {
    if (duration === 'OFF') {
      setManualState({
        active: false,
        activatedAt: null,
        expiresAt: null,
        durationMinutes: 'UNTIL_OFF',
      });
      return;
    }

    const nowMs = Date.now();
    const expiresAt =
      duration === 'UNTIL_OFF' ? null : nowMs + duration * 60 * 1000;

    setManualState({
      active: true,
      activatedAt: nowMs,
      expiresAt,
      durationMinutes: duration,
    });
  };

  const handleAddLocation = (loc: Omit<SavedLocation, 'id'>): SavedLocation => {
    const newLoc: SavedLocation = {
      ...loc,
      id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setLocations((prev) => [newLoc, ...prev]);
    return newLoc;
  };

  const handleUpdateLocation = (id: string, patch: Partial<SavedLocation>) => {
    setLocations((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  };

  const handleDeleteLocation = (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSimulateGeofence = (
    locationId: string,
    enter: boolean,
    skipDwell = false
  ) => {
    const enteredAtMs = enter
      ? skipDwell
        ? Date.now() - (settings.geofenceSensitivitySeconds + 2) * 1000
        : Date.now()
      : null;

    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId
          ? {
              ...loc,
              simulatedInside: enter,
              enteredAtMs,
            }
          : loc
      )
    );
  };

  const handleRequestRealGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
      },
      (err) => {
        appendLog({
          eventType: 'PERMISSION',
          triggerSource: 'LOCATION',
          ruleName: 'Browser Geolocation Notice',
          details: `Could not read physical GPS (${err.message}). Use the "Test Enter Geofence" button on any saved location to test arrival.`,
        });
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const handleAddSchedule = (sched: Omit<ScheduleRule, 'id'>) => {
    const newSched: ScheduleRule = {
      ...sched,
      id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setSchedules((prev) => [newSched, ...prev]);
  };

  const handleUpdateSchedule = (id: string, patch: Partial<ScheduleRule>) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddCaller = (caller: Omit<AllowedCaller, 'id'>) => {
    const newCaller: AllowedCaller = {
      ...caller,
      id: `caller-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setAllowedCallers((prev) => [newCaller, ...prev]);
  };

  const handleUpdateCaller = (id: string, patch: Partial<AllowedCaller>) => {
    setAllowedCallers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  };

  const handleDeleteCaller = (id: string) => {
    setAllowedCallers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleLogCallEvent = (params: {
    callerLabel: string;
    phoneNumber: string;
    allowed: boolean;
    reason: string;
  }) => {
    appendLog({
      eventType: params.allowed ? 'ACTIVATED' : 'DEACTIVATED',
      triggerSource: 'SYSTEM',
      ruleName: `Incoming Call: ${params.callerLabel} (${params.phoneNumber})`,
      details: params.reason,
    });
  };

  const handleUpdateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleUpdatePermissions = (patch: Partial<AndroidPermissionsState>) => {
    setPermissions((prev) => ({ ...prev, ...patch }));
  };

  const t = translations[settings.language];
  const isHe = settings.language === 'he';

  return (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-20 md:pb-10"
    >
      {/* Mandatory Google Maps Platform Demo Key Quota Exceeded Banner */}
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-xs">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 h-14">
          {/* Zone 1: Single Text Element Wordmark */}
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
            className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            {t.appName}
          </a>

          {/* Zone 2: 5 Concise Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            {(
              [
                { id: 'dashboard', label: t.navDashboard },
                { id: 'locations', label: t.navLocations },
                { id: 'schedules', label: t.navSchedules },
                { id: 'activity', label: t.navActivity },
                { id: 'settings', label: t.navSettings },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === item.id
                    ? 'text-slate-900 dark:text-amber-400 font-semibold underline underline-offset-8 decoration-2 decoration-amber-500'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() =>
                manualState.active
                  ? handleToggleManual('OFF')
                  : handleToggleManual('UNTIL_OFF')
              }
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                evaluation.isShulModeDesired
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-slate-900 dark:bg-slate-800 text-white dark:text-amber-400 hover:bg-slate-800'
              }`}
            >
              <BellOff className="w-3.5 h-3.5" />
              <span>
                {evaluation.isShulModeDesired
                  ? t.statusActive
                  : t.manualActivateBtn}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container (Full 1440px Responsive Presence) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            now={now}
            evaluation={evaluation}
            manualState={manualState}
            locations={locations}
            schedules={schedules}
            allowedCallers={allowedCallers}
            settings={settings}
            permissions={permissions}
            onToggleManual={handleToggleManual}
            onSimulateGeofence={handleSimulateGeofence}
            onAddCaller={handleAddCaller}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'locations' && (
          <LocationsView
            locations={locations}
            settings={settings}
            userCoords={userCoords}
            onAddLocation={handleAddLocation}
            onUpdateLocation={handleUpdateLocation}
            onDeleteLocation={handleDeleteLocation}
            onSimulateGeofence={handleSimulateGeofence}
            onRequestRealGps={handleRequestRealGps}
          />
        )}

        {activeTab === 'schedules' && (
          <SchedulesView
            now={now}
            schedules={schedules}
            locations={locations}
            settings={settings}
            onAddSchedule={handleAddSchedule}
            onUpdateSchedule={handleUpdateSchedule}
            onDeleteSchedule={handleDeleteSchedule}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityHistoryView
            logs={activityLogs}
            settings={settings}
            onClearLogs={() => setActivityLogs([])}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            permissions={permissions}
            allowedCallers={allowedCallers}
            isShulModeActive={evaluation.isShulModeDesired}
            onUpdateSettings={handleUpdateSettings}
            onUpdatePermissions={handleUpdatePermissions}
            onAddCaller={handleAddCaller}
            onUpdateCaller={handleUpdateCaller}
            onDeleteCaller={handleDeleteCaller}
            onLogCallEvent={handleLogCallEvent}
            onReopenOnboarding={() => setShowOnboarding(true)}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-5 items-center h-14">
          {(
            [
              { id: 'dashboard', label: t.navDashboard, icon: BellOff },
              { id: 'locations', label: t.navLocations, icon: MapPin },
              { id: 'schedules', label: t.navSchedules, icon: CalendarClock },
              { id: 'activity', label: t.navActivity, icon: History },
              { id: 'settings', label: t.navSettings, icon: SettingsIcon },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
                  isSelected
                    ? 'text-slate-900 dark:text-amber-400 font-semibold'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[64px]">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 4-Step Onboarding Wizard Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        lang={settings.language}
        permissions={permissions}
        onUpdatePermissions={handleUpdatePermissions}
        onAddLocation={handleAddLocation}
        onAddSchedule={handleAddSchedule}
        onComplete={() => {
          handleUpdateSettings({ onboardingCompleted: true });
          setShowOnboarding(false);
        }}
      />
    </div>
  );
}
