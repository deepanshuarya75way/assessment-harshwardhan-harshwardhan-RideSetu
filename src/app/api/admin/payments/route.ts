import { NextRequest, NextResponse } from 'next/server';
import { Payment } from '@/models/Payment';
import { maskEmail, maskPhone } from '@/lib/encryption';
import connectToDatabase from '@/lib/mongodb';
import { getSessionFromRequest, assertRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const auth = assertRole(session, ['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectToDatabase();

    const payments = await Payment.find()
      .populate('customerId', 'name email phone')
      .populate('vendorId', 'businessName ownerName phone')
      .populate('bookingId', 'bookingNumber pickupDateTime returnDateTime')
      .populate('vehicleId', 'brand model variant')
      .sort({ createdAt: -1 })
      .lean();

    const ledger = payments.map((p: any) => {
      const customer = p.customerId || {};
      const vendor = p.vendorId || {};
      const booking = p.bookingId || {};
      const vehicle = p.vehicleId || {};
      const breakdown = p.breakdown || {
        basePrice: p.amount > 1000 ? p.amount - 1000 : p.amount,
        deliveryCharge: 0,
        platformFee: 0,
        gstTax: 0,
        couponDiscount: 0,
        securityDeposit: 1000,
        totalPayable: p.amount,
      };

      return {
        _id: p._id,
        bookingId: booking._id || null,
        bookingNumber: booking.bookingNumber || p.metadata?.bookingNumber || 'RS-PENDING',
        customerName: customer.name || 'Anonymous Customer',
        customerEmail: maskEmail(customer.email || ''),
        customerPhone: maskPhone(customer.phone || ''),
        vendorName: vendor.businessName || vendor.ownerName || 'Verified Partner',
        vehicleName: vehicle.brand ? `${vehicle.brand} ${vehicle.model}` : p.metadata?.vehicleName || 'Rental Vehicle',
        grossAmount: p.amount,
        currency: p.currency || 'INR',
        basePrice: breakdown.basePrice,
        deliveryCharge: breakdown.deliveryCharge,
        platformFee: breakdown.platformFee,
        gstTax: breakdown.gstTax,
        couponDiscount: breakdown.couponDiscount,
        securityDeposit: breakdown.securityDeposit,
        status: p.status === 'SUCCESS' ? 'CAPTURED' : p.status,
        provider: p.provider,
        providerOrderId: p.providerOrderId,
        providerPaymentId: p.providerPaymentId || null,
        signatureVerified: Boolean(p.signatureVerified),
        method: p.method || 'UPI',
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      ledger,
    });
  } catch (error: any) {
    console.error('[Admin Payments GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch admin payment ledger' },
      { status: 500 }
    );
  }
}
