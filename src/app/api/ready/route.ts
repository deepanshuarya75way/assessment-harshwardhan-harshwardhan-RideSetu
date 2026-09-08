import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { validateEnvironment } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const envCheck = validateEnvironment();
    await connectToDatabase();
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected || !envCheck.isValid) {
      return NextResponse.json(
        {
          status: 'not_ready',
          environment: envCheck.environment,
          database: isDbConnected ? 'connected' : 'disconnected',
          configuration: envCheck.isValid ? 'valid' : 'invalid',
          paymentMode: envCheck.paymentMode,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'ready',
        environment: 'sandbox',
        database: 'connected',
        configuration: 'valid',
        paymentMode: envCheck.paymentMode,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        environment: 'sandbox',
        database: 'unavailable',
        configuration: 'unknown',
      },
      { status: 500 }
    );
  }
}
