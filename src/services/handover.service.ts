import mongoose from 'mongoose';
import {
  DigitalHandoverReport,
  IDigitalHandoverReport,
  IScratchItem,
} from '@/models/DigitalHandoverReport';
import { Booking } from '@/models/Booking';
import { Vehicle } from '@/models/Vehicle';
import { DamageReport } from '@/models/DamageReport';
import { User } from '@/models/User';
import { Vendor } from '@/models/Vendor';
import { AuditLog } from '@/models/AuditLog';
import { NotificationService } from './notification.service';
import { BookingStateMachineService } from './booking-state-machine.service';
import connectToDatabase from '@/lib/mongodb';

export interface VendorHandoverDTO {
  bookingId: string;
  vendorUserId: string;
  vehicleId: string;
  odometerReading: number;
  fuelBatteryLevel: number;
  existingScratches: IScratchItem[];
  photos: {
    frontUrl: string;
    backUrl: string;
    leftUrl: string;
    rightUrl: string;
    meterUrl: string;
    dashboardUrl?: string;
  };
  helmetCount: number;
  accessoriesGiven: string[];
  vendorAgentName: string;
  remarks: string;
}

export interface CustomerConfirmHandoverDTO {
  bookingId: string;
  customerUserId: string;
  customerSignatureConfirmed: boolean;
  customerSignatureName: string;
}

export interface VendorReturnDTO {
  bookingId: string;
  vendorUserId: string;
  vehicleId: string;
  returnOdometerReading: number;
  returnFuelBatteryLevel: number;
  returnScratches: IScratchItem[];
  returnPhotos: {
    frontUrl: string;
    backUrl: string;
    leftUrl: string;
    rightUrl: string;
    meterUrl: string;
    dashboardUrl?: string;
  };
  vendorAgentName: string;
  damageDescription?: string;
  remarks: string;
}

export class HandoverService {
  /**
   * Step 1: Vendor performs Pre-Pickup Handover Inspection
   */
  public static async recordVendorHandover(dto: VendorHandoverDTO): Promise<IDigitalHandoverReport> {
    await connectToDatabase();

    const booking = await Booking.findById(dto.bookingId);
    if (!booking) {
      throw new Error('Booking not found.');
    }

    // RBAC: Verify vendor owns this booking (Admin override permitted)
    const user = await User.findById(dto.vendorUserId).lean();
    if (user?.role !== 'ADMIN') {
      const vendor = await Vendor.findOne({ userId: dto.vendorUserId }).lean();
      if (!vendor || booking.vendorId.toString() !== vendor._id.toString()) {
        throw new Error('Forbidden: Only the assigned vendor can perform this inspection.');
      }
    }

    // Duplicate check: Prevent duplicate handover report creation
    const existingReport = await DigitalHandoverReport.findOne({
      bookingId: booking._id,
      handoverType: 'PICKUP',
    });
    if (existingReport && ['HANDED_OVER', 'ACTIVE', 'COMPLETED', 'DISPUTED'].includes(booking.bookingStatus)) {
      throw new Error('This handover inspection has already been completed and is awaiting customer confirmation.');
    }

    // State machine validation
    BookingStateMachineService.validateTransition(booking.bookingStatus, 'HANDED_OVER');

    if (dto.odometerReading === undefined || dto.odometerReading === null || Number(dto.odometerReading) < 0) {
      throw new Error('Odometer reading must be greater than or equal to 0.');
    }

    if (dto.fuelBatteryLevel === undefined || dto.fuelBatteryLevel === null || dto.fuelBatteryLevel < 0 || dto.fuelBatteryLevel > 100) {
      throw new Error('Fuel / Battery level must be between 0% and 100%.');
    }

    // Photo slot validation
    if (!dto.photos?.frontUrl || !dto.photos?.backUrl || !dto.photos?.leftUrl || !dto.photos?.rightUrl || !dto.photos?.meterUrl) {
      const missingPhotos: string[] = [];
      if (!dto.photos?.frontUrl) missingPhotos.push('Front inspection photo');
      if (!dto.photos?.backUrl) missingPhotos.push('Rear inspection photo');
      if (!dto.photos?.leftUrl) missingPhotos.push('Left inspection photo');
      if (!dto.photos?.rightUrl) missingPhotos.push('Right inspection photo');
      if (!dto.photos?.meterUrl) missingPhotos.push('Odometer / meter inspection photo');
      throw new Error(`Missing: ${missingPhotos.join(', ')}`);
    }

    const reportPayload = {
      bookingId: booking._id,
      vehicleId: new mongoose.Types.ObjectId(dto.vehicleId),
      handoverType: 'PICKUP' as const,
      odometerReading: Number(dto.odometerReading),
      fuelBatteryLevel: Number(dto.fuelBatteryLevel),
      existingScratches: dto.existingScratches || [],
      photos: dto.photos,
      helmetCount: dto.helmetCount || 1,
      accessoriesGiven: dto.accessoriesGiven || [],
      customerSignatureConfirmed: false,
      vendorAgentName: dto.vendorAgentName || 'Vendor Representative',
      remarks: dto.remarks || '',
      timestamp: new Date(),
    };

    let report: IDigitalHandoverReport;
    if (existingReport) {
      Object.assign(existingReport, reportPayload);
      await existingReport.save();
      report = existingReport;
    } else {
      report = await DigitalHandoverReport.create(reportPayload);
    }

    // Transition booking status to HANDED_OVER (awaiting customer acceptance)
    booking.bookingStatus = 'HANDED_OVER';
    booking.handoverPickupId = report._id;
    await booking.save();

    // Log Audit
    await AuditLog.create({
      action: 'BOOKING_HANDOVER_RECORDED',
      userId: dto.vendorUserId,
      userRole: user?.role || 'VENDOR',
      resourceType: 'BOOKING',
      resourceId: booking._id.toString(),
      details: { bookingNumber: booking.bookingNumber },
    }).catch(() => {});

    // Notify Customer
    await NotificationService.createNotification({
      userId: booking.customerId.toString(),
      type: 'BOOKING_CONFIRMED',
      title: 'Handover Inspection Ready for Confirmation',
      message: `Your vendor has completed the handover inspection for vehicle ${booking.bookingNumber}. Please review and confirm to start your trip.`,
      relatedBookingId: booking._id.toString(),
    }).catch(() => {});

    return report;
  }

