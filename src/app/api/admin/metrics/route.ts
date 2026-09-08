import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Vendor } from '@/models/Vendor';
import { Vehicle } from '@/models/Vehicle';
import { Booking } from '@/models/Booking';
import { Dispute } from '@/models/Dispute';
import { Payout } from '@/models/Payout';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    const authCheck = assertRole(session, ['ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();

    const [
      totalUsers,
      totalVendors,
      pendingVendors,
      totalVehicles,
      activeBookings,
      allBookings,
      openDisputes,
      pendingPayouts,
    ] = await Promise.all([
      User.countDocuments({ role: 'CUSTOMER' }),
      Vendor.countDocuments({ verificationStatus: 'VERIFIED' }),
      Vendor.countDocuments({ verificationStatus: { $in: ['PENDING', 'UNDER_REVIEW'] } }),
      Vehicle.countDocuments({ isAvailable: true }),
      Booking.countDocuments({ bookingStatus: 'ACTIVE' }),
      Booking.find({ paymentStatus: 'PAID' }).select('totalPayable platformFee taxes basePrice deliveryCharge').lean(),
      Dispute.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW'] } }),
      Payout.find({ status: 'PENDING' }).select('netAmount').lean(),
    ]);

    // Financial aggregations
    const gmv = allBookings.reduce((sum, b) => sum + (b.totalPayable || 0), 0);
    const platformRevenue = allBookings.reduce((sum, b) => sum + (b.platformFee || 0) + (b.taxes || 0), 0);
    const pendingPayoutTotal = pendingPayouts.reduce((sum, p) => sum + (p.netAmount || 0), 0);

    return NextResponse.json({
      metrics: {
        gmv,
        platformRevenue,
        takeRatePercentage: gmv > 0 ? parseFloat(((platformRevenue / gmv) * 100).toFixed(1)) : 15.0,
        totalUsers,
        totalVendors,
        pendingVendors,
        totalVehicles,
        activeBookings,
        totalBookings: allBookings.length,
        openDisputes,
        pendingPayoutTotal,
      },
    });
  } catch (error: any) {
    console.error('[API Admin Metrics Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch admin metrics' }, { status: 500 });
  }
}
