import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { NotificationService } from '@/services/notification.service';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const userId = user.userId || (user as any).id;
    const count = await NotificationService.markAllAsRead(userId, 'CUSTOMER');

    return NextResponse.json({
      success: true,
      modifiedCount: count,
      message: 'All customer notifications marked as read',
    });
  } catch (error: any) {
    console.error('Error marking all customer notifications as read:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
