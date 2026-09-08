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

    const config = validateProductionConfig();

    const dependencies = {
      database: {
        status: dbConnected ? 'HEALTHY' : 'UNAVAILABLE',
        type: 'MongoDB Atlas',
      },
      googleMaps: {
        status: config.services.googleMaps ? 'HEALTHY' : 'UNAVAILABLE',
        type: 'Google Maps Platform JavaScript API',
      },
      razorpay: {
        status: config.services.razorpay ? 'HEALTHY' : 'DEGRADED',
        type: process.env.RAZORPAY_KEY_ID ? 'Razorpay Gateway' : 'Mock Payment Provider',
      },
      email: {
        status: process.env.SMTP_HOST || process.env.SENDGRID_API_KEY ? 'HEALTHY' : 'DEGRADED',
        type: process.env.SMTP_HOST ? 'SMTP Provider' : 'Mock Email Provider',
      },
      sms: {
        status: process.env.TWILIO_AUTH_TOKEN ? 'HEALTHY' : 'DEGRADED',
        type: process.env.TWILIO_AUTH_TOKEN ? 'Twilio SMS Gateway' : 'Mock SMS Provider',
      },
    };

    return NextResponse.json(
      {
        status: dbConnected && config.valid ? 'HEALTHY' : 'DEGRADED',
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString(),
        dependencies,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'UNAVAILABLE',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
