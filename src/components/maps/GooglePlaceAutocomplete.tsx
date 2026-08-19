'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X, AlertCircle, Compass } from 'lucide-react';
import { loadGoogleMapsScript } from '@/lib/google-maps-loader';

export interface PlaceResult {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId: string;
  name?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface GooglePlaceAutocompleteProps {
  placeholder?: string;
  initialValue?: string;
  destinationCity?: string;
  destinationLat?: number;
  destinationLng?: number;
  onPlaceSelected: (result: PlaceResult) => void;
}

// Development-only curated location search fallback for Uttarakhand testing
const DEV_LOCATION_FALLBACKS = [
  {
    name: 'Zostel Rishikesh',
    address: 'Zostel Rishikesh, Badrinath Road, Tapovan, Rishikesh, Uttarakhand 249192',
    lat: 30.1317,
    lng: 78.3242,
    placeId: 'dev_place_zostel_rishikesh',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    pincode: '249192',
    keywords: ['zostel', 'tapovan', 'rishikesh', 'hostel', 'hotel'],
  },
  {
    name: 'Zostel Tapovan',
    address: 'Zostel Tapovan, Main Badrinath Highway, Tapovan, Rishikesh, Uttarakhand 249192',
    lat: 30.1345,
    lng: 78.3268,
    placeId: 'dev_place_zostel_tapovan',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    pincode: '249192',
    keywords: ['zostel', 'tapovan', 'hostel', 'hotel'],
  },
  {
    name: 'Hotel Ganga Kinare',
    address: 'Hotel Ganga Kinare, 237 Virbhadra Road, Rishikesh, Uttarakhand 249201',
    lat: 30.0895,
    lng: 78.2864,
    placeId: 'dev_place_ganga_kinare',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    pincode: '249201',
    keywords: ['ganga', 'kinare', 'hotel', 'resort', 'rishikesh'],
  },
  {
    name: 'Ram Jhula Suspension Bridge',
    address: 'Ram Jhula, Muni Ki Reti, Rishikesh, Uttarakhand 249192',
    lat: 30.1182,
    lng: 78.3129,
    placeId: 'dev_place_ram_jhula',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    pincode: '249192',
    keywords: ['ram', 'jhula', 'bridge', 'muni', 'reti', 'landmark'],
  },
  {
    name: 'Laxman Jhula Bridge',
    address: 'Laxman Jhula, Tapovan, Rishikesh, Uttarakhand 249192',
    lat: 30.1245,
    lng: 78.3289,
    placeId: 'dev_place_laxman_jhula',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    pincode: '249192',
    keywords: ['laxman', 'jhula', 'bridge', 'tapovan', 'landmark'],
  },
  {
    name: 'Rishikesh Railway Station (YRK)',
    address: 'Rishikesh Railway Station, Station Road, Rishikesh, Uttarakhand 249201',
    lat: 30.0987,
    lng: 78.2891,
    placeId: 'dev_place_railway_station',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    pincode: '249201',
    keywords: ['railway', 'station', 'train', 'yrk', 'rishikesh'],
  },
  {
    name: 'Bunk Stay Hostel',
    address: 'Bunk Stay, Upper Tapovan, Laxman Jhula, Rishikesh, Uttarakhand 249192',
    lat: 30.1302,
    lng: 78.3255,
    placeId: 'dev_place_bunk_stay',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    pincode: '249192',
    keywords: ['bunk', 'stay', 'hostel', 'tapovan'],
  },
  {
    name: 'Haridwar Junction Railway Station',
    address: 'Haridwar Railway Station, Railway Station Road, Haridwar, Uttarakhand 249401',
    lat: 29.9457,
    lng: 78.1642,
    placeId: 'dev_place_haridwar',
    city: 'Haridwar',
    state: 'Uttarakhand',
    pincode: '249401',
    keywords: ['haridwar', 'station', 'city'],
  },
  {
    name: 'Dehradun ISBT Bus Terminal',
    address: 'Dehradun ISBT, Haridwar Bypass Road, Dehradun, Uttarakhand 248001',
    lat: 30.2863,
    lng: 78.0084,
    placeId: 'dev_place_dehradun',
    city: 'Dehradun',
    state: 'Uttarakhand',
    pincode: '248001',
    keywords: ['dehradun', 'isbt', 'bus', 'city'],
  },
  {
    name: 'Mall Road Mussoorie',
    address: 'Mall Road, Library Chowk, Mussoorie, Uttarakhand 248179',
    lat: 30.4598,
    lng: 78.0645,
    placeId: 'dev_place_mussoorie',
    city: 'Mussoorie',
    state: 'Uttarakhand',
    pincode: '248179',
    keywords: ['mussoorie', 'mall', 'road', 'hillstation'],
  },
];

export default function GooglePlaceAutocomplete({
  placeholder = 'Search Google Places Location / Landmark...',
  initialValue = '',
  destinationCity = 'Rishikesh',
  destinationLat = 30.0869,
  destinationLng = 78.2676,
  onPlaceSelected,
}: GooglePlaceAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [isDevFallbackActive, setIsDevFallbackActive] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Load Google Maps Script with Places library
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      loadGoogleMapsScript(apiKey)
        .then(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[RideSetu Places] Places library script loaded');
          }
        })
        .catch((err) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('[RideSetu Places] Failed to load Places SDK:', err.message);
          }
        });
    }
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectPrediction(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  // Development-only fallback filter helper
  const getDevFallbackSuggestions = (inputVal: string) => {
    const lower = inputVal.toLowerCase().trim();
    return DEV_LOCATION_FALLBACKS.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        item.address.toLowerCase().includes(lower) ||
        item.keywords.some((kw) => kw.includes(lower))
    ).map((item) => ({
      ...item,
      isDevFallback: true,
      description: item.address,
      structured_formatting: {
        main_text: item.name,
        secondary_text: `${item.city}, ${item.state}`,
      },
    }));
  };

  // Fetch suggestions using Google Places Autocomplete API or Development Fallback
  const handleQueryChange = async (val: string) => {
    setQuery(val);
    setSelectedIndex(-1);
    setPlacesError(null);

    if (!val.trim() || val.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[RideSetu Places] Search initialized. Query: "${val}"`);
    }

    const isDev = process.env.NODE_ENV !== 'production';

    try {
      if (typeof window !== 'undefined' && (window as any).google?.maps?.places?.AutocompleteService) {
        const service = new (window as any).google.maps.places.AutocompleteService();

        const locationBias = (window as any).google.maps.Circle
          ? new (window as any).google.maps.Circle({
              center: { lat: destinationLat, lng: destinationLng },
              radius: 50000,
            }).getBounds()
          : { lat: destinationLat, lng: destinationLng };

        const requestPayload: any = {
          input: val,
          componentRestrictions: { country: 'in' },
          bounds: locationBias,
        };

        service.getPlacePredictions(requestPayload, (predictions: any[], status: string) => {
          if (status === (window as any).google?.maps?.places?.PlacesServiceStatus?.OK && predictions && predictions.length > 0) {
            setSuggestions(predictions.map((p) => ({ ...p, isDevFallback: false })));
            setIsDevFallbackActive(false);
            setPlacesError(null);
            setLoading(false);
          } else {
            // Google Places unavailable or billing disabled
            if (isDev) {
              const devMatches = getDevFallbackSuggestions(val);
              setSuggestions(devMatches);
              setIsDevFallbackActive(true);
              setPlacesError(null);
              if (process.env.NODE_ENV === 'development') {
                console.log(`[RideSetu Places] Switched to Development Location Search (${devMatches.length} matches)`);
              }
            } else {
              setSuggestions([]);
              setIsDevFallbackActive(false);
              setPlacesError('Google Places search is unavailable. Please check Places API enablement.');
            }
            setLoading(false);
          }
        });
      } else {
        // SDK offline or not initialized
        if (isDev) {
          const devMatches = getDevFallbackSuggestions(val);
          setSuggestions(devMatches);
          setIsDevFallbackActive(true);
        } else {
          setSuggestions([]);
        }
        setLoading(false);
      }
    } catch (err: any) {
      if (isDev) {
        setSuggestions(getDevFallbackSuggestions(val));
        setIsDevFallbackActive(true);
      }
      setLoading(false);
    }
  };

  // Handle selecting a prediction
  const handleSelectPrediction = (prediction: any) => {
    const mainText = prediction.structured_formatting?.main_text || prediction.name || prediction.description?.split(',')[0] || query;
    const fullAddress = prediction.description || prediction.address || query;
    const placeId = prediction.placeId || prediction.place_id || `dev_place_${Date.now()}`;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[RideSetu Places] Place selected: ${placeId} ("${mainText}")`, prediction);
    }

    setQuery(fullAddress);
    setIsOpen(false);
    setSelectedIndex(-1);

    // If prediction is from Dev Fallback or has explicit lat/lng
    if (prediction.isDevFallback || (prediction.lat && prediction.lng)) {
      onPlaceSelected({
        formattedAddress: fullAddress,
        latitude: prediction.lat,
        longitude: prediction.lng,
        placeId,
        name: mainText,
        city: prediction.city || destinationCity,
        state: prediction.state || 'Uttarakhand',
        pincode: prediction.pincode || '',
      });
      return;
    }

    // Google Places Geocoder lookup for live Google predictions
    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder && prediction.place_id) {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ placeId: prediction.place_id }, (results: any[], status: string) => {
        if (status === 'OK' && results[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          const result = results[0];
          const lat = Number(loc.lat().toFixed(6));
          const lng = Number(loc.lng().toFixed(6));

          let extractedCity = destinationCity;
          let extractedState = 'Uttarakhand';
          let extractedPincode = '';

          (result.address_components || []).forEach((comp: any) => {
            if (comp.types.includes('locality')) extractedCity = comp.long_name;
            if (comp.types.includes('administrative_area_level_1')) extractedState = comp.long_name;
            if (comp.types.includes('postal_code')) extractedPincode = comp.long_name;
          });

          onPlaceSelected({
            formattedAddress: result.formatted_address || fullAddress,
            latitude: lat,
            longitude: lng,
            placeId,
            name: mainText,
            city: extractedCity,
            state: extractedState,
            pincode: extractedPincode,
          });
          return;
        }

        // Fallback lat/lng if geocoding returns no geometry
        onPlaceSelected({
          formattedAddress: fullAddress,
          latitude: destinationLat,
          longitude: destinationLng,
          placeId,
          name: mainText,
          city: destinationCity,
          state: 'Uttarakhand',
        });
      });
    } else {
      onPlaceSelected({
        formattedAddress: fullAddress,
        latitude: destinationLat,
        longitude: destinationLng,
        placeId,
        name: mainText,
        city: destinationCity,
        state: 'Uttarakhand',
      });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full font-sans z-30">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="places-autocomplete-listbox"
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition-all"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setIsOpen(false);
              setPlacesError(null);
            }}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Suggestions Panel */}
      {isOpen && (
        <div
          id="places-autocomplete-listbox"
          className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100"
        >
          {loading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              Searching locations in {destinationCity}...
            </div>
          ) : placesError ? (
            <div className="p-4 bg-amber-50 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Google Places Unavailable</div>
                <div className="text-[11px] text-amber-700 mt-0.5">{placesError}</div>
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((item, idx) => (
                <button
                  key={item.placeId || item.place_id || idx}
                  type="button"
                  onClick={() => handleSelectPrediction(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-3 transition-colors flex items-start justify-between gap-3 text-xs ${
                    selectedIndex === idx ? 'bg-emerald-50 text-emerald-950 font-semibold' : 'hover:bg-slate-50 text-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">
                        {item.structured_formatting?.main_text || item.name || item.description?.split(',')[0]}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        {item.structured_formatting?.secondary_text || item.description}
                      </div>
                    </div>
                  </div>

                  {item.isDevFallback && process.env.NODE_ENV !== 'production' && (
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                      Development Location Search
                    </span>
                  )}
                </button>
              ))}

              {/* Attribution Footer */}
              <div className="px-3 py-1.5 bg-slate-50 text-[10px] text-slate-500 font-medium flex items-center justify-between border-t border-slate-100">
                {isDevFallbackActive && process.env.NODE_ENV !== 'production' ? (
                  <span className="font-bold text-amber-800 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-amber-600" />
                    Development Location Search • Localhost Mode
                  </span>
                ) : (
                  <span className="text-slate-400">Powered by Google Maps</span>
                )}
              </div>
            </>
          ) : (
            <div className="p-4 text-xs text-slate-500 text-center">
              No matching locations found in {destinationCity}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
