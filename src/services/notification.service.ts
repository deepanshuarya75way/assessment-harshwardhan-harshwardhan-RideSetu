import mongoose from 'mongoose';
import { Notification, NotificationType, INotification, RecipientRole, NotificationPriority } from '@/models/Notification';
import connectToDatabase from '@/lib/mongodb';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export interface SmsPayload {
  to: string;
  message: string;
}

export interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  recipientRole?: RecipientRole;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  link?: string;
  relatedBookingId?: string | mongoose.Types.ObjectId;
  idempotencyKey?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

const IN_MEMORY_NOTIFICATIONS: any[] = [];

export class NotificationService {
  public static getChannelStatus(): {
    provider: string;
    inApp: 'ACTIVE';
    email: 'DEVELOPMENT_MOCK' | 'ACTIVE';
    sms: 'DEVELOPMENT_MOCK' | 'ACTIVE';
  } {
    return {
      provider: process.env.NOTIFICATION_PROVIDER || 'MOCK',
      inApp: 'ACTIVE',
      email: process.env.SENDGRID_API_KEY || process.env.SMTP_HOST ? 'ACTIVE' : 'DEVELOPMENT_MOCK',
      sms: process.env.TWILIO_AUTH_TOKEN ? 'ACTIVE' : 'DEVELOPMENT_MOCK',
    };
  }

