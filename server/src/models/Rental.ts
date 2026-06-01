import { Schema, model, Document, Types } from 'mongoose';
import { RentalStatus, PaymentStatus, FuelLevel } from './types';

export interface IRental extends Document {
  _id: Types.ObjectId;
  company: Types.ObjectId;
  customer: Types.ObjectId;
  vehicle: Types.ObjectId;
  reference: string;
  status: RentalStatus;

  pickupDate: Date;
  returnDate: Date;
  actualReturnDate?: Date;

  dailyRate: number;
  totalPrice: number;
  bondAmount: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;

  // Condition at pickup
  pickupOdometer?: number;
  pickupFuelLevel?: FuelLevel;
  pickupDamageNotes?: string;

  // Condition at return
  returnOdometer?: number;
  returnFuelLevel?: FuelLevel;
  returnDamageNotes?: string;

  agreement?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const rentalSchema = new Schema<IRental>(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    reference: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(RentalStatus),
      default: RentalStatus.Active,
      index: true,
    },

    pickupDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    actualReturnDate: { type: Date },

    dailyRate: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    bondAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.Pending,
    },
    amountPaid: { type: Number, default: 0 },

    pickupOdometer: { type: Number },
    pickupFuelLevel: { type: String, enum: Object.values(FuelLevel) },
    pickupDamageNotes: { type: String, trim: true },

    returnOdometer: { type: Number },
    returnFuelLevel: { type: String, enum: Object.values(FuelLevel) },
    returnDamageNotes: { type: String, trim: true },

    agreement: { type: Schema.Types.ObjectId, ref: 'Agreement' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

rentalSchema.index({ company: 1, reference: 1 }, { unique: true });
rentalSchema.index({ company: 1, status: 1, returnDate: 1 });

export const Rental = model<IRental>('Rental', rentalSchema);
