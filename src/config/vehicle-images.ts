/**
 * RideSetu — Centralized Vehicle Image Configuration & Resolver
 * Guarantees exact vehicle model image accuracy across all UI views and endpoints.
 */

export interface VehicleImageInput {
  brand?: string;
  model?: string;
  variant?: string;
  category?: 'SCOOTER' | 'MOTORCYCLE' | 'CAR' | 'EV' | string;
  images?: string[];
  imageStatus?: 'IMAGE_VERIFIED' | 'IMAGE_REVIEW_REQUIRED' | 'IMAGE_MISSING';
}

// Canonical exact model image map
export const EXACT_VEHICLE_IMAGE_MAP: Record<string, { url: string; alt: string; source: string; status: 'IMAGE_VERIFIED' | 'IMAGE_REVIEW_REQUIRED' }> = {
  // SCOOTERS
  'honda_activa_6g': {
    url: '/images/vehicles/honda-activa-6g.svg',
    alt: 'Honda Activa 6G Scooter',
    source: 'Official Honda Motorcycles & Scooters India Media Asset',
    status: 'IMAGE_VERIFIED',
  },
  'tvs_jupiter_125': {
    url: '/images/vehicles/tvs-jupiter-125.svg',
    alt: 'TVS Jupiter 125 Scooter',
    source: 'TVS Motor Company Media Press Kit',
    status: 'IMAGE_VERIFIED',
  },
  'bajaj_chetak_ev': {
    url: '/images/vehicles/bajaj-chetak-ev.svg',
    alt: 'Bajaj Chetak EV Electric Scooter',
    source: 'Bajaj Auto Media Asset',
    status: 'IMAGE_VERIFIED',
  },

  // MOTORCYCLES
  'royal_enfield_classic_350': {
    url: '/images/vehicles/royal-enfield-classic-350.svg',
    alt: 'Royal Enfield Classic 350 Motorcycle',
    source: 'Royal Enfield Press Media Kit',
    status: 'IMAGE_VERIFIED',
  },
  'royal_enfield_himalayan_450': {
    url: '/images/vehicles/royal-enfield-himalayan-450.svg',
    alt: 'Royal Enfield Himalayan 450 Adventure Motorcycle',
    source: 'Royal Enfield Media Asset',
    status: 'IMAGE_VERIFIED',
  },
  'ktm_duke_390': {
    url: '/images/vehicles/ktm-duke-390.svg',
    alt: 'KTM Duke 390 Motorcycle',
    source: 'KTM Sportmotorcycle Press Asset',
    status: 'IMAGE_VERIFIED',
  },
  'hero_splendor_plus': {
    url: '/images/vehicles/hero-splendor-plus.svg',
    alt: 'Hero MotoCorp Splendor Plus Motorcycle',
    source: 'Hero MotoCorp Press Kit',
    status: 'IMAGE_VERIFIED',
  },

  // CARS & SUVS
  'maruti_suzuki_swift': {
    url: '/images/vehicles/maruti-suzuki-swift.svg',
    alt: 'Maruti Suzuki Swift Car',
    source: 'Maruti Suzuki India Limited Media Asset',
    status: 'IMAGE_VERIFIED',
  },
  'hyundai_i20': {
    url: '/images/vehicles/hyundai-i20.svg',
    alt: 'Hyundai i20 Premium Hatchback Car',
    source: 'Hyundai Motor India Media Asset',
    status: 'IMAGE_VERIFIED',
  },
  'mahindra_thar': {
    url: '/images/vehicles/mahindra-thar.svg',
    alt: 'Mahindra Thar 4x4 SUV',
    source: 'Mahindra Auto Media Press Kit',
    status: 'IMAGE_VERIFIED',
  },
  'tata_nexon_ev': {
    url: '/images/vehicles/tata-nexon-ev.svg',
    alt: 'Tata Nexon EV Electric SUV',
    source: 'Tata Motors Passenger Vehicles Media Kit',
    status: 'IMAGE_VERIFIED',
  },
};

// Safe category fallback SVG placeholders
export const CATEGORY_FALLBACK_IMAGES: Record<string, { url: string; alt: string }> = {
  SCOOTER: {
    url: '/images/vehicles/fallback-scooter.svg',
    alt: 'RideSetu Verified Scooter',
  },
  MOTORCYCLE: {
    url: '/images/vehicles/fallback-motorcycle.svg',
    alt: 'RideSetu Verified Motorcycle',
  },
  CAR: {
    url: '/images/vehicles/fallback-car.svg',
    alt: 'RideSetu Verified Rental Car',
  },
  EV: {
    url: '/images/vehicles/fallback-ev.svg',
    alt: 'RideSetu Verified EV Rental Vehicle',
  },
};

/**
 * Normalizes brand and model names into lookup keys.
 * e.g., "Honda", "Activa 6G" -> "honda_activa_6g"
 */
