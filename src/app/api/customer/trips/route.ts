import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/models/Booking';
import { GroupBooking } from '@/models/GroupBooking';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'ALL'; // ACTIVE, UPCOMING, COMPLETED, CANCELLED, ALL

    const query: any = { customerId: user.userId || (user as any).id };

    if (filter === 'ACTIVE') {
      query.bookingStatus = { $in: ['ACTIVE', 'OUT_FOR_DELIVERY', 'READY_FOR_HANDOVER', 'HANDED_OVER', 'RETURN_PENDING', 'RETURN_INSPECTION'] };
    } else if (filter === 'UPCOMING') {
      query.bookingStatus = { $in: ['CONFIRMED', 'PREPARING', 'PRE_PICKUP', 'PENDING'] };
    } else if (filter === 'COMPLETED') {
      query.bookingStatus = 'COMPLETED';
    } else if (filter === 'CANCELLED') {
      query.bookingStatus = { $in: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_VENDOR', 'CANCELLED_BY_ADMIN'] };
    }

    const bookings = await Booking.find(query)
      .populate('vehicleId', 'brand model variant category images pricePerDay pricePerHour registrationNumber')
      .populate('vendorId', 'businessName rating address location phone')
      .sort({ createdAt: -1 })
      .lean();

    // Group bookings aggregation
    const groupBookingIds = Array.from(new Set(bookings.map((b: any) => b.groupBookingId).filter(Boolean)));
    let groupBookingsMap: Record<string, any> = {};

    if (groupBookingIds.length > 0) {
      const groups = await GroupBooking.find({ groupId: { $in: groupBookingIds } }).lean();
      groups.forEach((g: any) => {
        groupBookingsMap[g.groupId] = g;
      });
    }

    const formattedTrips = bookings.map((b: any) => {
      const vehicle = b.vehicleId || {};
      const vendor = b.vendorId || {};

      return {
        id: b._id.toString(),
        bookingNumber: b.bookingNumber,
        groupBookingId: b.groupBookingId || null,
        groupInfo: b.groupBookingId ? groupBookingsMap[b.groupBookingId] || null : null,
        vehicle: {
          id: vehicle._id ? vehicle._id.toString() : '',
          brand: vehicle.brand || 'Vehicle',
          model: vehicle.model || 'Rental',
          variant: vehicle.variant || '',
          category: vehicle.category || 'SCOOTER',
          registrationNumber: vehicle.registrationNumber || '',
          images: vehicle.images || [],
        },
        vendor: {
          id: vendor._id ? vendor._id.toString() : '',
          businessName: vendor.businessName || 'RideSetu Partner',
          rating: vendor.rating || 4.8,
          address: vendor.address || '',
          phone: vendor.phone || '',
        },
        pickupDateTime: b.pickupDateTime,
        returnDateTime: b.returnDateTime,
        pickupType: b.pickupType,
        pickupLocation: b.pickupLocation,
        rentalDurationDays: b.rentalDurationDays,
        rentalDurationHours: b.rentalDurationHours,
        bookingStatus: b.bookingStatus,
        paymentStatus: b.paymentStatus,
        depositStatus: b.depositStatus,
        riderDetails: b.riderDetails || null,
        customerDetails: b.customerDetails || null,
        deliveryLocation: b.deliveryLocation || null,
        pricing: {
          basePrice: b.basePrice,
          deliveryCharge: b.deliveryCharge,
          platformFee: b.platformFee,
          taxes: b.taxes,
          securityDeposit: b.securityDeposit,
          totalPayable: b.totalPayable,
        },
        createdAt: b.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      count: formattedTrips.length,
      trips: formattedTrips,
    });
  } catch (error: any) {
    console.error('Error fetching customer trips:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
