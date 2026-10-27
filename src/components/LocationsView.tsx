import React, { useState } from 'react';
import {
  Check,
  Edit3,
  MapPin,
  Navigation,
  Plus,
  Shield,
  Trash2,
} from 'lucide-react';
import {
  AppSettings,
  GeofenceRadius,
  SavedLocation,
} from '../types/shulmode';
import { translations } from '../i18n/translations';
import { calculateDistanceMeters } from '../utils/ruleEngine';
import { GoogleMapSelector } from './GoogleMapSelector';

interface LocationsViewProps {
  locations: SavedLocation[];
  settings: AppSettings;
  userCoords: { lat: number; lng: number } | null;
  onAddLocation: (loc: Omit<SavedLocation, 'id'>) => SavedLocation;
  onUpdateLocation: (id: string, patch: Partial<SavedLocation>) => void;
  onDeleteLocation: (id: string) => void;
  onSimulateGeofence: (
    locationId: string,
    enter: boolean,
    skipDwell?: boolean
  ) => void;
  onRequestRealGps: () => void;
}

const RADIUS_CHOICES: GeofenceRadius[] = [50, 100, 200, 500];

export const LocationsView: React.FC<LocationsViewProps> = ({
  locations,
  settings,
  userCoords,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  onSimulateGeofence,
  onRequestRealGps,
}) => {
  const t = translations[settings.language];
  const isHe = settings.language === 'he';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: locations[0]?.lat ?? 31.7767,
    lng: locations[0]?.lng ?? 35.2345,
  });
  const [radiusMeters, setRadiusMeters] = useState<GeofenceRadius>(100);
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleStartEdit = (loc: SavedLocation) => {
    setEditingId(loc.id);
    setName(loc.name);
    setAddress(loc.address);
    setCoords({ lat: loc.lat, lng: loc.lng });
    setRadiusMeters(loc.radiusMeters);
    setActiveDays(loc.activeDays || [0, 1, 2, 3, 4, 5, 6]);
    setStartTime(loc.startTime || '');
    setEndTime(loc.endTime || '');
  };

  const handleResetForm = () => {
    setEditingId(null);
    setName('');
    setAddress('');
    setRadiusMeters(100);
    setActiveDays([0, 1, 2, 3, 4, 5, 6]);
    setStartTime('');
    setEndTime('');
  };

  const handleToggleDay = (dayIndex: number) => {
    setActiveDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName =
      name.trim() || (isHe ? 'בית כנסת שמור' : 'Saved Synagogue');
    const cleanAddress =
      address.trim() || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;

    if (editingId) {
      onUpdateLocation(editingId, {
        name: cleanName,
        address: cleanAddress,
        lat: coords.lat,
        lng: coords.lng,
        radiusMeters,
        activeDays,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      });
    } else {
      onAddLocation({
        name: cleanName,
        address: cleanAddress,
        lat: coords.lat,
        lng: coords.lng,
        radiusMeters,
        enabled: true,
        activeDays,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        simulatedInside: false,
        enteredAtMs: null,
      });
    }
    handleResetForm();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
            {t.locationsTitle}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {t.locationsSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onRequestRealGps}
          className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 self-start sm:self-center whitespace-nowrap"
        >
          <Navigation className="w-4 h-4 text-amber-600" />
          <span>{t.detectRealGpsBtn}</span>
        </button>
      </div>

      {/* Main 2-Column Split: Interactive Map + Add/Edit Form on Left, Saved Locations List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Map & Editor */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {editingId
                ? isHe
                  ? 'עריכת מיקום בית כנסת'
                  : 'Edit Synagogue Location'
                : isHe
                ? 'הוספת בית כנסת או בית מדרש'
                : 'Add Synagogue or Study Hall'}
            </h2>
            <span className="text-xs font-mono-tabular text-slate-500">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </span>
          </div>

          <GoogleMapSelector
            selectedCenter={coords}
            radiusMeters={radiusMeters}
            savedLocations={locations}
            searchPlaceholder={t.searchPlaceholder}
            onCoordinateSelect={(selected) => {
              setCoords({ lat: selected.lat, lng: selected.lng });
              if (selected.name) setName(selected.name);
              if (selected.address) setAddress(selected.address);
            }}
          />

          <form onSubmit={handleSave} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.locationNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.locationNamePlaceholder}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.radiusLabel}
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                  {RADIUS_CHOICES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadiusMeters(r)}
                      className={`min-h-[36px] py-1.5 text-xs font-semibold rounded-lg tabular-nums transition-colors ${
                        radiusMeters === r
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

            {/* Optional Active Days & Time Window */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.optionalWindowLabel}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {t.daysShort.map((dayLabel, idx) => {
                  const selected = activeDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleDay(idx)}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {dayLabel}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {t.startTimeLabel} ({isHe ? 'אופציונלי' : 'Optional'})
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono-tabular rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {t.endTimeLabel} ({isHe ? 'אופציונלי' : 'Optional'})
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono-tabular rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleResetForm}
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
                <span>{t.saveLocationBtn}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Saved Synagogues List & Geofence Presence Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{t.antiDriftNote}</span>
          </div>

          {locations.map((loc) => {
            const distanceFromUser = userCoords
              ? calculateDistanceMeters(
                  userCoords.lat,
                  userCoords.lng,
                  loc.lat,
                  loc.lng
                )
              : null;

            const isInside =
              Boolean(loc.simulatedInside) ||
              (distanceFromUser !== null &&
                distanceFromUser <= loc.radiusMeters);

            return (
              <div
                key={loc.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-colors space-y-4 ${
                  isInside && loc.enabled
                    ? 'border-amber-500/70 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                        {loc.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {loc.address}
                    </p>
                    {/* Unboxed Metadata with · separators */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-0.5 tabular-nums">
                      <span
                        className={
                          isInside && loc.enabled
                            ? 'text-amber-600 dark:text-amber-400 font-semibold'
                            : ''
                        }
                      >
                        {isInside ? t.insideGeofenceBadge : t.outsideGeofenceBadge}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {loc.radiusMeters} {t.metersUnit}
                      </span>
                      {distanceFromUser !== null && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{distanceFromUser}m away</span>
                        </>
                      )}
                      {loc.startTime && loc.endTime && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            {loc.startTime}–{loc.endTime}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Enable / Disable Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={loc.enabled}
                    onClick={() =>
                      onUpdateLocation(loc.id, { enabled: !loc.enabled })
                    }
                    className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 flex items-center ${
                      loc.enabled
                        ? 'bg-slate-900 dark:bg-amber-500 justify-end'
                        : 'bg-slate-200 dark:bg-slate-700 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-950 shadow-xs" />
                  </button>
                </div>

                {/* Action Controls: Simulate Geofence Enter/Exit, Edit, Delete */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onSimulateGeofence(loc.id, !loc.simulatedInside, false)
                      }
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        loc.simulatedInside
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {loc.simulatedInside
                          ? t.simulateExitBtn
                          : t.simulateEnterBtn}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(loc)}
                      className="min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t.editBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteLocation(loc.id)}
                      className="min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.deleteBtn}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