  /**
   * Step 2: Customer reviews & accepts Handover Inspection to activate trip
   */
  public static async confirmCustomerHandover(dto: CustomerConfirmHandoverDTO): Promise<any> {
    await connectToDatabase();

    const booking = await Booking.findById(dto.bookingId);
    if (!booking) {
      throw new Error('Booking not found.');
    }

    // RBAC: Verify customer owns this booking
    if (booking.customerId.toString() !== dto.customerUserId) {
      throw new Error('Forbidden: Only the assigned customer can confirm this handover.');
    }

    if (booking.bookingStatus === 'ACTIVE') {
      throw new Error('This handover inspection has already been confirmed and your ride is active.');
    }

    if (booking.bookingStatus !== 'HANDED_OVER') {
      throw new Error(`Booking status is "${booking.bookingStatus}". Handover confirmation requires HANDED_OVER state.`);
    }

    if (!dto.customerSignatureConfirmed) {
      throw new Error('You must accept the recorded vehicle condition to start your ride.');
    }

    BookingStateMachineService.validateTransition(booking.bookingStatus, 'ACTIVE');

    // Update handover report confirmation signature
    if (booking.handoverPickupId) {
      await DigitalHandoverReport.findByIdAndUpdate(booking.handoverPickupId, {
        customerSignatureConfirmed: true,
        customerSignatureName: dto.customerSignatureName || 'Customer',
      });
    }

    // Transition booking to ACTIVE and hold deposit
    booking.bookingStatus = 'ACTIVE';
    booking.depositStatus = 'HELD';
    await booking.save();

    // Update vehicle odometer
    const pickupReport = await DigitalHandoverReport.findById(booking.handoverPickupId);
    if (pickupReport) {
      await Vehicle.findByIdAndUpdate(booking.vehicleId, {
        odometer: pickupReport.odometerReading,
      });
    }

    // Log Audit
    await AuditLog.create({
      action: 'BOOKING_ACTIVATED',
      userId: dto.customerUserId,
      userRole: 'CUSTOMER',
      resourceType: 'BOOKING',
      resourceId: booking._id.toString(),
      details: { bookingNumber: booking.bookingNumber },
    }).catch(() => {});

    return booking;
  }

