import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { customerApi } from '../api/endpoints';
import { Customer } from '../types';
import { PageHeader, EmptyState, formatDate, daysUntil } from '../components/common';
import { apiErrorMessage } from '../api/client';

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  licenceNumber: string;
  licenceExpiry: Dayjs | null;
  notes: string;
}

const emptyForm: FormState = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  licenceNumber: '',
  licenceExpiry: null,
  notes: '',
};

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setCustomers(await customerApi.list({ search: search || undefined }));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const set = (key: keyof FormState) => (value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await customerApi.create({
        fullName: form.fullName,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        licenceNumber: form.licenceNumber || undefined,
        licenceExpiry: form.licenceExpiry?.toISOString(),
        notes: form.notes || undefined,
      });
      setOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Customers"
        subtitle="Manage customer records and verification documents"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            Add Customer
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <Box sx={{ p: 2 }}>
          <TextField
            placeholder="Search name, phone, email, licence…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Licence</TableCell>
                <TableCell>Licence expiry</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((c) => {
                const d = daysUntil(c.licenceExpiry);
                return (
                  <TableRow key={c._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/customers/${c._id}`)}>
                    <TableCell>
                      <strong>{c.fullName}</strong>
                    </TableCell>
                    <TableCell>{c.phone ?? '—'}</TableCell>
                    <TableCell>{c.email ?? '—'}</TableCell>
                    <TableCell>{c.licenceNumber ?? '—'}</TableCell>
                    <TableCell sx={{ color: d !== null && d < 0 ? 'error.main' : undefined }}>
                      {formatDate(c.licenceExpiry)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ border: 0 }}>
                    {search ? (
                      <EmptyState
                        icon={<SearchIcon />}
                        title="No customers match your search"
                        description="Try a different name, phone, email or licence number."
                      />
                    ) : (
                      <EmptyState
                        icon={<PeopleOutlineIcon />}
                        title="Add your first customer"
                        description="Store contact details, licences and rental history securely for every customer."
                        actionLabel="Add customer"
                        onAction={() => setOpen(true)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Customer</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField label="Full name" value={form.fullName} onChange={(e) => set('fullName')(e.target.value)} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Phone" value={form.phone} onChange={(e) => set('phone')(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Address" value={form.address} onChange={(e) => set('address')(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Licence number" value={form.licenceNumber} onChange={(e) => set('licenceNumber')(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker label="Licence expiry" value={form.licenceExpiry} onChange={set('licenceExpiry')} slotProps={{ textField: { fullWidth: true } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" value={form.notes} onChange={(e) => set('notes')(e.target.value)} fullWidth multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