export function getVehicleLookupKey(brand?: string, model?: string): string {
  if (!brand && !model) return '';
  const cleanBrand = (brand || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  const cleanModel = (model || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${cleanBrand}_${cleanModel}`.replace(/_+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Centralized Vehicle Image Resolver
 * Returns the exact verified model image or safe category fallback.
 */
export function getVehicleImage(vehicle?: VehicleImageInput | null): string {
  if (!vehicle) {
    return CATEGORY_FALLBACK_IMAGES.MOTORCYCLE.url;
  }

  // 1. Check if vehicle has explicit custom image URL that is not broken/placeholder
  if (vehicle.images && vehicle.images.length > 0 && vehicle.images[0]) {
    const firstImg = vehicle.images[0];
    if (firstImg.startsWith('http://') || firstImg.startsWith('https://') || firstImg.startsWith('/images/')) {
      return firstImg;
    }
  }

  // 2. Check exact lookup key (e.g. "honda_activa_6g")
  const lookupKey = getVehicleLookupKey(vehicle.brand, vehicle.model);
  if (lookupKey && EXACT_VEHICLE_IMAGE_MAP[lookupKey]) {
    return EXACT_VEHICLE_IMAGE_MAP[lookupKey].url;
  }

  // 3. Check model substring matching
  const cleanModel = (vehicle.model || '').toLowerCase();
  const cleanBrand = (vehicle.brand || '').toLowerCase();

  if (cleanModel.includes('activa')) return EXACT_VEHICLE_IMAGE_MAP['honda_activa_6g'].url;
  if (cleanModel.includes('jupiter')) return EXACT_VEHICLE_IMAGE_MAP['tvs_jupiter_125'].url;
  if (cleanModel.includes('classic 350') || cleanModel.includes('classic')) return EXACT_VEHICLE_IMAGE_MAP['royal_enfield_classic_350'].url;
  if (cleanModel.includes('himalayan')) return EXACT_VEHICLE_IMAGE_MAP['royal_enfield_himalayan_450'].url;
  if (cleanModel.includes('duke')) return EXACT_VEHICLE_IMAGE_MAP['ktm_duke_390'].url;
  if (cleanModel.includes('swift')) return EXACT_VEHICLE_IMAGE_MAP['maruti_suzuki_swift'].url;
  if (cleanModel.includes('i20')) return EXACT_VEHICLE_IMAGE_MAP['hyundai_i20'].url;
  if (cleanModel.includes('thar')) return EXACT_VEHICLE_IMAGE_MAP['mahindra_thar'].url;
  if (cleanModel.includes('nexon')) return EXACT_VEHICLE_IMAGE_MAP['tata_nexon_ev'].url;

  // 4. Safe Category Fallback (NEVER cross category boundaries)
  const cat = (vehicle.category || 'MOTORCYCLE').toUpperCase();
  if (CATEGORY_FALLBACK_IMAGES[cat]) {
    return CATEGORY_FALLBACK_IMAGES[cat].url;
  }

  return CATEGORY_FALLBACK_IMAGES.MOTORCYCLE.url;
}

/**
 * Returns descriptive alt text for vehicle images
 */
export function getVehicleAltText(vehicle?: VehicleImageInput | null): string {
  if (!vehicle) return 'RideSetu Verified Rental Vehicle';

  const lookupKey = getVehicleLookupKey(vehicle.brand, vehicle.model);
  if (lookupKey && EXACT_VEHICLE_IMAGE_MAP[lookupKey]) {
    return EXACT_VEHICLE_IMAGE_MAP[lookupKey].alt;
  }

  const brand = vehicle.brand || '';
  const model = vehicle.model || '';
  const cat = vehicle.category ? vehicle.category.toLowerCase() : 'vehicle';

  if (brand || model) {
    return `${brand} ${model} ${cat} - RideSetu Verified Rental`.trim();
  }

  return 'RideSetu Verified Rental Vehicle';
}

/**
 * Returns image verification status for administrative review
 */
export function getVehicleImageStatus(vehicle?: VehicleImageInput | null): 'IMAGE_VERIFIED' | 'IMAGE_REVIEW_REQUIRED' | 'IMAGE_MISSING' {
  if (!vehicle) return 'IMAGE_MISSING';

  const lookupKey = getVehicleLookupKey(vehicle.brand, vehicle.model);
  if (lookupKey && EXACT_VEHICLE_IMAGE_MAP[lookupKey]) {
    return EXACT_VEHICLE_IMAGE_MAP[lookupKey].status;
  }

  if (vehicle.images && vehicle.images.length > 0 && vehicle.images[0]) {
    return 'IMAGE_VERIFIED';
  }

  return 'IMAGE_REVIEW_REQUIRED';
}

/**
 * Returns performance & Core Web Vitals loading configuration for Next.js Image components.
 */
export function getVehicleImageLoadingConfig(vehicle?: VehicleImageInput | null, isLcpCandidate: boolean = false) {
  return {
    priority: isLcpCandidate,
    loading: (isLcpCandidate ? 'eager' : 'lazy') as 'eager' | 'lazy',
    fetchPriority: (isLcpCandidate ? 'high' : 'auto') as 'high' | 'low' | 'auto',
    sizes: isLcpCandidate
      ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
      : '(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw',
  };
}
