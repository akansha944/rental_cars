import { Schema, model, Document, Types } from 'mongoose';
import { StoredFile } from './types';
import { fileSchema } from './Vehicle';

export interface ICustomer extends Document {
  _id: Types.ObjectId;
  company: Types.ObjectId;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  licenceNumber?: string;
  licenceExpiry?: Date;
  dateOfBirth?: Date;
  documents: StoredFile[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    licenceNumber: { type: String, trim: true },
    licenceExpiry: { type: Date },
    dateOfBirth: { type: Date },
    documents: { type: [fileSchema], default: [] },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

customerSchema.index({ company: 1, fullName: 1 });
customerSchema.index({ company: 1, phone: 1 });

export const Customer = model<ICustomer>('Customer', customerSchema);
