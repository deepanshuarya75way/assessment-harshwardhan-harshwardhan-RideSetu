'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Building,
  Home,
  Hotel,
  ShieldCheck,
  AlertCircle,
  Clock,
  Phone,
  User,
  Info,
  Compass,
} from 'lucide-react';
import GooglePlaceAutocomplete, { PlaceResult } from '@/components/maps/GooglePlaceAutocomplete';
import { loadGoogleMapsScript } from '@/lib/google-maps-loader';

export interface DeliveryLocationData {
  locationType: 'VENDOR_PICKUP' | 'DOORSTEP' | 'HOTEL' | 'HOSTEL' | 'OTHER';
  locationSource: 'CURRENT_LOCATION' | 'GOOGLE_PLACE' | 'MAP_PIN' | 'MANUAL';
  address: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  houseOrRoom?: string;
  buildingName?: string;
  landmark?: string;
  instructions?: string;
  formattedAddress?: string;
  contactName?: string;
  contactPhone?: string;
  deliveryInstructions?: string;
  hotelName?: string;
  roomNumber?: string;
  receiverName?: string;
  receiverPhone?: string;
  deliveryFee?: number;
  hubAddress?: string;
  distanceKm?: number;
}

export type DeliveryLocation = DeliveryLocationData;

interface DeliveryLocationSelectorProps {
  destinationCity?: string;
  initialType?: string;
  vendorDeliveryRadiusKm?: number;
  baseDeliveryFee?: number;
  onLocationConfirmed?: (location: DeliveryLocationData) => void;
  savedLocations?: any[];
  value?: DeliveryLocationData;
  onChange?: (location: DeliveryLocationData) => void;
}

