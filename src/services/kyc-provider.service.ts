import crypto from 'crypto';
import { KYCVerificationStatus, KYCDocumentType } from '@/models/KYCVerification';

export interface SubmitKYCDTO {
  userId: string;
  documentType: KYCDocumentType;
  nameOnLicence: string;
  dateOfBirth: Date;
  issueDate: Date;
  expiryDate: Date;
  vehicleClasses: string[];
  documentFrontStorageKey: string;
  documentBackStorageKey: string;
}

export interface KYCSubmissionResult {
  status: KYCVerificationStatus;
  verificationReference: string;
  providerName: string;
  verificationMethod: 'ADMIN_REVIEW' | 'AUTOMATED_PROVIDER';
  message: string;
}

export interface KYCStatusResult {
  status: KYCVerificationStatus;
  verificationReference: string;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface IKYCProvider {
  providerName: string;
  submitVerification(dto: SubmitKYCDTO): Promise<KYCSubmissionResult>;
  getVerificationStatus(reference: string): Promise<KYCStatusResult>;
}

/**
 * Validates Driving Licence field formats and date consistency
 * NOTE: Field validation does NOT equal authenticity verification.
 */
export function validateDrivingLicenceFields(params: {
  licenceNumber: string;
  nameOnLicence: string;
  dateOfBirth: Date | string;
  issueDate: Date | string;
  expiryDate: Date | string;
  vehicleClasses?: string[];
}): { isValid: boolean; error?: string } {
  const { licenceNumber, nameOnLicence, dateOfBirth, issueDate, expiryDate, vehicleClasses } = params;

  if (!licenceNumber || licenceNumber.trim().length < 8 || licenceNumber.trim().length > 25) {
    return { isValid: false, error: 'Please enter a valid Driving Licence number (8-25 characters).' };
  }

  if (!nameOnLicence || nameOnLicence.trim().length < 2) {
    return { isValid: false, error: 'Full name on Driving Licence is required.' };
  }

  const dob = new Date(dateOfBirth);
  const issue = new Date(issueDate);
  const expiry = new Date(expiryDate);
  const now = new Date();

  if (isNaN(dob.getTime())) {
    return { isValid: false, error: 'Invalid Date of Birth.' };
  }

  if (isNaN(issue.getTime())) {
    return { isValid: false, error: 'Invalid Licence Issue Date.' };
  }

  if (isNaN(expiry.getTime())) {
    return { isValid: false, error: 'Invalid Licence Expiry Date.' };
  }

  // Age Check: At least 18 years old
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(now.getFullYear() - 18);
  if (dob > eighteenYearsAgo) {
    return { isValid: false, error: 'Rider must be at least 18 years of age.' };
  }

  // Issue date cannot be in the future
  if (issue > now) {
    return { isValid: false, error: 'Licence issue date cannot be in the future.' };
  }

  // Expiry check
  if (expiry <= now) {
    return { isValid: false, error: 'Your Driving Licence has expired. Please update with a valid licence.' };
  }

  // Vehicle classes
  if (vehicleClasses && vehicleClasses.length === 0) {
    return { isValid: false, error: 'Please specify at least one authorized vehicle class (e.g. MCWG, LMV).' };
  }

  return { isValid: true };
}

/**
 * RideSetu KYC State Machine Guard
 * Enforces strict transitions and prevents arbitrary state jumps
 */
export class KYCStateMachine {
  private static readonly VALID_TRANSITIONS: Record<KYCVerificationStatus, KYCVerificationStatus[]> = {
    NOT_STARTED: ['UNDER_REVIEW'],
    UNDER_REVIEW: ['VERIFIED', 'REJECTED', 'ACTION_REQUIRED'],
    ACTION_REQUIRED: ['UNDER_REVIEW'],
    REJECTED: ['UNDER_REVIEW'],
    VERIFIED: ['ACTION_REQUIRED'], // Triggered when customer changes identity details
  };

  public static canTransition(current: KYCVerificationStatus, next: KYCVerificationStatus): boolean {
    const allowed = this.VALID_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  public static assertTransition(current: KYCVerificationStatus, next: KYCVerificationStatus): void {
    if (!this.canTransition(current, next)) {
      throw new Error(
        `Invalid KYC state transition: Cannot change status from "${current}" to "${next}".`
      );
    }
  }
}

/**
 * Development / Production Default: Admin Review KYC Provider
 */
export class AdminReviewKYCProvider implements IKYCProvider {
  public readonly providerName = 'ADMIN_REVIEW';

  public async submitVerification(dto: SubmitKYCDTO): Promise<KYCSubmissionResult> {
    const uniqueRef = `KYC_REF_ADM_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    return {
      status: 'UNDER_REVIEW',
      verificationReference: uniqueRef,
      providerName: 'ADMIN_REVIEW',
      verificationMethod: 'ADMIN_REVIEW',
      message: 'Documents submitted for RideSetu internal administrative review.',
    };
  }

  public async getVerificationStatus(reference: string): Promise<KYCStatusResult> {
    return {
      status: 'UNDER_REVIEW',
      verificationReference: reference,
    };
  }
}

let kycProviderInstance: IKYCProvider | null = null;

export function getKYCProvider(): IKYCProvider {
  if (!kycProviderInstance) {
    kycProviderInstance = new AdminReviewKYCProvider();
  }
  return kycProviderInstance;
}
