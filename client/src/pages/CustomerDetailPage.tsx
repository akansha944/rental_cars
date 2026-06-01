import { useEffect, useState, useRef } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Link,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';
import { customerApi } from '../api/endpoints';
import { Customer, Rental, Vehicle } from '../types';
import { PageHeader, formatDate, formatMoney, RentalStatusChip } from '../components/common';
import { apiErrorMessage } from '../api/client';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

function fileUrl(url: string) {
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!id) return;
    try {
      const data = await customerApi.get(id);
      setCustomer(data.customer);
      setRentals(data.rentals);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      const updated = await customerApi.uploadFile(id, file);
      setCustomer(updated);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!customer)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <PageHeader
        title={customer.fullName}
        subtitle="Customer profile"
        action={
          <Button component={RouterLink} to="/customers" variant="outlined">
            Back to customers
          </Button>
        }
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.2}>
                <Detail label="Phone" value={customer.phone} />
                <Detail label="Email" value={customer.email} />
                <Detail label="Address" value={customer.address} />
                <Detail label="Licence number" value={customer.licenceNumber} />
                <Detail label="Licence expiry" value={formatDate(customer.licenceExpiry)} />
                {customer.notes && <Detail label="Notes" value={customer.notes} />}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2.5 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Documents</Typography>
                <Button size="small" startIcon={<UploadFileIcon />} onClick={() => fileInput.current?.click()}>
                  Upload
                </Button>
                <input ref={fileInput} type="file" hidden onChange={handleUpload} accept="image/*,application/pdf" />
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              {customer.documents.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No documents uploaded (licence, passport, ID, etc).
                </Typography>
              ) : (
                <List dense>
                  {customer.documents.map((doc, i) => (
                    <ListItem key={i} disableGutters>
                      <DescriptionIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Link href={fileUrl(doc.url)} target="_blank" rel="noopener">
                        {doc.filename}
                      </Link>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rental history
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {rentals.length === 0 ? (
                <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>
                  No rentals yet.
                </Typography>
              ) : (
                <List>
                  {rentals.map((r) => {
                    const veh = r.vehicle as Vehicle;
                    return (
                      <ListItemButton key={r._id} component={RouterLink} to={`/rentals/${r._id}`} sx={{ px: 1, borderRadius: 1 }}>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <span>{r.reference}</span>
                              <RentalStatusChip status={r.status} />
                            </Stack>
                          }
                          secondary={`${veh?.plateNumber ?? ''} · ${formatDate(r.pickupDate)} → ${formatDate(
                            r.returnDate
                          )} · ${formatMoney(r.totalPrice)}`}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value || '—'}</Typography>
    </Box>
  );
}
