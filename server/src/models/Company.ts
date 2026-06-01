import { Schema, model, Document, Types } from 'mongoose';

export interface ICompany extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  logo?: string;
  termsAndConditions?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true, default: 'New Zealand' },
    logo: { type: String },
    termsAndConditions: {
      type: String,
      default:
        'The renter agrees to return the vehicle in the same condition as received, ' +
        'to cover any traffic fines incurred during the rental period, and to be ' +
        'responsible for the bond in the event of damage or loss. The vehicle must ' +
        'be returned with the same fuel level. Late returns may incur additional charges.',
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Company = model<ICompany>('Company', companySchema);
