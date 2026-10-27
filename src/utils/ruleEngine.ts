import {
  ActiveEvaluationResult,
  AndroidPermissionsState,
  AppSettings,
  DriftPendingInfo,
  ManualActivationState,
  NextScheduledInfo,
  SavedLocation,
  ScheduleRule,
  TriggerReason,
} from '../types/shulmode';

/**
 * Calculates Haversine distance in meters between two lat/lng coordinates.
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Parses "HH:mm" string into minutes since 00:00 (0..1439).
 */
export function parseTimeMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr || '0', 10);
  const m = parseInt(mStr || '0', 10);
  return h * 60 + m;
}

/**
 * Checks whether a time window (which may cross midnight) is currently active.
 */
export function isTimeWindowActive(
  now: Date,
  startTime: string,
  endTime: string,
  activeDays: number[]
): boolean {
  if (!activeDays || activeDays.length === 0) return false;
  const currentDay = now.getDay(); // 0 = Sun .. 6 = Sat
  const yesterdayDay = (currentDay + 6) % 7;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const startMinutes = parseTimeMinutes(startTime);
  const endMinutes = parseTimeMinutes(endTime);

  if (startMinutes === endMinutes) {
    return activeDays.includes(currentDay);
  }

  // Normal same-day window (e.g., 07:00 to 08:30)
  if (startMinutes < endMinutes) {
    return (
      activeDays.includes(currentDay) &&
      currentMinutes >= startMinutes &&
      currentMinutes < endMinutes
    );
  }

  // Crosses midnight (e.g., 23:00 to 01:30)
  const inLateNightPortion =
    activeDays.includes(currentDay) && currentMinutes >= startMinutes;
  const inEarlyMorningPortion =
    activeDays.includes(yesterdayDay) && currentMinutes < endMinutes;

  return inLateNightPortion || inEarlyMorningPortion;
}

/**
 * Formats 24h "HH:mm" into readable 12h/24h string based on language.
 */
