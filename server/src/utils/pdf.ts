import PDFDocument from 'pdfkit';

export interface AgreementPdfData {
  reference: string;
  company: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    logo?: string;
  };
  customer: {
    fullName: string;
    phone?: string;
    email?: string;
    address?: string;
    licenceNumber?: string;
    licenceExpiry?: string;
  };
  vehicle: {
    plateNumber: string;
    make: string;
    model: string;
    year?: number;
    colour?: string;
    vin?: string;
  };
  rental: {
    pickupDate: string;
    returnDate: string;
    dailyRate: number;
    totalPrice: number;
    bondAmount: number;
    pickupOdometer?: number;
    pickupFuelLevel?: string;
    pickupDamageNotes?: string;
  };
  termsAndConditions: string;
  signature?: {
    dataUrl?: string;
    signedName?: string;
    signedAt?: string;
  };
}

const BRAND = '#1565C0';
const MUTED = '#666666';

/** Render a rental agreement to a PDF Buffer. */
export function generateAgreementPdf(
  data: AgreementPdfData,
  logoBuffer?: Buffer | null
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header — optional company logo, then the company name.
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, { fit: [140, 60] });
        doc.moveDown(0.4);
      } catch {
        /* unsupported image format (e.g. svg/webp) — skip the logo */
      }
    }
    doc.fillColor(BRAND).fontSize(22).text(data.company.name, { continued: false });
    doc.moveDown(0.2);
    doc.fillColor(MUTED).fontSize(9);
    const companyLines = [data.company.address, data.company.phone, data.company.email]
      .filter(Boolean)
      .join('  |  ');
    if (companyLines) doc.text(companyLines);

    doc.moveDown(0.6);
    doc.fillColor('#000').fontSize(16).text('Rental Agreement', { align: 'left' });
    doc.fillColor(MUTED).fontSize(10).text(`Agreement Reference: ${data.reference}`);
    drawDivider(doc);

    // Two-column: Customer + Vehicle
    section(doc, 'Customer Details');
    kv(doc, 'Full name', data.customer.fullName);
    kv(doc, 'Phone', data.customer.phone);
    kv(doc, 'Email', data.customer.email);
    kv(doc, 'Address', data.customer.address);
    kv(doc, 'Licence number', data.customer.licenceNumber);
    kv(doc, 'Licence expiry', data.customer.licenceExpiry);

    section(doc, 'Vehicle Details');
    kv(
      doc,
      'Vehicle',
      `${data.vehicle.year ?? ''} ${data.vehicle.make} ${data.vehicle.model}`.trim()
    );
    kv(doc, 'Plate', data.vehicle.plateNumber);
    kv(doc, 'Colour', data.vehicle.colour);
    kv(doc, 'VIN', data.vehicle.vin);

    section(doc, 'Rental Terms');
    kv(doc, 'Pickup date', data.rental.pickupDate);
    kv(doc, 'Return date', data.rental.returnDate);
    kv(doc, 'Daily rate', money(data.rental.dailyRate));
    kv(doc, 'Total price', money(data.rental.totalPrice));
    kv(doc, 'Bond', money(data.rental.bondAmount));
    kv(doc, 'Odometer at pickup', numOrDash(data.rental.pickupOdometer));
    kv(doc, 'Fuel at pickup', data.rental.pickupFuelLevel);
    if (data.rental.pickupDamageNotes) {
      kv(doc, 'Pre-existing damage', data.rental.pickupDamageNotes);
    }

    section(doc, 'Terms & Conditions');
    doc.fillColor('#000').fontSize(9).text(data.termsAndConditions, { align: 'justify' });

    // Signature block
    doc.moveDown(1.5);
    drawDivider(doc);
    section(doc, 'Signature');

    if (data.signature?.dataUrl) {
      try {
        const base64 = data.signature.dataUrl.split(',')[1];
        if (base64) {
          const imgBuffer = Buffer.from(base64, 'base64');
          doc.image(imgBuffer, { fit: [200, 80] });
        }
      } catch {
        /* ignore malformed signature image */
      }
      doc.moveDown(0.3);
      kv(doc, 'Signed by', data.signature.signedName);
      kv(doc, 'Signed at', data.signature.signedAt);
      doc.moveDown(0.5);
      doc.fillColor(MUTED).fontSize(8).text(
        'This document was signed electronically and is legally binding.'
      );
    } else {
      doc.fillColor(MUTED).fontSize(9).text('Awaiting customer signature.');
      doc.moveDown(2);
      doc.fillColor('#000').fontSize(10).text('Signature: ______________________________');
      doc.moveDown(0.5);
      doc.text('Date: ______________________________');
    }

    doc.end();
  });
}

function drawDivider(doc: PDFKit.PDFDocument) {
  doc.moveDown(0.5);
  doc
    .strokeColor('#dddddd')
    .lineWidth(1)
    .moveTo(doc.x, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(0.5);
}

function section(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.6);
  doc.fillColor(BRAND).fontSize(12).text(title);
  doc.moveDown(0.2);
}

function kv(doc: PDFKit.PDFDocument, key: string, value?: string) {
  if (value === undefined || value === null || value === '') return;
  doc.fillColor(MUTED).fontSize(9).text(`${key}: `, { continued: true });
  doc.fillColor('#000').text(String(value));
}

function money(n: number): string {
  return `$${(n ?? 0).toFixed(2)}`;
}

function numOrDash(n?: number): string {
  return n === undefined || n === null ? '-' : String(n);
}
