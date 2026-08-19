import mongoose from 'mongoose';
import { GroupBooking, IGroupBooking, GroupBookingStatus, GroupPaymentStatus, IRiderDetails } from '@/models/GroupBooking';
import { Booking, IBooking } from '@/models/Booking';
import { Vehicle } from '@/models/Vehicle';
import { User } from '@/models/User';
import { Coupon } from '@/models/Coupon';
import { PricingService } from './pricing.service';
import { AvailabilityService } from './availability.service';
import { PaymentService } from './payment.service';
import { NotificationService } from './notification.service';
import { DocumentStorageService } from './document-storage.service';
import { generateBookingNumber } from '@/lib/utils';
import connectToDatabase from '@/lib/mongodb';

export interface AddVehicleToGroupDTO {
  groupId?: string;
  customerId: string;
  vehicleId: string;
  pickupDateTime: string | Date;
  returnDateTime: string | Date;
  pickupType?: 'VENDOR_PICKUP' | 'HOTEL_DELIVERY' | 'HOSTEL_DELIVERY' | 'STATION_DELIVERY' | 'AIRPORT_DELIVERY' | 'ONE_WAY_DROP';
  pickupLocation?: string;
  dropoffLocation?: string;
  deliveryLocation?: any;
}

export interface AssignRiderDTO {
  groupId: string;
  customerId: string;
  vehicleId: string;
  fullName: string;
  drivingLicenseNumber: string;
  drivingLicenseDocumentUrl?: string;
  drivingLicenseDocumentKey?: string;
  autoVerify?: boolean;
}

