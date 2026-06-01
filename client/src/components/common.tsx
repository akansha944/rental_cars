import { Box, Chip, Typography, Stack, Button } from '@mui/material';
import { ReactNode } from 'react';
import { alpha } from '@mui/material/styles';
import { VehicleStatus, RentalStatus, PaymentStatus, AgreementStatus } from '../types';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h4">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Stack alignItems="center" spacing={1.5} sx={{ py: 7, px: 2, textAlign: 'center' }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.main',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
          '& svg': { fontSize: 32 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}

const vehicleColors: Record<VehicleStatus, 'success' | 'info' | 'warning' | 'default'> = {
  available: 'success',
  rented: 'info',
  maintenance: 'warning',
  unavailable: 'default',
};

const rentalColors: Record<RentalStatus, 'info' | 'success' | 'default'> = {
  active: 'info',
  returned: 'success',
  cancelled: 'default',
};

const paymentColors: Record<PaymentStatus, 'warning' | 'info' | 'success' | 'default'> = {
  pending: 'warning',
  partially_paid: 'info',
  paid: 'success',
  refunded: 'default',
};

const agreementColors: Record<AgreementStatus, 'default' | 'info' | 'success' | 'error' | 'warning'> =
  {
    draft: 'default',
    sent: 'info',
    signed: 'success',
    declined: 'error',
    expired: 'warning',
  };

export function VehicleStatusChip({ status }: { status: VehicleStatus }) {
  return <Chip size="small" color={vehicleColors[status]} label={status} sx={{ textTransform: 'capitalize' }} />;
}
export function RentalStatusChip({ status }: { status: RentalStatus }) {
  return <Chip size="small" color={rentalColors[status]} label={status} sx={{ textTransform: 'capitalize' }} />;
}
export function PaymentStatusChip({ status }: { status: PaymentStatus }) {
  return (
    <Chip
      size="small"
      color={paymentColors[status]}
      label={status.replace('_', ' ')}
      sx={{ textTransform: 'capitalize' }}
    />
  );
}
export function AgreementStatusChip({ status }: { status: AgreementStatus }) {
  return <Chip size="small" color={agreementColors[status]} label={status} sx={{ textTransform: 'capitalize' }} />;
}

export function formatDate(d?: string | Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-NZ', { dateStyle: 'medium' });
}

export function formatMoney(n?: number): string {
  return `$${(n ?? 0).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function daysUntil(d?: string | Date | null): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}
