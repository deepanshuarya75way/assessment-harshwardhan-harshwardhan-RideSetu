import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { DamageReport } from '@/models/DamageReport';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    await connectToDatabase();

    const disputes = await DamageReport.find({})
      .populate('bookingId')
      .populate('vendorId', 'businessName phone')
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: disputes.length,
      disputes,
    });
  } catch (error: any) {
    console.error('Error fetching admin disputes:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
