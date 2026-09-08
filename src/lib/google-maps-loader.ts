/**
 * RideSetu Google Maps Platform Singleton Script Loader
 * Guarantees single-instance, race-condition-free script loading for Google Maps API.
 */

let loadPromise: Promise<any> | null = null;

export function loadGoogleMapsScript(apiKey?: string): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps script cannot be loaded on the server.'));
  }

  // If google.maps.Map is already loaded and ready
  if ((window as any).google?.maps?.Map) {
    return Promise.resolve((window as any).google.maps);
  }

  if (loadPromise) {
    return loadPromise;
  }

  const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured.'));
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if script tag already exists in document
    let scriptTag = document.getElementById('google-maps-js-sdk') as HTMLScriptElement;

    const onScriptLoaded = () => {
      // Poll briefly for window.google.maps.Map constructor to be fully initialized
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).google?.maps?.Map) {
          clearInterval(interval);
          resolve((window as any).google.maps);
        } else if (attempts > 100) {
          clearInterval(interval);
          reject(new Error('Google Maps JavaScript API script loaded, but google.maps.Map object failed to initialize.'));
        }
      }, 50);
    };

    const onScriptError = (err?: any) => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps JavaScript API script. Please check network connection or API key restrictions.'));
    };

    if (scriptTag) {
      if ((window as any).google?.maps?.Map) {
        onScriptLoaded();
      } else {
        scriptTag.addEventListener('load', onScriptLoaded);
        scriptTag.addEventListener('error', onScriptError);
      }
    } else {
      scriptTag = document.createElement('script');
      scriptTag.id = 'google-maps-js-sdk';
      scriptTag.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry`;
      scriptTag.async = true;
      scriptTag.defer = true;
      scriptTag.onload = onScriptLoaded;
      scriptTag.onerror = onScriptError;
      document.head.appendChild(scriptTag);
    }
  });

  return loadPromise;
}
