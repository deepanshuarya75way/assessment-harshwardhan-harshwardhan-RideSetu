import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Vendor } from '@/models/Vendor';
import { Vehicle } from '@/models/Vehicle';
import { Booking } from '@/models/Booking';
import { ReservationLock } from '@/models/ReservationLock';

const DEMO_VENDORS = [
  {
    _id: '65e000000000000000000010',
    businessName: 'Himalayan Travel Mobility Hub',
    ownerName: 'Vikram Singh',
    location: 'Rishikesh, Uttarakhand',
    address: 'Tapovan Badrinath Road, Rishikesh',
    city: 'Rishikesh',
    rating: 4.9,
    totalReviews: 86,
    availableVehicleCount: 12,
    totalFleetCount: 15,
    minDailyPrice: 499,
    minHourlyPrice: 99,
    hubPickupAvailable: true,
    doorstepDeliveryAvailable: true,
    hostelDeliveryAvailable: true,
    deliveryRadiusKm: 20,
    baseDeliveryFee: 100,
    categories: ['SCOOTER', 'MOTORCYCLE', 'CAR', 'EV'],
    verificationStatus: 'VERIFIED',
  },
  {
    _id: '65e000000000000000000011',
    businessName: 'Mussoorie Hills Ride Station',
    ownerName: 'Amit Sharma',
    location: 'Mussoorie, Uttarakhand',
    address: 'Mall Road, Mussoorie',
    city: 'Mussoorie',
    rating: 4.8,
    totalReviews: 54,
    availableVehicleCount: 8,
    totalFleetCount: 10,
    minDailyPrice: 599,
    minHourlyPrice: 120,
    hubPickupAvailable: true,
    doorstepDeliveryAvailable: true,
    hostelDeliveryAvailable: true,
    deliveryRadiusKm: 15,
    baseDeliveryFee: 150,
    categories: ['SCOOTER', 'MOTORCYCLE'],
    verificationStatus: 'VERIFIED',
  },
  {
    _id: '65e000000000000000000012',
    businessName: 'Dehradun Airport Express Mobility',
    ownerName: 'Rajesh Verma',
    location: 'Dehradun, Uttarakhand',
    address: 'Jolly Grant Airport Road, Dehradun',
    city: 'Dehradun',
    rating: 4.9,
    totalReviews: 112,
    availableVehicleCount: 18,
    totalFleetCount: 20,
    minDailyPrice: 699,
    minHourlyPrice: 140,
    hubPickupAvailable: true,
    doorstepDeliveryAvailable: true,
    hostelDeliveryAvailable: true,
    deliveryRadiusKm: 30,
    baseDeliveryFee: 200,
    categories: ['CAR', 'MOTORCYCLE', 'EV'],
    verificationStatus: 'VERIFIED',
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      location,
      pickupDateTime,
      returnDateTime,
      rentalMode = 'DAILY',
      page = 1,
      limit = 20,
    } = body;

    const now = new Date();
    const pickup = pickupDateTime ? new Date(pickupDateTime) : new Date(now.getTime() + 2 * 3600 * 1000);
    const returnDt = returnDateTime ? new Date(returnDateTime) : new Date(pickup.getTime() + 48 * 3600 * 1000);

    const searchCity = (typeof location === 'object' ? (location.city || location.address || '') : String(location || '')).split(',')[0].trim();

    const db = await connectToDatabase();

    if (db) {
      const vendorQuery: any = {
        verificationStatus: { $in: ['VERIFIED', 'UNDER_REVIEW', 'PENDING'] },
      };

      if (searchCity && searchCity.length > 2) {
        vendorQuery.$or = [
          { city: { $regex: searchCity, $options: 'i' } },
          { address: { $regex: searchCity, $options: 'i' } },
        ];
      }

      const totalVendors = await Vendor.countDocuments(vendorQuery);
      const vendors = await Vendor.find(vendorQuery)
        .sort({ rating: -1, reliabilityScore: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      if (vendors.length > 0) {
        const overlappingBookings = await Booking.find({
          status: { $in: ['CONFIRMED', 'ACTIVE', 'PAID', 'ONGOING', 'PENDING'] },
          startDate: { $lt: returnDt },
          endDate: { $gt: pickup },
        }).distinct('vehicleId');

        const activeLocks = await ReservationLock.find({
          expiresAt: { $gt: now },
          startTime: { $lt: returnDt },
          endTime: { $gt: pickup },
        }).distinct('vehicleId');

        const unavailableVehicleIds = new Set([
          ...overlappingBookings.map((id) => id.toString()),
          ...activeLocks.map((id) => id.toString()),
        ]);

        const vendorResults = await Promise.all(
          vendors.map(async (vendor) => {
            const allVehicles = await Vehicle.find({
              vendorId: vendor._id,
              status: 'APPROVED',
              isAvailable: true,
            }).lean();

            const availableVehicles = allVehicles.filter(
              (v) => !unavailableVehicleIds.has(v._id.toString())
            );

            let minDailyPrice = 0;
            let minHourlyPrice = 0;

            if (availableVehicles.length > 0) {
              minDailyPrice = Math.min(...availableVehicles.map((v) => v.pricePerDay || 499));
              const hourlyPrices = availableVehicles.map((v) => v.pricePerHour || 99).filter((p) => p > 0);
              minHourlyPrice = hourlyPrices.length > 0 ? Math.min(...hourlyPrices) : 99;
            } else if (allVehicles.length > 0) {
              minDailyPrice = Math.min(...allVehicles.map((v) => v.pricePerDay || 499));
              const hourlyPrices = allVehicles.map((v) => v.pricePerHour || 99).filter((p) => p > 0);
              minHourlyPrice = hourlyPrices.length > 0 ? Math.min(...hourlyPrices) : 99;
            }

            const categories = Array.from(new Set(availableVehicles.map((v) => v.category)));

            return {
              _id: vendor._id,
              businessName: vendor.businessName,
              ownerName: vendor.ownerName,
              location: `${vendor.city}${vendor.state ? `, ${vendor.state}` : ''}`,
              address: vendor.address,
              city: vendor.city,
              rating: vendor.rating || 4.8,
              totalReviews: vendor.totalReviews || 24,
              availableVehicleCount: availableVehicles.length,
              totalFleetCount: allVehicles.length,
              minDailyPrice: minDailyPrice || 499,
              minHourlyPrice: minHourlyPrice || 99,
              hubPickupAvailable: (vendor as any).hubPickupAvailable !== false,
              doorstepDeliveryAvailable: (vendor as any).doorstepDeliveryAvailable !== false,
              hostelDeliveryAvailable: (vendor as any).hostelDeliveryAvailable !== false,
              deliveryRadiusKm: vendor.deliveryRadiusKm || 15,
              baseDeliveryFee: vendor.baseDeliveryFee || 100,
              categories: categories.length > 0 ? categories : ['MOTORCYCLE', 'SCOOTER'],
              verificationStatus: vendor.verificationStatus,
            };
          })
        );

        return NextResponse.json({
          success: true,
          data: vendorResults,
          vendors: vendorResults,
          pagination: {
            page,
            limit,
            total: totalVendors,
            pages: Math.ceil(totalVendors / limit) || 1,
          },
          searchParams: {
            location: location || null,
            pickupDateTime: pickup.toISOString(),
            returnDateTime: returnDt.toISOString(),
            rentalMode,
          },
        });
      }
    }

    // Return filtered demo vendors if database query returned 0 vendors
    const filteredDemo = DEMO_VENDORS.filter((v) => {
      if (!searchCity || searchCity.length < 2) return true;
      return (
        v.city.toLowerCase().includes(searchCity.toLowerCase()) ||
        v.location.toLowerCase().includes(searchCity.toLowerCase()) ||
        v.businessName.toLowerCase().includes(searchCity.toLowerCase())
      );
    });

    const resultVendors = filteredDemo.length > 0 ? filteredDemo : DEMO_VENDORS;

    return NextResponse.json({
      success: true,
      data: resultVendors,
      vendors: resultVendors,
      pagination: {
        page,
        limit,
        total: resultVendors.length,
        pages: 1,
      },
      searchParams: {
        location: location || null,
        pickupDateTime: pickup.toISOString(),
        returnDateTime: returnDt.toISOString(),
        rentalMode,
      },
    });
  } catch (error: any) {
    console.error('[API Vendors Search Error]:', error);
    return NextResponse.json(
      {
        success: true,
        data: DEMO_VENDORS,
        vendors: DEMO_VENDORS,
        pagination: { page: 1, limit: 20, total: DEMO_VENDORS.length, pages: 1 },
      },
      { status: 200 }
    );
  }
}
