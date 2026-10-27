import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  Map,
  MapMouseEvent,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import { GeofenceRadius, SavedLocation } from '../types/shulmode';

const GOOGLE_MAPS_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

interface GeofenceCircleOverlayProps {
  center: { lat: number; lng: number };
  radiusMeters: number;
  strokeColor?: string;
  fillColor?: string;
}

const GeofenceCircleOverlay: React.FC<GeofenceCircleOverlayProps> = ({
  center,
  radiusMeters,
  strokeColor = '#C59B27',
  fillColor = '#D4AF37',
}) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map || !mapsLib) return;

    if (!circleRef.current) {
      circleRef.current = new mapsLib.Circle({
        map,
        center,
        radius: radiusMeters,
        strokeColor,
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor,
        fillOpacity: 0.2,
        clickable: false,
      });
    } else {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radiusMeters);
      circleRef.current.setOptions({ strokeColor, fillColor });
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, mapsLib, center.lat, center.lng, radiusMeters, strokeColor, fillColor]);

  return null;
};

interface PlacesSearchBoxProps {
  placeholder: string;
  onPlaceSelected: (placeData: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    placeId?: string;
  }) => void;
}

const PlacesSearchBox: React.FC<PlacesSearchBoxProps> = ({
  placeholder,
  onPlaceSelected,
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!placesLib) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }

        const response =
          await AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: trimmed,
            sessionToken: sessionTokenRef.current,
          });

        setSuggestions(response?.suggestions || []);
        setIsOpen(true);
      } catch (err: any) {
        const msg = String(err?.message || err || '');
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('QuotaExceededError') ||
          msg.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        console.error('Autocomplete error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [placesLib, query]);

  const handleSelectSuggestion = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!placesLib || !suggestion.placePrediction) return;
      try {
        setIsLoading(true);
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
        });

        const loc = place.location;
        if (loc) {
          const lat = loc.lat();
          const lng = loc.lng();
          if (map) {
            if (place.viewport) {
              map.fitBounds(place.viewport);
            } else {
              map.panTo({ lat, lng });
              map.setZoom(17);
            }
          }
          onPlaceSelected({
            name:
              place.displayName ||
              suggestion.placePrediction.mainText?.text ||
              '',
            address:
              place.formattedAddress ||
              suggestion.placePrediction.text?.text ||
              '',
            lat,
            lng,
            placeId: place.id,
          });
        }
        setQuery('');
        setSuggestions([]);
        setIsOpen(false);
        sessionTokenRef.current = null;
      } catch (err: any) {
        const msg = String(err?.message || err || '');
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('QuotaExceededError') ||
          msg.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        console.error('Place fetchFields error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [placesLib, map, onPlaceSelected]
  );

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute start-3.5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full ps-10 pe-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        />
        {isLoading && (
          <Loader2 className="w-4 h-4 text-amber-600 animate-spin absolute end-3.5" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1.5 w-full max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg divide-y divide-slate-100 dark:divide-slate-800">
          {suggestions.map((s, idx) => {
            const pred = s.placePrediction;
            if (!pred) return null;
            return (
              <li key={pred.placeId || idx}>
                <button
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-start px-3.5 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors flex items-start gap-2.5"
                >
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {pred.mainText?.text || pred.text?.text}
                    </div>
                    {pred.secondaryText?.text && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {pred.secondaryText.text}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export interface GoogleMapSelectorProps {
  selectedCenter: { lat: number; lng: number };
  radiusMeters: GeofenceRadius;
  savedLocations?: SavedLocation[];
  searchPlaceholder: string;
  onCoordinateSelect: (coords: {
    lat: number;
    lng: number;
    name?: string;
    address?: string;
    placeId?: string;
  }) => void;
  heightClassName?: string;
}

export const GoogleMapSelector: React.FC<GoogleMapSelectorProps> = ({
  selectedCenter,
  radiusMeters,
  savedLocations = [],
  searchPlaceholder,
  onCoordinateSelect,
  heightClassName = 'h-[320px] md:h-[360px]',
}) => {
  const [locatingGps, setLocatingGps] = useState(false);

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const latLng = e.detail?.latLng;
      if (!latLng) return;
      onCoordinateSelect({
        lat: Number(latLng.lat.toFixed(6)),
        lng: Number(latLng.lng.toFixed(6)),
      });
    },
    [onCoordinateSelect]
  );

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingGps(false);
        onCoordinateSelect({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
      },
      () => {
        setLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Google Maps API key is not configured. You can still enter latitude and longitude coordinates manually below.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <PlacesSearchBox
              placeholder={searchPlaceholder}
              onPlaceSelected={(place) =>
                onCoordinateSelect({
                  lat: Number(place.lat.toFixed(6)),
                  lng: Number(place.lng.toFixed(6)),
                  name: place.name,
                  address: place.address,
                  placeId: place.placeId,
                })
              }
            />
          </div>
          <button
            type="button"
            onClick={handleLocateMe}
            title="Use current device GPS location"
            className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <Navigation className={`w-3.5 h-3.5 text-amber-600 ${locatingGps ? 'animate-spin' : ''}`} />
            <span>GPS</span>
          </button>
        </div>

        <div
          className={`relative w-full ${heightClassName} rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs`}
        >
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={selectedCenter}
            defaultZoom={16}
            gestureHandling="greedy"
            disableDefaultUI={false}
            onClick={handleMapClick}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            className="w-full h-full"
          >
            {/* Active Selected Center + Geofence Radius Circle */}
            <AdvancedMarker position={selectedCenter}>
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-amber-400 shadow-md flex items-center justify-center text-amber-400">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
            </AdvancedMarker>

            <GeofenceCircleOverlay
              center={selectedCenter}
              radiusMeters={radiusMeters}
            />

            {/* Existing Saved Locations */}
            {savedLocations.map((loc) => (
              <React.Fragment key={loc.id}>
                <AdvancedMarker
                  position={{ lat: loc.lat, lng: loc.lng }}
                  title={loc.name}
                >
                  <div className="px-2 py-1 rounded-md bg-slate-900/90 text-amber-300 border border-amber-500/40 text-[11px] font-medium shadow-xs whitespace-nowrap">
                    {loc.name}
                  </div>
                </AdvancedMarker>
                <GeofenceCircleOverlay
                  center={{ lat: loc.lat, lng: loc.lng }}
                  radiusMeters={loc.radiusMeters}
                  strokeColor={loc.enabled ? '#0F172A' : '#94A3B8'}
                  fillColor={loc.enabled ? '#1E293B' : '#CBD5E1'}
                />
              </React.Fragment>
            ))}
          </Map>
        </div>
      </div>
    </APIProvider>
  );
};
