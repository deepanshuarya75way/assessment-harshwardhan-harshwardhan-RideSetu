import { BookingStatus } from '@/models/Booking';

export class BookingStateMachineService {
  private static ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_VENDOR', 'CANCELLED_BY_ADMIN'],
    CONFIRMED: ['PRE_PICKUP', 'READY_FOR_HANDOVER', 'HANDED_OVER', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_VENDOR', 'CANCELLED_BY_ADMIN'],
    PRE_PICKUP: ['READY_FOR_HANDOVER', 'HANDED_OVER', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_VENDOR', 'CANCELLED_BY_ADMIN'],
    READY_FOR_HANDOVER: ['HANDED_OVER', 'CANCELLED_BY_VENDOR', 'CANCELLED_BY_ADMIN'],
    HANDED_OVER: ['ACTIVE', 'CANCELLED_BY_ADMIN'],
    ACTIVE: ['RETURN_PENDING', 'RETURN_INSPECTION', 'COMPLETED', 'DISPUTED'],
    RETURN_PENDING: ['RETURN_INSPECTION', 'COMPLETED', 'DISPUTED'],
    RETURN_INSPECTION: ['COMPLETED', 'DISPUTED'],
    COMPLETED: [],
    CANCELLED: [],
    CANCELLED_BY_CUSTOMER: [],
    CANCELLED_BY_VENDOR: [],
    CANCELLED_BY_ADMIN: [],
    DISPUTED: ['COMPLETED'],
  };

  public static canTransition(currentStatus: BookingStatus, targetStatus: BookingStatus): boolean {
    if (currentStatus === targetStatus) return true;
    const allowed = this.ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  public static validateTransition(currentStatus: BookingStatus, targetStatus: BookingStatus): void {
    if (!this.canTransition(currentStatus, targetStatus)) {
      if (currentStatus === 'CONFIRMED' && targetStatus === 'ACTIVE') {
        throw new Error('Vehicle must undergo vendor handover inspection and customer confirmation before trip becomes ACTIVE.');
      }
      throw new Error(`Invalid state transition from "${currentStatus}" to "${targetStatus}".`);
    }
  }
}
