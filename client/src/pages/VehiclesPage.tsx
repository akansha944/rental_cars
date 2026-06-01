import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Stack,
  Alert,
  Typography,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { vehicleApi } from '../api/endpoints';
import { Vehicle, VehicleStatus } from '../types';
import { PageHeader, VehicleStatusChip, EmptyState, formatDate, daysUntil } from '../components/common';
import { apiErrorMessage } from '../api/client';

const STATUSES: VehicleStatus[] = ['available', 'rented', 'maintenance', 'unavailable'];

interface FormState {
  plateNumber: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  colour: string;
  odometer: string;
  dailyRate: string;
  status: VehicleStatus;
  wofExpiry: Dayjs | null;
  registrationExpiry: Dayjs | null;
  insuranceExpiry: Dayjs | null;
  serviceDueDate: Dayjs | null;
  notes: string;
}

const emptyForm: FormState = {
  plateNumber: '',
  make: '',
  model: '',
  year: '',
  vin: '',
  colour: '',
  odometer: '',
  dailyRate: '',
  status: 'available',
  wofExpiry: null,
  registrationExpiry: null,
  insuranceExpiry: null,
  serviceDueDate: null,
  notes: '',
};

function ExpiryCell({ date }: { date?: string }) {
  const d = daysUntil(date);
  const color = d === null ? 'text.secondary' : d < 0 ? 'error.main' : d <= 14 ? 'warning.main' : 'text.primary';
  return (
    <Typography variant="body2" color={color}>
      {formatDate(date)}
    </Typography>
  );
}

export default function VehiclesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const setStatusFilter = (status: string) => {
    if (status) setSearchParams({ status });
    else setSearchParams({});
  };

  const load = useCallback(async () => {
    try {
      setVehicles(
        await vehicleApi.list({
          search: search || undefined,
          status: statusFilter || undefined,
        })
      );
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      plateNumber: v.plateNumber,
      make: v.make,
      model: v.model,
      year: v.year?.toString() ?? '',
      vin: v.vin ?? '',
      colour: v.colour ?? '',
      odometer: v.odometer?.toString() ?? '',
      dailyRate: v.dailyRate?.toString() ?? '',
      status: v.status,
      wofExpiry: v.wofExpiry ? dayjs(v.wofExpiry) : null,
      registrationExpiry: v.registrationExpiry ? dayjs(v.registrationExpiry) : null,
      insuranceExpiry: v.insuranceExpiry ? dayjs(v.insuranceExpiry) : null,
      serviceDueDate: v.serviceDueDate ? dayjs(v.serviceDueDate) : null,
      notes: v.notes ?? '',
    });
    setOpen(true);
  };

  const set = (key: keyof FormState) => (value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const payload: Partial<Vehicle> = {
      plateNumber: form.plateNumber,
      make: form.make,
      model: form.model,
      year: form.year ? Number(form.year) : undefined,
      vin: form.vin || undefined,
      colour: form.colour || undefined,
      odometer: form.odometer ? Number(form.odometer) : undefined,
      dailyRate: form.dailyRate ? Number(form.dailyRate) : undefined,
      status: form.status,
      wofExpiry: form.wofExpiry?.toISOString(),
      registrationExpiry: form.registrationExpiry?.toISOString(),
      insuranceExpiry: form.insuranceExpiry?.toISOString(),
      serviceDueDate: form.serviceDueDate?.toISOString(),
      notes: form.notes || undefined,
    };
    try {
      if (editing) await vehicleApi.update(editing._id, payload);
      else await vehicleApi.create(payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: Vehicle) => {
    if (!confirm(`Delete vehicle ${v.plateNumber}?`)) return;
    try {
      await vehicleApi.remove(v._id);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <Box>
      <PageHeader
        title="Vehicles"
        subtitle="Manage your rental fleet and compliance dates"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Add Vehicle
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1 }}>
            <Chip
              label="All"
              color={statusFilter === '' ? 'primary' : 'default'}
              variant={statusFilter === '' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('')}
            />
            {STATUSES.map((s) => (
              <Chip
                key={s}
                label={s.charAt(0).toUpperCase() + s.slice(1)}
                color={statusFilter === s ? 'primary' : 'default'}
                variant={statusFilter === s ? 'filled' : 'outlined'}
                onClick={() => setStatusFilter(s)}
              />
            ))}
          </Stack>
          <TextField
            placeholder="Search plate, make, model, VIN…"
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
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Plate</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>WOF</TableCell>
                <TableCell>Rego</TableCell>
                <TableCell>Insurance</TableCell>
                <TableCell>Odometer</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.map((v) => (
                <TableRow key={v._id} hover>
                  <TableCell>
                    <strong>{v.plateNumber}</strong>
                  </TableCell>
                  <TableCell>
                    {v.year ? `${v.year} ` : ''}
                    {v.make} {v.model}
                    {v.colour ? ` · ${v.colour}` : ''}
                  </TableCell>
                  <TableCell>
                    <VehicleStatusChip status={v.status} />
                  </TableCell>
                  <TableCell>
                    <ExpiryCell date={v.wofExpiry} />
                  </TableCell>
                  <TableCell>
                    <ExpiryCell date={v.registrationExpiry} />
                  </TableCell>
                  <TableCell>
                    <ExpiryCell date={v.insuranceExpiry} />
                  </TableCell>
                  <TableCell>{v.odometer?.toLocaleString() ?? '—'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(v)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(v)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {vehicles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ border: 0 }}>
                    {search || statusFilter ? (
                      <EmptyState
                        icon={<SearchIcon />}
                        title="No vehicles match your filters"
                        description="Try a different status or clear your search."
                      />
                    ) : (
                      <EmptyState
                        icon={<DirectionsCarOutlinedIcon />}
                        title="Add your first vehicle"
                        description="Track plates, WOF, registration, insurance and service dates — all in one place."
                        actionLabel="Add vehicle"
                        onAction={openCreate}
                      />
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={4}>
              <TextField label="Plate number" value={form.plateNumber} onChange={(e) => set('plateNumber')(e.target.value)} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Make" value={form.make} onChange={(e) => set('make')(e.target.value)} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Model" value={form.model} onChange={(e) => set('model')(e.target.value)} fullWidth required />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="Year" type="number" value={form.year} onChange={(e) => set('year')(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="Colour" value={form.colour} onChange={(e) => set('colour')(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="VIN" value={form.vin} onChange={(e) => set('vin')(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="Odometer (km)" type="number" value={form.odometer} onChange={(e) => set('odometer')(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="Daily rate ($)" type="number" value={form.dailyRate} onChange={(e) => set('dailyRate')(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Status" value={form.status} onChange={(e) => set('status')(e.target.value)} fullWidth>
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={3}>
              <DatePicker label="WOF expiry" value={form.wofExpiry} onChange={set('wofExpiry')} slotProps={{ textField: { fullWidth: true } }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker label="Rego expiry" value={form.registrationExpiry} onChange={set('registrationExpiry')} slotProps={{ textField: { fullWidth: true } }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker label="Insurance expiry" value={form.insuranceExpiry} onChange={set('insuranceExpiry')} slotProps={{ textField: { fullWidth: true } }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker label="Service due" value={form.serviceDueDate} onChange={set('serviceDueDate')} slotProps={{ textField: { fullWidth: true } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" value={form.notes} onChange={(e) => set('notes')(e.target.value)} fullWidth multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
