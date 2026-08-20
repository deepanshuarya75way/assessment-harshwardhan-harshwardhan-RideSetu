import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { HandoverService } from '@/services/handover.service';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 });
    }

    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
    }

    const body = await request.json();
    const { customerSignatureConfirmed = true, customerSignatureName } = body;

    if (!customerSignatureConfirmed) {
      return NextResponse.json(
        { error: 'You must accept the recorded vehicle condition to start your trip.' },
        { status: 400 }
      );
    }

    const booking = await HandoverService.confirmCustomerHandover({
      bookingId: id,
      customerUserId: session.userId,
      customerSignatureConfirmed: Boolean(customerSignatureConfirmed),
      customerSignatureName: customerSignatureName || session.name,
    });

    return NextResponse.json({
      success: true,
      booking,
      message: 'Vehicle handover confirmed successfully! Your ride is now ACTIVE.',
    });
  } catch (error: any) {
    console.error('[API Handover Confirm POST Error]:', error);
    const status = error.message?.includes('Forbidden') ? 403 : error.message?.includes('status') ? 409 : 500;
    return NextResponse.json({ error: error.message || 'Handover confirmation failed' }, { status });
  }
}