export default function DeliveryLocationSelector({
  destinationCity = 'Rishikesh',
  initialType = 'DOORSTEP',
  vendorDeliveryRadiusKm = 15,
  baseDeliveryFee = 100,
  onLocationConfirmed,
  savedLocations = [],
  value,
  onChange,
}: DeliveryLocationSelectorProps) {
  const [deliveryMode, setDeliveryMode] = useState<'VENDOR_PICKUP' | 'HOTEL' | 'DOORSTEP'>(
    initialType === 'VENDOR_PICKUP' ? 'VENDOR_PICKUP' : initialType === 'HOTEL' ? 'HOTEL' : 'DOORSTEP'
  );

  // Rishikesh Default Center: 30.0869° N, 78.2676° E
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 30.0869,
    lng: 78.2676,
  });

  const [placeId, setPlaceId] = useState<string>('');
  const [formattedAddress, setFormattedAddress] = useState<string>('');
  const [buildingName, setBuildingName] = useState<string>('');
  const [houseOrRoom, setHouseOrRoom] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>('');
  const [locationSource, setLocationSource] = useState<'CURRENT_LOCATION' | 'GOOGLE_PLACE' | 'MAP_PIN' | 'MANUAL'>('MANUAL');
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  // Geolocation & Map Status
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoSuccess, setGeoSuccess] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapConfigError, setMapConfigError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // 1. Load Real Google Maps JavaScript API via Singleton Loader
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (process.env.NODE_ENV === 'development') {
      console.log('[RideSetu Maps] loader started, client key present:', Boolean(apiKey));
    }

    if (!apiKey) {
      setMapConfigError('GOOGLE_MAPS_API_KEY_NOT_CONFIGURED: Google Maps API key is missing in environment variables. Real Google Maps cannot be loaded.');
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[RideSetu Maps] Google Maps API loaded successfully');
        }
        setMapLoaded(true);
      })
      .catch((err) => {
        setMapConfigError(err.message || 'Failed to load Google Maps JavaScript API script. Please check network connection and API key configuration.');
      });
  }, []);

  // 2. Initialize Real Google Map & Draggable Marker on DOM element
  useEffect(() => {
    if (!mapLoaded || typeof window === 'undefined' || !(window as any).google?.maps?.Map) {
      return;
    }

    if (!mapContainerRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[RideSetu Maps] Container ref not ready yet');
      }
      return;
    }

    if (!googleMapRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[RideSetu Maps] Creating google.maps.Map instance on container ref');
      }

      try {
        const mapInstance = new (window as any).google.maps.Map(mapContainerRef.current, {
          center: { lat: coords.lat, lng: coords.lng },
          zoom: 14,
          mapTypeId: 'roadmap',
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        googleMapRef.current = mapInstance;

        const markerInstance = new (window as any).google.maps.Marker({
          position: { lat: coords.lat, lng: coords.lng },
          map: mapInstance,
          draggable: true,
          title: 'Selected Delivery Location',
        });

        markerRef.current = markerInstance;

        // Handle Marker Drag Event
        markerInstance.addListener('dragend', (e: any) => {
          if (!e.latLng) return;
          const newLat = Number(e.latLng.lat().toFixed(6));
          const newLng = Number(e.latLng.lng().toFixed(6));
          setCoords({ lat: newLat, lng: newLng });
          setLocationSource('MAP_PIN');
          setIsConfirmed(false);
          performReverseGeocode(newLat, newLng);
        });

        // Handle Map Click Event
        mapInstance.addListener('click', (e: any) => {
          if (!e.latLng) return;
          const newLat = Number(e.latLng.lat().toFixed(6));
          const newLng = Number(e.latLng.lng().toFixed(6));
          setCoords({ lat: newLat, lng: newLng });
          if (markerRef.current) {
            markerRef.current.setPosition({ lat: newLat, lng: newLng });
          }
          setLocationSource('MAP_PIN');
          setIsConfirmed(false);
          performReverseGeocode(newLat, newLng);
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('[RideSetu Maps] map instance created successfully');
        }
      } catch (err: any) {
        console.error('[RideSetu Maps] Initialization Error:', err);
      }
    }

    // Trigger map resize whenever container becomes visible or deliveryMode changes
    const timer = setTimeout(() => {
      if ((window as any).google?.maps?.event && googleMapRef.current) {
        (window as any).google.maps.event.trigger(googleMapRef.current, 'resize');
        googleMapRef.current.setCenter({ lat: coords.lat, lng: coords.lng });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [mapLoaded, deliveryMode]);

  // Update map center & marker position when coords state changes
  useEffect(() => {
    if (googleMapRef.current && markerRef.current) {
      const pos = { lat: coords.lat, lng: coords.lng };
      markerRef.current.setPosition(pos);
      googleMapRef.current.panTo(pos);
    }
  }, [coords]);

  // Perform Google Reverse Geocoding
  const performReverseGeocode = (lat: number, lng: number) => {
    if (typeof window === 'undefined' || !(window as any).google?.maps?.Geocoder) return;

    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
      if (status === 'OK' && results[0]) {
        const result = results[0];
        setFormattedAddress(result.formatted_address || '');
        setAddress(result.formatted_address || `${lat}, ${lng}`);
        if (result.place_id) setPlaceId(result.place_id);

        let extractedCity = destinationCity;
        let extractedState = 'Uttarakhand';
        let extractedPincode = '';

        (result.address_components || []).forEach((comp: any) => {
          if (comp.types.includes('locality')) extractedCity = comp.long_name;
          if (comp.types.includes('administrative_area_level_1')) extractedState = comp.long_name;
          if (comp.types.includes('postal_code')) extractedPincode = comp.long_name;
        });

        if (extractedPincode) setPincode(extractedPincode);
      }
    });
  };

  // Google Places Selection Callback
  const handlePlaceSelected = (place: PlaceResult) => {
    setCoords({ lat: place.latitude, lng: place.longitude });
    setFormattedAddress(place.formattedAddress);
    setAddress(place.formattedAddress);
    setBuildingName(place.name || place.formattedAddress.split(',')[0]);
    if (place.placeId) setPlaceId(place.placeId);
    setLocationSource('GOOGLE_PLACE');
    setIsConfirmed(false);
    if (googleMapRef.current) {
      googleMapRef.current.panTo({ lat: place.latitude, lng: place.longitude });
      googleMapRef.current.setZoom(15);
    }
  };

  // "Use My Current Location" via Browser Geolocation API
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);
    setGeoSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));

        setCoords({ lat, lng });
        setLocationSource('CURRENT_LOCATION');
        setGeoLoading(false);
        setGeoSuccess(true);
        setIsConfirmed(false);

        performReverseGeocode(lat, lng);

        if (googleMapRef.current) {
          googleMapRef.current.panTo({ lat, lng });
          googleMapRef.current.setZoom(16);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission denied. Please allow GPS access or search your delivery landmark above.');
        } else if (err.code === err.TIMEOUT) {
          setGeoError('GPS request timed out. Please try again or select your location on the map.');
        } else {
          setGeoError('Unable to detect your current position. Please select location on map.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Select Saved Location
  const handleSelectSavedLocation = (saved: any) => {
    const lat = saved.latitude || 30.0869;
    const lng = saved.longitude || 78.2676;

    setCoords({ lat, lng });
    setBuildingName(saved.buildingName || saved.label || '');
    setHouseOrRoom(saved.houseOrRoom || '');
    setLandmark(saved.landmark || '');
    setAddress(saved.address || '');
    setPincode(saved.pincode || '');
    setContactName(saved.contactName || '');
    setContactPhone(saved.contactPhone || '');
    setDeliveryInstructions(saved.deliveryInstructions || '');
    if (saved.placeId) setPlaceId(saved.placeId);
    setLocationSource('MANUAL');
    setIsConfirmed(false);
  };

  // Confirm Location Snapshot
  const handleConfirm = () => {
    const finalData: DeliveryLocationData = {
      locationType: deliveryMode === 'VENDOR_PICKUP' ? 'VENDOR_PICKUP' : deliveryMode === 'HOTEL' ? 'HOTEL' : 'DOORSTEP',
      locationSource,
      address: deliveryMode === 'VENDOR_PICKUP' ? `Verified Local Vendor Hub, ${destinationCity}` : address || `Coordinates: ${coords.lat}, ${coords.lng}`,
      houseOrRoom: deliveryMode === 'VENDOR_PICKUP' ? '' : houseOrRoom,
      buildingName: deliveryMode === 'VENDOR_PICKUP' ? 'Vendor Official Hub' : buildingName,
      landmark: deliveryMode === 'VENDOR_PICKUP' ? 'Main Market Junction' : landmark,
      city: destinationCity,
      state: 'Uttarakhand',
      country: 'India',
      pincode,
      latitude: coords.lat,
      longitude: coords.lng,
      placeId,
      formattedAddress:
        formattedAddress ||
        (deliveryMode === 'VENDOR_PICKUP'
          ? `Verified Local Vendor Hub, ${destinationCity}, Uttarakhand`
          : `${houseOrRoom ? houseOrRoom + ', ' : ''}${buildingName ? buildingName + ', ' : ''}${address}, ${destinationCity}, Uttarakhand`),
      contactName,
      contactPhone,
      deliveryInstructions,
    };

    setIsConfirmed(true);
    if (onLocationConfirmed) onLocationConfirmed(finalData);
    if (onChange) onChange(finalData);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center font-bold shadow-sm">
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Pickup & Delivery Location</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Compass className="w-3 h-3 text-emerald-600" />
                Google Maps Platform
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select vendor store pickup or doorstep / hotel delivery in {destinationCity}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Delivery Type Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setDeliveryMode('VENDOR_PICKUP');
              setIsConfirmed(false);
            }}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              deliveryMode === 'VENDOR_PICKUP'
                ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                <Building className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                FREE
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Vendor Hub Pickup</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Pick up directly from store hub in {destinationCity}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setDeliveryMode('HOTEL');
              setIsConfirmed(false);
            }}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              deliveryMode === 'HOTEL'
                ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="p-2 rounded-lg bg-teal-100 text-teal-800">
                <Hotel className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                ₹{baseDeliveryFee}
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Hotel / Hostel Delivery</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Doorstep delivery to hotel, resort, or hostel
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setDeliveryMode('DOORSTEP');
              setIsConfirmed(false);
            }}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              deliveryMode === 'DOORSTEP'
                ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="p-2 rounded-lg bg-indigo-100 text-indigo-800">
                <Home className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                ₹{baseDeliveryFee}
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Doorstep Delivery</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Airbnb, homestay, or custom landmark delivery
              </div>
            </div>
          </button>
        </div>

        {/* Vendor Pickup Mode View */}
        {deliveryMode === 'VENDOR_PICKUP' && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Building className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-sm text-slate-700">
              <div className="font-bold text-slate-900">
                Verified Local Vendor Hub — {destinationCity}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                You will pick up the vehicle directly from the verified vendor store. Navigation link and host contact details will be unlocked on your voucher upon booking.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-emerald-700">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Zero Delivery Fee
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Free Clean Helmets
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Fast 2-Min Handover
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Hotel & Doorstep Delivery Controls (Keep map container mounted permanently in DOM, toggle visibility via CSS to prevent ref timing issues) */}
        <div className={deliveryMode === 'VENDOR_PICKUP' ? 'hidden' : 'space-y-5'}>
          {/* Geolocation Button & Saved Locations */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={geoLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-75"
              >
                <Navigation className={`w-4 h-4 ${geoLoading ? 'animate-spin' : ''}`} />
                {geoLoading ? 'Locating you...' : 'Use My Current Location'}
              </button>

              {geoSuccess && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> GPS Locked
                </span>
              )}
            </div>

            {savedLocations.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-semibold text-slate-400 shrink-0">Saved:</span>
                {savedLocations.map((loc: any) => (
                  <button
                    key={loc._id}
                    type="button"
                    onClick={() => handleSelectSavedLocation(loc)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 transition-colors shrink-0"
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {geoError && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{geoError}</span>
            </div>
          )}

          {/* Google Places Autocomplete Search Bar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Search Google Places Location / Landmark
            </label>
            <GooglePlaceAutocomplete
              destinationCity={destinationCity}
              initialValue=""
              placeholder={`Search hotel, hostel, resort, or landmark in ${destinationCity} (e.g. Zostel Rishikesh, Ganga Kinare)...`}
              onPlaceSelected={handlePlaceSelected}
            />
          </div>

          {/* Real Google Maps Container */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <span className="font-semibold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                Google Maps Delivery Location & Drag Pin
              </span>
              <span className="text-[11px] text-slate-400">Click map or drag pin to reposition delivery point</span>
            </div>

            {mapConfigError ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Google Maps Unavailable</div>
                  <div className="text-slate-500 mt-0.5">{mapConfigError}</div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm min-h-[320px] sm:min-h-[360px]">
                <div
                  ref={mapContainerRef}
                  className="w-full h-full min-h-[320px] sm:min-h-[360px] relative"
                  style={{ width: '100%', minHeight: '320px', height: '360px' }}
                />
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-[11px] font-semibold text-slate-700 z-10 pointer-events-none">
                  Selected Pin: {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
                </div>
              </div>
            )}
          </div>

          {/* Address Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {deliveryMode === 'HOTEL' ? 'Hotel / Hostel / Resort Name *' : 'Building / Villa / House Name *'}
              </label>
              <input
                type="text"
                required
                value={buildingName}
                onChange={(e) => {
                  setBuildingName(e.target.value);
                  setIsConfirmed(false);
                }}
                placeholder={deliveryMode === 'HOTEL' ? 'e.g. Zostel Tapovan / Hotel Ganga Kinare' : 'e.g. Shanti Villa / Apartment 4B'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {deliveryMode === 'HOTEL' ? 'Room / Bed / Dorm Number' : 'House / Flat / Floor Number'}
              </label>
              <input
                type="text"
                value={houseOrRoom}
                onChange={(e) => {
                  setHouseOrRoom(e.target.value);
                  setIsConfirmed(false);
                }}
                placeholder="e.g. Room #302 / Flat 2A"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street Address & Area *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setIsConfirmed(false);
                }}
                placeholder="e.g. Badrinath Road, Tapovan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prominent Landmark
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => {
                  setLandmark(e.target.value);
                  setIsConfirmed(false);
                }}
                placeholder="e.g. Near Laxman Jhula Bridge"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Delivery Instructions for Rider
              </label>
              <input
                type="text"
                value={deliveryInstructions}
                onChange={(e) => {
                  setDeliveryInstructions(e.target.value);
                  setIsConfirmed(false);
                }}
                placeholder="e.g. Call 10 mins before arrival / Leave at reception"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {deliveryMode === 'VENDOR_PICKUP'
                ? 'Store pickup is verified and ready upon booking confirmation.'
                : `Delivery radius: up to ${vendorDeliveryRadiusKm}km from vendor hub.`}
            </span>
          </div>

          {!isConfirmed ? (
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-[0.98]"
            >
              Confirm Delivery Location
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Snapshot Saved
              </span>
              <button
                type="button"
                onClick={() => setIsConfirmed(false)}
                className="text-xs text-slate-600 hover:text-slate-900 underline font-medium"
              >
                [ Change Location ]
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
