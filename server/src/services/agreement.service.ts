import crypto from 'crypto';
import { Types } from 'mongoose';
import { Agreement } from '../models/Agreement';
import { ICompany } from '../models/Company';
import { ICustomer } from '../models/Customer';
import { IVehicle } from '../models/Vehicle';
import { IRental } from '../models/Rental';
import { AgreementStatus, StoredFile } from '../models/types';
import { generateAgreementPdf, AgreementPdfData } from '../utils/pdf';
import { uploadBuffer, fetchImageBuffer } from '../utils/storage';
import { sendEmail } from '../utils/email';
import { sendSms } from '../utils/sms';
import { hashToken } from '../utils/token';
import { env } from '../config/env';

function fmtDate(d?: Date): string | undefined {
  return d ? new Date(d).toLocaleDateString('en-NZ', { dateStyle: 'medium' }) : undefined;
}

/** Pulls a readable message out of a SendGrid/Twilio/HTTP error. */
function describeSendError(err: unknown): string {
  const anyErr = err as {
    code?: number;
    message?: string;
    response?: { body?: { errors?: { message: string }[] } };
  };
  const sgErrors = anyErr?.response?.body?.errors;
  if (sgErrors?.length) {
    return `${anyErr.code ?? ''} ${sgErrors.map((e) => e.message).join('; ')}`.trim();
  }
  return anyErr?.message ?? String(err);
}

function buildPdfData(
  rental: IRental,
  company: ICompany,
  customer: ICustomer,
  vehicle: IVehicle,
  signature?: AgreementPdfData['signature']
): AgreementPdfData {
  return {
    reference: rental.reference,
    company: {
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      logo: company.logo,
    },
    customer: {
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      licenceNumber: customer.licenceNumber,
      licenceExpiry: fmtDate(customer.licenceExpiry),
    },
    vehicle: {
      plateNumber: vehicle.plateNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      colour: vehicle.colour,
      vin: vehicle.vin,
    },
    rental: {
      pickupDate: fmtDate(rental.pickupDate) ?? '',
      returnDate: fmtDate(rental.returnDate) ?? '',
      dailyRate: rental.dailyRate,
      totalPrice: rental.totalPrice,
      bondAmount: rental.bondAmount,
      pickupOdometer: rental.pickupOdometer,
      pickupFuelLevel: rental.pickupFuelLevel,
      pickupDamageNotes: rental.pickupDamageNotes,
    },
    termsAndConditions:
      company.termsAndConditions ?? 'Standard rental terms and conditions apply.',
    signature,
  };
}

/**
 * Creates a draft Agreement for a rental, generates the unsigned PDF, and stores
 * it. Returns the created agreement document.
 */
