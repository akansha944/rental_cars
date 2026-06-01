export enum UserRole {
  Owner = 'owner',
  Manager = 'manager',
  Staff = 'staff',
}

export enum VehicleStatus {
  Available = 'available',
  Rented = 'rented',
  Maintenance = 'maintenance',
  Unavailable = 'unavailable',
}

export enum RentalStatus {
  Active = 'active',
  Returned = 'returned',
  Cancelled = 'cancelled',
}

export enum PaymentStatus {
  Pending = 'pending',
  PartiallyPaid = 'partially_paid',
  Paid = 'paid',
  Refunded = 'refunded',
}

export enum AgreementStatus {
  Draft = 'draft',
  Sent = 'sent',
  Signed = 'signed',
  Declined = 'declined',
  Expired = 'expired',
}

export enum FuelLevel {
  Empty = 'empty',
  Quarter = '1/4',
  Half = '1/2',
  ThreeQuarter = '3/4',
  Full = 'full',
}

export enum NotificationType {
  WofExpiry = 'wof_expiry',
  RegistrationExpiry = 'registration_expiry',
  InsuranceExpiry = 'insurance_expiry',
  ServiceDue = 'service_due',
  RentalEnding = 'rental_ending',
  AgreementSign = 'agreement_sign',
  PaymentReminder = 'payment_reminder',
}

export interface StoredFile {
  url: string;
  publicId?: string;
  filename: string;
  mimeType?: string;
  size?: number;
  uploadedAt: Date;
}