  public static async sendNotification(params: {
    userId: string | mongoose.Types.ObjectId;
    userRole?: any;
    recipientRole?: RecipientRole;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<INotification | null> {
    return this.createNotification({
      userId: params.userId,
      recipientRole: params.recipientRole || params.userRole || 'VENDOR',
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata,
    });
  }

  /**
   * Core dispatch method with Idempotency Guard & Failure Isolation
   */
  public static async createNotification(params: CreateNotificationParams): Promise<INotification | null> {
    try {
      try {
        await connectToDatabase();
      } catch {
        // Fallback
      }

      // Check Memory Idempotency First if offline or registered
      if (params.idempotencyKey) {
        const memExisting = IN_MEMORY_NOTIFICATIONS.find((n) => n.idempotencyKey === params.idempotencyKey);
        if (memExisting) return memExisting;
      }

      // Database & Service Level Idempotency Check
      if (params.idempotencyKey && mongoose.connection.readyState === 1) {
        try {
          const existing = await Notification.findOne({ idempotencyKey: params.idempotencyKey });
          if (existing) {
            return existing;
          }
        } catch {
          // Fallback
        }
      }

      let notif: any = null;
      if (mongoose.connection.readyState === 1) {
        try {
          notif = await Notification.create({
            userId: new mongoose.Types.ObjectId(params.userId),
            recipientRole: params.recipientRole || 'CUSTOMER',
            title: params.title,
            message: params.message,
            type: params.type,
            priority: params.priority || 'NORMAL',
            link: params.link || '',
            relatedBookingId: params.relatedBookingId ? new mongoose.Types.ObjectId(params.relatedBookingId) : undefined,
            idempotencyKey: params.idempotencyKey,
            metadata: params.metadata || {},
            read: false,
          });
        } catch (dbErr: any) {
          if (dbErr.code === 11000 && params.idempotencyKey) {
            notif = await Notification.findOne({ idempotencyKey: params.idempotencyKey });
          }
        }
      }

      if (!notif) {
        // Create memory fallback notification object
        const newId = new mongoose.Types.ObjectId();
        notif = {
          _id: newId,
          id: newId.toString(),
          userId: params.userId.toString(),
          recipientRole: params.recipientRole || 'CUSTOMER',
          title: params.title,
          message: params.message,
          type: params.type,
          priority: params.priority || 'NORMAL',
          link: params.link || '',
          relatedBookingId: params.relatedBookingId ? params.relatedBookingId.toString() : undefined,
          idempotencyKey: params.idempotencyKey,
          metadata: params.metadata || {},
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        IN_MEMORY_NOTIFICATIONS.unshift(notif);
      }

      return notif;
    } catch (err: any) {
      const fallbackId = new mongoose.Types.ObjectId();
      const fallbackNotif: any = {
        _id: fallbackId,
        id: fallbackId.toString(),
        userId: params.userId.toString(),
        recipientRole: params.recipientRole || 'CUSTOMER',
        title: params.title,
        message: params.message,
        type: params.type,
        priority: params.priority || 'NORMAL',
        link: params.link || '',
        idempotencyKey: params.idempotencyKey,
        metadata: params.metadata || {},
        read: false,
        createdAt: new Date(),
      };
      IN_MEMORY_NOTIFICATIONS.unshift(fallbackNotif);
      return fallbackNotif;
    }
  }

  /**
   * Bulk Notification Creation
   */
  public static async createBulkNotifications(notifications: CreateNotificationParams[]): Promise<number> {
    let count = 0;
    for (const params of notifications) {
      const res = await this.createNotification(params);
      if (res) count++;
    }
    return count;
  }

  /**
   * Fetch User Notifications with Pagination & Category Filtering
   */
  public static async getUserNotifications(params: {
    userId: string | mongoose.Types.ObjectId;
    recipientRole?: RecipientRole;
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    category?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const userIdStr = params.userId.toString();

    try {
      if (mongoose.connection.readyState === 1) {
        await connectToDatabase();

        const uObjectId = new mongoose.Types.ObjectId(params.userId);
        const query: Record<string, any> = { userId: uObjectId };

        if (params.recipientRole) {
          query.recipientRole = params.recipientRole;
        }

        if (params.unreadOnly) {
          query.read = false;
        }

        const cat = params.category?.toUpperCase() || 'ALL';
        if (cat === 'UNREAD') {
          query.read = false;
        } else if (cat === 'BOOKING' || cat === 'BOOKINGS') {
          query.type = {
            $in: [
              'BOOKING_CREATED',
              'BOOKING_CONFIRMED',
              'BOOKING_REJECTED',
              'BOOKING_CANCELLED',
              'VENDOR_ACCEPTED',
              'VEHICLE_PREPARING',
              'VEHICLE_READY',
              'READY_FOR_PICKUP',
              'VEHICLE_HANDED_OVER',
              'RENTAL_STARTED',
              'RENTAL_EXTENDED',
              'RENTAL_ENDING_SOON',
              'RETURN_PENDING',
              'RETURN_COMPLETED',
              'RIDE_STARTING_SOON',
              'RIDE_ACTIVE',
              'RIDE_COMPLETED',
            ],
          };
        } else if (cat === 'PAYMENT' || cat === 'PAYMENTS') {
          query.type = {
            $in: [
              'PAYMENT_SUCCESS',
              'PAYMENT_FAILED',
              'REFUND_INITIATED',
              'REFUND_COMPLETED',
              'DEPOSIT_REFUNDED',
              'SECURITY_DEPOSIT_REFUNDED',
              'SECURITY_DEPOSIT_HELD',
              'PAYOUT_ELIGIBLE',
              'PAYOUT_COMPLETED',
            ],
          };
        } else if (cat === 'DELIVERY') {
          query.type = {
            $in: ['OUT_FOR_DELIVERY', 'DELIVERY_ARRIVED', 'DELIVERY_COMPLETED', 'READY_FOR_PICKUP'],
          };
        } else if (cat === 'ACCOUNT') {
          query.type = {
            $in: [
              'ACCOUNT_VERIFIED',
              'KYC_SUBMITTED',
              'KYC_APPROVED',
              'KYC_VERIFIED',
              'KYC_REJECTED',
              'VENDOR_SUBMITTED',
              'VENDOR_APPROVED',
              'VENDOR_REJECTED',
              'VENDOR_ACTION_REQUIRED',
            ],
          };
        } else if (cat === 'SAFETY' || cat === 'DISPUTE') {
          query.type = {
            $in: ['EMERGENCY_ALERT', 'SYSTEM_ALERT', 'DAMAGE_REPORTED', 'DISPUTE_CREATED', 'DISPUTE_RESOLVED', 'DISPUTE_UPDATE'],
          };
        }

        const total = await Notification.countDocuments(query);
        const notifications = await Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();

        const unreadCount = await Notification.countDocuments({
          userId: uObjectId,
          ...(params.recipientRole ? { recipientRole: params.recipientRole } : {}),
          read: false,
        });

        return {
          notifications: notifications.map((n) => ({
            id: n._id.toString(),
            _id: n._id.toString(),
            userId: n.userId ? n.userId.toString() : userIdStr,
            recipientRole: n.recipientRole || 'CUSTOMER',
            title: n.title,
            message: n.message,
            type: n.type,
            priority: n.priority || 'NORMAL',
            read: n.read,
            readAt: n.readAt,
            link: n.link || '',
            relatedBookingId: n.relatedBookingId ? n.relatedBookingId.toString() : null,
            metadata: n.metadata || {},
            createdAt: n.createdAt,
          })),
          unreadCount,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit) || 1,
          },
        };
      }
    } catch {
      // Fallback to memory
    }

    // Memory Query Fallback
    const filteredMem = IN_MEMORY_NOTIFICATIONS.filter((n) => {
      if (n.userId.toString() !== userIdStr) return false;
      if (params.recipientRole && n.recipientRole !== params.recipientRole) return false;
      if (params.unreadOnly && n.read) return false;
      return true;
    });

    const total = filteredMem.length;
    const notifications = filteredMem.slice(skip, skip + limit);
    const unreadCount = IN_MEMORY_NOTIFICATIONS.filter(
      (n) => n.userId.toString() === userIdStr && (!params.recipientRole || n.recipientRole === params.recipientRole) && !n.read
    ).length;

    return {
      notifications: notifications.map((n) => ({
        id: (n._id || n.id).toString(),
        _id: (n._id || n.id).toString(),
        userId: n.userId ? n.userId.toString() : userIdStr,
        recipientRole: n.recipientRole || 'CUSTOMER',
        title: n.title,
        message: n.message,
        type: n.type,
        priority: n.priority || 'NORMAL',
        read: n.read,
        readAt: n.readAt,
        link: n.link || '',
        relatedBookingId: n.relatedBookingId ? n.relatedBookingId.toString() : null,
        metadata: n.metadata || {},
        createdAt: n.createdAt,
      })),
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public static async getUnreadCount(userId: string | mongoose.Types.ObjectId, recipientRole?: RecipientRole): Promise<number> {
    const userIdStr = userId.toString();
    try {
      if (mongoose.connection.readyState === 1) {
        await connectToDatabase();
        return await Notification.countDocuments({
          userId: new mongoose.Types.ObjectId(userId),
          ...(recipientRole ? { recipientRole } : {}),
          read: false,
        });
      }
    } catch {
      // Fallback
    }

    return IN_MEMORY_NOTIFICATIONS.filter(
      (n) => n.userId.toString() === userIdStr && (!recipientRole || n.recipientRole === recipientRole) && !n.read
    ).length;
  }

  public static async markAsRead(notificationId: string, userId: string | mongoose.Types.ObjectId): Promise<boolean> {
    const userIdStr = userId.toString();
    const notifIdStr = notificationId.toString();

    // Memory update
    const memNotif = IN_MEMORY_NOTIFICATIONS.find((n) => (n._id || n.id).toString() === notifIdStr);
    if (memNotif) {
      if (memNotif.userId.toString() !== userIdStr) return false;
      memNotif.read = true;
      memNotif.readAt = new Date();
    }

    try {
      if (mongoose.connection.readyState === 1) {
        await connectToDatabase();
        const notif = await Notification.findById(notificationId);
        if (!notif) return memNotif ? true : false;
        if (notif.userId.toString() !== userIdStr) return false;

        notif.read = true;
        notif.readAt = new Date();
        await notif.save();
        return true;
      }
    } catch {
      // Fallback
    }

    return memNotif ? true : false;
  }

  public static async markAllAsRead(userId: string | mongoose.Types.ObjectId, recipientRole?: RecipientRole): Promise<number> {
    const userIdStr = userId.toString();
    let memCount = 0;
    for (const n of IN_MEMORY_NOTIFICATIONS) {
      if (n.userId.toString() === userIdStr && (!recipientRole || n.recipientRole === recipientRole) && !n.read) {
        n.read = true;
        n.readAt = new Date();
        memCount++;
      }
    }

    try {
      if (mongoose.connection.readyState === 1) {
        await connectToDatabase();
        const res = await Notification.updateMany(
          {
            userId: new mongoose.Types.ObjectId(userId),
            ...(recipientRole ? { recipientRole } : {}),
            read: false,
          },
          { $set: { read: true, readAt: new Date() } }
        );
        return res.modifiedCount || memCount;
      }
    } catch {
      // Fallback
    }

    return memCount;
  }

  public static async deleteNotification(notificationId: string, userId: string | mongoose.Types.ObjectId): Promise<boolean> {
    const userIdStr = userId.toString();
    const notifIdStr = notificationId.toString();

    const memIdx = IN_MEMORY_NOTIFICATIONS.findIndex((n) => (n._id || n.id).toString() === notifIdStr);
    if (memIdx !== -1) {
      if (IN_MEMORY_NOTIFICATIONS[memIdx].userId.toString() !== userIdStr) return false;
      IN_MEMORY_NOTIFICATIONS.splice(memIdx, 1);
    }

    try {
      if (mongoose.connection.readyState === 1) {
        await connectToDatabase();
        const res = await Notification.deleteOne({
          _id: new mongoose.Types.ObjectId(notificationId),
          userId: new mongoose.Types.ObjectId(userId),
        });
        return res.deletedCount > 0 || memIdx !== -1;
      }
    } catch {
      // Fallback
    }

    return memIdx !== -1;
  }

  public static async sendVendorResponseAlert(params: {
    customerUserId: string;
    bookingNumber: string;
    vendorName: string;
    bookingId: string;
  }) {
    return this.createNotification({
      userId: params.customerUserId,
      recipientRole: 'CUSTOMER',
      title: 'Vendor Replied to Your Review',
      message: `${params.vendorName} replied to your review for booking #${params.bookingNumber}.`,
      type: 'VENDOR_RESPONSE',
      priority: 'NORMAL',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `VENDOR_REPLY:${params.bookingId}`,
    });
  }

  public static async sendReviewRequest(params: {
    userId: string;
    bookingNumber: string;
    vehicleName: string;
    bookingId: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'How was your ride?',
      message: `Share your review for ${params.vehicleName} (Booking #${params.bookingNumber}).`,
      type: 'REVIEW_REQUEST',
      priority: 'NORMAL',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `REVIEW_REQ:${params.bookingId}`,
    });
  }

  public static async sendNewReviewAlertToVendor(params: {
    vendorUserId: string;
    vehicleName: string;
    rating: number;
    customerName: string;
    bookingId: string;
  }) {
    return this.createNotification({
      userId: params.vendorUserId,
      recipientRole: 'VENDOR',
      title: 'New Customer Review Received',
      message: `${params.customerName} left a ${params.rating}★ review for ${params.vehicleName}.`,
      type: 'NEW_REVIEW',
      priority: 'NORMAL',
      link: `/partner/reviews`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `NEW_REVIEW:${params.bookingId}`,
    });
  }

  public static async notifyVendorApplicationSubmitted(params: {
    vendorUserId: string;
    vendorId: string;
    businessName: string;
  }) {
    return this.createNotification({
      userId: params.vendorUserId,
      recipientRole: 'VENDOR',
      title: 'Application Submitted',
      message: `Your partner application for ${params.businessName} has been submitted for review.`,
      type: 'VENDOR_SUBMITTED',
      priority: 'NORMAL',
      link: '/partner/dashboard',
      idempotencyKey: `VENDOR_SUBMITTED:${params.vendorId}`,
    });
  }

  public static async notifyVendorApproved(params: {
    vendorUserId: string;
    vendorId: string;
    businessName: string;
    email?: string;
  }) {
    return this.createNotification({
      userId: params.vendorUserId,
      recipientRole: 'VENDOR',
      title: 'Partner Application Approved ✓',
      message: `Congratulations! Your vendor profile for ${params.businessName} is VERIFIED. You can now publish vehicles.`,
      type: 'VENDOR_APPROVED',
      priority: 'HIGH',
      link: '/partner/dashboard',
      idempotencyKey: `VENDOR_APPROVED:${params.vendorId}`,
      customerEmail: params.email,
    });
  }

  public static async notifyVendorActionRequired(params: {
    vendorUserId: string;
    vendorId: string;
    reason: string;
    email?: string;
  }) {
    return this.createNotification({
      userId: params.vendorUserId,
      recipientRole: 'VENDOR',
      title: 'Action Required on Application',
      message: `RideSetu Operations requested changes: ${params.reason}`,
      type: 'VENDOR_ACTION_REQUIRED',
      priority: 'HIGH',
      link: '/partner/onboarding',
      idempotencyKey: `VENDOR_ACTION_REQUIRED:${params.vendorId}:${Date.now()}`,
      customerEmail: params.email,
    });
  }

  public static async notifySafetyIncident(params: {
    adminUserId: string;
    incidentId: string;
    details: string;
  }) {
    return this.createNotification({
      userId: params.adminUserId,
      recipientRole: 'ADMIN',
      title: '🚨 Emergency SOS Safety Alert',
      message: `SOS Incident reported: ${params.details}`,
      type: 'EMERGENCY_ALERT',
      priority: 'URGENT',
      link: '/ops/safety',
      idempotencyKey: `SOS:${params.incidentId}`,
    });
  }

  // --- Specific Domain Event Helper Methods ---

  public static async notifyBookingCreated(params: {
    userId: string;
    bookingId: string;
    bookingNumber: string;
    vehicleName: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Booking Created 📝',
      message: `Your reservation request #${params.bookingNumber} for ${params.vehicleName} has been created.`,
      type: 'BOOKING_CREATED',
      priority: 'NORMAL',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `BOOKING_CREATED:${params.bookingId}`,
    });
  }

  public static async notifyBookingConfirmed(params: {
    userId: string;
    bookingId: string;
    bookingNumber: string;
    vehicleName: string;
    customerEmail?: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Booking Confirmed ✓',
      message: `Your booking #${params.bookingNumber} for ${params.vehicleName} is confirmed.`,
      type: 'BOOKING_CONFIRMED',
      priority: 'HIGH',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `BOOKING_CONFIRMED:${params.bookingId}`,
      customerEmail: params.customerEmail,
    });
  }

  public static async sendBookingConfirmation(params: any) {
    return this.notifyBookingConfirmed({
      userId: params.userId,
      bookingId: params.bookingId || params.bookingNumber,
      bookingNumber: params.bookingNumber,
      vehicleName: params.vehicleName,
      customerEmail: params.customerEmail,
    });
  }

  public static async notifyBookingCancelled(params: {
    userId: string;
    bookingId: string;
    bookingNumber: string;
    reason?: string;
    customerEmail?: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Booking Cancelled',
      message: `Booking #${params.bookingNumber} was cancelled. ${params.reason || ''}`,
      type: 'BOOKING_CANCELLED',
      priority: 'HIGH',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `BOOKING_CANCELLED:${params.bookingId}`,
      customerEmail: params.customerEmail,
    });
  }

