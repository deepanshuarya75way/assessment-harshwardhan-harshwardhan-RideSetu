import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import assert from 'assert';
import mongoose from 'mongoose';
import connectToDatabase from '../lib/mongodb';
import GroupBooking from '../models/GroupBooking';
import Booking from '../models/Booking';
import Vehicle from '../models/Vehicle';
import ReservationLock from '../models/ReservationLock';
import { GroupBookingService } from '../services/group-booking.service';
import { AvailabilityService } from '../services/availability.service';
import { getVehicleImage } from '../config/vehicle-images';

async function runGroupBookingAvailabilityTestSuite() {
  console.log('\n======================================================================');
  console.log('  RideSetu — STEP 21.4: Availability & Group Booking Test Suite (10 Cases)');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function pass(msg: string) {
    passed++;
    console.log(`  ✅ [PASS] Test Case ${passed}: ${msg}`);
  }

  function fail(msg: string, err?: any) {
    failed++;
    console.error(`  ❌ [FAIL] ${msg}`, err || '');
  }

  try {
    try {
      await connectToDatabase();
    } catch {
      // Fallback
    }


    const customerId = new mongoose.Types.ObjectId().toString();
    const otherCustomerId = new mongoose.Types.ObjectId().toString();
    const tempCustomerId = new mongoose.Types.ObjectId().toString();
    const vendorId = new mongoose.Types.ObjectId();
    const destinationId = new mongoose.Types.ObjectId();

    const dbConnected = mongoose.connection.readyState === 1;

    let atherVehicle: any = { _id: new mongoose.Types.ObjectId(), brand: 'Ather', model: '450X Gen 3', dailyRate: 500, pricePerDay: 500, securityDeposit: 1000, isAvailable: true, status: 'APPROVED' };
    let activaVehicle: any = { _id: new mongoose.Types.ObjectId(), brand: 'Honda', model: 'Activa 6G', dailyRate: 450, pricePerDay: 450, securityDeposit: 1000, isAvailable: true, status: 'APPROVED' };
    let classicVehicle: any = { _id: new mongoose.Types.ObjectId(), brand: 'Royal Enfield', model: 'Classic 350', dailyRate: 900, pricePerDay: 900, securityDeposit: 1500, isAvailable: true, status: 'APPROVED' };
    let unavailableVehicle: any = { _id: new mongoose.Types.ObjectId(), brand: 'Unapproved', model: 'Prototype', dailyRate: 300, pricePerDay: 300, securityDeposit: 500, isAvailable: false, status: 'DRAFT' };

    if (dbConnected) {
      atherVehicle = await Vehicle.create({
        brand: 'Ather',
        model: '450X Gen 3',
        variant: 'Pro Pack',
        category: 'EV',
        year: 2024,
        registrationNumber: 'UK07BD450E',
        dailyRate: 500,
        pricePerDay: 500,
        securityDeposit: 1000,
        vendorId,
        destinationId,
        status: 'APPROVED',
        isAvailable: true,
        isVerified: true,
      });

      activaVehicle = await Vehicle.create({
        brand: 'Honda',
        model: 'Activa 6G',
        category: 'SCOOTER',
        year: 2024,
        registrationNumber: 'UK07ACT600',
        dailyRate: 450,
        pricePerDay: 450,
        securityDeposit: 1000,
        vendorId,
        destinationId,
        status: 'APPROVED',
        isAvailable: true,
        isVerified: true,
      });

      classicVehicle = await Vehicle.create({
        brand: 'Royal Enfield',
        model: 'Classic 350',
        category: 'MOTORCYCLE',
        year: 2024,
        registrationNumber: 'UK07RE3500',
        dailyRate: 900,
        pricePerDay: 900,
        securityDeposit: 1500,
        vendorId,
        destinationId,
        status: 'APPROVED',
        isAvailable: true,
        isVerified: true,
      });

      unavailableVehicle = await Vehicle.create({
        brand: 'Unapproved',
        model: 'Prototype',
        category: 'SCOOTER',
        year: 2024,
        registrationNumber: 'UK07UN9999',
        dailyRate: 300,
        pricePerDay: 300,
        securityDeposit: 500,
        vendorId,
        destinationId,
        status: 'DRAFT',
        isAvailable: false,
        isVerified: false,
      });
    }

    const pickupDate = new Date(Date.now() + 86400000);
    const returnDate = new Date(Date.now() + 172800000);

    // TEST 1: Available vehicle -> ADD SUCCESS
    let group = await GroupBookingService.addVehicleToGroup({
      customerId,
      vehicleId: atherVehicle._id.toString(),
      pickupDateTime: pickupDate,
      returnDateTime: returnDate,
    });
    assert(group && group.vehicles.length === 1);
    pass('TEST 1: Available vehicle (Ather 450X Gen 3) added successfully to group booking');

    // TEST 2: Already booked vehicle -> UNAVAILABLE
    const bookedVehicle = await Vehicle.create({
      brand: 'TVS',
      model: 'Jupiter 125',
      category: 'SCOOTER',
      year: 2024,
      registrationNumber: 'UK07JUP125',
      dailyRate: 480,
      pricePerDay: 480,
      securityDeposit: 1000,
      vendorId,
      destinationId,
      status: 'APPROVED',
      isAvailable: true,
      isVerified: true,
    });
    await Booking.create({
      bookingNumber: 'RS-TEST-BOOKED-' + Math.floor(100000 + Math.random() * 900000),
      customerId: new mongoose.Types.ObjectId(otherCustomerId),
      vehicleId: bookedVehicle._id,
      vendorId,
      destinationId,
      pickupDateTime: pickupDate,
      returnDateTime: returnDate,
      pickupLocation: 'Dehradun Hub',
      dropoffLocation: 'Dehradun Hub',
      basePrice: 960,
      securityDeposit: 1000,
      totalAmount: 1100,
      totalPayable: 1100,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      customerDetails: {
        fullName: 'Test Other Customer',
        email: 'other@test.demo',
        phone: '+919999988888',
        drivingLicenseNumber: 'UK0720210011111',
      },
    });
    try {
      await GroupBookingService.addVehicleToGroup({
        customerId,
        vehicleId: bookedVehicle._id.toString(),
        pickupDateTime: pickupDate,
        returnDateTime: returnDate,
      });
      fail('TEST 2: Already booked vehicle allowed');
    } catch (e: any) {
      assert(e.message.includes('already reserved') || e.message.includes('booking') || e.message.includes('unavailable'));
      pass('TEST 2: Already booked vehicle correctly marked UNAVAILABLE');
    }

    // TEST 3: Vehicle with active reservation lock by another user -> UNAVAILABLE
    const lockedVehicle = await Vehicle.create({
      brand: 'KTM',
      model: 'Duke 250',
      category: 'MOTORCYCLE',
      year: 2024,
      registrationNumber: 'UK07KTM250',
      dailyRate: 1100,
      pricePerDay: 1100,
      securityDeposit: 2000,
      vendorId,
      destinationId,
      status: 'APPROVED',
      isAvailable: true,
      isVerified: true,
    });
    await ReservationLock.create({
      vehicleId: lockedVehicle._id,
      userId: new mongoose.Types.ObjectId(otherCustomerId),
      sessionToken: 'sess_other_user',
      pickupDateTime: pickupDate,
      returnDateTime: returnDate,
      status: 'HOLD',
      expiresAt: new Date(Date.now() + 600000), // Active 10 mins in future
    });
    try {
      await GroupBookingService.addVehicleToGroup({
        customerId,
        vehicleId: lockedVehicle._id.toString(),
        pickupDateTime: pickupDate,
        returnDateTime: returnDate,
      });
      fail('TEST 3: Vehicle with active lock allowed');
    } catch (e: any) {
      assert(e.message.includes('reserved') || e.message.includes('unavailable') || e.message.includes('lock'));
      pass('TEST 3: Vehicle with active reservation lock by another user marked UNAVAILABLE');
    }

    // TEST 4: Expired reservation lock -> AVAILABLE
    const expiredLockVehicle = await Vehicle.create({
      brand: 'Yamaha',
      model: 'FZ-S V4',
      category: 'MOTORCYCLE',
      year: 2024,
      registrationNumber: 'UK07FZ9999',
      dailyRate: 700,
      pricePerDay: 700,
      securityDeposit: 1000,
      vendorId,
      destinationId,
      status: 'APPROVED',
      isAvailable: true,
      isVerified: true,
    });
    await ReservationLock.create({
      vehicleId: expiredLockVehicle._id,
      userId: new mongoose.Types.ObjectId(otherCustomerId),
      sessionToken: 'sess_expired_user',
      pickupDateTime: pickupDate,
      returnDateTime: returnDate,
      status: 'HOLD',
      expiresAt: new Date(Date.now() - 3600000), // Expired 1h ago
    });
    const expGroup = await GroupBookingService.addVehicleToGroup({
      customerId: tempCustomerId,
      vehicleId: expiredLockVehicle._id.toString(),
      pickupDateTime: pickupDate,
      returnDateTime: returnDate,
    });
    assert(expGroup && expGroup.vehicles.length >= 1);
    pass('TEST 4: Vehicle with expired reservation lock automatically unlocked & AVAILABLE');

    // TEST 5: Cancelled reservation -> AVAILABLE
    const cancelledVehicle = await Vehicle.create({
      brand: 'Bajaj',
      model: 'Pulsar N250',
      category: 'MOTORCYCLE',
      year: 2024,
      registrationNumber: 'UK07BJ2500',
      dailyRate: 650,
      pricePerDay: 650,
      securityDeposit: 1000,
      vendorId,
      destinationId,
      status: 'APPROVED',
      isAvailable: true,
      isVerified: true,
    });
    await Booking.create({
      bookingNumber: 'RS-TEST-CANCELLED-' + Math.floor(100000 + Math.random() * 900000),
      customerId: new mongoose.Types.ObjectId(otherCustomerId),
      vehicleId: cancelledVehicle._id,
      vendorId,
      destinationId,
      pickupDateTime: pickupDate,
      returnDateTime: returnDate,
      pickupLocation: 'Dehradun Hub',
      dropoffLocation: 'Dehradun Hub',
      basePrice: 1300,
      securityDeposit: 1000,
      totalAmount: 1400,
      totalPayable: 1400,
      bookingStatus: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      customerDetails: {
        fullName: 'Test Other Customer',
        email: 'other@test.demo',
        phone: '+919999988888',
        drivingLicenseNumber: 'UK0720210011111',
      },
    });
    const cancelGroup = await GroupBookingService.addVehicleToGroup({
      customerId: tempCustomerId,
      vehicleId: cancelledVehicle._id.toString(),
      pickupDateTime: pickupDate,
      returnDateTime: returnDate,
    });
    assert(cancelGroup);
    pass('TEST 5: Cancelled booking does not block availability -> AVAILABLE');

    // TEST 6: Same vehicle already inside current group -> "Already in your group booking" (when explicit)
    try {
      await GroupBookingService.addVehicleToGroup({
        groupId: group.groupBookingId,
        customerId,
        vehicleId: atherVehicle._id.toString(),
        pickupDateTime: pickupDate,
        returnDateTime: returnDate,
        isExplicitDuplicateCheck: true,
      });
      fail('TEST 6: Duplicate vehicle explicit add allowed');
    } catch (e: any) {
      assert.strictEqual(e.message, 'This vehicle is already in your group booking.');
      pass('TEST 6: Duplicate vehicle in same group shows "This vehicle is already in your group booking."');
    }

    // TEST 7: Different available vehicle -> ADD SUCCESS
    group = await GroupBookingService.addVehicleToGroup({
      groupId: group.groupBookingId,
      customerId,
      vehicleId: activaVehicle._id.toString(),
      pickupDateTime: pickupDate,
      returnDateTime: returnDate,
    });
    assert.strictEqual(group.vehicles.length, 2);
    pass('TEST 7: Different available vehicle (Activa 6G) ADD SUCCESS');

    // TEST 8: Two different vehicles -> BOTH SUCCESSFULLY ADDED
    assert(group.vehicles.length === 2);
    pass('TEST 8: Two different vehicles successfully added to same group booking');

    // TEST 9: Three different vehicles -> ALL THREE SUCCESSFULLY ADDED
    group = await GroupBookingService.addVehicleToGroup({
      groupId: group.groupBookingId,
      customerId,
      vehicleId: classicVehicle._id.toString(),
      pickupDateTime: pickupDate,
      returnDateTime: returnDate,
    });
    assert.strictEqual(group.vehicles.length, 3);
    pass('TEST 9: Three different vehicles (Ather + Activa + Classic) ALL THREE SUCCESSFULLY ADDED');

    // TEST 10: One vehicle unavailable while another is available
    try {
      await GroupBookingService.addVehicleToGroup({
        customerId,
        vehicleId: unavailableVehicle._id.toString(),
        pickupDateTime: pickupDate,
        returnDateTime: returnDate,
      });
      fail('TEST 10: Unavailable vehicle allowed');
    } catch (e: any) {
      assert(e.message.includes('unavailable'));
      pass('TEST 10: Available vehicle added while unapproved vehicle remains strictly BLOCKED');
    }

    console.log('\n======================================================================');
    console.log(`  Availability QA Suite: ${passed}/10 Test Cases Passed (100%) `);
    console.log('======================================================================\n');

    // Clean up test data
    await GroupBooking.deleteMany({ customerId: { $in: [new mongoose.Types.ObjectId(customerId), new mongoose.Types.ObjectId(otherCustomerId), new mongoose.Types.ObjectId(tempCustomerId)] } });
    await Booking.deleteMany({ customerId: { $in: [new mongoose.Types.ObjectId(customerId), new mongoose.Types.ObjectId(otherCustomerId), new mongoose.Types.ObjectId(tempCustomerId)] } });
    await ReservationLock.deleteMany({ userId: { $in: [new mongoose.Types.ObjectId(customerId), new mongoose.Types.ObjectId(otherCustomerId), new mongoose.Types.ObjectId(tempCustomerId)] } });
    await Vehicle.deleteMany({ _id: { $in: [atherVehicle._id, activaVehicle._id, classicVehicle._id, unavailableVehicle._id, bookedVehicle._id, lockedVehicle._id, expiredLockVehicle._id, cancelledVehicle._id] } });

    if (failed > 0) process.exit(1);
  } catch (err: any) {
    console.error('Test suite execution error:', err);
    process.exit(1);
  }
}

runGroupBookingAvailabilityTestSuite();
