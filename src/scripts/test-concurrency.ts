import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import connectToDatabase from '../lib/mongodb';

async function runConcurrencyTest() {
  console.log('======================================================================');
  console.log('      RideSetu Double Booking High-Concurrency Stress Test            ');
  console.log('======================================================================\n');

  console.log('📡 [Step 1] Connecting to MongoDB Atlas cluster...');
  await connectToDatabase();
  console.log('✅ Connected to MongoDB Atlas in', mongoose.connection.db?.databaseName);

  const { BookingService } = await import('../services/booking.service');
  const { Vehicle } = await import('../models/Vehicle');
  const { Booking } = await import('../models/Booking');
  const { User } = await import('../models/User');
  const { Destination } = await import('../models/Destination');
  const { Vendor } = await import('../models/Vendor');

  // Find or create test environment prerequisites
  console.log('🔍 [Step 2] Finding verified fleet vehicle for concurrency test...');
  let customer = await User.findOne({ role: 'CUSTOMER' });
  let testVehicle = await Vehicle.findOne({ isAvailable: true, isVerified: true });

  if (!customer || !testVehicle) {
    console.log('🌱 Database needs seed data. Seeding now...');
    const { seedDatabase } = await import('./seed');
    await seedDatabase();
    customer = await User.findOne({ role: 'CUSTOMER' });
    testVehicle = await Vehicle.findOne({ isAvailable: true, isVerified: true });
  }

  if (!customer || !testVehicle) {
    throw new Error('Could not find or seed test vehicle.');
  }

  const pickupDateTime = '2026-09-10T10:00:00.000Z';
  const returnDateTime = '2026-09-12T18:00:00.000Z';
  const CONCURRENT_REQUEST_COUNT = 100;

  console.log(`🚀 Launching ${CONCURRENT_REQUEST_COUNT} SIMULTANEOUS booking requests for:`);
  console.log(`   Vehicle ID       : ${testVehicle._id}`);
  console.log(`   Registration No  : ${testVehicle.registrationNumber}`);
  console.log(`   Time Window      : ${pickupDateTime} -> ${returnDateTime}`);
  console.log(`   Concurrency Mode : Promise.allSettled([100 parallel requests])`);
  console.log(`   Lock Mechanism   : MongoDB Atlas Distributed Reservation (ReservationLock)\n`);

  const startTime = Date.now();

  const bookingPromises = Array.from({ length: CONCURRENT_REQUEST_COUNT }, (_, index) => {
    return BookingService.createBooking({
      customerId: customer!._id.toString(),
      vehicleId: testVehicle._id.toString(),
      pickupDateTime,
      returnDateTime,
      pickupType: 'VENDOR_PICKUP',
      pickupLocation: 'Rishikesh Hub',
      dropoffLocation: 'Rishikesh Hub',
      customerDetails: {
        fullName: `Concurrency Tester ${index + 1}`,
        phone: `+91 99999 8888${index % 10}`,
        email: `tester${index + 1}@ridesetu.demo`,
        drivingLicenseNumber: `UK07202100${1000 + index}`,
      },
    });
  });

  const results = await Promise.allSettled(bookingPromises);
  const elapsedMs = Date.now() - startTime;

  let successfulCount = 0;
  let rejectedCount = 0;
  let successBookingId: string | null = null;
  const rejectionReasons: string[] = [];

  results.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      successfulCount++;
      successBookingId = res.value.booking._id.toString();
      console.log(`  Thread #${(i + 1).toString().padStart(3, '0')} : ✅ 200 OK - Booking created: ${res.value.booking.bookingNumber}`);
    } else {
      rejectedCount++;
      const reason = res.reason?.message || 'Conflict';
      rejectionReasons.push(reason);
      if (i < 5 || i >= 95) {
        console.log(`  Thread #${(i + 1).toString().padStart(3, '0')} : 🛡️ 409 REJECTED - ${reason}`);
      } else if (i === 5) {
        console.log(`  ... [Threads #006 to #095 safely rejected with 409 Conflict] ...`);
      }
    }
  });

  console.log('\n--- Database Verification in MongoDB Atlas ---');
  const dbBookings = await Booking.find({
    vehicleId: testVehicle._id,
    bookingStatus: { $in: ['CONFIRMED', 'ACTIVE', 'PENDING'] },
    pickupDateTime: { $lt: new Date(returnDateTime) },
    returnDateTime: { $gt: new Date(pickupDateTime) },
  });

  console.log(`Total concurrent threads : ${CONCURRENT_REQUEST_COUNT}`);
  console.log(`Successful confirmations : ${successfulCount}`);
  console.log(`Safely rejected conflicts: ${rejectedCount}`);
  console.log(`Database matching records: ${dbBookings.length}`);
  console.log(`Total execution time     : ${elapsedMs}ms`);

  // Cleanup test documents
  if (successBookingId) {
    await Booking.findByIdAndDelete(successBookingId);
  }

  console.log('\n======================================================================');
  if (successfulCount === 1 && rejectedCount === CONCURRENT_REQUEST_COUNT - 1 && dbBookings.length === 1) {
    console.log('  🏆 100-THREAD CONCURRENCY TEST RESULT: 100% PASSED');
    console.log('  Single booking successfully created; all 99 race attempts safely rejected.');
    console.log('======================================================================\n');
    process.exit(0);
  } else {
    console.error('  ❌ CONCURRENCY TEST FAILED!');
    console.error(`  Expected 1 success and ${CONCURRENT_REQUEST_COUNT - 1} rejections, got ${successfulCount} successes and ${dbBookings.length} DB records.`);
    console.error('======================================================================\n');
    process.exit(1);
  }
}

runConcurrencyTest().catch((err) => {
  console.error('❌ Concurrency test runner failed:', err);
  process.exit(1);
});