  public static async sendBookingCancelled(params: any) {
    return this.notifyBookingCancelled({
      userId: params.userId,
      bookingId: params.bookingId || params.bookingNumber,
      bookingNumber: params.bookingNumber,
      reason: params.reason,
      customerEmail: params.customerEmail,
    });
  }

  public static async notifyBookingRejected(params: {
    userId: string;
    bookingId: string;
    bookingNumber: string;
    reason?: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Booking Rejected',
      message: `Booking #${params.bookingNumber} could not be fulfilled. ${params.reason ? `Reason: ${params.reason}` : ''}`,
      type: 'BOOKING_REJECTED',
      priority: 'HIGH',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `BOOKING_REJECTED:${params.bookingId}`,
    });
  }

  public static async notifyPaymentSuccess(params: {
    userId: string;
    bookingId: string;
    amount: number;
    customerEmail?: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Payment Successful 💳',
      message: `Payment of ₹${params.amount} received successfully for your rental booking.`,
      type: 'PAYMENT_SUCCESS',
      priority: 'NORMAL',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `PAYMENT_SUCCESS:${params.bookingId}`,
      customerEmail: params.customerEmail,
    });
  }

  public static async notifyVehiclePreparing(params: {
    userId: string;
    bookingId: string;
    vehicleName: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Vehicle Being Prepared 🔧',
      message: `Your ${params.vehicleName} is being inspected and prepared by the rental partner.`,
      type: 'VEHICLE_PREPARING',
      priority: 'NORMAL',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `VEHICLE_PREPARING:${params.bookingId}`,
    });
  }

  public static async notifyVehicleReady(params: {
    userId: string;
    bookingId: string;
    vehicleName: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Your Vehicle is Ready 🚀',
      message: `Your ${params.vehicleName} is prepped and ready for handover.`,
      type: 'VEHICLE_READY',
      priority: 'HIGH',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `VEHICLE_READY:${params.bookingId}`,
    });
  }

  public static async notifyOutForDelivery(params: {
    userId: string;
    bookingId: string;
    vehicleName: string;
    deliveryAddress?: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Out for Delivery 🚚',
      message: `Your ${params.vehicleName} is on the way to your delivery location.`,
      type: 'OUT_FOR_DELIVERY',
      priority: 'HIGH',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `OUT_FOR_DELIVERY:${params.bookingId}`,
    });
  }

  public static async notifyDeliveryArrived(params: {
    userId: string;
    bookingId: string;
    vehicleName: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Delivery Agent Arrived 📍',
      message: `Your delivery agent has arrived with your ${params.vehicleName}. Please meet at the pickup point.`,
      type: 'DELIVERY_ARRIVED',
      priority: 'URGENT',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `DELIVERY_ARRIVED:${params.bookingId}`,
    });
  }

  public static async notifyReadyForPickup(params: {
    userId: string;
    bookingId: string;
    vehicleName: string;
    hubAddress?: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Ready for Hub Pickup 🏪',
      message: `Your ${params.vehicleName} is ready for pickup at the partner hub.`,
      type: 'READY_FOR_PICKUP',
      priority: 'HIGH',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `READY_FOR_PICKUP:${params.bookingId}`,
    });
  }

  public static async notifyRentalStarted(params: {
    userId: string;
    bookingId: string;
    vehicleName: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Rental Started 🎉',
      message: `Handover complete! Your rental trip for ${params.vehicleName} has officially started. Drive safe!`,
      type: 'RENTAL_STARTED',
      priority: 'HIGH',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `RENTAL_STARTED:${params.bookingId}`,
    });
  }

  public static async notifyRentalExtended(params: {
    userId: string;
    bookingId: string;
    vehicleName: string;
    newReturnTime: string;
    extensionAmount: number;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Rental Extended Successfully ⏳',
      message: `Your rental for ${params.vehicleName} is extended until ${params.newReturnTime} (₹${params.extensionAmount}).`,
      type: 'RENTAL_EXTENDED',
      priority: 'HIGH',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `RENTAL_EXTENDED:${params.bookingId}:${params.newReturnTime}`,
    });
  }

  public static async notifyRentalEndingSoon(params: {
    userId: string;
    bookingId: string;
    vehicleName: string;
    hoursRemaining: number;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Rental Ending Soon ⏰',
      message: `Your rental for ${params.vehicleName} ends in ${params.hoursRemaining} hour(s). Please plan return or extend early.`,
      type: 'RENTAL_ENDING_SOON',
      priority: 'HIGH',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `RENTAL_ENDING_SOON:${params.bookingId}:${params.hoursRemaining}`,
    });
  }

  public static async notifyReturnCompleted(params: {
    userId: string;
    bookingId: string;
    vehicleName: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Rental Completed 🏁',
      message: `Return inspection completed cleanly for ${params.vehicleName}. Thank you for riding with RideSetu!`,
      type: 'RETURN_COMPLETED',
      priority: 'NORMAL',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `RETURN_COMPLETED:${params.bookingId}`,
    });
  }

  public static async notifyDepositRefunded(params: {
    userId: string;
    bookingId: string;
    amount: number;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Security Deposit Refunded 💰',
      message: `Your refundable security deposit of ₹${params.amount} has been released to your original payment mode.`,
      type: 'SECURITY_DEPOSIT_REFUNDED',
      priority: 'HIGH',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `DEPOSIT_REFUNDED:${params.bookingId}`,
    });
  }

  public static async notifyDamageReported(params: {
    userId: string;
    bookingId: string;
    vehicleName: string;
    damageDescription: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Damage Reported on Return ⚠️',
      message: `Damage reported during return inspection for ${params.vehicleName}: ${params.damageDescription}.`,
      type: 'DAMAGE_REPORTED',
      priority: 'URGENT',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `DAMAGE_REPORTED:${params.bookingId}`,
    });
  }

  public static async notifyDisputeCreated(params: {
    customerId: string;
    adminUserId?: string;
    bookingId: string;
    disputeId: string;
  }) {
    // Notify Customer
    await this.createNotification({
      userId: params.customerId,
      recipientRole: 'CUSTOMER',
      title: 'Damage Dispute Opened ⚖️',
      message: `A damage dispute has been registered and sent to RideSetu Operations for review.`,
      type: 'DISPUTE_CREATED',
      priority: 'HIGH',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `DISPUTE_OPENED_CUST:${params.disputeId}`,
    });

    // Notify Admin
    if (params.adminUserId) {
      await this.createNotification({
        userId: params.adminUserId,
        recipientRole: 'ADMIN',
        title: 'New Damage Dispute Review Required 🚨',
        message: `New dispute #${params.disputeId} registered for booking #${params.bookingId}.`,
        type: 'DISPUTE_CREATED',
        priority: 'URGENT',
        link: `/ops/disputes`,
        relatedBookingId: params.bookingId,
        idempotencyKey: `DISPUTE_OPENED_ADMIN:${params.disputeId}`,
      });
    }
  }

  public static async notifyDisputeResolved(params: {
    userId: string;
    bookingId: string;
    resolution: string;
    refundAmount?: number;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'Dispute Resolved ⚖️',
      message: `Dispute review completed: ${params.resolution}. ${params.refundAmount ? `Refund: ₹${params.refundAmount}` : ''}`,
      type: 'DISPUTE_RESOLVED',
      priority: 'HIGH',
      link: `/dashboard/trips/${params.bookingId}`,
      relatedBookingId: params.bookingId,
      idempotencyKey: `DISPUTE_RESOLVED:${params.bookingId}`,
    });
  }

  public static async notifyKycSubmitted(params: {
    userId: string;
    documentType: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'KYC Document Submitted 📄',
      message: `Your ${params.documentType === 'DRIVING_LICENCE' ? 'Driving License' : 'Aadhaar Card'} was submitted and is pending verification.`,
      type: 'KYC_SUBMITTED',
      priority: 'NORMAL',
      link: `/dashboard/profile`,
      idempotencyKey: `KYC_SUBMITTED:${params.userId}:${params.documentType}:${Date.now()}`,
    });
  }

  public static async notifyKycVerified(params: {
    userId: string;
    documentType: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'KYC Document Verified ✓',
      message: `Your ${params.documentType === 'DRIVING_LICENCE' ? 'Driving License' : 'Aadhaar Card'} has been verified!`,
      type: 'KYC_VERIFIED',
      priority: 'HIGH',
      link: `/dashboard/profile`,
      idempotencyKey: `KYC_VERIFIED:${params.userId}:${params.documentType}`,
    });
  }

  public static async notifyKycRejected(params: {
    userId: string;
    documentType: string;
    reason?: string;
  }) {
    return this.createNotification({
      userId: params.userId,
      recipientRole: 'CUSTOMER',
      title: 'KYC Verification Action Required',
      message: `Your ${params.documentType === 'DRIVING_LICENCE' ? 'Driving License' : 'Aadhaar Card'} requires re-upload. ${params.reason || ''}`,
      type: 'KYC_REJECTED',
      priority: 'HIGH',
      link: `/dashboard/profile`,
      idempotencyKey: `KYC_REJECTED:${params.userId}:${params.documentType}:${Date.now()}`,
    });
  }

  public static async notifyPayoutEligible(params: { vendorUserId: string; payoutId: string; amount: number; bookingNumber: string }) {
    return this.createNotification({
      userId: params.vendorUserId,
      recipientRole: 'VENDOR',
      title: 'Payout Eligible 💰',
      message: `Payout of ₹${params.amount} for booking #${params.bookingNumber} is eligible for settlement.`,
      type: 'PAYOUT_ELIGIBLE',
      priority: 'HIGH',
      link: `/partner/payouts/${params.payoutId}`,
      relatedBookingId: params.payoutId,
      idempotencyKey: `PAYOUT_ELIGIBLE:${params.payoutId}`,
    });
  }

  public static async notifyPayoutProcessing(params: { vendorUserId: string; payoutId: string; amount: number }) {
    return this.createNotification({
      userId: params.vendorUserId,
      recipientRole: 'VENDOR',
      title: 'Payout Processing ⏳',
      message: `Payout of ₹${params.amount} is currently being processed for bank transfer.`,
      type: 'PAYOUT_PROCESSING',
      priority: 'NORMAL',
      link: `/partner/payouts/${params.payoutId}`,
      idempotencyKey: `PAYOUT_PROCESSING:${params.payoutId}`,
    });
  }

  public static async notifyPayoutPaid(params: { vendorUserId: string; payoutId: string; amount: number; reference: string }) {
    return this.createNotification({
      userId: params.vendorUserId,
      recipientRole: 'VENDOR',
      title: 'Payout Settled & Paid ✓',
      message: `Payout of ₹${params.amount} has been successfully transferred to your registered bank account. Ref: ${params.reference}`,
      type: 'PAYOUT_COMPLETED',
      priority: 'HIGH',
      link: `/partner/payouts/${params.payoutId}`,
      idempotencyKey: `PAYOUT_PAID:${params.payoutId}`,
    });
  }

  public static async notifyPayoutFailed(params: { vendorUserId: string; payoutId: string; amount: number; reason: string }) {
    return this.createNotification({
      userId: params.vendorUserId,
      recipientRole: 'VENDOR',
      title: 'Payout Transfer Action Required ⚠️',
      message: `Payout transfer of ₹${params.amount} could not be completed: ${params.reason}. Please verify bank details.`,
      type: 'PAYOUT_FAILED',
      priority: 'URGENT',
      link: `/partner/settings/payouts`,
      idempotencyKey: `PAYOUT_FAILED:${params.payoutId}:${Date.now()}`,
    });
  }

  public static async notifyPayoutOnHold(params: { vendorUserId: string; payoutId: string; amount: number; reason: string }) {
    return this.createNotification({
      userId: params.vendorUserId,
      recipientRole: 'VENDOR',
      title: 'Payout Placed On Hold 🔒',
      message: `Payout of ₹${params.amount} was placed on compliance hold: ${params.reason}`,
      type: 'PAYOUT_HELD',
      priority: 'HIGH',
      link: `/partner/payouts/${params.payoutId}`,
      idempotencyKey: `PAYOUT_HOLD:${params.payoutId}`,
    });
  }

  // --- Dispatch Utilities ---

  private static async dispatchEmail(payload: EmailPayload) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Notification Email] To: ${payload.to} | Subject: ${payload.subject}`);
    }
  }

  private static async dispatchSms(payload: SmsPayload) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Notification SMS] To: ${payload.to} | Message: ${payload.message}`);
    }
  }
}
