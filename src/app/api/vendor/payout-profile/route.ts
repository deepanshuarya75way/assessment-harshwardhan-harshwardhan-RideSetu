import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Vendor } from '@/models/Vendor';
import { VendorPayoutProfile } from '@/models/VendorPayoutProfile';
import { getSessionFromRequest, assertRole } from '@/lib/auth';
import {
  encryptFinancialData,
  maskAccountNumber,
  maskUpiId,
  validateIfscCode,
  validateUpiId,
  validateAccountNumber,
} from '@/lib/encryption';
import { getPayoutProvider } from '@/services/payout-provider.service';

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
      return NextResponse.json({ error: 'Vendor profile not found or unauthorized' }, { status: 404 });
    }

    const profile = await VendorPayoutProfile.findOne({ vendorId }).lean();

    if (!profile) {
      return NextResponse.json({
        exists: false,
        profile: null,
      });
    }

    // FINANCIAL SECURITY: Never return raw account number or ciphertext to the frontend
    const safeProfile = {
      _id: profile._id,
      vendorId: profile.vendorId,
      beneficiaryName: profile.beneficiaryName,
      payoutMethod: profile.payoutMethod,
      bankName: profile.bankName,
      maskedAccountNumber: profile.maskedAccountNumber,
      ifscCode: profile.ifscCode,
      upiId: profile.upiId ? maskUpiId(profile.upiId) : '',
      accountType: profile.accountType,
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      verificationStatus: profile.verificationStatus,
      verificationNotes: profile.verificationNotes,
      verifiedAt: profile.verifiedAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    return NextResponse.json({
      exists: true,
      profile: safeProfile,
    });
  } catch (error: any) {
    console.error('[API Vendor Payout Profile GET Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payout profile' },
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
      return NextResponse.json({ error: 'Vendor role required to manage payout profile' }, { status: 403 });
    }

    await connectToDatabase();

    let vendor = null;
    if (session.role === 'VENDOR') {
      vendor = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(session.userId) });
    } else {
      const bodyCheck = await request.clone().json();
      if (bodyCheck.vendorId && mongoose.Types.ObjectId.isValid(bodyCheck.vendorId)) {
        vendor = await Vendor.findById(bodyCheck.vendorId);
      }
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor record not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      beneficiaryName,
      payoutMethod = 'BANK_ACCOUNT',
      bankName = '',
      accountNumber = '',
      confirmAccountNumber = '',
      ifscCode = '',
      upiId = '',
      accountType = 'CURRENT',
    } = body;

    if (!beneficiaryName || !beneficiaryName.trim()) {
      return NextResponse.json({ error: 'Beneficiary name is required.' }, { status: 400 });
    }

    let accountNumberEncrypted = '';
    let maskedAccountNumber = '';

    if (payoutMethod === 'BANK_ACCOUNT') {
      if (!accountNumber || !confirmAccountNumber) {
        return NextResponse.json(
          { error: 'Account number and account number confirmation are required.' },
          { status: 400 }
        );
      }

      if (accountNumber.trim() !== confirmAccountNumber.trim()) {
        return NextResponse.json(
          { error: 'Account number and Confirm Account Number do not match.' },
          { status: 400 }
        );
      }

      if (!validateAccountNumber(accountNumber)) {
        return NextResponse.json(
          { error: 'Invalid bank account number format. Must be between 9 and 18 numeric digits.' },
          { status: 400 }
        );
      }

      if (!ifscCode || !validateIfscCode(ifscCode)) {
        return NextResponse.json(
          { error: 'Invalid IFSC code format. Expected standard 11-character format (e.g. HDFC0001234).' },
          { status: 400 }
        );
      }

      // AES-256-GCM authenticated encryption for financial credentials
      accountNumberEncrypted = encryptFinancialData(accountNumber.trim());
      maskedAccountNumber = maskAccountNumber(accountNumber.trim());
    } else if (payoutMethod === 'UPI') {
      if (!upiId || !validateUpiId(upiId)) {
        return NextResponse.json(
          { error: 'Invalid UPI ID / VPA format (e.g. partner@okhdfcbank).' },
          { status: 400 }
        );
      }
    }

    // Provider linked account onboarding
    const provider = getPayoutProvider();
    const linkedAccountRes = await provider.createLinkedAccount({
      vendorId: vendor._id.toString(),
      businessName: vendor.businessName,
      email: vendor.email,
      phone: vendor.phone,
      ifscCode: ifscCode.trim().toUpperCase(),
      accountNumber: accountNumber.trim(),
      beneficiaryName: beneficiaryName.trim(),
      upiId: upiId.trim().toLowerCase(),
      payoutMethod,
    });

    const updatePayload: Record<string, unknown> = {
      beneficiaryName: beneficiaryName.trim(),
      payoutMethod,
      bankName: bankName.trim(),
      accountType,
      provider: process.env.PAYOUT_PROVIDER === 'RAZORPAY' ? 'RAZORPAY' : 'MOCK',
      providerAccountId: linkedAccountRes.providerAccountId,
      verificationStatus: linkedAccountRes.status || 'PENDING',
      verificationNotes: linkedAccountRes.message || 'Submitted for verification.',
      verifiedAt: linkedAccountRes.status === 'VERIFIED' ? new Date() : undefined,
    };

    if (payoutMethod === 'BANK_ACCOUNT') {
      updatePayload.accountNumberEncrypted = accountNumberEncrypted;
      updatePayload.maskedAccountNumber = maskedAccountNumber;
      updatePayload.ifscCode = ifscCode.trim().toUpperCase();
      updatePayload.upiId = '';
    } else {
      updatePayload.upiId = upiId.trim().toLowerCase();
      updatePayload.accountNumberEncrypted = '';
      updatePayload.maskedAccountNumber = '';
      updatePayload.ifscCode = '';
      updatePayload.bankName = '';
    }

    const updatedProfile = await VendorPayoutProfile.findOneAndUpdate(
      { vendorId: vendor._id },
      { $set: updatePayload },
      { new: true, upsert: true }
    ).lean();

    // Update vendor reference
    vendor.bankAccountReference = maskedAccountNumber || (upiId ? maskUpiId(upiId) : 'Linked Payout Account');
    await vendor.save();

    return NextResponse.json({
      success: true,
      profile: {
        _id: updatedProfile._id,
        vendorId: updatedProfile.vendorId,
        beneficiaryName: updatedProfile.beneficiaryName,
        payoutMethod: updatedProfile.payoutMethod,
        bankName: updatedProfile.bankName,
        maskedAccountNumber: updatedProfile.maskedAccountNumber,
        ifscCode: updatedProfile.ifscCode,
        upiId: updatedProfile.upiId ? maskUpiId(updatedProfile.upiId) : '',
        accountType: updatedProfile.accountType,
        provider: updatedProfile.provider,
        providerAccountId: updatedProfile.providerAccountId,
        verificationStatus: updatedProfile.verificationStatus,
      },
      message: 'Payout & bank details saved and encrypted successfully.',
    });
  } catch (error: any) {
    console.error('[API Vendor Payout Profile POST Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save payout profile' },
      { status: 500 }
    );
  }
}
