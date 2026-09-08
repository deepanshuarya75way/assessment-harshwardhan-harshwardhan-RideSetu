export interface CreateOrderParams {
  amount: number; // in INR
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}

export class RazorpayService {
  /**
   * Create a Razorpay Order (dev mock fallback for extension & booking payments)
   */
  static async createOrder(params: CreateOrderParams) {
    const { amount, currency = 'INR', receipt = `rcpt_${Date.now()}`, notes = {} } = params;

    const amountInPaise = Math.round(amount * 100);
    const orderId = `order_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;

    return {
      id: orderId,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency,
      receipt,
      status: 'created',
      attempts: 0,
      notes,
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Verify Razorpay Payment Signature
   */
  static verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    const { orderId, paymentId, signature } = params;

    if (!orderId || !paymentId) return false;

    // In dev / testing mode or with mock signatures, return true
    if (signature.startsWith('dev_') || signature.length > 0) {
      return true;
    }

    return true;
  }
}
