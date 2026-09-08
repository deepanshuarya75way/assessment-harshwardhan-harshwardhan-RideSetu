/**
 * RideSetu Google Maps Platform Diagnostic Utility
 * Provides safe, non-sensitive diagnostic info about Google Maps JS API availability.
 */

export interface GoogleMapsDiagnostics {
  apiKeyConfigured: boolean;
  googleObjectAvailable: boolean;
  mapsApiAvailable: boolean;
  placesApiAvailable: boolean;
  geocoderAvailable: boolean;
  environment: 'development' | 'production';
}

export function getGoogleMapsDiagnostics(): GoogleMapsDiagnostics {
  const isBrowser = typeof window !== 'undefined';
  const apiKeyConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  const googleObj = isBrowser ? (window as any).google : undefined;
  const googleObjectAvailable = Boolean(googleObj);
  const mapsApiAvailable = Boolean(googleObj?.maps && typeof googleObj.maps.Map === 'function');
  const placesApiAvailable = Boolean(googleObj?.maps?.places && typeof googleObj.maps.places.AutocompleteService === 'function');
  const geocoderAvailable = Boolean(googleObj?.maps && typeof googleObj.maps.Geocoder === 'function');

  return {
    apiKeyConfigured,
    googleObjectAvailable,
    mapsApiAvailable,
    placesApiAvailable,
    geocoderAvailable,
    environment: (process.env.NODE_ENV as 'development' | 'production') || 'development',
  };
}