export async function createAgreementForRental(
  rental: IRental,
  company: ICompany,
  customer: ICustomer,
  vehicle: IVehicle
) {
  const pdfData = buildPdfData(rental, company, customer, vehicle);
  const logoBuffer = await fetchImageBuffer(company.logo);
  const pdfBuffer = await generateAgreementPdf(pdfData, logoBuffer);

  const unsignedPdf = await uploadBuffer(pdfBuffer, {
    folder: `agreements/${company._id}`,
    filename: `agreement-${rental.reference}-unsigned.pdf`,
    mimeType: 'application/pdf',
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

  const agreement = await Agreement.create({
    company: company._id,
    rental: rental._id,
    customer: customer._id,
    status: AgreementStatus.Draft,
    signToken: hashToken(rawToken),
    signTokenRaw: rawToken,
    tokenExpiresAt,
    contentSnapshot: pdfData as unknown as Record<string, unknown>,
    unsignedPdf,
  });

  return { agreement, rawToken };
}

/** Sends the signing link to the customer via email and/or SMS. */
export async function sendAgreement(
  agreementId: Types.ObjectId,
  rawToken: string,
  customer: ICustomer,
  company: ICompany,
  rental: IRental
) {
  const link = buildSigningLink(rawToken);
  const channels: ('email' | 'sms')[] = [];

  if (env.isProd && /localhost|127\.0\.0\.1/i.test(env.clientUrl)) {
    console.warn(
      '[agreement] CLIENT_URL is localhost in production — email links will NOT work on phones/tablets. Set CLIENT_URL to your Vercel URL on Render.'
    );
  }

  // Delivery failures (e.g. an unverified SendGrid sender) must NOT abort
  // rental creation — log them and carry on. The signing link is always
  // available from the rental detail page regardless.
  if (customer.email) {
    try {
      console.log(
        `[agreement] Sending signing email to ${customer.email} | link=${link} | CLIENT_URL=${env.clientUrl}`
      );
      await sendEmail({
        to: customer.email,
        fromName: company.name,
        subject: `Your rental agreement from ${company.name}`,
        html: buildAgreementEmailHtml(company.name, customer.fullName, rental.reference, link),
        text: [
          `Hi ${customer.fullName},`,
          '',
          `Your rental agreement from ${company.name} (ref ${rental.reference}) is ready to sign.`,
          '',
          `Open this link to review and sign:`,
          link,
          '',
          'This link expires in 14 days.',
        ].join('\n'),
      });
      channels.push('email');
    } catch (err) {
      console.error('[agreement] Failed to send agreement email:', describeSendError(err));
    }
  }

  if (customer.phone) {
    try {
      await sendSms(
        customer.phone,
        `${company.name}: please review and sign your rental agreement (${rental.reference}): ${link}`
      );
      channels.push('sms');
    } catch (err) {
      console.error('[agreement] Failed to send agreement SMS:', describeSendError(err));
    }
  }

  await Agreement.updateOne(
    { _id: agreementId },
    { status: AgreementStatus.Sent, sentAt: new Date(), sentVia: channels }
  );

  return { link, channels };
}

/**
 * Regenerates the PDF with the signature embedded and stores it as the signed
 * PDF. Returns the stored file descriptor.
 */
export async function generateSignedPdf(
  agreement: { contentSnapshot: Record<string, unknown> },
  companyId: Types.ObjectId,
  reference: string,
  signature: { dataUrl?: string; signedName?: string; signedAt: Date }
): Promise<{ file: StoredFile; buffer: Buffer }> {
  const data = agreement.contentSnapshot as unknown as AgreementPdfData;
  data.signature = {
    dataUrl: signature.dataUrl,
    signedName: signature.signedName,
    signedAt: signature.signedAt.toLocaleString('en-NZ'),
  };
  const logoBuffer = await fetchImageBuffer(data.company?.logo);
  const pdfBuffer = await generateAgreementPdf(data, logoBuffer);
  const file = await uploadBuffer(pdfBuffer, {
    folder: `agreements/${companyId}`,
    filename: `agreement-${reference}-signed.pdf`,
    mimeType: 'application/pdf',
  });
  return { file, buffer: pdfBuffer };
}

/** Public signing URL — always uses the configured CLIENT_URL. */
export function buildSigningLink(rawToken: string): string {
  const base = env.clientUrl.replace(/\/$/, '');
  return `${base}/sign/${rawToken}`;
}

function buildAgreementEmailHtml(
  companyName: string,
  customerName: string,
  reference: string,
  link: string
): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111">
      <h2 style="color:#4F46E5">${companyName}</h2>
      <p>Hi ${customerName},</p>
      <p>Your rental agreement (ref <strong>${reference}</strong>) is ready to sign.
      Please review and sign it using the secure link below:</p>
      <p style="text-align:center;margin:28px 0">
        <a href="${link}" style="background:#4F46E5;color:#fff;padding:14px 28px;
        border-radius:8px;text-decoration:none;display:inline-block;font-weight:600">
          Review &amp; Sign Agreement
        </a>
      </p>
      <p style="color:#666;font-size:13px;line-height:1.6">
        If the button above doesn't work on your phone, copy and paste this link into Safari or Chrome:
      </p>
      <p style="word-break:break-all;font-size:13px;background:#f4f6f8;padding:12px;border-radius:6px">
        <a href="${link}" style="color:#4F46E5">${link}</a>
      </p>
      <p style="color:#666;font-size:13px">This link expires in 14 days.</p>
    </div>`;
}
