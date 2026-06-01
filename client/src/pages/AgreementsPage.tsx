import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Link,
  Alert,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { agreementApi } from '../api/endpoints';
import { Agreement, AgreementStatus } from '../types';
import { PageHeader, AgreementStatusChip, formatDate } from '../components/common';
import { apiErrorMessage } from '../api/client';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const fileUrl = (url: string) => (url.startsWith('http') ? url : `${API_BASE}${url}`);

const FILTERS: { label: string; value: '' | AgreementStatus }[] = [
  { label: 'All', value: '' },
  { label: 'Signed', value: 'signed' },
  { label: 'Sent', value: 'sent' },
  { label: 'Draft', value: 'draft' },
];

export default function AgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [status, setStatus] = useState<'' | AgreementStatus>('');
  const [error, setError] = useState('');

  useEffect(() => {
    agreementApi
      .list({ status: status || undefined })
      .then(setAgreements)
      .catch((err) => setError(apiErrorMessage(err)));
  }, [status]);

  return (
    <Box>
      <PageHeader
        title="Agreements"
        subtitle="Every rental agreement you've generated, stored securely and available anytime"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {FILTERS.map((f) => (
              <Chip
                key={f.label}
                label={f.label}
                color={status === f.value ? 'primary' : 'default'}
                variant={status === f.value ? 'filled' : 'outlined'}
                onClick={() => setStatus(f.value)}
              />
            ))}
          </Stack>
        </Box>
      </Card>

      <Card>
        <TableContainer>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Signed by</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Documents</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agreements.map((a) => {
                const rental = typeof a.rental === 'object' ? a.rental : undefined;
                const customer = typeof a.customer === 'object' ? a.customer : undefined;
                return (
                  <TableRow key={a._id} hover>
                    <TableCell>
                      {rental ? (
                        <Link component={RouterLink} to={`/rentals/${rental._id}`} fontWeight={600}>
                          {rental.reference}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{customer?.fullName ?? '—'}</TableCell>
                    <TableCell>
                      <AgreementStatusChip status={a.status} />
                    </TableCell>
                    <TableCell>{a.signature?.signedName ?? '—'}</TableCell>
                    <TableCell>
                      {a.signature?.signedAt
                        ? formatDate(a.signature.signedAt)
                        : a.sentAt
                        ? `Sent ${formatDate(a.sentAt)}`
                        : a.createdAt
                        ? `Created ${formatDate(a.createdAt)}`
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {a.signedPdf ? (
                          // Once signed, the signed copy is the official record.
                          <Tooltip title="Download signed PDF">
                            <IconButton
                              size="small"
                              color="primary"
                              component={Link}
                              href={fileUrl(a.signedPdf.url)}
                              target="_blank"
                              rel="noopener"
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : a.unsignedPdf ? (
                          // Not signed yet — only a draft exists.
                          <Tooltip title="View draft (awaiting signature)">
                            <IconButton
                              size="small"
                              component={Link}
                              href={fileUrl(a.unsignedPdf.url)}
                              target="_blank"
                              rel="noopener"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          '—'
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {agreements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
                      <DescriptionOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No agreements yet.</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Agreements are created automatically when you start a new rental.
                      </Typography>
                    </Stack>
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
