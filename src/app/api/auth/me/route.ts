import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Vendor } from '@/models/Vendor';
import { getSessionFromRequest } from '@/lib/auth';

const DEV_TEST_USERS: Record<string, any> = {
  'customer@ridesetu.demo': {
    _id: '65e000000000000000000001',
    name: 'Test Customer',
    email: 'customer@ridesetu.demo',
    phone: '+919876543210',
    role: 'CUSTOMER',
    kycStatus: 'VERIFIED',
    drivingLicenseStatus: 'VERIFIED',
    drivingLicenseNumber: 'UK0720210084920',
  },
  'customer@ridesetu.com': {
    _id: '65e000000000000000000001',
    name: 'Test Customer',
    email: 'customer@ridesetu.demo',
    phone: '+919876543210',
    role: 'CUSTOMER',
    kycStatus: 'VERIFIED',
    drivingLicenseStatus: 'VERIFIED',
    drivingLicenseNumber: 'UK0720210084920',
  },
  'vendor@ridesetu.demo': {
    _id: '65e000000000000000000002',
    name: 'Test Vendor Partner',
    email: 'vendor@ridesetu.demo',
    phone: '+919876543211',
    role: 'VENDOR',
    kycStatus: 'VERIFIED',
    drivingLicenseStatus: 'VERIFIED',
    vendor: {
      _id: '65e000000000000000000010',
      businessName: 'Himalayan Travel Mobility Hub',
      rating: 4.9,
      totalReviews: 86,
      verificationStatus: 'VERIFIED',
      city: 'Rishikesh',
    },
  },
  'vendor@ridesetu.com': {
    _id: '65e000000000000000000002',
    name: 'Test Vendor Partner',
    email: 'vendor@ridesetu.demo',
    phone: '+919876543211',
    role: 'VENDOR',
    kycStatus: 'VERIFIED',
    drivingLicenseStatus: 'VERIFIED',
    vendor: {
      _id: '65e000000000000000000010',
      businessName: 'Himalayan Travel Mobility Hub',
      rating: 4.9,
      totalReviews: 86,
      verificationStatus: 'VERIFIED',
      city: 'Rishikesh',
    },
  },
  'admin@ridesetu.demo': {
    _id: '65e000000000000000000003',
    name: 'RideSetu Admin Ops',
    email: 'admin@ridesetu.demo',
    phone: '+919876543212',
    role: 'ADMIN',
    kycStatus: 'VERIFIED',
    drivingLicenseStatus: 'VERIFIED',
  },
  'admin@ridesetu.com': {
    _id: '65e000000000000000000003',
    name: 'RideSetu Admin Ops',
    email: 'admin@ridesetu.demo',
    phone: '+919876543212',
    role: 'ADMIN',
    kycStatus: 'VERIFIED',
    drivingLicenseStatus: 'VERIFIED',
  },
};

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ user: null, authenticated: false });
    }

    let user: any = null;

    const db = await connectToDatabase();
    if (db) {
      user = await User.findById(session.userId).select('-passwordHash').lean();
    }

    if (!user) {
      const devProfile = DEV_TEST_USERS[session.email?.toLowerCase()] || DEV_TEST_USERS['customer@ridesetu.demo'];
      user = {
        _id: session.userId || devProfile._id,
        name: session.name || devProfile.name,
        email: session.email || devProfile.email,
        phone: devProfile.phone,
        role: session.role || devProfile.role,
        kycStatus: 'VERIFIED',
        drivingLicenseStatus: 'VERIFIED',
        drivingLicenseNumber: 'UK0720210084920',
        vendor: session.role === 'VENDOR' ? devProfile.vendor : undefined,
      };
    }

    let vendor = null;
    if (user.role === 'VENDOR') {
      if (db) {
        vendor = await Vendor.findOne({ userId: user._id }).lean();
      }
      if (!vendor) {
        vendor = {
          _id: session.vendorId || '65e000000000000000000010',
          businessName: 'Himalayan Travel Mobility Hub',
          rating: 4.9,
          totalReviews: 86,
          verificationStatus: 'VERIFIED',
          city: 'Rishikesh',
        };
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        ...user,
        vendor,
      },
    });
  } catch (error: any) {
    console.error('[API Auth Me Error]:', error);
    return NextResponse.json({ user: null, authenticated: false });
  }
}
