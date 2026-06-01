export type UserRole = 'owner' | 'manager' | 'staff';
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'unavailable';
export type RentalStatus = 'active' | 'returned' | 'cancelled';
export type PaymentStatus = 'pending' | 'partially_paid' | 'paid' | 'refunded';
export type AgreementStatus = 'draft' | 'sent' | 'signed' | 'declined' | 'expired';
export type FuelLevel = 'empty' | '1/4' | '1/2' | '3/4' | 'full';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLoginAt?: string;
}

export interface Company {
  id?: string;
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  logo?: string;
  termsAndConditions?: string;
}

export interface StoredFile {
  url: string;
  filename: string;
  mimeType?: string;
  uploadedAt: string;
}

export interface Vehicle {
  _id: string;
  plateNumber: string;
  make: string;
  model: string;
  year?: number;
  vin?: string;
  colour?: string;
  odometer?: number;
  dailyRate?: number;
  wofExpiry?: string;
  registrationExpiry?: string;
  insuranceExpiry?: string;
  serviceDueDate?: string;
  status: VehicleStatus;
  photos: StoredFile[];
  documents: StoredFile[];
  notes?: string;
}

export interface Customer {
  _id: string;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  licenceNumber?: string;
  licenceExpiry?: string;
  dateOfBirth?: string;
  documents: StoredFile[];
  notes?: string;
}

export interface Rental {
  _id: string;
  reference: string;
  status: RentalStatus;
  customer: Customer | string;
  vehicle: Vehicle | string;
  pickupDate: string;
  returnDate: string;
  actualReturnDate?: string;
  dailyRate: number;
  totalPrice: number;
  bondAmount: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  pickupOdometer?: number;
  pickupFuelLevel?: FuelLevel;
  pickupDamageNotes?: string;
  returnOdometer?: number;
  returnFuelLevel?: FuelLevel;
  returnDamageNotes?: string;
  agreement?: Agreement | string;
}

export interface Agreement {
  _id: string;
  status: AgreementStatus;
  unsignedPdf?: StoredFile;
  signedPdf?: StoredFile;
  signature?: { signedName?: string; signedAt?: string };
  sentVia?: string[];
  rental?: { _id: string; reference: string } | string;
  customer?: { _id: string; fullName: string; email?: string; phone?: string } | string;
  sentAt?: string;
  createdAt?: string;
}

export interface DashboardData {
  stats: {
    totalVehicles: number;
    available: number;
    rented: number;
    maintenance: number;
    totalCustomers: number;
    activeRentals: number;
  };
  expiringDocs: {
    vehicleId: string;
    plateNumber: string;
    label: string;
    items: { type: string; date: string; daysLeft: number }[];
  }[];
  endingSoon: Rental[];
}

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  read: boolean;
  createdAt: string;
}
