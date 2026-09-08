import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import connectToDatabase from '../lib/mongodb';
import { Vendor } from '../models/Vendor';
import { Vehicle } from '../models/Vehicle';
import { Destination } from '../models/Destination';
import { User } from '../models/User';

const CITIES = [
  { name: 'Rishikesh', slug: 'rishikesh', state: 'Uttarakhand', img: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80' },
  { name: 'Mussoorie', slug: 'mussoorie', state: 'Uttarakhand', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80' },
  { name: 'Dehradun', slug: 'dehradun', state: 'Uttarakhand', img: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80' },
  { name: 'Haridwar', slug: 'haridwar', state: 'Uttarakhand', img: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80' },
  { name: 'Nainital', slug: 'nainital', state: 'Uttarakhand', img: 'https://images.unsplash.com/photo-1605648916361-9bc12ad6a569?auto=format&fit=crop&w=800&q=80' },
  { name: 'Haldwani', slug: 'haldwani', state: 'Uttarakhand', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
];

const VEHICLE_TEMPLATES = [
  {
    brand: 'Royal Enfield',
    model: 'Himalayan 450',
    category: 'MOTORCYCLE',
    price: 1200,
    deposit: 2000,
    images: ['/images/vehicles/royal-enfield-himalayan-450.svg'],
  },
  {
    brand: 'Royal Enfield',
    model: 'Classic 350',
    category: 'MOTORCYCLE',
    price: 950,
    deposit: 1500,
    images: ['/images/vehicles/royal-enfield-classic-350.svg'],
  },
  {
    brand: 'Honda',
    model: 'Activa 6G',
    category: 'SCOOTER',
    price: 450,
    deposit: 1000,
    images: ['/images/vehicles/honda-activa-6g.svg'],
  },
  {
    brand: 'TVS',
    model: 'Jupiter 125',
    category: 'SCOOTER',
    price: 460,
    deposit: 1000,
    images: ['/images/vehicles/tvs-jupiter-125.svg'],
  },
  {
    brand: 'Mahindra',
    model: 'Thar 4x4',
    category: 'CAR',
    price: 3500,
    deposit: 5000,
    images: ['/images/vehicles/mahindra-thar.svg'],
  },
  {
    brand: 'Hyundai',
    model: 'Creta SX',
    category: 'CAR',
    price: 2400,
    deposit: 3000,
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    brand: 'Ather',
    model: '450X EV',
    category: 'EV',
    price: 550,
    deposit: 1000,
    images: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
    ],
  },
];

export async function seedMarketplaceData() {
  console.log('======================================================================');
  console.log('  RideSetu — Real Photographic Marketplace Inventory Seeding Script');
  console.log('======================================================================\n');

  await connectToDatabase();

  // 1. Ensure Destinations exist
  const destinationMap = new Map<string, mongoose.Types.ObjectId>();
  for (const city of CITIES) {
    let dest = await Destination.findOne({ slug: city.slug });
    if (!dest) {
      dest = await Destination.create({
        name: city.name,
        slug: city.slug,
        state: city.state,
        description: `Explore ${city.name} with verified rental scooters, Himalayan bikes, and self-drive SUVs.`,
        isActive: true,
        heroImage: city.img,
      });
    } else if (!dest.heroImage || dest.heroImage.startsWith('/images/')) {
      dest.heroImage = city.img;
      await dest.save();
    }
    destinationMap.set(city.slug, dest._id);
  }

  // 2. Ensure at least 10 vendors per city (60 total)
  let vendorCount = 0;
  let vehicleCount = 0;

  for (const city of CITIES) {
    const destId = destinationMap.get(city.slug)!;

    for (let i = 1; i <= 10; i++) {
      const email = `partner_${city.slug}_${i}@ridesetu-demo.in`;
      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name: `${city.name} Mobility Hub #${i}`,
          email,
          phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
          role: 'VENDOR',
          passwordHash: '$2a$10$demoPasswordHashForMarketplaceSeedingOnly2026',
          kycStatus: 'VERIFIED',
        });
      }

      let vendor = await Vendor.findOne({ userId: user._id });
      if (!vendor) {
        vendor = await Vendor.create({
          userId: user._id,
          businessName: `${city.name} ${i === 1 ? 'Prime' : i === 2 ? 'Himalayan' : 'Speed'} Riders #${i}`,
          ownerName: `Devendra ${city.name} Host`,
          phone: user.phone,
          email: user.email,
          city: city.name,
          address: `Hub ${i}, Main Road, ${city.name}, Uttarakhand`,
          verificationStatus: 'VERIFIED',
          isVerified: true,
          rating: parseFloat((4.5 + Math.random() * 0.49).toFixed(1)),
          totalReviews: 24 + i * 5,
        });
      }
      vendorCount++;

      // Seed 5 vehicles per vendor
      for (let vIdx = 0; vIdx < 5; vIdx++) {
        const tmpl = VEHICLE_TEMPLATES[(i + vIdx) % VEHICLE_TEMPLATES.length];
        const regNo = `UK${(i % 12 + 1).toString().padStart(2, '0')} ${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + (vIdx % 26))} ${1000 + i * 10 + vIdx}`;

        let vehicle = await Vehicle.findOne({ registrationNumber: regNo });
        if (!vehicle) {
          vehicle = await Vehicle.create({
            vendorId: vendor._id,
            destinationId: destId,
            brand: tmpl.brand,
            model: tmpl.model,
            variant: 'BS6 Phase 2',
            category: tmpl.category as any,
            year: 2024,
            color: 'Himalayan Granite',
            registrationNumber: regNo,
            odometer: 4200 + vIdx * 1500,
            fuelType: tmpl.category === 'EV' ? 'ELECTRIC' : 'PETROL',
            transmission: tmpl.category === 'SCOOTER' || tmpl.category === 'EV' ? 'AUTOMATIC' : 'MANUAL',
            status: 'APPROVED',
            pricePerDay: tmpl.price,
            pricePerHour: Math.round(tmpl.price / 10),
            securityDeposit: tmpl.deposit,
            securityDepositEnabled: true,
            securityDepositAmount: tmpl.deposit,
            kmLimitPerDay: 150,
            excessKmCharge: 4,
            isAvailable: true,
            isVerified: true,
            deliveryAvailable: true,
            helmetIncluded: true,
            roadsideAssistance: true,
            images: tmpl.images,
            photos: {
              front: tmpl.images[0],
              rear: tmpl.images[1],
              left: tmpl.images[2],
              right: tmpl.images[3],
              dashboard: tmpl.images[4],
              odometer: tmpl.images[0],
            },
            specifications: {
              seatingCapacity: tmpl.category === 'CAR' ? 5 : 2,
              engineCc: tmpl.category === 'CAR' ? 1500 : tmpl.category === 'MOTORCYCLE' ? 350 : 125,
            },
            rating: parseFloat((4.6 + Math.random() * 0.39).toFixed(1)),
            totalReviews: 12 + vIdx * 4,
          });
        } else {
          // Update existing vehicle images to clean high-res URLs
          vehicle.images = tmpl.images;
          vehicle.photos = {
            front: tmpl.images[0],
            rear: tmpl.images[1],
            left: tmpl.images[2],
            right: tmpl.images[3],
            dashboard: tmpl.images[4],
            odometer: tmpl.images[0],
          };
          await vehicle.save();
        }
        vehicleCount++;
      }
    }
  }

  console.log(`✅ [SUCCESS] Seeded/Updated ${vendorCount} Vendors and ${vehicleCount} Vehicles with real photographs!`);
}

if (require.main === module) {
  seedMarketplaceData().then(() => process.exit(0)).catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}
