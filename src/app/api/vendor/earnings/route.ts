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

    let vendorIdStr = session.vendorId;
    if (!vendorIdStr && session.role === 'VENDOR') {
      const vendor = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(session.userId) }).lean();
      if (vendor) {
        vendorIdStr = vendor._id.toString();
      }
    }

    if (session.role === 'ADMIN') {
      const { searchParams } = new URL(request.url);
      const queryVendorId = searchParams.get('vendorId');
      if (queryVendorId) vendorIdStr = queryVendorId;
    }

    if (!vendorIdStr) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const summary = await VendorFinancialsService.getVendorFinancialSummary(vendorIdStr);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('[API /api/vendor/earnings GET Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vendor financial summary' },
      { status: 500 }
    );
  }
}