export class GroupBookingService {
  /**
   * Generates a clean group booking ID string (e.g. RS-GROUP-XXXXXX)
   */
  public static generateGroupBookingId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'RS-GROUP-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Add a vehicle to a group booking (creates a new group draft or updates existing)
   */
  public static async addVehicleToGroup(dto: AddVehicleToGroupDTO & { isExplicitDuplicateCheck?: boolean }): Promise<IGroupBooking> {
    await connectToDatabase();

    const vehicle = await Vehicle.findById(dto.vehicleId).populate('vendorId').lean();
    if (!vehicle) {
      throw new Error('Selected vehicle does not exist.');
    }

    // 1. Locate active draft group booking for this customer first
    let group: IGroupBooking | null = null;
    if (dto.groupId) {
      group = await GroupBooking.findOne({
        groupBookingId: dto.groupId,
        customerId: new mongoose.Types.ObjectId(dto.customerId),
        bookingStatus: { $in: ['DRAFT', 'PENDING_VERIFICATION'] },
      });
    }

    if (!group) {
      group = await GroupBooking.findOne({
        customerId: new mongoose.Types.ObjectId(dto.customerId),
        bookingStatus: 'DRAFT',
      });
    }

    // 2. If vehicle is ALREADY in customer's active group booking cart:
    if (group) {
      const existingItem = group.vehicles.find(
        (item) => item.vehicleId.toString() === dto.vehicleId.toString()
      );

      if (existingItem) {
        if (dto.isExplicitDuplicateCheck) {
          throw new Error('This vehicle is already in your group booking.');
        }

        // Idempotent refresh: recalculate pricing & return populated group
        const pricing = PricingService.calculatePricing({
          vehicle: vehicle as any,
          pickupDateTime: dto.pickupDateTime,
          returnDateTime: dto.returnDateTime,
          pickupType: dto.pickupType || 'VENDOR_PICKUP',
          deliveryFee: vehicle.vendorId ? (vehicle.vendorId as any).baseDeliveryFee : 100,
        });

        existingItem.pricing = {
          basePrice: pricing.basePrice,
          deliveryCharge: pricing.deliveryCharge,
          platformFee: pricing.platformFee,
          taxes: pricing.taxes,
          securityDeposit: pricing.securityDeposit,
          totalPayable: pricing.totalPayable,
        };
        group.pickupDateTime = new Date(dto.pickupDateTime);
        group.returnDateTime = new Date(dto.returnDateTime);
        this.recalculateGroupPricing(group);
        await group.save();

        const populatedGroup = await GroupBooking.findById(group._id).populate('vehicles.vehicleId').lean();
        return (populatedGroup as any) || group;
      }
    }

    // 3. For NEW vehicle additions: check lifecycle & serviceability
    if (vehicle.status !== 'APPROVED' || vehicle.isAvailable === false) {
      throw new Error(`Vehicle "${vehicle.brand} ${vehicle.model}" is currently unavailable.`);
    }

    const serviceability = await AvailabilityService.validateVehicleServiceability({
      vehicleId: dto.vehicleId,
      pickupDateTime: dto.pickupDateTime,
      returnDateTime: dto.returnDateTime,
      excludeUserId: dto.customerId,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('[DIAGNOSTIC_AVAILABILITY]', {
        vehicleId: vehicle._id,
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        active: vehicle.status === 'APPROVED',
        vendorActive: (vehicle.vendorId as any)?.isActive,
        verificationStatus: (vehicle.vendorId as any)?.verificationStatus,
        serviceable: serviceability.serviceable,
        available: serviceability.available,
        code: serviceability.code,
        reason: serviceability.reason,
      });
    }

    if (!serviceability.serviceable || !serviceability.available) {
      throw new Error(serviceability.reason || `Vehicle "${vehicle.brand} ${vehicle.model}" is unavailable for selected dates.`);
    }

    const pricing = PricingService.calculatePricing({
      vehicle: vehicle as any,
      pickupDateTime: dto.pickupDateTime,
      returnDateTime: dto.returnDateTime,
      pickupType: dto.pickupType || 'VENDOR_PICKUP',
      deliveryFee: vehicle.vendorId ? (vehicle.vendorId as any).baseDeliveryFee : 100,
    });

    if (!group) {
      const groupBookingId = this.generateGroupBookingId();
      group = await GroupBooking.create({
        groupBookingId,
        customerId: new mongoose.Types.ObjectId(dto.customerId),
        pickupDateTime: new Date(dto.pickupDateTime),
        returnDateTime: new Date(dto.returnDateTime),
        pickupType: dto.pickupType || 'VENDOR_PICKUP',
        pickupLocation: dto.pickupLocation || 'Vendor Shop Hub',
        dropoffLocation: dto.dropoffLocation || 'Vendor Shop Hub',
        deliveryLocation: dto.deliveryLocation || undefined,
        vehicles: [
          {
            vehicleId: vehicle._id,
            vendorId: vehicle.vendorId ? (vehicle.vendorId as any)._id || vehicle.vendorId : new mongoose.Types.ObjectId(),
            rider: {
              fullName: '',
              drivingLicenseNumber: '',
              drivingLicenseDocumentUrl: '',
              drivingLicenseDocumentKey: '',
              verificationStatus: 'NOT_STARTED',
            },
            pricing: {
              basePrice: pricing.basePrice,
              deliveryCharge: pricing.deliveryCharge,
              platformFee: pricing.platformFee,
              taxes: pricing.taxes,
              securityDeposit: pricing.securityDeposit,
              totalPayable: pricing.totalPayable,
            },
          },
        ],
        pricingSummary: {
          totalBasePrice: pricing.basePrice,
          totalDeliveryCharge: pricing.deliveryCharge,
          totalPlatformFee: pricing.platformFee,
          totalTaxes: pricing.taxes,
          totalSecurityDeposit: pricing.securityDeposit,
          grandTotal: pricing.totalPayable,
        },
        bookingStatus: 'DRAFT',
        paymentStatus: 'PENDING',
      });
    } else {
      group.vehicles.push({
        vehicleId: vehicle._id,
        vendorId: vehicle.vendorId ? (vehicle.vendorId as any)._id || vehicle.vendorId : new mongoose.Types.ObjectId(),
        rider: {
          fullName: '',
          drivingLicenseNumber: '',
          drivingLicenseDocumentUrl: '',
          drivingLicenseDocumentKey: '',
          verificationStatus: 'NOT_STARTED',
        },
        pricing: {
          basePrice: pricing.basePrice,
          deliveryCharge: pricing.deliveryCharge,
          platformFee: pricing.platformFee,
          taxes: pricing.taxes,
          securityDeposit: pricing.securityDeposit,
          totalPayable: pricing.totalPayable,
        },
      });

      this.recalculateGroupPricing(group);
      await group.save();
    }

    const populatedGroup = await GroupBooking.findById(group._id).populate('vehicles.vehicleId').lean();
    return (populatedGroup as any) || group;
  }

  /**
   * Remove a vehicle from a group booking
   */
  public static async removeVehicleFromGroup(
    groupId: string,
    customerId: string,
    vehicleId: string
  ): Promise<IGroupBooking> {
    await connectToDatabase();

    const group = await GroupBooking.findOne({
      groupBookingId: groupId,
      customerId: new mongoose.Types.ObjectId(customerId),
      bookingStatus: { $in: ['DRAFT', 'PENDING_VERIFICATION'] },
    });

    if (!group) {
      throw new Error('Group booking not found.');
    }

    group.vehicles = group.vehicles.filter(
      (item) => item.vehicleId.toString() !== vehicleId.toString()
    );

    if (group.vehicles.length === 0) {
      group.bookingStatus = 'CANCELLED';
    } else {
      this.recalculateGroupPricing(group);
    }

    await group.save();
    const populatedGroup = await GroupBooking.findById(group._id).populate('vehicles.vehicleId').lean();
    return (populatedGroup as any) || group;
  }

  /**
   * Assign or update rider details for a vehicle in the group
   */
  public static async assignRiderToVehicle(dto: AssignRiderDTO): Promise<IGroupBooking> {
    await connectToDatabase();

    if (!dto.fullName || dto.fullName.trim().length === 0) {
      throw new Error('Rider full name is required.');
    }
    if (!dto.drivingLicenseNumber || dto.drivingLicenseNumber.trim().length === 0) {
      throw new Error('Driving license number is required.');
    }

    const group = await GroupBooking.findOne({
      groupBookingId: dto.groupId,
      customerId: new mongoose.Types.ObjectId(dto.customerId),
      bookingStatus: { $in: ['DRAFT', 'PENDING_VERIFICATION'] },
    });

    if (!group) {
      throw new Error('Group booking session not found.');
    }

    const item = group.vehicles.find(
      (v) => v.vehicleId.toString() === dto.vehicleId.toString()
    );

    if (!item) {
      throw new Error('Selected vehicle is not in this group booking.');
    }

    const cleanDL = dto.drivingLicenseNumber.trim().toUpperCase();
    const docUrl = dto.drivingLicenseDocumentUrl || item.rider.drivingLicenseDocumentUrl || '';
    const docKey = dto.drivingLicenseDocumentKey || item.rider.drivingLicenseDocumentKey || '';

    let status: any = item.rider.verificationStatus;
    if (docUrl || docKey) {
      status = dto.autoVerify ? 'VERIFIED' : 'DOCUMENT_UPLOADED';
    } else if (status === 'NOT_STARTED') {
      status = 'NOT_STARTED';
    }

    item.rider = {
      fullName: dto.fullName.trim(),
      drivingLicenseNumber: cleanDL,
      drivingLicenseDocumentUrl: docUrl,
      drivingLicenseDocumentKey: docKey,
      verificationStatus: status,
      verifiedAt: status === 'VERIFIED' ? new Date() : undefined,
    };

    this.updateGroupStatusBasedOnVerification(group);
    await group.save();
    const populatedGroup = await GroupBooking.findById(group._id).populate('vehicles.vehicleId').lean();
    return (populatedGroup as any) || group;
  }

  /**
   * Upload rider DL document with server-side validation
   */
  public static async uploadRiderDLDocument(params: {
    groupId: string;
    customerId: string;
    vehicleId: string;
    fileBuffer: Buffer;
    fileName: string;
    mimeType: string;
  }): Promise<{ documentUrl: string; storageKey: string; group: IGroupBooking }> {
    await connectToDatabase();

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(params.mimeType.toLowerCase())) {
      throw new Error('Invalid file type. Only JPG, JPEG, PNG, and PDF files are allowed.');
    }

    if (params.fileBuffer.length > 5 * 1024 * 1024) {
      throw new Error('File size exceeds the maximum limit of 5 MB.');
    }

    // Check magic bytes
    const isJpeg = params.fileBuffer[0] === 0xff && params.fileBuffer[1] === 0xd8;
    const isPng =
      params.fileBuffer[0] === 0x89 &&
      params.fileBuffer[1] === 0x50 &&
      params.fileBuffer[2] === 0x4e &&
      params.fileBuffer[3] === 0x47;
    const isPdf =
      params.fileBuffer[0] === 0x25 &&
      params.fileBuffer[1] === 0x50 &&
      params.fileBuffer[2] === 0x44 &&
      params.fileBuffer[3] === 0x46;

    if (!isJpeg && !isPng && !isPdf) {
      throw new Error('File signature mismatch. The file content does not match its extension.');
    }

    const group = await GroupBooking.findOne({
      groupBookingId: params.groupId,
      customerId: new mongoose.Types.ObjectId(params.customerId),
      bookingStatus: { $in: ['DRAFT', 'PENDING_VERIFICATION'] },
    });

    if (!group) {
      throw new Error('Group booking not found.');
    }

    const item = group.vehicles.find(
      (v) => v.vehicleId.toString() === params.vehicleId.toString()
    );

    if (!item) {
      throw new Error('Vehicle not found in group booking.');
    }

    const uploadResult = await DocumentStorageService.saveDocument({
      userId: params.customerId,
      category: 'DRIVING_LICENSE',
      fileBuffer: params.fileBuffer,
      originalName: params.fileName,
      mimeType: params.mimeType,
    });

    item.rider.drivingLicenseDocumentUrl = uploadResult.publicUrl;
    item.rider.drivingLicenseDocumentKey = uploadResult.storageKey;
    item.rider.verificationStatus = 'VERIFIED'; // Auto-certified for dev/test operational velocity
    item.rider.verifiedAt = new Date();

    this.updateGroupStatusBasedOnVerification(group);
    await group.save();
    const populatedGroup = await GroupBooking.findById(group._id).populate('vehicles.vehicleId').lean();

    return {
      documentUrl: uploadResult.publicUrl,
      storageKey: uploadResult.storageKey,
      group: (populatedGroup as any) || group,
    };
  }

