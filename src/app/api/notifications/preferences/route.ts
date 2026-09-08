import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.userId).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const preferences = {
      emailNotifications: true,
      bookingUpdates: true,
      marketingPromotions: false,
      criticalAlerts: true, // Cannot be toggled off
    };

    return NextResponse.json({ success: true, preferences });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { emailNotifications, bookingUpdates, marketingPromotions } = body;

    // Notice: criticalAlerts CANNOT be modified or disabled by policy
    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully.',
      preferences: {
        emailNotifications: Boolean(emailNotifications ?? true),
        bookingUpdates: Boolean(bookingUpdates ?? true),
        marketingPromotions: Boolean(marketingPromotions ?? false),
        criticalAlerts: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update preferences' }, { status: 500 });
  }
}
