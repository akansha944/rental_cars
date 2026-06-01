import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Vehicle } from '../models/Vehicle';
import { Customer } from '../models/Customer';
import { Rental } from '../models/Rental';
import { VehicleStatus, RentalStatus } from '../models/types';
import { runAllReminders } from '../services/reminder.service';

function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// GET /api/dashboard
export async function getDashboard(req: Request, res: Response) {
  const companyId = new Types.ObjectId(req.auth!.companyId);
  const soon = addDays(30);
  const now = new Date();

  const [
    totalVehicles,
    available,
    rented,
    maintenance,
    totalCustomers,
    activeRentals,
  ] = await Promise.all([
    Vehicle.countDocuments({ company: companyId }),
    Vehicle.countDocuments({ company: companyId, status: VehicleStatus.Available }),
    Vehicle.countDocuments({ company: companyId, status: VehicleStatus.Rented }),
    Vehicle.countDocuments({ company: companyId, status: VehicleStatus.Maintenance }),
    Customer.countDocuments({ company: companyId }),
    Rental.countDocuments({ company: companyId, status: RentalStatus.Active }),
  ]);

  // Vehicles with documents expiring in the next 30 days (or already expired)
  const expiring = await Vehicle.find({
    company: companyId,
    $or: [
      { wofExpiry: { $lte: soon } },
      { registrationExpiry: { $lte: soon } },
      { insuranceExpiry: { $lte: soon } },
      { serviceDueDate: { $lte: soon } },
    ],
  }).select('plateNumber make model wofExpiry registrationExpiry insuranceExpiry serviceDueDate');

  const expiringDocs = expiring
    .map((v) => {
      const items: { type: string; date: Date; daysLeft: number }[] = [];
      const check = (type: string, date?: Date) => {
        if (date && date <= soon) {
          const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          items.push({ type, date, daysLeft });
        }
      };
      check('WOF', v.wofExpiry);
      check('Registration', v.registrationExpiry);
      check('Insurance', v.insuranceExpiry);
      check('Service', v.serviceDueDate);
      return {
        vehicleId: v._id,
        plateNumber: v.plateNumber,
        label: `${v.make} ${v.model}`,
        items,
      };
    })
    .filter((v) => v.items.length > 0);

  // Active rentals ending within 3 days
  const endingSoon = await Rental.find({
    company: companyId,
    status: RentalStatus.Active,
    returnDate: { $lte: addDays(3) },
  })
    .populate('customer', 'fullName phone')
    .populate('vehicle', 'plateNumber make model')
    .sort({ returnDate: 1 });

  res.json({
    stats: {
      totalVehicles,
      available,
      rented,
      maintenance,
      totalCustomers,
      activeRentals,
    },
    expiringDocs,
    endingSoon,
  });
}

// POST /api/dashboard/run-reminders — run the reminder scan on demand (for the
// "Run reminders now" button). Authenticated; available to all roles.
export async function triggerReminders(_req: Request, res: Response) {
  const result = await runAllReminders();
  res.json({
    message: 'Reminder scan complete',
    notificationsCreated: result.expiry + result.ending,
    ...result,
  });
}
