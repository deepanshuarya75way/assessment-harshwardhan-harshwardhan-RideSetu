import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, getServerSession } from '@/lib/auth';
import { GroupBookingService } from '@/services/group-booking.service';

export async function POST(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const session = getSessionFromRequest(req) || (await getServerSession());
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderData = await GroupBookingService.createRazorpayGroupOrder(params.groupId, session.userId);
    return NextResponse.json({ success: true, ...orderData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payment initiation failed' }, { status: 400 });
  }
}
