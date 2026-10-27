export type GeofenceRadius = 50 | 100 | 200 | 500;

export type ActivationConditionType = 'TIME_ONLY' | 'LOCATION_ONLY' | 'TIME_AND_LOCATION';

export type TriggerReason = 'MANUAL' | 'LOCATION' | 'SCHEDULE';

export type CallerCategory = 'FAMILY' | 'EMERGENCY' | 'SCHOOL_CHILDCARE' | 'OTHER';

export type CallerBypassBehavior = 'RING_AUDIBLE' | 'VIBRATE_ONLY';

export interface AllowedCaller {
  id: string;
  name: string;
  phoneNumber: string;
  category: CallerCategory;
  bypassBehavior: CallerBypassBehavior;
  alwaysBypassEvenInTotalSilence: boolean;
  enabled: boolean;
}

export interface SavedLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radiusMeters: GeofenceRadius;
  enabled: boolean;
  activeDays: number[]; // 0 = Sunday ... 6 = Saturday
  startTime?: string; // Optional time window HH:mm
  endTime?: string;   // Optional time window HH:mm
  placeId?: string;
  /** Used to test geofence entry/exit in the web prototype or when stationary */
  simulatedInside?: boolean;
  /** Timestamp (ms) when user first entered geofence (for GPS drift hysteresis) */
  enteredAtMs?: number | null;
}

export interface ScheduleRule {
  id: string;
  name: string;
  startTime: string; // "HH:mm" 24-hour format
  endTime: string;   // "HH:mm" 24-hour format (supports crossing midnight if endTime <= startTime)
  daysOfWeek: number[]; // 0 = Sunday ... 6 = Saturday
  enabled: boolean;
  conditionType: ActivationConditionType;
  linkedLocationId?: string;
}

export interface ManualActivationState {
  active: boolean;
  activatedAt: number | null;
  expiresAt: number | null; // null = Until manually turned off
  durationMinutes: 15 | 30 | 60 | 120 | 'UNTIL_OFF';
}

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  deactivatedAt?: number | null;
  eventType: 'ACTIVATED' | 'DEACTIVATED' | 'RULE_OVERLAP' | 'ERROR' | 'PERMISSION';
  triggerSource: 'MANUAL' | 'LOCATION' | 'SCHEDULE' | 'COMBINED' | 'SYSTEM';
  ruleName: string;
  details: string;
}

export interface AndroidPermissionsState {
  dndAccessGranted: boolean;
  fineLocationGranted: boolean,
  backgroundLocationGranted: boolean;
  exactAlarmGranted: boolean;
  batteryUnrestricted: boolean;
  locationServicesEnabled: boolean;
  nativeBridgeConnected: boolean;
}

export interface AppSettings {
  dndBehavior: 'PRIORITY_ONLY' | 'TOTAL_SILENCE' | 'ALARMS_ONLY';
  allowAlarms: boolean;
  allowSelectedContacts: boolean;
  allowRepeatCallers: boolean;
  emergencyExceptions: boolean;
  locationAutomationEnabled: boolean;
  schedulingEnabled: boolean;
  startOnBoot: boolean;
  geofenceSensitivitySeconds: 15 | 30 | 60;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'he';
  onboardingCompleted: boolean;
}

export interface NextScheduledInfo {
  schedule: ScheduleRule;
  startsInMinutes: number;
  formattedStart: string;
  crossesMidnight: boolean;
}

export interface DriftPendingInfo {
  location: SavedLocation;
  elapsedSeconds: number;
  requiredSeconds: number;
}

export interface ActiveEvaluationResult {
  /** Whether ShulMode rules currently demand silence */
  isShulModeDesired: boolean;
  /** Whether the operating system confirms actual hardware DND state */
  isOsDndConfirmed: boolean;
  /** Active trigger categories */
  activeReasons: TriggerReason[];
  /** Currently satisfied location geofence rules */
  activeLocationRules: SavedLocation[];
  /** Currently satisfied schedule rules */
  activeScheduleRules: ScheduleRule[];
  /** Locations detected inside boundary but still waiting for anti-drift dwell timer */
  driftPendingLocations: DriftPendingInfo[];
  /** Next upcoming schedule */
  nextScheduledActivation: NextScheduledInfo | null;
  /** Blocking permission or OS error message if ShulMode wants to activate DND but cannot */
  blockingError: string | null;
}
