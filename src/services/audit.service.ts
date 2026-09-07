import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { AuditLog } from '@/models/AuditLog';

export type VendorAuditAction =
  | 'VEHICLE_CREATED'
  | 'VEHICLE_UPDATED'
  | 'VEHICLE_DEACTIVATED'
  | 'PRICE_UPDATED'
  | 'AVAILABILITY_CHANGED'
  | 'MAINTENANCE_STARTED'
  | 'MAINTENANCE_COMPLETED'
  | 'BUSINESS_PROFILE_UPDATED';

export class AuditLogService {
  public static async logVendorAction(params: {
    vendorId: string | mongoose.Types.ObjectId;
    userId: string | mongoose.Types.ObjectId;
    action: VendorAuditAction;
    entityId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
  }): Promise<boolean> {
    try {
      await connectToDatabase();
      await AuditLog.create({
        action: params.action,
        userId: new mongoose.Types.ObjectId(params.userId),
        userRole: 'VENDOR',
        resourceType: 'VENDOR_MANAGEMENT',
        resourceId: params.entityId || params.vendorId.toString(),
        details: {
          vendorId: params.vendorId.toString(),
          ...(params.details || {}),
        },
        ipAddress: params.ipAddress || '',
      });
      return true;
    } catch (err: any) {
      console.warn('[AuditLogService] Warning: Failed to record audit log:', err.message);
      return false;
    }
  }
}
