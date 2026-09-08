import { NextRequest, NextResponse } from 'next/server';
import { Payment } from '@/models/Payment';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login to view payment history.' },
        { status: 401 }
      );
    }

    const payments = await Payment.find({ customerId: user.userId })
      .populate('bookingId', 'bookingNumber pickupDateTime returnDateTime pickupType pickupLocation')
      .populate('vehicleId', 'brand model variant images')
      .sort({ createdAt: -1 })
      .lean();

    const formattedPayments = payments.map((p: any) => ({
      _id: p._id,
      bookingId: p.bookingId?._id || null,
      bookingNumber: p.bookingId?.bookingNumber || p.metadata?.bookingNumber || 'RS-PENDING',
      vehicleName: p.vehicleId ? `${p.vehicleId.brand} ${p.vehicleId.model}` : p.metadata?.vehicleName || 'Rental Vehicle',
      vehicleImage: p.vehicleId?.images?.[0] || null,
      amount: p.amount,
      currency: p.currency,
      status: p.status === 'SUCCESS' ? 'CAPTURED' : p.status,
      provider: p.provider,
      providerOrderId: p.providerOrderId,
      providerPaymentId: p.providerPaymentId ? `${p.providerPaymentId.slice(0, 8)}••••` : 'Pending',
      method: p.method || 'UPI',
      breakdown: p.breakdown || {
        basePrice: p.amount - 1000,
        securityDeposit: 1000,
        totalPayable: p.amount,
      },
      createdAt: p.createdAt,
    }));

    return NextResponse.json({
      success: true,
      payments: formattedPayments,
    });
  } catch (error: any) {
    console.error('[Customer Payments GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customer payments' },
      { status: 500 }
    );
  }
}
