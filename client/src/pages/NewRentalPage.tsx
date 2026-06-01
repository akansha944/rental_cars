import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
  Alert,
  Autocomplete,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { customerApi, vehicleApi, rentalApi } from '../api/endpoints';
import { Customer, Vehicle, FuelLevel } from '../types';
import { PageHeader, formatMoney } from '../components/common';
import { apiErrorMessage } from '../api/client';

const FUEL_LEVELS: FuelLevel[] = ['empty', '1/4', '1/2', '3/4', 'full'];

export default function NewRentalPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [pickupDate, setPickupDate] = useState<Dayjs | null>(dayjs());
  const [returnDate, setReturnDate] = useState<Dayjs | null>(dayjs().add(3, 'day'));
  const [dailyRate, setDailyRate] = useState('');
  const [bondAmount, setBondAmount] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [pickupOdometer, setPickupOdometer] = useState('');
  const [pickupFuelLevel, setPickupFuelLevel] = useState<FuelLevel | ''>('');
  const [pickupDamageNotes, setPickupDamageNotes] = useState('');
  const [sendAgreement, setSendAgreement] = useState(true);

  useEffect(() => {
    customerApi.list().then(setCustomers).catch(() => undefined);
    vehicleApi.list({ status: 'available' }).then(setVehicles).catch(() => undefined);
  }, []);

  // When a vehicle is selected, prefill rate and odometer.
  useEffect(() => {
    if (vehicle) {
      if (vehicle.dailyRate) setDailyRate(String(vehicle.dailyRate));
      if (vehicle.odometer !== undefined) setPickupOdometer(String(vehicle.odometer));
    }
  }, [vehicle]);

  const days = useMemo(() => {
    if (!pickupDate || !returnDate) return 0;
    return Math.max(1, returnDate.diff(pickupDate, 'day'));
  }, [pickupDate, returnDate]);

  const total = useMemo(() => (Number(dailyRate) || 0) * days, [dailyRate, days]);

  const handleSubmit = async () => {
    setError('');
    if (!customer || !vehicle || !pickupDate || !returnDate) {
      setError('Please select a customer, a vehicle, and rental dates.');
      return;
    }
    setSaving(true);
    try {
      const { rental } = await rentalApi.create({
        customer: customer._id,
        vehicle: vehicle._id,
        pickupDate: pickupDate.toISOString(),
        returnDate: returnDate.toISOString(),
        dailyRate: Number(dailyRate) || 0,
        totalPrice: total,
        bondAmount: Number(bondAmount) || 0,
        amountPaid: Number(amountPaid) || 0,
        pickupOdometer: pickupOdometer ? Number(pickupOdometer) : undefined,
        pickupFuelLevel: pickupFuelLevel || undefined,
        pickupDamageNotes: pickupDamageNotes || undefined,
        sendAgreement,
      });
      navigate(`/rentals/${rental._id}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader title="New Rental" subtitle="Issue a vehicle to a customer" />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer & Vehicle
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={customers}
                    getOptionLabel={(c) => `${c.fullName}${c.phone ? ` · ${c.phone}` : ''}`}
                    value={customer}
                    onChange={(_, v) => setCustomer(v)}
                    renderInput={(params) => <TextField {...params} label="Customer" required />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={vehicles}
                    getOptionLabel={(v) => `${v.plateNumber} · ${v.make} ${v.model}`}
                    value={vehicle}
                    onChange={(_, v) => setVehicle(v)}
                    renderInput={(params) => (
                      <TextField {...params} label="Available vehicle" required helperText="Only available vehicles are listed" />
                    )}
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Rental period & pricing
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DatePicker label="Pickup date" value={pickupDate} onChange={setPickupDate} slotProps={{ textField: { fullWidth: true } }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker label="Return date" value={returnDate} onChange={setReturnDate} slotProps={{ textField: { fullWidth: true } }} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField label="Daily rate ($)" type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField label="Bond ($)" type="number" value={bondAmount} onChange={(e) => setBondAmount(e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField label="Amount paid ($)" type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} fullWidth />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Vehicle condition at pickup
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <TextField label="Odometer (km)" type="number" value={pickupOdometer} onChange={(e) => setPickupOdometer(e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField select label="Fuel level" value={pickupFuelLevel} onChange={(e) => setPickupFuelLevel(e.target.value as FuelLevel)} fullWidth>
                    <MenuItem value="">—</MenuItem>
                    {FUEL_LEVELS.map((f) => (
                      <MenuItem key={f} value={f}>
                        {f}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Damage notes" value={pickupDamageNotes} onChange={(e) => setPickupDamageNotes(e.target.value)} fullWidth multiline rows={2} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 88 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1}>
                <Row label="Duration" value={`${days} day${days === 1 ? '' : 's'}`} />
                <Row label="Daily rate" value={formatMoney(Number(dailyRate) || 0)} />
                <Row label="Bond" value={formatMoney(Number(bondAmount) || 0)} />
                <Divider />
                <Row label="Total" value={formatMoney(total)} bold />
              </Stack>

              <FormControlLabel
                sx={{ mt: 2 }}
                control={<Checkbox checked={sendAgreement} onChange={(e) => setSendAgreement(e.target.checked)} />}
                label="Email/SMS signing link to customer"
              />

              <Button variant="contained" fullWidth size="large" sx={{ mt: 1 }} onClick={handleSubmit} disabled={saving}>
                {saving ? 'Creating…' : 'Create rental & generate agreement'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={bold ? 700 : 400}>
        {value}
      </Typography>
    </Stack>
  );
}
