import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'ALL';

    await connectToDatabase();
    const uObjectId = new mongoose.Types.ObjectId(session.userId);

    const query: Record<string, any> = { userId: uObjectId };

    if (category === 'UNREAD') {
      query.read = false;
    } else if (category === 'BOOKING') {
      query.type = { $in: ['BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'RIDE_STARTING_SOON', 'RIDE_ACTIVE', 'RIDE_COMPLETED', 'PICKUP_REMINDER', 'RETURN_REMINDER', 'HANDOVER_READY', 'HANDOVER_ACCEPTED'] };
    } else if (category === 'PAYMENT') {
      query.type = { $in: ['PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'REFUND_INITIATED', 'REFUND_COMPLETED', 'PAYOUT_ELIGIBLE', 'PAYOUT_COMPLETED', 'DEPOSIT_REFUNDED'] };
    } else if (category === 'ACCOUNT') {
      query.type = { $in: ['ACCOUNT_VERIFIED', 'KYC_APPROVED', 'KYC_REJECTED', 'VENDOR_SUBMITTED', 'VENDOR_APPROVED', 'VENDOR_REJECTED', 'VENDOR_ACTION_REQUIRED'] };
    } else if (category === 'SAFETY') {
      query.type = { $in: ['EMERGENCY_ALERT', 'SYSTEM_ALERT', 'DISPUTE_UPDATE'] };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: uObjectId,
      read: false,
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('[API Notifications GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { notificationId, markAll } = await request.json();
    await connectToDatabase();

    const uObjectId = new mongoose.Types.ObjectId(session.userId);

    if (markAll) {
      await Notification.updateMany(
        { userId: uObjectId, read: false },
        { $set: { read: true, readAt: new Date() } }
      );
      return NextResponse.json({ success: true, message: 'All notifications marked as read.' });
    }

    if (notificationId) {
      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
      }

      // Check ownership first
      const existing = await Notification.findById(notificationId);
      if (!existing) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      if (existing.userId.toString() !== session.userId) {
        return NextResponse.json({ error: 'Forbidden: You do not own this notification' }, { status: 403 });
      }

      existing.read = true;
      existing.readAt = new Date();
      await existing.save();

      return NextResponse.json({ success: true, message: 'Notification marked as read.' });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    console.error('[API Notifications PATCH Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update notifications' }, { status: 500 });
  }
}
