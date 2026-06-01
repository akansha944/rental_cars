import { Request, Response } from 'express';
import { z } from 'zod';
import { Agreement } from '../models/Agreement';
import { Rental } from '../models/Rental';
import { Company } from '../models/Company';
import { Customer } from '../models/Customer';
import { AgreementStatus } from '../models/types';
import { ApiError } from '../utils/ApiError';
import { hashToken } from '../utils/token';
import { generateSignedPdf } from '../services/agreement.service';
import { sendEmail } from '../utils/email';

// GET /api/public/agreements/:token — public view of an agreement to sign.
export async function getPublicAgreement(req: Request, res: Response) {
  const agreement = await Agreement.findOne({ signToken: hashToken(req.params.token) });
  if (!agreement) throw ApiError.notFound('Agreement not found');

  if (agreement.status === AgreementStatus.Signed) {
    return res.json({
      status: agreement.status,
      content: agreement.contentSnapshot,
      signedAt: agreement.signature?.signedAt,
      signedPdfUrl: agreement.signedPdf?.url,
      alreadySigned: true,
    });
  }
  if (agreement.tokenExpiresAt && agreement.tokenExpiresAt < new Date()) {
    throw ApiError.badRequest('This signing link has expired. Please contact the company.');
  }

  res.json({
    status: agreement.status,
    content: agreement.contentSnapshot,
    alreadySigned: false,
  });
}

// POST /api/public/agreements/:token/sign
export async function signPublicAgreement(req: Request, res: Response) {
  const schema = z.object({
    signedName: z.string().min(2),
    signatureDataUrl: z.string().min(10),
    agree: z.literal(true),
  });
  const data = schema.parse(req.body);

  const agreement = await Agreement.findOne({ signToken: hashToken(req.params.token) });
  if (!agreement) throw ApiError.notFound('Agreement not found');
  if (agreement.status === AgreementStatus.Signed) {
    throw ApiError.conflict('This agreement has already been signed');
  }
  if (agreement.tokenExpiresAt && agreement.tokenExpiresAt < new Date()) {
    throw ApiError.badRequest('This signing link has expired');
  }

  const signedAt = new Date();
  const rental = await Rental.findById(agreement.rental);

  const { file: signedPdf, buffer: signedPdfBuffer } = await generateSignedPdf(
    agreement,
    agreement.company,
    rental?.reference ?? 'agreement',
    { dataUrl: data.signatureDataUrl, signedName: data.signedName, signedAt }
  );

  agreement.status = AgreementStatus.Signed;
  agreement.signedPdf = signedPdf;
  agreement.signature = {
    dataUrl: data.signatureDataUrl,
    signedName: data.signedName,
    signedAt,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
  await agreement.save();

  const reference = rental?.reference ?? '';
  const pdfAttachment = {
    filename: `rental-agreement-${reference || 'signed'}.pdf`,
    content: signedPdfBuffer,
    contentType: 'application/pdf',
  };

  const company = await Company.findById(agreement.company);
  const customer = await Customer.findById(agreement.customer);

  // Email the signed copy to the customer (best-effort).
  if (customer?.email) {
    try {
      await sendEmail({
        to: customer.email,
        fromName: company?.name,
        subject: `Your signed rental agreement${reference ? ` — ${reference}` : ''}`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
          <h2 style="color:#4F46E5">${company?.name ?? 'Your rental agreement'}</h2>
          <p>Hi ${customer.fullName},</p>
          <p>Thank you for signing your rental agreement
          ${reference ? `(ref <strong>${reference}</strong>)` : ''}. A signed copy is
          attached to this email for your records.</p>
          <p style="color:#666;font-size:13px">Signed on ${signedAt.toLocaleString('en-NZ')}.</p>
        </div>`,
        attachments: [pdfAttachment],
      });
    } catch (err) {
      console.error('[agreement] Failed to email signed copy to customer:', err);
    }
  }

  // Notify the company that the agreement was signed, with a copy attached (best-effort).
  if (company?.email) {
    try {
      await sendEmail({
        to: company.email,
        subject: `Agreement signed — ${reference}`,
        html: `<p>${data.signedName} has signed the rental agreement
          ${rental ? `(<strong>${reference}</strong>)` : ''} at
          ${signedAt.toLocaleString('en-NZ')}. A signed copy is attached.</p>`,
        attachments: [pdfAttachment],
      });
    } catch (err) {
      console.error('[agreement] Failed to send signed-notification email:', err);
    }
  }

  res.json({ message: 'Agreement signed successfully', signedAt, signedPdfUrl: signedPdf.url });
}

// GET /api/agreements — list all agreements for the company.
export async function listAgreements(req: Request, res: Response) {
  const filter: Record<string, unknown> = { company: req.auth!.companyId };
  if (req.query.status) filter.status = req.query.status;
  const agreements = await Agreement.find(filter)
    .populate('rental', 'reference')
    .populate('customer', 'fullName email phone')
    .sort({ createdAt: -1 });
  res.json(agreements);
}

// GET /api/agreements/:id — authenticated company view of an agreement.
export async function getAgreement(req: Request, res: Response) {
  const agreement = await Agreement.findOne({
    _id: req.params.id,
    company: req.auth!.companyId,
  });
  if (!agreement) throw ApiError.notFound('Agreement not found');
  res.json(agreement);
}
