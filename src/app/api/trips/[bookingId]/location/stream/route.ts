import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Booking } from '@/models/Booking';
import { TripLocation } from '@/models/TripLocation';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { bookingId } = params;
  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    return new Response(JSON.stringify({ error: 'Invalid booking ID format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await connectToDatabase();
  const bObjectId = new mongoose.Types.ObjectId(bookingId);

  const booking = await Booking.findById(bObjectId);
  if (!booking) {
    return new Response(JSON.stringify({ error: 'Booking not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Role Ownership Validation
  const isCustomer = session.userId === booking.customerId.toString();
  const isVendor = session.vendorId
    ? session.vendorId === booking.vendorId.toString()
    : session.role === 'VENDOR';
  const isAdmin = session.role === 'ADMIN';

  if (!isCustomer && !isVendor && !isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden: Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create ReadableStream for SSE Stream Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial latest position immediately
      const initialLoc = await TripLocation.findOne({ bookingId: bObjectId })
        .sort({ timestamp: -1 })
        .lean();

      sendEvent({
        type: 'INITIAL_LOCATION',
        location: initialLoc,
        timestamp: new Date().toISOString(),
      });

      // Poll interval loop for live SSE push updates
      const interval = setInterval(async () => {
        try {
          const latest = await TripLocation.findOne({ bookingId: bObjectId })
            .sort({ timestamp: -1 })
            .lean();

          if (latest) {
            sendEvent({
              type: 'LOCATION_UPDATE',
              location: latest,
              timestamp: new Date().toISOString(),
            });
          }
        } catch {
          // Continue stream
        }
      }, 5000);

      // Clean up stream on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
