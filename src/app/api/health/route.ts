import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { validateProductionConfig } from '@/lib/production-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let dbConnected = false;
    try {
      if (process.env.MONGODB_URI) {
        await connectToDatabase();
        dbConnected = mongoose.connection.readyState === 1;
      }
    } catch {
      dbConnected = false;
    }

    const configStatus = validateProductionConfig();
    const isHealthy = dbConnected && configStatus.valid;

    return NextResponse.json(
      {
        status: isHealthy ? 'HEALTHY' : dbConnected ? 'DEGRADED' : 'UNAVAILABLE',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbConnected ? 'CONNECTED' : 'DISCONNECTED',
          configuration: configStatus.valid ? 'VALID' : 'INVALID',
        },
      },
      { status: isHealthy ? 200 : 503 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'UNAVAILABLE',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
