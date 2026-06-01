import { Schema, model, Types } from 'mongoose';
import { VehicleStatus, StoredFile } from './types';

export interface IVehicle {
  _id: Types.ObjectId;
  company: Types.ObjectId;
  plateNumber: string;
  make: string;
  model: string;
  year?: number;
  vin?: string;
  colour?: string;
  odometer?: number;
  dailyRate?: number;
  wofExpiry?: Date;
  registrationExpiry?: Date;
  insuranceExpiry?: Date;
  serviceDueDate?: Date;
  status: VehicleStatus;
  photos: StoredFile[];
  documents: StoredFile[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<StoredFile>(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    filename: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const vehicleSchema = new Schema<IVehicle>(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    plateNumber: { type: String, required: true, trim: true, uppercase: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number },
    vin: { type: String, trim: true, uppercase: true },
    colour: { type: String, trim: true },
    odometer: { type: Number, default: 0 },
    dailyRate: { type: Number, default: 0 },
    wofExpiry: { type: Date },
    registrationExpiry: { type: Date },
    insuranceExpiry: { type: Date },
    serviceDueDate: { type: Date },
    status: {
      type: String,
      enum: Object.values(VehicleStatus),
      default: VehicleStatus.Available,
      index: true,
    },
    photos: { type: [fileSchema], default: [] },
    documents: { type: [fileSchema], default: [] },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

vehicleSchema.index({ company: 1, plateNumber: 1 }, { unique: true });

export const Vehicle = model<IVehicle>('Vehicle', vehicleSchema);
export { fileSchema };