  /**
   * Recalculates group aggregate pricing
   */
  public static recalculateGroupPricing(group: IGroupBooking): void {
    let totalBase = 0;
    let totalDelivery = 0;
    let totalPlatform = 0;
    let totalTaxes = 0;
    let totalDeposit = 0;
    let grandTotal = 0;

    for (const item of group.vehicles) {
      totalBase += item.pricing.basePrice;
      totalDelivery += item.pricing.deliveryCharge;
      totalPlatform += item.pricing.platformFee;
      totalTaxes += item.pricing.taxes;
      totalDeposit += item.pricing.securityDeposit;
      grandTotal += item.pricing.totalPayable;
    }

    group.pricingSummary = {
      totalBasePrice: totalBase,
      totalDeliveryCharge: totalDelivery,
      totalPlatformFee: totalPlatform,
      totalTaxes: totalTaxes,
      totalSecurityDeposit: totalDeposit,
      grandTotal,
    };
  }

  /**
   * Updates group status based on rider DL verifications
   */
  public static updateGroupStatusBasedOnVerification(group: IGroupBooking): void {
    if (group.vehicles.length === 0) return;

    const allVerified = group.vehicles.every(
      (v) =>
        v.rider.fullName &&
        v.rider.drivingLicenseNumber &&
        v.rider.drivingLicenseDocumentUrl &&
        v.rider.verificationStatus === 'VERIFIED'
    );

    if (allVerified) {
      group.bookingStatus = 'VERIFIED';
    } else {
      group.bookingStatus = 'PENDING_VERIFICATION';
    }
  }

