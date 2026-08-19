import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, getServerSession } from '@/lib/auth';
import { GroupBookingService } from '@/services/group-booking.service';

export async function POST(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const session = getSessionFromRequest(req) || (await getServerSession());
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'razorpayPaymentId, razorpayOrderId, and razorpaySignature are required.' },
        { status: 400 }
      );
    }

    const result = await GroupBookingService.confirmGroupBooking({
      groupId: params.groupId,
      customerId: session.userId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 400 });
  }
}