export function formatTimeDisplay(hhmm: string, lang: 'en' | 'he' = 'en'): string {
  if (!hhmm) return '';
  if (lang === 'he') return hhmm;
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr || '0', 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${suffix}`;
}

/**
 * Computes the next scheduled activation across all enabled schedules.
 */
export function computeNextScheduledActivation(
  now: Date,
  schedules: ScheduleRule[],
  lang: 'en' | 'he'
): NextScheduledInfo | null {
  const enabledSchedules = schedules.filter(
    (s) => s.enabled && s.conditionType !== 'LOCATION_ONLY' && s.daysOfWeek.length > 0
  );
  if (enabledSchedules.length === 0) return null;

  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let bestCandidate: NextScheduledInfo | null = null;

  for (const schedule of enabledSchedules) {
    const startMin = parseTimeMinutes(schedule.startTime);
    const endMin = parseTimeMinutes(schedule.endTime);
    const crossesMidnight = endMin <= startMin;

    // Search up to 7 days ahead
    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const targetDay = (currentDay + dayOffset) % 7;
      if (!schedule.daysOfWeek.includes(targetDay)) continue;

      const deltaMinutes = dayOffset * 1440 + (startMin - currentMinutes);
      if (deltaMinutes <= 0) continue; // Already started or in the past

      if (!bestCandidate || deltaMinutes < bestCandidate.startsInMinutes) {
        const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Shabbat'];
        const dayNamesHe = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'];
        const dayLabel =
          dayOffset === 0
            ? lang === 'he'
              ? 'היום'
              : 'Today'
            : dayOffset === 1
            ? lang === 'he'
              ? 'מחר'
              : 'Tomorrow'
            : lang === 'he'
            ? dayNamesHe[targetDay]
            : dayNamesEn[targetDay];

        bestCandidate = {
          schedule,
          startsInMinutes: deltaMinutes,
          formattedStart: `${dayLabel} · ${formatTimeDisplay(schedule.startTime, lang)}`,
          crossesMidnight,
        };
      }
      break;
    }
  }

  return bestCandidate;
}

/**
 * Evaluates all active locations, schedules, manual overrides, and Android OS permissions.
 */
export function evaluateShulModeState(params: {
  now: Date;
  manualState: ManualActivationState;
  locations: SavedLocation[];
  schedules: ScheduleRule[];
  settings: AppSettings;
  permissions: AndroidPermissionsState;
  userCoords: { lat: number; lng: number } | null;
}): ActiveEvaluationResult {
  const {
    now,
    manualState,
    locations,
    schedules,
    settings,
    permissions,
    userCoords,
  } = params;

  const nowMs = now.getTime();
  const activeReasons: TriggerReason[] = [];
  const activeLocationRules: SavedLocation[] = [];
  const activeScheduleRules: ScheduleRule[] = [];
  const driftPendingLocations: DriftPendingInfo[] = [];

  // 1. Check Manual Activation
  const isManualActive =
    manualState.active &&
    (manualState.expiresAt === null || manualState.expiresAt > nowMs);
  if (isManualActive) {
    activeReasons.push('MANUAL');
  }

  // Helper to check if user is physically or simulated inside a location's geofence (with dwell hysteresis)
  const confirmedInsideLocationIds = new Set<string>();

  if (
    settings.locationAutomationEnabled &&
    permissions.locationServicesEnabled &&
    permissions.fineLocationGranted
  ) {
    for (const loc of locations) {
      if (!loc.enabled) continue;

      // Check optional day/time constraint on the location itself
      if (loc.activeDays && loc.activeDays.length > 0) {
        if (loc.startTime && loc.endTime) {
          if (!isTimeWindowActive(now, loc.startTime, loc.endTime, loc.activeDays)) {
            continue;
          }
        } else if (!loc.activeDays.includes(now.getDay())) {
          continue;
        }
      }

      let rawInside = Boolean(loc.simulatedInside);
      if (!rawInside && userCoords) {
        const dist = calculateDistanceMeters(
          userCoords.lat,
          userCoords.lng,
          loc.lat,
          loc.lng
        );
        if (dist <= loc.radiusMeters) {
          rawInside = true;
        }
      }

      if (rawInside) {
        const enteredMs = loc.enteredAtMs ?? nowMs;
        const elapsedSeconds = Math.max(0, Math.floor((nowMs - enteredMs) / 1000));
        if (elapsedSeconds >= settings.geofenceSensitivitySeconds) {
          confirmedInsideLocationIds.add(loc.id);
          activeLocationRules.push(loc);
        } else {
          driftPendingLocations.push({
            location: loc,
            elapsedSeconds,
            requiredSeconds: settings.geofenceSensitivitySeconds,
          });
        }
      }
    }
  }

  if (activeLocationRules.length > 0) {
    activeReasons.push('LOCATION');
  }

  // 2. Check Schedules
  if (settings.schedulingEnabled) {
    for (const sched of schedules) {
      if (!sched.enabled) continue;

      const timeMatches = isTimeWindowActive(
        now,
        sched.startTime,
        sched.endTime,
        sched.daysOfWeek
      );

      if (sched.conditionType === 'TIME_ONLY') {
        if (timeMatches) {
          activeScheduleRules.push(sched);
        }
      } else if (sched.conditionType === 'LOCATION_ONLY') {
        if (sched.linkedLocationId && confirmedInsideLocationIds.has(sched.linkedLocationId)) {
          activeScheduleRules.push(sched);
        }
      } else if (sched.conditionType === 'TIME_AND_LOCATION') {
        if (
          timeMatches &&
          sched.linkedLocationId &&
          confirmedInsideLocationIds.has(sched.linkedLocationId)
        ) {
          activeScheduleRules.push(sched);
        }
      }
    }
  }

  if (activeScheduleRules.length > 0 && !activeReasons.includes('SCHEDULE')) {
    activeReasons.push('SCHEDULE');
  }

  const isShulModeDesired = activeReasons.length > 0;

  // 3. Determine blocking error & OS confirmation
  let blockingError: string | null = null;
  if (isShulModeDesired && !permissions.dndAccessGranted) {
    blockingError =
      settings.language === 'he'
        ? 'חסרה הרשאת גישה ל״נא לא להפריע״ (NotificationManager). המכשיר לא יושתק עד לאישור ההרשאה.'
        : 'Android Notification Policy Access (DND permission) is revoked. ShulMode cannot silence the device until granted.';
  } else if (
    settings.locationAutomationEnabled &&
    !permissions.locationServicesEnabled
  ) {
    blockingError =
      settings.language === 'he'
        ? 'שירותי המיקום של המכשיר כבויים. אוטומציית בתי כנסת מושהית.'
        : 'Device Location Services are turned off. Synagogue geofence detection is paused.';
  }

  // Never falsely claim OS hardware DND is active unless native bridge confirms AND permission is granted
  const isOsDndConfirmed =
    isShulModeDesired &&
    permissions.dndAccessGranted &&
    permissions.nativeBridgeConnected;

  const nextScheduledActivation = computeNextScheduledActivation(
    now,
    schedules,
    settings.language
  );

  return {
    isShulModeDesired,
    isOsDndConfirmed,
    activeReasons,
    activeLocationRules,
    activeScheduleRules,
    driftPendingLocations,
    nextScheduledActivation,
    blockingError,
  };
}