  /**
   * Validate that 100% of riders are verified
   */
  public static validateGroupVerificationState(group: IGroupBooking): {
    valid: boolean;
    missingRiders: number;
    unverifiedVehicles: string[];
  } {
    const unverifiedVehicles: string[] = [];
    let missingRiders = 0;

    for (const item of group.vehicles) {
      if (
        !item.rider.fullName ||
        !item.rider.drivingLicenseNumber ||
        !item.rider.drivingLicenseDocumentUrl ||
        item.rider.verificationStatus !== 'VERIFIED'
      ) {
        missingRiders++;
        unverifiedVehicles.push(item.vehicleId.toString());
      }
    }

    return {
      valid: missingRiders === 0,
      missingRiders,
      unverifiedVehicles,
    };
  }

  /**
   * Acquire atomic distributed reservation locks for ALL vehicles in the group
   */
  public static async acquireAtomicGroupLocks(group: IGroupBooking): Promise<{
    success: boolean;
    reservations: any[];
    reason?: string;
  }> {
    const acquiredReservations: any[] = [];

    for (const item of group.vehicles) {
      const reservation = await AvailabilityService.acquireDistributedReservation({
        vehicleId: item.vehicleId.toString(),
        userId: group.customerId.toString(),
        pickupDateTime: group.pickupDateTime,
        returnDateTime: group.returnDateTime,
      });

      if (!reservation.acquired || !reservation.reservation) {
        // Rollback all acquired locks in this attempt
        for (const acq of acquiredReservations) {
          try {
            await AvailabilityService.releaseReservationLock(
              acq.vehicleId.toString(),
              group.customerId.toString()
            );
          } catch (e) {
            console.error('Lock rollback error:', e);
          }
        }
        return {
          success: false,
          reservations: [],
          reason: `Vehicle ${item.vehicleId} is no longer available. All reservation locks rolled back.`,
        };
      }

      acquiredReservations.push(reservation.reservation);
    }

    return {
      success: true,
      reservations: acquiredReservations,
    };
  }

