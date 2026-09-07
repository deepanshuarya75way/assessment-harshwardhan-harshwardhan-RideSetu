import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vendor } from '@/models/Vendor';
import { VendorPayoutProfile } from '@/models/VendorPayoutProfile';
import { getSessionFromRequest } from '@/lib/auth';
import { maskAccountNumber, encryptFinancialData, validateIfscCode, validateAccountNumber } from '@/lib/encryption';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();

    let vendorId: mongoose.Types.ObjectId | null = null;
    if (session.role === 'VENDOR') {
      if (session.vendorId && mongoose.Types.ObjectId.isValid(session.vendorId)) {
        vendorId = new mongoose.Types.ObjectId(session.vendorId);
      } else {
        const vendor = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(session.userId) });
        if (vendor) vendorId = vendor._id;
      }
    } else if (session.role === 'ADMIN') {
      const { searchParams } = new URL(request.url);
      const queryVendorId = searchParams.get('vendorId');
      if (queryVendorId && mongoose.Types.ObjectId.isValid(queryVendorId)) {
        vendorId = new mongoose.Types.ObjectId(queryVendorId);
      }
    }

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const profile = await VendorPayoutProfile.findOne({ vendorId }).lean();
    if (!profile) {
      return NextResponse.json({
        exists: false,
        profile: null,
      });
    }

    return NextResponse.json({
      exists: true,
      profile: {
        _id: profile._id,
        vendorId: profile.vendorId,
        beneficiaryName: profile.beneficiaryName,
        payoutMethod: profile.payoutMethod,
        bankName: profile.bankName,
        maskedAccountNumber: profile.maskedAccountNumber,
        ifscCode: profile.ifscCode,
        accountType: profile.accountType,
        verificationStatus: profile.verificationStatus,
        verificationNotes: profile.verificationNotes || 'Bank verification is not configured for this development environment (TEST MODE).',
      },
    });
  } catch (error: any) {
    console.error('[API /api/vendor/settings/payouts GET Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payout settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.role !== 'VENDOR' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Vendor role required' }, { status: 403 });
    }

    await connectToDatabase();

    let vendorId: mongoose.Types.ObjectId | null = null;
    if (session.vendorId && mongoose.Types.ObjectId.isValid(session.vendorId)) {
      vendorId = new mongoose.Types.ObjectId(session.vendorId);
    } else {
      const vendor = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(session.userId) });
      if (vendor) vendorId = vendor._id;
    }

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { beneficiaryName, accountNumber, ifscCode, bankName, accountType } = body;

    if (!beneficiaryName || !accountNumber || !ifscCode) {
      return NextResponse.json({ error: 'Beneficiary Name, Account Number, and IFSC code are required' }, { status: 400 });
    }

    if (!validateAccountNumber(accountNumber)) {
      return NextResponse.json({ error: 'Invalid bank account number format' }, { status: 400 });
    }

    if (!validateIfscCode(ifscCode)) {
      return NextResponse.json({ error: 'Invalid IFSC code format' }, { status: 400 });
    }

    const maskedAcc = maskAccountNumber(accountNumber);
    const encryptedAcc = encryptFinancialData(accountNumber);

    let profile = await VendorPayoutProfile.findOne({ vendorId });
    if (!profile) {
      profile = new VendorPayoutProfile({
        vendorId,
        beneficiaryName,
        accountNumberEncrypted: encryptedAcc,
        maskedAccountNumber: maskedAcc,
        ifscCode: ifscCode.toUpperCase(),
        bankName: bankName || 'Bank',
        accountType: accountType || 'CURRENT',
        verificationStatus: 'PENDING',
        verificationNotes: 'Bank verification is not configured for this development environment (TEST MODE).',
      });
    } else {
      profile.beneficiaryName = beneficiaryName;
      profile.accountNumberEncrypted = encryptedAcc;
      profile.maskedAccountNumber = maskedAcc;
      profile.ifscCode = ifscCode.toUpperCase();
      if (bankName) profile.bankName = bankName;
      if (accountType) profile.accountType = accountType;
      profile.verificationStatus = 'PENDING';
      profile.verificationNotes = 'Bank verification is not configured for this development environment (TEST MODE).';
    }

    await profile.save();

    return NextResponse.json({
      success: true,
      message: 'Bank account details saved successfully.',
      profile: {
        beneficiaryName: profile.beneficiaryName,
        maskedAccountNumber: profile.maskedAccountNumber,
        ifscCode: profile.ifscCode,
        bankName: profile.bankName,
        verificationStatus: profile.verificationStatus,
        verificationNotes: profile.verificationNotes,
      },
    });
  } catch (error: any) {
    console.error('[API /api/vendor/settings/payouts POST Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payout settings' },
      { status: 500 }
    );
  }
}
