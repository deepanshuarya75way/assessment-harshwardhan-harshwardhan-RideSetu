import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { SupportTicket } from '@/models/SupportTicket';
import { getSessionFromRequest } from '@/lib/auth';
import { generateTicketId } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    const query: Record<string, unknown> = {};

    if (session.role === 'CUSTOMER') {
      query.userId = new mongoose.Types.ObjectId(session.userId);
    }

    const tickets = await SupportTicket.find(query)
      .populate('bookingId', 'bookingNumber')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error('[API Support GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { category, priority = 'HIGH', subject, message, bookingId, locationNote } = body;

    if (!category || !subject || !message) {
      return NextResponse.json({ error: 'Category, subject, and message are required.' }, { status: 400 });
    }

    await connectToDatabase();
    const ticketId = generateTicketId();

    const ticket = await SupportTicket.create({
      ticketId,
      userId: new mongoose.Types.ObjectId(session.userId),
      userName: session.name,
      userPhone: '+91 98765 43210',
      userEmail: session.email,
      bookingId: bookingId ? new mongoose.Types.ObjectId(bookingId) : undefined,
      category,
      priority: category === 'EMERGENCY_ROADSIDE' ? 'CRITICAL_EMERGENCY' : priority,
      status: 'OPEN',
      subject,
      messages: [
        {
          senderId: new mongoose.Types.ObjectId(session.userId),
          senderName: session.name,
          senderRole: session.role,
          message: message.trim(),
          createdAt: new Date(),
        },
      ],
      locationNote: locationNote || '',
    });

    return NextResponse.json({
      success: true,
      ticket,
      message: category === 'EMERGENCY_ROADSIDE'
        ? 'Emergency Roadside Dispatch Alert Sent! A local partner support unit is assigned.'
        : 'Support ticket submitted successfully.',
    });
  } catch (error: any) {
    console.error('[API Support POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Support request failed' }, { status: 500 });
  }
}
