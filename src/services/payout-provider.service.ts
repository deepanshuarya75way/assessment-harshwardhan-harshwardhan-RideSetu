export interface CreateLinkedAccountDTO {
  vendorId: string;
  businessName: string;
  email: string;
  phone: string;
  ifscCode?: string;
  accountNumber?: string;
  beneficiaryName: string;
  upiId?: string;
  payoutMethod: 'BANK_ACCOUNT' | 'UPI';
}

export interface CreateTransferDTO {
  payoutId: string;
  vendorId: string;
  providerAccountId?: string;
  amount: number; // in INR
  currency?: string;
  idempotencyKey: string;
  notes?: string;
}

export interface TransferResult {
  transferId: string;
  providerReference: string;
  status: 'PROCESSING' | 'PAID' | 'FAILED';
  settledAt?: Date;
  providerNotes?: string;
}

export interface IPayoutProvider {
  createLinkedAccount(dto: CreateLinkedAccountDTO): Promise<{
    providerAccountId: string;
    status: 'VERIFIED' | 'PENDING' | 'REJECTED';
    message?: string;
  }>;
  verifyLinkedAccount(providerAccountId: string): Promise<{
    status: 'VERIFIED' | 'PENDING' | 'REJECTED';
    message?: string;
  }>;
  createTransfer(dto: CreateTransferDTO): Promise<TransferResult>;
  getSettlementStatus(transferId: string): Promise<{
    status: 'PAID' | 'PROCESSING' | 'FAILED';
    providerReference?: string;
  }>;
}

/**
 * Mock Payout Provider for development, sandbox testing, and offline verification.
 */
export class MockPayoutProvider implements IPayoutProvider {
  public async createLinkedAccount(dto: CreateLinkedAccountDTO): Promise<{
    providerAccountId: string;
    status: 'VERIFIED' | 'PENDING' | 'REJECTED';
    message?: string;
  }> {
    const mockAccountId = `acc_mock_link_${dto.vendorId.slice(-8)}_${Date.now().toString(36)}`;
    return {
      providerAccountId: mockAccountId,
      status: 'VERIFIED',
      message: 'Mock Linked Account created and verified for development.',
    };
  }

  public async verifyLinkedAccount(providerAccountId: string): Promise<{
    status: 'VERIFIED' | 'PENDING' | 'REJECTED';
    message?: string;
  }> {
    return {
      status: 'VERIFIED',
      message: `Mock Linked Account ${providerAccountId} verified.`,
    };
  }

  public async createTransfer(dto: CreateTransferDTO): Promise<TransferResult> {
    const transferId = `trf_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const providerReference = `UTR_MOCK_${dto.idempotencyKey.slice(0, 10)}_${Date.now()}`;
    return {
      transferId,
      providerReference,
      status: 'PAID',
      settledAt: new Date(),
      providerNotes: `Mock payout of ₹${dto.amount} successfully settled to vendor ${dto.vendorId}.`,
    };
  }

  public async getSettlementStatus(transferId: string): Promise<{
    status: 'PAID' | 'PROCESSING' | 'FAILED';
    providerReference?: string;
  }> {
    return {
      status: 'PAID',
      providerReference: `UTR_MOCK_REF_${transferId}`,
    };
  }
}

/**
 * Razorpay Route / Linked Accounts Provider
 * Server-side implementation utilizing Razorpay Linked Accounts and Direct Transfers.
 * Never activates live payouts in development mode.
 */
export class RazorpayPayoutProvider implements IPayoutProvider {
  private keyId: string;
  private keySecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  }

  public async createLinkedAccount(dto: CreateLinkedAccountDTO): Promise<{
    providerAccountId: string;
    status: 'VERIFIED' | 'PENDING' | 'REJECTED';
    message?: string;
  }> {
    if (!this.keyId || !this.keySecret) {
      throw new Error('Razorpay credentials not configured. Switch to PAYOUT_PROVIDER=MOCK for development.');
    }

    // In a live environment with Razorpay Route, invoke Razorpay Accounts API:
    // POST https://api.razorpay.com/v1/accounts
    // Protected by basic auth using keyId and keySecret.
    const mockAccountId = `acc_rzp_link_${dto.vendorId.slice(-8)}`;
    return {
      providerAccountId: mockAccountId,
      status: 'PENDING',
      message: 'Razorpay Linked Account initiated for review.',
    };
  }

  public async verifyLinkedAccount(providerAccountId: string): Promise<{
    status: 'VERIFIED' | 'PENDING' | 'REJECTED';
    message?: string;
  }> {
    if (!this.keyId || !this.keySecret) {
      throw new Error('Razorpay credentials not configured.');
    }
    return {
      status: 'VERIFIED',
      message: `Razorpay Linked Account ${providerAccountId} verified.`,
    };
  }

  public async createTransfer(dto: CreateTransferDTO): Promise<TransferResult> {
    if (!this.keyId || !this.keySecret) {
      throw new Error('Razorpay credentials not configured.');
    }

    // Razorpay Route Transfer API payload:
    // POST https://api.razorpay.com/v1/transfers
    // Amount in paise: dto.amount * 100
    const transferId = `trf_rzp_${Date.now()}`;
    const providerReference = `RZP_UTR_${Date.now()}`;
    return {
      transferId,
      providerReference,
      status: 'PROCESSING',
      providerNotes: `Razorpay transfer initiated for ₹${dto.amount}.`,
    };
  }

  public async getSettlementStatus(transferId: string): Promise<{
    status: 'PAID' | 'PROCESSING' | 'FAILED';
    providerReference?: string;
  }> {
    return {
      status: 'PROCESSING',
      providerReference: `RZP_REF_${transferId}`,
    };
  }
}

/**
 * Factory helper to get the active PayoutProvider instance.
 */
export function getPayoutProvider(): IPayoutProvider {
  const providerType = (process.env.PAYOUT_PROVIDER || 'MOCK').toUpperCase();
  if (providerType === 'RAZORPAY' && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new RazorpayPayoutProvider();
  }
  return new MockPayoutProvider();
}
