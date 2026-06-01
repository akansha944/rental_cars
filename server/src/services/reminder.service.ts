import { Vehicle } from '../models/Vehicle';
import { Rental } from '../models/Rental';
import { Company } from '../models/Company';
import { Customer } from '../models/Customer';
import { Notification } from '../models/Notification';
import { NotificationType, RentalStatus } from '../models/types';
import { env } from '../config/env';
import { sendEmail } from '../utils/email';
import { sendSms } from '../utils/sms';

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

function severityFor(days: number): 'info' | 'warning' | 'critical' {
  if (days <= 1) return 'critical';
  if (days <= 7) return 'warning';
  return 'info';
}

/**
 * Returns the reminder "stage" a document currently falls in, given the
 * configured day thresholds (e.g. [30,14,7,1]). Returns the tightest threshold
 * the date is within (so reminders escalate as the date approaches),
 * 'overdue' if already past, or null if it's further away than every threshold.
 * Using the stage (not the exact day) as the dedupe key means a reminder fires
 * once per stage even if the daily job doesn't run on the precise threshold day.
 */
function reminderBucket(days: number, thresholds: number[]): string | null {
  if (days < 0) return 'overdue';
  const sorted = [...thresholds].sort((a, b) => a - b);
  for (const t of sorted) {
    if (days <= t) return String(t);
  }
  return null;
}

/**
 * Creates an in-app notification if one with the same dedupeKey doesn't exist.
 * Returns true if a new notification was created.
 */
async function upsertNotification(args: {
  companyId: unknown;
  type: NotificationType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  dedupeKey: string;
  relatedVehicle?: unknown;
  relatedRental?: unknown;
}): Promise<boolean> {
  const existing = await Notification.findOne({
    company: args.companyId,
    dedupeKey: args.dedupeKey,
  });
  if (existing) return false;
  await Notification.create({
    company: args.companyId,
    type: args.type,
    title: args.title,
    message: args.message,
    severity: args.severity,
    dedupeKey: args.dedupeKey,
    relatedVehicle: args.relatedVehicle,
    relatedRental: args.relatedRental,
  });
  return true;
}

/** Scans all companies' vehicles for documents expiring within the thresholds. */
export async function runDocumentExpiryReminders(): Promise<number> {
  const maxDays = Math.max(...env.reminders.days, 30);
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + maxDays);

  const fieldLabels = {
    wofExpiry: { label: 'WOF', type: NotificationType.WofExpiry },
    registrationExpiry: { label: 'Registration', type: NotificationType.RegistrationExpiry },
    insuranceExpiry: { label: 'Insurance', type: NotificationType.InsuranceExpiry },
    serviceDueDate: { label: 'Service', type: NotificationType.ServiceDue },
  } as const;

  const docs: { key: keyof typeof fieldLabels; field: string }[] = [
    { key: 'wofExpiry', field: 'wofExpiry' },
    { key: 'registrationExpiry', field: 'registrationExpiry' },
    { key: 'insuranceExpiry', field: 'insuranceExpiry' },
    { key: 'serviceDueDate', field: 'serviceDueDate' },
  ];

  const vehicles = await Vehicle.find({
    $or: docs.map((d) => ({ [d.field]: { $lte: horizon } })),
  });

  let created = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const v of vehicles) {
    for (const { key } of docs) {
      const date = v[key] as Date | undefined;
      if (!date) continue;
      const days = daysUntil(date);
      const bucket = reminderBucket(days, env.reminders.days);
      // Outside the reminder window (further away than the largest threshold).
      if (bucket === null) continue;

      const meta = fieldLabels[key];
      // Dedupe per (vehicle, document, expiry date, stage) so each stage emails
      // once — robust even if the daily job misses the exact threshold day.
      const dedupeKey = `${meta.type}:${v._id}:${date.toISOString().slice(0, 10)}:${bucket}`;
      const when =
        days < 0 ? `expired ${Math.abs(days)} day(s) ago` : `expires in ${days} day(s)`;
      const isNew = await upsertNotification({
        companyId: v.company,
        type: meta.type,
        title: `${meta.label} ${days < 0 ? 'expired' : 'expiring'}: ${v.plateNumber}`,
        message: `${v.make} ${v.model} (${v.plateNumber}) — ${meta.label} ${when}.`,
        severity: severityFor(days),
        dedupeKey,
        relatedVehicle: v._id,
      });
      if (isNew) {
        created++;
        // Email the company (owner) address — best-effort.
        const company = await Company.findById(v.company);
        if (company?.email) {
          try {
            await sendEmail({
              to: company.email,
              subject: `${meta.label} ${days < 0 ? 'expired' : 'expiring soon'} — ${v.plateNumber}`,
              html: `<p>The ${meta.label} for <strong>${v.make} ${v.model} (${v.plateNumber})</strong> ${when}.</p>
                   <p>Please arrange renewal to keep this vehicle compliant.</p>`,
            });
          } catch (err) {
            console.error('[reminders] Failed to email expiry reminder:', err);
          }
        }
      }
    }
  }
  return created;
}

/** Notifies customers of rentals ending within 1 day. */
export async function runRentalEndingReminders(): Promise<number> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const rentals = await Rental.find({
    status: RentalStatus.Active,
    returnDate: { $lte: tomorrow },
  })
    .populate('vehicle', 'plateNumber make model')
    .populate('customer', 'fullName email phone');

  let count = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const rental of rentals) {
    const dedupeKey = `${NotificationType.RentalEnding}:${rental._id}:${today}`;
    const customer = rental.customer as unknown as {
      fullName: string;
      email?: string;
      phone?: string;
    };
    const vehicle = rental.vehicle as unknown as { plateNumber: string };

    const isNew = await upsertNotification({
      companyId: rental.company,
      type: NotificationType.RentalEnding,
      title: `Rental ending soon: ${rental.reference}`,
      message: `${customer.fullName}'s rental of ${vehicle.plateNumber} is due back ${new Date(
        rental.returnDate
      ).toLocaleDateString('en-NZ')}.`,
      severity: 'warning',
      dedupeKey,
      relatedRental: rental._id,
    });

    if (isNew) {
      count++;
      const company = await Company.findById(rental.company);
      const due = new Date(rental.returnDate).toLocaleDateString('en-NZ');
      if (customer.email && company) {
        await sendEmail({
          to: customer.email,
          subject: `Reminder: your rental is due back on ${due}`,
          html: `<p>Hi ${customer.fullName},</p><p>This is a friendly reminder that your rental
                 (${rental.reference}) is due to be returned on <strong>${due}</strong>.</p>
                 <p>Thank you,<br/>${company.name}</p>`,
        });
      }
      if (customer.phone && company) {
        await sendSms(
          customer.phone,
          `${company.name}: reminder — your rental ${rental.reference} is due back on ${due}.`
        );
      }
    }
  }
  return count;
}

export async function runAllReminders(): Promise<{ expiry: number; ending: number }> {
  try {
    const expiry = await runDocumentExpiryReminders();
    const ending = await runRentalEndingReminders();
    console.log(`[reminders] Created ${expiry} expiry + ${ending} rental-ending notifications`);
    return { expiry, ending };
  } catch (err) {
    console.error('[reminders] Error while running reminders:', err);
    return { expiry: 0, ending: 0 };
  }
}
