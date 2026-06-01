import { useEffect, useState } from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
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
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { rentalApi } from '../api/endpoints';
import { Rental, Customer, Vehicle } from '../types';
import {
  PageHeader,
  RentalStatusChip,
  PaymentStatusChip,
  EmptyState,
  formatDate,
  formatMoney,
} from '../components/common';
import { apiErrorMessage } from '../api/client';

export default function RentalsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = ((): 'all' | 'active' | 'returned' => {
    const s = searchParams.get('status');
    return s === 'active' || s === 'returned' || s === 'all' ? s : 'active';
  })();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [tab, setTab] = useState<'all' | 'active' | 'returned'>(initialTab);
  const [error, setError] = useState('');

  useEffect(() => {
    const status = tab === 'all' ? undefined : tab;
    rentalApi
      .list({ status })
      .then(setRentals)
      .catch((err) => setError(apiErrorMessage(err)));
  }, [tab]);

  return (
    <Box>
      <PageHeader
        title="Rentals"
        subtitle="Issue cars, track active rentals and process returns"
        action={
          <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/rentals/new">
            New Rental
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Active" value="active" />
          <Tab label="Returned" value="returned" />
          <Tab label="All" value="all" />
        </Tabs>
        <TableContainer>
          <Table sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Pickup</TableCell>
                <TableCell>Return</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rentals.map((r) => {
                const cust = r.customer as Customer;
                const veh = r.vehicle as Vehicle;
                return (
                  <TableRow key={r._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/rentals/${r._id}`)}>
                    <TableCell>
                      <strong>{r.reference}</strong>
                    </TableCell>
                    <TableCell>{cust?.fullName ?? '—'}</TableCell>
                    <TableCell>
                      {veh?.plateNumber} · {veh?.make} {veh?.model}
                    </TableCell>
                    <TableCell>{formatDate(r.pickupDate)}</TableCell>
                    <TableCell>{formatDate(r.returnDate)}</TableCell>
                    <TableCell>{formatMoney(r.totalPrice)}</TableCell>
                    <TableCell>
                      <PaymentStatusChip status={r.paymentStatus} />
                    </TableCell>
                    <TableCell>
                      <RentalStatusChip status={r.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {rentals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ border: 0 }}>
                    {tab === 'active' ? (
                      <EmptyState
                        icon={<ReceiptLongOutlinedIcon />}
                        title="No active rentals"
                        description="When you issue a car to a customer, it'll show up here."
                        actionLabel="New rental"
                        onAction={() => navigate('/rentals/new')}
                      />
                    ) : (
                      <EmptyState
                        icon={<ReceiptLongOutlinedIcon />}
                        title="No rentals to show"
                        description="Nothing matches this view yet."
                      />
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
