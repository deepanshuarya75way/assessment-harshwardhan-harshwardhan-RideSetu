import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vendor } from '@/models/Vendor';
import { getSessionFromRequest } from '@/lib/auth';
import { VendorFinancialsService } from '@/services/vendor-financials.service';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.role !== 'VENDOR' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Vendor role required' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') as any;
    const bookingId = searchParams.get('bookingId') || undefined;
    const vehicleId = searchParams.get('vehicleId') || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const payoutStatus = searchParams.get('payoutStatus') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let vendorIdStr = session.vendorId;
    if (!vendorIdStr && session.role === 'VENDOR') {
      const vendor = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(session.userId) }).lean();
      if (vendor) vendorIdStr = vendor._id.toString();
    }

    if (session.role === 'ADMIN') {
      const queryVendorId = searchParams.get('vendorId');
      if (queryVendorId) vendorIdStr = queryVendorId;
    }

    if (!vendorIdStr) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const result = await VendorFinancialsService.getVendorTransactions(vendorIdStr, {
      dateRange,
      bookingId,
      vehicleId,
      paymentStatus,
      payoutStatus,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[API /api/vendor/transactions GET Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vendor transactions' },
      { status: 500 }
    );
  }
}
