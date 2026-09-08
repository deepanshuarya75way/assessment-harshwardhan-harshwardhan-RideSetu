import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import connectToDatabase from '../lib/mongodb';
import { User } from '../models/User';
import { Vendor } from '../models/Vendor';
import { Destination } from '../models/Destination';
import { hashPassword } from '../lib/auth';

async function seedDemoUsers() {
  console.log('\n======================================================================');
  console.log('  RideSetu — Development Demo Account Seeding Script                 ');
  console.log('======================================================================\n');

  try {
    await connectToDatabase();

    const defaultPassword = process.env.DEMO_USER_PASSWORD || 'demo123456';
    const passwordHash = await hashPassword(defaultPassword);

    // 1. Seed Customer Account
    let customer = await User.findOne({ email: 'customer@ridesetu.demo' });
    if (!customer) {
      customer = await User.create({
        name: 'Demo Customer',
        email: 'customer@ridesetu.demo',
        phone: '9876543210',
        passwordHash,
        role: 'CUSTOMER',
        kycStatus: 'VERIFIED',
        drivingLicenseNumber: 'UK0720210084920',
        drivingLicenseStatus: 'VERIFIED',
        emergencyContact: {
          name: 'Rohan Sharma',
          phone: '9876543219',
          relation: 'Brother',
        },
      });
      console.log('  ✅ [CREATED] Demo Customer: customer@ridesetu.demo (Role: CUSTOMER)');
    } else {
      customer.passwordHash = passwordHash;
      customer.kycStatus = 'VERIFIED';
      await customer.save();
      console.log('  ✅ [UPDATED] Demo Customer: customer@ridesetu.demo (Role: CUSTOMER)');
    }

    // 2. Seed Vendor Account & Vendor Profile
    let vendorUser = await User.findOne({ email: 'vendor@ridesetu.demo' });
    if (!vendorUser) {
      vendorUser = await User.create({
        name: 'Demo Vendor Owner',
        email: 'vendor@ridesetu.demo',
        phone: '9876543211',
        passwordHash,
        role: 'VENDOR',
      });
      console.log('  ✅ [CREATED] Demo Vendor User: vendor@ridesetu.demo (Role: VENDOR)');
    } else {
      vendorUser.passwordHash = passwordHash;
      await vendorUser.save();
      console.log('  ✅ [UPDATED] Demo Vendor User: vendor@ridesetu.demo (Role: VENDOR)');
    }

    let destination = await Destination.findOne({ slug: 'rishikesh' });
    if (!destination) {
      destination = await Destination.create({
        name: 'Rishikesh',
        slug: 'rishikesh',
        state: 'Uttarakhand',
        popularRoutes: ['Laxman Jhula', 'Tapovan', 'Neelkanth'],
        isActive: true,
      });
    }

    let vendorProfile = await Vendor.findOne({ userId: vendorUser._id });
    if (!vendorProfile) {
      vendorProfile = await Vendor.create({
        userId: vendorUser._id,
        businessName: 'Rishikesh Mobility Hub',
        ownerName: vendorUser.name,
        email: vendorUser.email,
        phone: vendorUser.phone,
        address: 'Tapovan Main Road, Rishikesh',
        city: 'Rishikesh',
        destinationId: destination._id,
        businessType: 'INDIVIDUAL',
        rentalLicenseNumber: 'LIC-RK-2024-889',
        verificationStatus: 'VERIFIED',
        commissionRate: 15,
        rating: 4.8,
        totalReviews: 24,
      });
      console.log('  ✅ [CREATED] Demo Vendor Profile: Rishikesh Mobility Hub');
    } else {
      vendorProfile.verificationStatus = 'VERIFIED';
      await vendorProfile.save();
      console.log('  ✅ [UPDATED] Demo Vendor Profile: Rishikesh Mobility Hub');
    }

    // 3. Seed Admin Account (Restricted Server-side Seeding Only)
    let adminUser = await User.findOne({ email: 'admin@ridesetu.demo' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Demo Admin Operator',
        email: 'admin@ridesetu.demo',
        phone: '9876543212',
        passwordHash,
        role: 'ADMIN',
      });
      console.log('  ✅ [CREATED] Demo Admin User: admin@ridesetu.demo (Role: ADMIN)');
    } else {
      adminUser.passwordHash = passwordHash;
      await adminUser.save();
      console.log('  ✅ [UPDATED] Demo Admin User: admin@ridesetu.demo (Role: ADMIN)');
    }

    console.log('\n======================================================================');
    console.log('  Demo Account Seeding Complete: 3/3 Demo Roles Ready (Bcrypt Hashed) ');
    console.log('======================================================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('Seed script error:', err.message);
    process.exit(1);
  }
}

seedDemoUsers();
