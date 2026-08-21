import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { Booking } from '@/models/Booking';
import { Vendor } from '@/models/Vendor';
import { GroupBooking } from '@/models/GroupBooking';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find vendor document belonging to authenticated user
    let vendor = await Vendor.findOne({ userId: user.userId || (user as any).id }).lean();
    if (!vendor && user.role === 'VENDOR') {
      vendor = await Vendor.findOne({}).lean(); // Fallback for dev vendor account
    }

    if (!vendor && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const vendorId = vendor ? vendor._id : null;

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'ALL'; // NEW, ACTIVE, RETURN_PENDING, COMPLETED, DISPUTED, ALL

    const query: any = vendorId ? { vendorId } : {};

    if (filter === 'NEW') {
      query.bookingStatus = { $in: ['CONFIRMED', 'VENDOR_ACCEPTED', 'PREPARING'] };
    } else if (filter === 'ACTIVE') {
      query.bookingStatus = { $in: ['READY_FOR_HANDOVER', 'OUT_FOR_DELIVERY', 'HANDED_OVER', 'ACTIVE'] };
    } else if (filter === 'RETURN_PENDING') {
      query.bookingStatus = { $in: ['RETURN_PENDING', 'RETURN_INSPECTION'] };
    } else if (filter === 'COMPLETED') {
      query.bookingStatus = 'COMPLETED';
    } else if (filter === 'DISPUTED') {
      query.bookingStatus = 'DISPUTED';
    }

    const bookings = await Booking.find(query)
      .populate('vehicleId', 'brand model variant category registrationNumber pricePerDay images')
      .populate('customerId', 'name phone email avatar')
      .sort({ createdAt: -1 })
      .lean();

    const groupBookingIds = Array.from(new Set(bookings.map((b: any) => b.groupBookingId).filter(Boolean)));
    let groupBookingsMap: Record<string, any> = {};

    if (groupBookingIds.length > 0) {
      const groups = await GroupBooking.find({ groupId: { $in: groupBookingIds } }).lean();
      groups.forEach((g: any) => {
        groupBookingsMap[g.groupId] = g;
      });
    }

    const formattedBookings = bookings.map((b: any) => ({
      id: b._id.toString(),
      bookingNumber: b.bookingNumber,
      groupBookingId: b.groupBookingId || null,
      groupInfo: b.groupBookingId ? groupBookingsMap[b.groupBookingId] || null : null,
      vehicle: b.vehicleId,
      customer: b.customerId,
      customerDetails: b.customerDetails,
      riderDetails: b.riderDetails,
      pickupDateTime: b.pickupDateTime,
      returnDateTime: b.returnDateTime,
      pickupType: b.pickupType,
      pickupLocation: b.pickupLocation,
      deliveryLocation: b.deliveryLocation,
      bookingStatus: b.bookingStatus,
      paymentStatus: b.paymentStatus,
      depositStatus: b.depositStatus,
      totalPayable: b.totalPayable,
      securityDeposit: b.securityDeposit,
      createdAt: b.createdAt,
    }));

    return NextResponse.json({
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings,
    });
  } catch (error: any) {
    console.error('Error fetching vendor bookings:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
