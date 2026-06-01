import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Link,
  Snackbar,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { rentalApi } from '../api/endpoints';
import { Rental, Customer, Vehicle, Agreement, FuelLevel, PaymentStatus } from '../types';
import {
  PageHeader,
  RentalStatusChip,
  PaymentStatusChip,
  AgreementStatusChip,
  formatDate,
  formatMoney,
} from '../components/common';
import { apiErrorMessage } from '../api/client';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const fileUrl = (url: string) => (url.startsWith('http') ? url : `${API_BASE}${url}`);

const FUEL_LEVELS: FuelLevel[] = ['empty', '1/4', '1/2', '3/4', 'full'];
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'partially_paid', 'paid', 'refunded'];

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [rental, setRental] = useState<Rental | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [returnOpen, setReturnOpen] = useState(false);

  // Return form
  const [returnOdometer, setReturnOdometer] = useState('');
  const [returnFuelLevel, setReturnFuelLevel] = useState<FuelLevel | ''>('');
  const [returnDamageNotes, setReturnDamageNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [amountPaid, setAmountPaid] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const r = await rentalApi.get(id);
      setRental(r);
      setReturnOdometer(r.pickupOdometer ? String(r.pickupOdometer) : '');
      setAmountPaid(String(r.totalPrice ?? ''));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleReturn = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await rentalApi.return(id, {
        returnOdometer: returnOdometer ? Number(returnOdometer) : undefined,
        returnFuelLevel: returnFuelLevel || undefined,
        returnDamageNotes: returnDamageNotes || undefined,
        paymentStatus,
        amountPaid: amountPaid ? Number(amountPaid) : undefined,
      });
      setReturnOpen(false);
      await load();
      setToast('Vehicle returned and marked available.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (!id) return;
    try {
      const res = await rentalApi.resendAgreement(id);
      await load();
      setToast(
        res.channels.length
          ? `Agreement sent via ${res.channels.join(', ')}.`
          : 'Agreement regenerated. Share the signing link manually.'
      );
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!rental)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );

  const customer = rental.customer as Customer;
  const vehicle = rental.vehicle as Vehicle;
  const agreement = rental.agreement as Agreement | undefined;

  return (
    <Box>
      <PageHeader
        title={`Rental ${rental.reference}`}
        subtitle={`${customer?.fullName ?? ''} · ${vehicle?.plateNumber ?? ''}`}
        action={
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/rentals" variant="outlined">
              Back
            </Button>
            {rental.status === 'active' && (
              <Button variant="contained" startIcon={<AssignmentTurnedInIcon />} onClick={() => setReturnOpen(true)}>
                Process Return
              </Button>
            )}
          </Stack>
        }
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} mb={2}>
                <RentalStatusChip status={rental.status} />
                <PaymentStatusChip status={rental.paymentStatus} />
              </Stack>
              <Grid container spacing={2}>
                <Detail label="Customer" value={customer?.fullName} to={customer?._id ? `/customers/${customer._id}` : undefined} />
                <Detail label="Vehicle" value={`${vehicle?.plateNumber ?? ''} · ${vehicle?.make ?? ''} ${vehicle?.model ?? ''}`} />
                <Detail label="Pickup date" value={formatDate(rental.pickupDate)} />
                <Detail label="Return date" value={formatDate(rental.returnDate)} />
                {rental.actualReturnDate && <Detail label="Actual return" value={formatDate(rental.actualReturnDate)} />}
                <Detail label="Daily rate" value={formatMoney(rental.dailyRate)} />
                <Detail label="Total price" value={formatMoney(rental.totalPrice)} />
                <Detail label="Bond" value={formatMoney(rental.bondAmount)} />
                <Detail label="Amount paid" value={formatMoney(rental.amountPaid)} />
              </Grid>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Condition
              </Typography>
              <Grid container spacing={2}>
                <Detail label="Odometer (pickup)" value={rental.pickupOdometer?.toString()} />
                <Detail label="Fuel (pickup)" value={rental.pickupFuelLevel} />
                <Detail label="Damage (pickup)" value={rental.pickupDamageNotes} />
                <Detail label="Odometer (return)" value={rental.returnOdometer?.toString()} />
                <Detail label="Fuel (return)" value={rental.returnFuelLevel} />
                <Detail label="Damage (return)" value={rental.returnDamageNotes} />
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rental Agreement
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {agreement ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box>
                      <AgreementStatusChip status={agreement.status} />
                    </Box>
                  </Box>
                  {agreement.signature?.signedAt && (
                    <Typography variant="body2">
                      Signed by <strong>{agreement.signature.signedName}</strong> on{' '}
                      {formatDate(agreement.signature.signedAt)}
                    </Typography>
                  )}
                  {agreement.signedPdf && (
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      component={Link}
                      href={fileUrl(agreement.signedPdf.url)}
                      target="_blank"
                      rel="noopener"
                    >
                      Download signed PDF
                    </Button>
                  )}
                  {agreement.unsignedPdf && (
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      component={Link}
                      href={fileUrl(agreement.unsignedPdf.url)}
                      target="_blank"
                      rel="noopener"
                    >
                      View draft PDF
                    </Button>
                  )}
                  {agreement.status !== 'signed' && (
                    <Button variant="text" startIcon={<SendIcon />} onClick={handleResend}>
                      Resend signing link
                    </Button>
                  )}
                </Stack>
              ) : (
                <Typography color="text.secondary" variant="body2">
                  No agreement generated.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Return dialog */}
      <Dialog open={returnOpen} onClose={() => setReturnOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Return</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}>
              <TextField label="Return odometer (km)" type="number" value={returnOdometer} onChange={(e) => setReturnOdometer(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={6}>
              <TextField select label="Fuel level" value={returnFuelLevel} onChange={(e) => setReturnFuelLevel(e.target.value as FuelLevel)} fullWidth>
                <MenuItem value="">—</MenuItem>
                {FUEL_LEVELS.map((f) => (
                  <MenuItem key={f} value={f}>
                    {f}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Damage notes" value={returnDamageNotes} onChange={(e) => setReturnDamageNotes(e.target.value)} fullWidth multiline rows={2} />
            </Grid>
            <Grid item xs={6}>
              <TextField select label="Payment status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)} fullWidth>
                {PAYMENT_STATUSES.map((p) => (
                  <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>
                    {p.replace('_', ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Amount paid ($)" type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setReturnOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReturn} disabled={busy}>
            {busy ? 'Saving…' : 'Confirm return'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

function Detail({ label, value, to }: { label: string; value?: string | null; to?: string }) {
  return (
    <Grid item xs={6} sm={4}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {to ? (
        <Typography variant="body2">
          <Link component={RouterLink} to={to}>
            {value || '—'}
          </Link>
        </Typography>
      ) : (
        <Typography variant="body2">{value || '—'}</Typography>
      )}
    </Grid>
  );
}