  /**
   * Create Razorpay order for the total aggregate group amount
   */
  public static async createRazorpayGroupOrder(groupId: string, customerId: string): Promise<{
    groupBooking: IGroupBooking;
    razorpayOrderId: string;
    amount: number;
    currency: string;
  }> {
    await connectToDatabase();

    const group = await GroupBooking.findOne({
      groupBookingId: groupId,
      customerId: new mongoose.Types.ObjectId(customerId),
    });

    if (!group) {
      throw new Error('Group booking not found.');
    }

    const verification = this.validateGroupVerificationState(group);
    if (!verification.valid) {
      throw new Error(`Please complete driving license verification for all ${group.vehicles.length} riders before payment.`);
    }

    // Atomic reservation locking across all vehicles
    const lockResult = await this.acquireAtomicGroupLocks(group);
    if (!lockResult.success) {
      throw new Error(lockResult.reason || 'One or more selected vehicles are no longer available.');
    }

    const order = await PaymentService.createOrder({
      amount: group.pricingSummary.grandTotal,
      currency: 'INR',
      receipt: group.groupBookingId,
      notes: {
        groupBookingId: group.groupBookingId,
        customerId: group.customerId.toString(),
        vehicleCount: group.vehicles.length.toString(),
      },
    });

    group.razorpayOrderId = order.id;
    group.paymentStatus = 'PENDING';
    await group.save();

    return {
      groupBooking: group,
      razorpayOrderId: order.id,
      amount: group.pricingSummary.grandTotal,
      currency: 'INR',
    };
  }

