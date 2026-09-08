import { getVehicleImage } from '@/config/vehicle-images';

export function getVehiclePhotos(vehicle: any): string[] {
  const primaryImg = getVehicleImage(vehicle);
  
  if (vehicle?.images && Array.isArray(vehicle.images) && vehicle.images.length > 0) {
    const validImages = vehicle.images.filter(
      (img: string) => img && (img.startsWith('/') || img.startsWith('http'))
    );
    if (validImages.length >= 3) {
      return validImages;
    }
  }

  // Return primary exact vehicle image guaranteed by centralized resolver
  return [primaryImg, primaryImg, primaryImg];
}

export function getDestinationPhoto(slug: string): string {
  const map: Record<string, string> = {
    rishikesh: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80',
    mussoorie: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    dehradun: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    haridwar: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
    nainital: 'https://images.unsplash.com/photo-1605648916361-9bc12ad6a569?auto=format&fit=crop&w=800&q=80',
    haldwani: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  };
  return map[slug.toLowerCase()] || 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80';
}