  /**
   * Step 3: Vendor performs Return Inspection
   */
  public static async recordVendorReturn(dto: VendorReturnDTO): Promise<{ report: IDigitalHandoverReport; isDisputed: boolean }> {
    await connectToDatabase();

    const booking = await Booking.findById(dto.bookingId);
    if (!booking) {
      throw new Error('Booking not found.');
    }

    // RBAC: Verify vendor owns this booking (Admin bypass)
    const user = await User.findById(dto.vendorUserId).lean();
    if (user?.role !== 'ADMIN') {
      const vendor = await Vendor.findOne({ userId: dto.vendorUserId }).lean();
      if (!vendor || booking.vendorId.toString() !== vendor._id.toString()) {
        throw new Error('Forbidden: Only the assigned vendor can perform this inspection.');
      }
    }

    // Duplicate return check
    const existingReturnReport = await DigitalHandoverReport.findOne({
      bookingId: booking._id,
      handoverType: 'RETURN',
    });
    if (existingReturnReport || ['COMPLETED', 'DISPUTED'].includes(booking.bookingStatus)) {
      throw new Error('This return inspection has already been completed.');
    }

    if (!['ACTIVE', 'RETURN_PENDING', 'RETURN_INSPECTION'].includes(booking.bookingStatus)) {
      throw new Error(`Booking status is "${booking.bookingStatus}". Return inspection requires ACTIVE or RETURN_PENDING state.`);
    }

    if (dto.returnOdometerReading === undefined || dto.returnOdometerReading === null || Number(dto.returnOdometerReading) < 0) {
      throw new Error('Return odometer reading must be greater than or equal to 0.');
    }

    if (dto.returnFuelBatteryLevel === undefined || dto.returnFuelBatteryLevel === null || dto.returnFuelBatteryLevel < 0 || dto.returnFuelBatteryLevel > 100) {
      throw new Error('Return fuel / battery level must be between 0% and 100%.');
    }

    // Fetch pickup report to validate handover data contract and odometer delta
    const pickupReport = await DigitalHandoverReport.findOne({ bookingId: booking._id, handoverType: 'PICKUP' });
    if (!pickupReport) {
      throw new Error('Return inspection unavailable because this booking has no completed handover inspection.');
    }

    if (dto.returnOdometerReading < pickupReport.odometerReading) {
      throw new Error(`Return odometer (${dto.returnOdometerReading} km) cannot be lower than handover odometer (${pickupReport.odometerReading} km).`);
    }

    // Photo slot validation
    if (!dto.returnPhotos?.frontUrl || !dto.returnPhotos?.backUrl || !dto.returnPhotos?.leftUrl || !dto.returnPhotos?.rightUrl || !dto.returnPhotos?.meterUrl) {
      const missingPhotos: string[] = [];
      if (!dto.returnPhotos?.frontUrl) missingPhotos.push('Front inspection photo');
      if (!dto.returnPhotos?.backUrl) missingPhotos.push('Rear inspection photo');
      if (!dto.returnPhotos?.leftUrl) missingPhotos.push('Left inspection photo');
      if (!dto.returnPhotos?.rightUrl) missingPhotos.push('Right inspection photo');
      if (!dto.returnPhotos?.meterUrl) missingPhotos.push('Odometer / meter inspection photo');
      throw new Error(`Missing: ${missingPhotos.join(', ')}`);
    }

    // Detect new scratches / damage
    const pickupScratchIds = new Set((pickupReport.existingScratches || []).map((s) => s.id));
    const newScratches = (dto.returnScratches || []).filter((s) => !pickupScratchIds.has(s.id));
    const isDisputed = newScratches.length > 0 || Boolean(dto.damageDescription && dto.damageDescription.trim().length > 0);

    const targetStatus = isDisputed ? 'DISPUTED' : 'COMPLETED';
    BookingStateMachineService.validateTransition(booking.bookingStatus, targetStatus);

    const returnReport = await DigitalHandoverReport.create({
      bookingId: booking._id,
      vehicleId: new mongoose.Types.ObjectId(dto.vehicleId),
      handoverType: 'RETURN',
      odometerReading: Number(dto.returnOdometerReading),
      fuelBatteryLevel: Number(dto.returnFuelBatteryLevel),
      existingScratches: dto.returnScratches || [],
      photos: dto.returnPhotos,
      helmetCount: 1,
      accessoriesGiven: [],
      customerSignatureConfirmed: true,
      vendorAgentName: dto.vendorAgentName || 'Vendor Representative',
      remarks: dto.remarks || '',
      timestamp: new Date(),
    });

    booking.handoverReturnId = returnReport._id;

    if (isDisputed) {
      booking.bookingStatus = 'DISPUTED';
      booking.depositStatus = 'HELD';
      await booking.save();

      const pickupPhotos = Object.values(pickupReport.photos || {}).filter((p): p is string => Boolean(p));
      const returnPhotosList = Object.values(dto.returnPhotos || {}).filter((p): p is string => Boolean(p));

      // Prevent duplicate DamageReport creation
      const existingDamageReport = await DamageReport.findOne({ bookingId: booking._id });
      if (!existingDamageReport) {
        await DamageReport.create({
          bookingId: booking._id,
          vendorId: booking.vendorId,
          customerId: booking.customerId,
          beforePhotos: pickupPhotos,
          afterPhotos: returnPhotosList,
          description: dto.damageDescription || `New damage detected during return inspection: ${newScratches.map((s) => s.description).join(', ')}`,
          claimedAmount: booking.securityDeposit || 1000,
          status: 'OPEN',
          vendorRemarks: dto.remarks || '',
        });
      }

      await AuditLog.create({
        action: 'BOOKING_DISPUTED_DAMAGE',
        userId: dto.vendorUserId,
        userRole: user?.role || 'VENDOR',
        resourceType: 'BOOKING',
        resourceId: booking._id.toString(),
        details: { bookingNumber: booking.bookingNumber },
      }).catch(() => {});
    } else {
      booking.bookingStatus = 'COMPLETED';
      booking.depositStatus = 'REFUNDED';
      await booking.save();

      await AuditLog.create({
        action: 'BOOKING_COMPLETED',
        userId: dto.vendorUserId,
        userRole: user?.role || 'VENDOR',
        resourceType: 'BOOKING',
        resourceId: booking._id.toString(),
        details: { bookingNumber: booking.bookingNumber },
      }).catch(() => {});
    }

    // Update vehicle odometer and restore availability for future non-overlapping dates
    await Vehicle.findByIdAndUpdate(booking.vehicleId, {
      odometer: Number(dto.returnOdometerReading),
      isAvailable: true,
    });

    return { report: returnReport, isDisputed };
  }