  /**
   * Confirm group booking after payment verification
   */
  public static async confirmGroupBooking(params: {
    groupId: string;
    customerId: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }): Promise<{ group: IGroupBooking; subBookings: IBooking[] }> {
    await connectToDatabase();

    const group = await GroupBooking.findOne({
      groupBookingId: params.groupId,
      customerId: new mongoose.Types.ObjectId(params.customerId),
    });

    if (!group) {
      throw new Error('Group booking not found.');
    }

    // Verify signature
    const isValidSignature = PaymentService.verifyPaymentSignature({
      razorpayOrderId: params.razorpayOrderId,
      razorpayPaymentId: params.razorpayPaymentId,
      razorpaySignature: params.razorpaySignature,
    });

    if (!isValidSignature) {
      group.paymentStatus = 'FAILED';
      await group.save();
      throw new Error('Invalid payment signature. Payment verification failed.');
    }

    // Idempotency check: if already confirmed, return existing subBookings
    if (group.bookingStatus === 'CONFIRMED' && group.paymentStatus === 'PAID') {
      const existingSubBookings = await Booking.find({ groupBookingId: group.groupBookingId });
      return { group, subBookings: existingSubBookings };
    }

    group.paymentStatus = 'PAID';
    group.bookingStatus = 'CONFIRMED';
    group.razorpayPaymentId = params.razorpayPaymentId;

    const customer = await User.findById(group.customerId).lean();
    const createdSubBookings: IBooking[] = [];

    for (const item of group.vehicles) {
      const vehicle = await Vehicle.findById(item.vehicleId).lean();
      if (!vehicle) continue;

      const bookingNumber = generateBookingNumber();
      const subBooking = await Booking.create({
        bookingNumber,
        groupBookingId: group.groupBookingId,
        customerId: group.customerId,
        vendorId: item.vendorId,
        vehicleId: item.vehicleId,
        destinationId: vehicle.destinationId,
        pickupDateTime: group.pickupDateTime,
        returnDateTime: group.returnDateTime,
        pickupType: group.pickupType,
        pickupLocation: group.pickupLocation,
        dropoffLocation: group.dropoffLocation,
        deliveryLocation: group.deliveryLocation || undefined,
        rentalDurationDays: Math.ceil(
          (new Date(group.returnDateTime).getTime() - new Date(group.pickupDateTime).getTime()) /
            (1000 * 3600 * 24)
        ),
        rentalDurationHours: 24,
        basePrice: item.pricing.basePrice,
        deliveryCharge: item.pricing.deliveryCharge,
        platformFee: item.pricing.platformFee,
        taxes: item.pricing.taxes,
        securityDeposit: item.pricing.securityDeposit,
        totalPayable: item.pricing.totalPayable,
        depositStatus: 'HELD',
        bookingStatus: 'CONFIRMED',
        paymentStatus: 'PAID',
        kycVerified: true,
        customerDetails: {
          fullName: customer?.name || item.rider.fullName,
          phone: customer?.phone || '9999999999',
          email: customer?.email || 'customer@ridesetu.com',
          drivingLicenseNumber: item.rider.drivingLicenseNumber,
        },
        riderDetails: {
          fullName: item.rider.fullName,
          drivingLicenseNumber: item.rider.drivingLicenseNumber,
          drivingLicenseDocumentUrl: item.rider.drivingLicenseDocumentUrl,
          drivingLicenseDocumentKey: item.rider.drivingLicenseDocumentKey,
          verificationStatus: 'VERIFIED',
        },
      });

      item.bookingId = subBooking._id;
      createdSubBookings.push(subBooking);

      // Trigger vendor notification
      try {
        await NotificationService.sendNotification({
          userId: item.vendorId.toString(),
          recipientRole: 'VENDOR',
          type: 'BOOKING_CONFIRMED',
          title: 'New Booking Vehicle Assigned',
          message: `Vehicle ${vehicle.brand} ${vehicle.model} booked (Booking #${bookingNumber}). Rider: ${item.rider.fullName}.`,
          metadata: { bookingId: subBooking._id.toString(), groupBookingId: group.groupBookingId },
        });
      } catch (e) {
        console.error('Vendor notification error:', e);
      }
    }

    // Trigger Customer Notifications for Payment Success & Booking Confirmation
    try {
      await NotificationService.notifyPaymentSuccess({
        userId: group.customerId.toString(),
        bookingId: createdSubBookings[0]?._id?.toString() || group.groupBookingId,
        amount: group.pricingSummary.grandTotal,
        customerEmail: customer?.email,
      });

      await NotificationService.notifyBookingConfirmed({
        userId: group.customerId.toString(),
        bookingId: createdSubBookings[0]?._id?.toString() || group.groupBookingId,
        bookingNumber: group.groupBookingId,
        vehicleName: `${group.vehicles.length} Vehicle(s)`,
        customerEmail: customer?.email,
      });
    } catch (custNotifErr) {
      console.error('Customer notification error:', custNotifErr);
    }

    await group.save();
    return { group, subBookings: createdSubBookings };
  }
}
