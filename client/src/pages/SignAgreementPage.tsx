import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import { agreementApi } from '../api/endpoints';
import { apiErrorMessage } from '../api/client';
import { SignaturePad, SignaturePadHandle } from '../components/SignaturePad';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const fileUrl = (url: string) => (url.startsWith('http') ? url : `${API_BASE}${url}`);

interface Content {
  reference?: string;
  company?: { name?: string; phone?: string; email?: string; address?: string; logo?: string };
  customer?: { fullName?: string; phone?: string; email?: string; licenceNumber?: string };
  vehicle?: { plateNumber?: string; make?: string; model?: string; year?: number; colour?: string };
  rental?: {
    pickupDate?: string;
    returnDate?: string;
    dailyRate?: number;
    totalPrice?: number;
    bondAmount?: number;
    pickupOdometer?: number;
    pickupFuelLevel?: string;
    pickupDamageNotes?: string;
  };
  termsAndConditions?: string;
}

function money(n?: number) {
  return `$${(n ?? 0).toFixed(2)}`;
}

export default function SignAgreementPage() {
  const { token } = useParams<{ token: string }>();
  const [content, setContent] = useState<Content | null>(null);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const padRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    if (!token) return;
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const onLiveSite = !/localhost|127\.0\.0\.1/i.test(window.location.hostname);
    if (onLiveSite && (!apiUrl || /localhost|127\.0\.0\.1/i.test(apiUrl))) {
      setLoadError(
        'This signing page cannot reach the server. The app may need VITE_API_URL set on Vercel — contact the rental company.'
      );
      return;
    }
    agreementApi
      .getPublic(token)
      .then((data) => {
        setContent(data.content as Content);
        setAlreadySigned(data.alreadySigned || data.status === 'signed');
        setSignedPdfUrl(data.signedPdfUrl);
      })
      .catch((err) => {
        const msg = apiErrorMessage(err);
        if (msg === 'Network Error') {
          setLoadError(
            'Could not load this agreement (network error). Try opening the link in Safari or Chrome, or ask the company to resend the email.'
          );
        } else {
          setLoadError(msg);
        }
      });
  }, [token]);

  const handleSubmit = async () => {
    setError('');
    if (!token) return;
    const signatureDataUrl = padRef.current?.toDataUrl();
    if (!signatureDataUrl) {
      setError('Please provide your signature.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Please type your full name.');
      return;
    }
    if (!agree) {
      setError('You must agree to the terms to continue.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await agreementApi.sign(token, {
        signedName: name.trim(),
        signatureDataUrl,
        agree: true,
      });
      setSignedPdfUrl(res.signedPdfUrl);
      setSuccess(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError)
    return (
      <CenteredCard>
        <Alert severity="error">{loadError}</Alert>
      </CenteredCard>
    );

  if (!content)
    return (
      <CenteredCard>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </CenteredCard>
    );

  if (success || alreadySigned)
    return (
      <CenteredCard>
        <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
          <Typography variant="h5">Agreement signed</Typography>
          <Typography color="text.secondary" textAlign="center">
            Thank you. Your rental agreement {content.reference ? `(${content.reference})` : ''} has been
            signed{content.company?.name ? ` and a copy has been emailed to you by ${content.company.name}` : ''}.
          </Typography>
          {signedPdfUrl && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              href={fileUrl(signedPdfUrl)}
              target="_blank"
              rel="noopener"
              sx={{ mt: 1 }}
            >
              Download signed copy
            </Button>
          )}
          <Typography variant="caption" color="text.secondary">
            You may now close this page.
          </Typography>
        </Stack>
      </CenteredCard>
    );

  const { company, customer, vehicle, rental } = content;

  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh', py: { xs: 2, md: 5 } }}>
      <Box sx={{ maxWidth: 760, mx: 'auto', px: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="center" mb={2}>
          {company?.logo ? (
            <Box
              component="img"
              src={fileUrl(company.logo)}
              alt={company?.name ?? 'Company logo'}
              sx={{ height: 48, maxWidth: 200, objectFit: 'contain' }}
            />
          ) : (
            <>
              <DirectionsCarIcon color="primary" fontSize="large" />
              <Typography variant="h5" color="primary" fontWeight={800}>
                {company?.name ?? 'RentalFlow'}
              </Typography>
            </>
          )}
        </Stack>

        <Card>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h5" gutterBottom>
              Rental Agreement
            </Typography>
            {content.reference && (
              <Typography variant="body2" color="text.secondary">
                Reference: {content.reference}
              </Typography>
            )}

            <Section title="Customer">
              <Field label="Name" value={customer?.fullName} />
              <Field label="Phone" value={customer?.phone} />
              <Field label="Email" value={customer?.email} />
              <Field label="Licence" value={customer?.licenceNumber} />
            </Section>

            <Section title="Vehicle">
              <Field label="Vehicle" value={`${vehicle?.year ?? ''} ${vehicle?.make ?? ''} ${vehicle?.model ?? ''}`.trim()} />
              <Field label="Plate" value={vehicle?.plateNumber} />
              <Field label="Colour" value={vehicle?.colour} />
            </Section>

            <Section title="Rental terms">
              <Field label="Pickup" value={rental?.pickupDate} />
              <Field label="Return" value={rental?.returnDate} />
              <Field label="Daily rate" value={money(rental?.dailyRate)} />
              <Field label="Total" value={money(rental?.totalPrice)} />
              <Field label="Bond" value={money(rental?.bondAmount)} />
              <Field label="Odometer" value={rental?.pickupOdometer?.toString()} />
              <Field label="Fuel" value={rental?.pickupFuelLevel} />
            </Section>

            {content.termsAndConditions && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Terms & Conditions
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: 'pre-wrap', maxHeight: 180, overflow: 'auto', p: 1.5, bgcolor: '#fafafa', borderRadius: 1 }}
                >
                  {content.termsAndConditions}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Sign below
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <TextField
              label="Type your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <SignaturePad ref={padRef} />

            <FormControlLabel
              sx={{ mt: 1 }}
              control={<Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} />}
              label="I have read and agree to the terms and conditions of this rental agreement."
            />

            <Button
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Sign & Submit Agreement'}
            </Button>
          </CardContent>
        </Card>
        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
          Secured by RentalFlow · This signature is legally binding.
        </Typography>
      </Box>
    </Box>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ maxWidth: 480, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>{children}</CardContent>
      </Card>
    </Box>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mt: 2.5 }}>
      <Typography variant="subtitle2" color="primary" gutterBottom>
        {title}
      </Typography>
      <Grid container spacing={1.5}>
        {children}
      </Grid>
    </Box>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <Grid item xs={6} sm={4}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value || '—'}</Typography>
    </Grid>
  );
}
