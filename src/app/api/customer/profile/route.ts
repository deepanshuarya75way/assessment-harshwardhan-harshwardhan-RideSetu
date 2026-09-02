import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { User } from '@/models/User';
import { KYCVerification } from '@/models/KYCVerification';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const dbUser = await User.findById(user.userId || (user as any).id).lean();
    if (!dbUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Fetch existing KYC document records for authenticated user only
    const kycRecords = await KYCVerification.find({ userId: dbUser._id }).lean();
    const dlRecord = kycRecords.find((r) => r.documentType === 'DRIVING_LICENCE');
    const aadhaarRecord = kycRecords.find((r) => r.documentType === 'AADHAAR');

    // Sensitive Data Masking Helper
    const maskDL = (val?: string) => {
      if (!val) return '';
      const clean = val.trim();
      if (clean.length <= 4) return 'XXXX' + clean;
      return 'XXXXXX' + clean.slice(-4);
    };

    const maskAadhaar = (val?: string) => {
      if (!val) return '';
      const clean = val.replace(/\D/g, '');
      if (clean.length < 4) return 'XXXX-XXXX-XXXX';
      return `XXXX-XXXX-${clean.slice(-4)}`;
    };

    const dlMasked = dlRecord?.maskedLicenceNumber || maskDL(dbUser.drivingLicenseNumber);
    const aadhaarMasked = aadhaarRecord?.maskedLicenceNumber || dbUser.aadhaarNumberMasked || '';

    // Calculate aggregate KYC status
    let overallKycStatus = dbUser.kycStatus || 'NOT_STARTED';
    const isDlVerified = dbUser.drivingLicenseStatus === 'VERIFIED' || dlRecord?.status === 'VERIFIED';
    const isAadhaarAdded = !!aadhaarRecord || !!dbUser.aadhaarNumberMasked;
    const isAadhaarVerified = dbUser.aadhaarStatus === 'VERIFIED' || aadhaarRecord?.status === 'VERIFIED';

    if (isDlVerified && isAadhaarVerified) {
      overallKycStatus = 'VERIFIED';
    } else if (isDlVerified || isAadhaarAdded) {
      overallKycStatus = dbUser.kycStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING';
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        avatar: dbUser.avatar || dbUser.googleProfileImage || '',
        dateOfBirth: dbUser.dateOfBirth ? new Date(dbUser.dateOfBirth).toISOString().split('T')[0] : '',
        gender: dbUser.gender || '',
        address: {
          street: dbUser.address?.street || '',
          city: dbUser.address?.city || '',
          state: dbUser.address?.state || '',
          pincode: dbUser.address?.pincode || '',
        },
        role: dbUser.role,
        kycStatus: overallKycStatus,
        drivingLicenseStatus: dbUser.drivingLicenseStatus || dlRecord?.status || 'NOT_STARTED',
        drivingLicenseNumberMasked: dlMasked,
        aadhaarStatus: dbUser.aadhaarStatus || aadhaarRecord?.status || (aadhaarMasked ? 'PENDING' : 'NOT_STARTED'),
        aadhaarNumberMasked: aadhaarMasked,
        documents: {
          drivingLicense: dlRecord
            ? {
                id: dlRecord._id.toString(),
                status: dlRecord.status,
                documentType: dlRecord.documentType,
                maskedNumber: dlRecord.maskedLicenceNumber || dlMasked,
                rejectionReason: dlRecord.rejectionReason || '',
                submittedAt: dlRecord.submittedAt,
                expiryDate: dlRecord.expiryDate,
              }
            : null,
          aadhaar: aadhaarRecord
            ? {
                id: aadhaarRecord._id.toString(),
                status: aadhaarRecord.status,
                documentType: aadhaarRecord.documentType,
                maskedNumber: aadhaarRecord.maskedLicenceNumber || aadhaarMasked,
                rejectionReason: aadhaarRecord.rejectionReason || '',
                submittedAt: aadhaarRecord.submittedAt,
              }
            : null,
        },
        profileComplete: isDlVerified,
        emailVerified: dbUser.emailVerified ?? true,
        phoneVerified: dbUser.phoneVerified ?? true,
      },
    });
  } catch (error: any) {
    console.error('Error fetching customer profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, dateOfBirth, gender, address, avatar } = body;

    await connectToDatabase();

    const userId = user.userId || (user as any).id;
    const dbUser = await User.findById(userId);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update allowed personal fields
    if (name !== undefined) dbUser.name = name.trim();
    if (email !== undefined) dbUser.email = email.trim().toLowerCase();
    if (avatar !== undefined) dbUser.avatar = avatar;
    if (gender !== undefined) dbUser.gender = gender;
    if (dateOfBirth !== undefined) dbUser.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;

    if (address && typeof address === 'object') {
      dbUser.address = {
        street: address.street !== undefined ? address.street.trim() : dbUser.address?.street || '',
        city: address.city !== undefined ? address.city.trim() : dbUser.address?.city || '',
        state: address.state !== undefined ? address.state.trim() : dbUser.address?.state || '',
        pincode: address.pincode !== undefined ? address.pincode.trim() : dbUser.address?.pincode || '',
      };
    }

    await dbUser.save();

    return NextResponse.json({
      success: true,
      profile: {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        avatar: dbUser.avatar,
        dateOfBirth: dbUser.dateOfBirth ? new Date(dbUser.dateOfBirth).toISOString().split('T')[0] : '',
        gender: dbUser.gender || '',
        address: dbUser.address,
      },
      message: 'Profile updated successfully.',
    });
  } catch (error: any) {
    console.error('Error updating customer profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
