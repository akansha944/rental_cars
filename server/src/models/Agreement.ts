import { Schema, model, Document, Types } from 'mongoose';
import { AgreementStatus, StoredFile } from './types';
import { fileSchema } from './Vehicle';

export interface IAgreement extends Document {
  _id: Types.ObjectId;
  company: Types.ObjectId;
  rental: Types.ObjectId;
  customer: Types.ObjectId;
  status: AgreementStatus;

  // Public signing token (hashed in DB for lookup; raw kept for staff copy-link only)
  signToken: string;
  signTokenRaw?: string;
  tokenExpiresAt: Date;

  // Snapshot of agreement content at generation time
  contentSnapshot: Record<string, unknown>;

  unsignedPdf?: StoredFile;
  signedPdf?: StoredFile;

  signature?: {
    dataUrl?: string;
    signedName?: string;
    signedAt?: Date;
    ipAddress?: string;
    userAgent?: string;
  };

  sentAt?: Date;
  sentVia?: ('email' | 'sms')[];
  createdAt: Date;
  updatedAt: Date;
}

const agreementSchema = new Schema<IAgreement>(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    rental: { type: Schema.Types.ObjectId, ref: 'Rental', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    status: {
      type: String,
      enum: Object.values(AgreementStatus),
      default: AgreementStatus.Draft,
      index: true,
    },

    signToken: { type: String, index: true },
    signTokenRaw: { type: String, select: false },
    tokenExpiresAt: { type: Date },

    contentSnapshot: { type: Schema.Types.Mixed, default: {} },

    unsignedPdf: { type: fileSchema },
    signedPdf: { type: fileSchema },

    signature: {
      dataUrl: { type: String },
      signedName: { type: String },
      signedAt: { type: Date },
      ipAddress: { type: String },
      userAgent: { type: String },
    },

    sentAt: { type: Date },
    sentVia: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Agreement = model<IAgreement>('Agreement', agreementSchema);