  /**
   * Helper: Get Handover Comparison Breakdown
   */
  public static async getHandoverComparison(bookingId: string): Promise<{
    pickupReport: IDigitalHandoverReport | null;
    returnReport: IDigitalHandoverReport | null;
    kmTravelled: number;
    fuelDiff: number;
    newScratches: IScratchItem[];
    depositRecommendation: 'FULL_REFUND' | 'INSPECT_DAMAGE';
  }> {
    await connectToDatabase();
    const bId = new mongoose.Types.ObjectId(bookingId);

    const [pickupReport, returnReport] = await Promise.all([
      DigitalHandoverReport.findOne({ bookingId: bId, handoverType: 'PICKUP' }).lean<IDigitalHandoverReport>(),
      DigitalHandoverReport.findOne({ bookingId: bId, handoverType: 'RETURN' }).lean<IDigitalHandoverReport>(),
    ]);

    let kmTravelled = 0;
    let fuelDiff = 0;
    let newScratches: IScratchItem[] = [];

    if (pickupReport && returnReport) {
      kmTravelled = Math.max(0, returnReport.odometerReading - pickupReport.odometerReading);
      fuelDiff = returnReport.fuelBatteryLevel - pickupReport.fuelBatteryLevel;

      const pickupScratchIds = new Set((pickupReport.existingScratches || []).map((s) => s.id));
      newScratches = (returnReport.existingScratches || []).filter((s) => !pickupScratchIds.has(s.id));
    }

    const depositRecommendation = newScratches.length > 0 ? 'INSPECT_DAMAGE' : 'FULL_REFUND';

    return {
      pickupReport,
      returnReport,
      kmTravelled,
      fuelDiff,
      newScratches,
      depositRecommendation,
    };
  }

  public static generateInspectionDiff(
    pickupReport: { odometerReading: number; fuelBatteryLevel: number; existingScratches: IScratchItem[] },
    returnReport: { odometerReading: number; fuelBatteryLevel: number; existingScratches: IScratchItem[] }
  ): {
    distanceRiddenKm: number;
    fuelBatteryDifference: number;
    newScratchesCount: number;
    newScratches: IScratchItem[];
    depositRecommendation: 'FULL_REFUND' | 'INSPECT_DAMAGE';
  } {
    const distanceRiddenKm = Math.max(0, returnReport.odometerReading - pickupReport.odometerReading);
    const fuelBatteryDifference = returnReport.fuelBatteryLevel - pickupReport.fuelBatteryLevel;
    const pickupScratchIds = new Set((pickupReport.existingScratches || []).map((s) => s.id));
    const newScratches = (returnReport.existingScratches || []).filter((s) => !pickupScratchIds.has(s.id));
    const depositRecommendation = newScratches.length > 0 ? 'INSPECT_DAMAGE' : 'FULL_REFUND';

    return {
      distanceRiddenKm,
      fuelBatteryDifference,
      newScratchesCount: newScratches.length,
      newScratches,
      depositRecommendation,
    };
  }
}
