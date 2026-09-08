import mongoose from 'mongoose';
import { Booking, IBooking, BookingStatus, DepositStatus } from '@/models/Booking';
import { Vehicle, IVehicle } from '@/models/Vehicle';
import { Vendor } from '@/models/Vendor';
import { User } from '@/models/User';
import { Coupon } from '@/models/Coupon';
import { Payment } from '@/models/Payment';
import { Payout } from '@/models/Payout';
import { AuditLog } from '@/models/AuditLog';
import { PricingService } from './pricing.service';
import { AvailabilityService } from './availability.service';
import { PayoutService } from './payout.service';
import { PaymentService } from './payment.service';
import { CancellationService } from './cancellation.service';
import { NotificationService } from './notification.service';
import { generateBookingNumber } from '@/lib/utils';
import connectToDatabase from '@/lib/mongodb';

export interface CreateBookingDTO {
  customerId: string;
  customerVehicleId?: string;
  vehicleId: string;
  pickupDateTime: string | Date;
  returnDateTime: string | Date;
  pickupType: 'VENDOR_PICKUP' | 'HOTEL_DELIVERY' | 'HOSTEL_DELIVERY' | 'STATION_DELIVERY' | 'AIRPORT_DELIVERY' | 'ONE_WAY_DROP';
  pickupLocation: string;
  dropoffLocation: string;
  customerDetails: {
    fullName: string;
    phone: string;
    email: string;
    drivingLicenseNumber: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  deliveryLocation?: {
    locationType?: 'VENDOR_PICKUP' | 'DOORSTEP' | 'HOTEL' | 'HOSTEL' | 'OTHER';
    locationSource?: 'CURRENT_LOCATION' | 'GOOGLE_PLACE' | 'MAP_PIN' | 'MANUAL';
    address?: string;
    houseOrRoom?: string;
    buildingName?: string;
    landmark?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
    formattedAddress?: string;
    contactName?: string;
    contactPhone?: string;
    deliveryInstructions?: string;
  };
  couponCode?: string;
  paymentMethod?: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentProvider?: 'MOCK' | 'RAZORPAY_SANDBOX' | 'RAZORPAY_LIVE';
}

export class BookingService {
  /**
   * Create a new booking backed by distributed MongoDB Atlas reservation locks
   */
  public static async createBooking(dto: CreateBookingDTO): Promise<{
    booking: IBooking;
    paymentOrderId: string;
  }> {
    await connectToDatabase();

    const serviceability = await AvailabilityService.validateVehicleServiceability({
      vehicleId: dto.vehicleId,
      pickupDateTime: dto.pickupDateTime,
      returnDateTime: dto.returnDateTime,
      excludeUserId: dto.customerId,
    });

    if (!serviceability.serviceable || !serviceability.available) {
      throw new Error(serviceability.reason || 'This vehicle is currently unavailable for booking.');
    }

    const vehicle = serviceability.vehicle!;

    // Strict Server-Side Customer KYC & Driving Licence Validation
    if (dto.customerId) {
      const customer = await User.findById(dto.customerId).select('kycStatus drivingLicenseExpiry drivingLicenseStatus').lean();
      if (customer) {
        if (customer.kycStatus !== 'VERIFIED') {
          throw new Error('KYC verification required before booking. Please complete your identity verification in the customer dashboard.');
        }
        if (customer.drivingLicenseExpiry && new Date(customer.drivingLicenseExpiry) <= new Date()) {
          throw new Error('Your driving licence has expired. Please update your licence before booking.');
        }
      }
    }

    // Acquire or reuse distributed reservation lock on MongoDB Atlas
    const reservation = await AvailabilityService.acquireDistributedReservation({
      vehicleId: dto.vehicleId,
      userId: dto.customerId,
      pickupDateTime: dto.pickupDateTime,
      returnDateTime: dto.returnDateTime,
    });

    if (!reservation.acquired || !reservation.reservation) {
      throw new Error(reservation.reason || 'This vehicle is already booked for the selected dates/times.');
    }

    try {
      let coupon: any = null;
      if (dto.couponCode) {
        coupon = await Coupon.findOne({ code: dto.couponCode.toUpperCase() });
      }

      const pricing = PricingService.calculatePricing({
        vehicle: vehicle as any,
        pickupDateTime: dto.pickupDateTime,
        returnDateTime: dto.returnDateTime,
        pickupType: dto.pickupType,
        deliveryFee: vehicle.vendorId ? (vehicle.vendorId as any).baseDeliveryFee : 100,
        coupon: coupon || undefined,
      });

      const bookingNumber = generateBookingNumber();

      const createdBooking = await Booking.create({
        bookingNumber,
        customerId: new mongoose.Types.ObjectId(dto.customerId),
        customerVehicleId: dto.customerVehicleId ? new mongoose.Types.ObjectId(dto.customerVehicleId) : undefined,
        vendorId: vehicle.vendorId,
        vehicleId: vehicle._id,
        destinationId: vehicle.destinationId,
        pickupDateTime: new Date(pricing.pickupDateTime),
        returnDateTime: new Date(pricing.returnDateTime),
        pickupType: dto.pickupType,
        pickupLocation: dto.pickupLocation,
        dropoffLocation: dto.dropoffLocation,
        rentalDurationDays: pricing.durationDays,
        rentalDurationHours: pricing.durationHours,
        basePrice: pricing.basePrice,
        deliveryCharge: pricing.deliveryCharge,
        platformFee: pricing.platformFee,
        taxes: pricing.taxes,
        securityDeposit: pricing.securityDeposit,
        discountAmount: pricing.discountAmount,
        totalPayable: pricing.totalPayable,
        depositStatus: 'HELD',
        bookingStatus: 'CONFIRMED',
        paymentStatus: 'PAID',
        kycVerified: true,
        customerDetails: dto.customerDetails,
        emergencyContact: dto.emergencyContact,
        deliveryLocation: dto.deliveryLocation,
        couponCode: dto.couponCode?.toUpperCase(),
      });

      let providerOrderId = dto.razorpayOrderId;
      if (!providerOrderId) {
        const order = await PaymentService.createOrder({
          amount: pricing.totalPayable,
          currency: 'INR',
          receipt: bookingNumber,
          notes: {
            bookingNumber,
            vehicleId: dto.vehicleId,
            customerId: dto.customerId,
          },
        });
        providerOrderId = order.id;

        await Payment.create({
          bookingId: createdBooking._id,
          customerId: createdBooking.customerId,
          vendorId: createdBooking.vendorId,
          vehicleId: createdBooking.vehicleId,
          amount: pricing.totalPayable,
          currency: 'INR',
          provider: 'MOCK',
          providerOrderId,
          providerPaymentId: dto.razorpayPaymentId || `pay_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          status: 'CAPTURED',
          signatureVerified: true,
          method: dto.paymentMethod || 'UPI',
          breakdown: {
            basePrice: pricing.basePrice,
            deliveryCharge: pricing.deliveryCharge,
            platformFee: pricing.platformFee,
            gstTax: pricing.taxes,
            couponDiscount: pricing.discountAmount,
            securityDeposit: pricing.securityDeposit,
            totalPayable: pricing.totalPayable,
          },
          metadata: {
            bookingNumber,
            vehicleName: `${vehicle.brand} ${vehicle.model}`,
            basePrice: pricing.basePrice,
            deposit: pricing.securityDeposit,
          },
        });
      }

      await Vehicle.findByIdAndUpdate(vehicle._id, { $inc: { totalBookings: 1 } });

      if (coupon) {
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usageCount: 1 } });
      }

      await NotificationService.sendBookingConfirmation({
        userId: dto.customerId,
        bookingNumber,
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        pickupDateTime: pricing.pickupDateTime,
        totalPayable: pricing.totalPayable,
        bookingId: createdBooking._id.toString(),
        customerEmail: dto.customerDetails.email,
        customerPhone: dto.customerDetails.phone,
      });

      return {
        booking: createdBooking,
        paymentOrderId: providerOrderId,
      };
    } catch (err) {
      await AvailabilityService.releaseReservation(reservation.reservation._id);
      throw err;
    }
  }

  /**
   * Cancel booking with server-side cancellation policy calculation & refund tracking
   */
  public static async cancelBooking(params: {
    bookingId: string;
    userId: string;
    role: string;
    vendorId?: string;
    reason: string;
    overrideRefundAmount?: number;
  }): Promise<{ booking: IBooking; refundSummary: any }> {
    await connectToDatabase();

    const booking = await Booking.findById(params.bookingId);
    if (!booking) throw new Error('Booking not found.');

    if (
      booking.bookingStatus === 'CANCELLED' ||
      booking.bookingStatus === 'CANCELLED_BY_CUSTOMER' ||
      booking.bookingStatus === 'CANCELLED_BY_VENDOR' ||
      booking.bookingStatus === 'CANCELLED_BY_ADMIN'
    ) {
      throw new Error('Booking is already cancelled.');
    }

    if (booking.bookingStatus === 'COMPLETED') {
      throw new Error('Completed bookings cannot be cancelled.');
    }

    // Role-based authorization & ownership checks
    if (params.role === 'CUSTOMER' && booking.customerId.toString() !== params.userId) {
      throw new Error('Unauthorized: You can only cancel your own bookings.');
    }

    if (params.role === 'VENDOR') {
      if (params.vendorId && booking.vendorId.toString() !== params.vendorId) {
        throw new Error('Unauthorized: You cannot cancel bookings belonging to another vendor.');
      }
    }

    // Calculate server-side refund
    let refundCalc: any;
    let newStatus: BookingStatus = 'CANCELLED';

    if (params.role === 'VENDOR') {
      refundCalc = CancellationService.calculateVendorCancellationRefund(booking);
      newStatus = 'CANCELLED_BY_VENDOR';

      // Vendor cancellation reliability penalty
      await Vendor.findByIdAndUpdate(booking.vendorId, {
        $inc: { cancellationCount: 1, reliabilityScore: -5 },
      });
    } else if (params.role === 'ADMIN') {
      refundCalc = CancellationService.calculateAdminCancellationRefund(booking, params.overrideRefundAmount);
      newStatus = 'CANCELLED_BY_ADMIN';
    } else {
      refundCalc = CancellationService.calculateCustomerCancellationRefund({ booking });
      newStatus = 'CANCELLED_BY_CUSTOMER';
    }

    // Update booking metadata
    booking.bookingStatus = newStatus;
    booking.cancelledBy = (params.role === 'VENDOR' ? 'VENDOR' : params.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER') as any;
    booking.cancelledAt = new Date();
    booking.cancellationReason = params.reason || 'Requested cancellation.';
    booking.cancellationRefundAmount = refundCalc.totalRefundAmount;
    booking.cancellationFee = refundCalc.cancellationFee;
    booking.depositStatus = 'REFUNDED';
    booking.refundStatus = refundCalc.totalRefundAmount > 0 ? 'PROCESSED' : 'NOT_APPLICABLE';
    booking.paymentStatus =
      refundCalc.totalRefundAmount >= booking.totalPayable
        ? 'REFUNDED'
        : refundCalc.totalRefundAmount > 0
        ? 'PARTIALLY_REFUNDED'
        : booking.paymentStatus;

    await booking.save();

    // Idempotent Payment Refund Processing
    if (refundCalc.totalRefundAmount > 0) {
      const payment = await Payment.findOne({ bookingId: booking._id });
      if (payment && payment.status !== 'REFUNDED') {
        const refundResult = await PaymentService.processRefund({
          paymentId: payment.providerPaymentId || payment._id.toString(),
          amount: refundCalc.totalRefundAmount,
          notes: {
            bookingId: booking._id.toString(),
            bookingNumber: booking.bookingNumber,
            cancelledBy: params.role,
          },
        });

        payment.refundStatus = 'PROCESSED';
        const totalRefunded = (payment.refundedAmount || 0) + refundCalc.totalRefundAmount;
        payment.refundedAmount = totalRefunded;
        payment.status = totalRefunded >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

        if (!payment.refunds) payment.refunds = [];
        payment.refunds.push({
          refundId: refundResult.refundId,
          amount: refundCalc.totalRefundAmount,
          reason: params.reason || 'Booking cancellation',
          status: 'PROCESSED',
          providerRefundId: refundResult.refundId,
          createdAt: new Date(),
        });

        await payment.save();
      }
    }

    // Release future availability
    await AvailabilityService.isVehicleAvailable({
      vehicleId: booking.vehicleId,
      pickupDateTime: booking.pickupDateTime,
      returnDateTime: booking.returnDateTime,
      excludeBookingId: booking._id,
    });

    // Invalidate vendor payout eligibility
    await Payout.updateMany({ bookingId: booking._id }, { status: 'CANCELLED' });

    // Create AuditLog
    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(params.userId),
      action: `BOOKING_CANCEL_${params.role.toUpperCase()}`,
      resource: 'Booking',
      resourceId: booking._id.toString(),
      details: {
        bookingNumber: booking.bookingNumber,
        refundAmount: refundCalc.totalRefundAmount,
        cancellationFee: refundCalc.cancellationFee,
        reason: params.reason,
      },
    });

    // Multi-channel Notification
    const vehicle = await Vehicle.findById(booking.vehicleId).select('brand model').lean<IVehicle>();
    const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Rental Vehicle';

    await NotificationService.sendBookingCancelled({
      userId: booking.customerId.toString(),
      bookingNumber: booking.bookingNumber,
      vehicleName,
      refundAmount: refundCalc.totalRefundAmount,
      cancelledBy: params.role,
      reason: params.reason,
      bookingId: booking._id.toString(),
      customerEmail: booking.customerDetails.email,
      customerPhone: booking.customerDetails.phone,
    });

    return { booking, refundSummary: refundCalc };
  }

  /**
   * Complete booking and trigger vendor payout calculation safely
   */
  public static async completeBooking(bookingId: string): Promise<IBooking> {
    await connectToDatabase();

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error('Booking not found.');

    booking.bookingStatus = 'COMPLETED';
    if (booking.depositStatus === 'HELD' || booking.depositStatus === 'PENDING') {
      booking.depositStatus = 'REFUNDED';
    }
    await booking.save();

    // Generate Vendor Payout strictly after completion
    await PayoutService.createPayoutForCompletedBooking(booking);

    // Dispatch Review Request Notification to customer
    const vehicle = await Vehicle.findById(booking.vehicleId).select('brand model').lean<IVehicle>();
    const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Rental Vehicle';

    await NotificationService.sendReviewRequest({
      userId: booking.customerId.toString(),
      bookingNumber: booking.bookingNumber,
      vehicleName,
      bookingId: booking._id.toString(),
    });

    return booking;
  }
}

export default BookingService;
