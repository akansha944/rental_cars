import { Schema, model, Document, Types } from 'mongoose';
import { NotificationType } from './types';

export interface INotification extends Document {
  _id: Types.ObjectId;
  company: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  read: boolean;
  relatedVehicle?: Types.ObjectId;
  relatedRental?: Types.ObjectId;
  relatedCustomer?: Types.ObjectId;
  // De-dupe key so the cron doesn't create the same reminder repeatedly.
  dedupeKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    read: { type: Boolean, default: false, index: true },
    relatedVehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    relatedRental: { type: Schema.Types.ObjectId, ref: 'Rental' },
    relatedCustomer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    dedupeKey: { type: String, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ company: 1, dedupeKey: 1 }, { unique: true, sparse: true });

export const Notification = model<INotification>('Notification', notificationSchema);
