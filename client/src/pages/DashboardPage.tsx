import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Snackbar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import KeyIcon from '@mui/icons-material/Key';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { dashboardApi } from '../api/endpoints';
import { DashboardData, Customer, Vehicle } from '../types';
import { PageHeader, formatDate } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { BRAND_GRADIENT } from '../theme';
import { apiErrorMessage } from '../api/client';

function StatCard({
  label,
  value,
  icon,
  color,
  to,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  to?: string;
}) {
  const navigate = useNavigate();
  return (
    <Card
      onClick={to ? () => navigate(to) : undefined}
      sx={{
        height: '100%',
        cursor: to ? 'pointer' : 'default',
        transition: 'transform .18s ease, box-shadow .18s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 28px -12px rgba(16,24,40,0.22)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              bgcolor: alpha(color, 0.12),
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" sx={{ lineHeight: 1.1 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function WelcomeCard({
  companyName,
  steps,
}: {
  companyName?: string;
  steps: { label: string; to: string; done: boolean }[];
}) {
  return (
    <Card sx={{ mb: 2.5, background: BRAND_GRADIENT, color: '#fff', border: 'none' }}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="h5" sx={{ mb: 0.5 }}>
          Welcome{companyName ? `, ${companyName}` : ''} 👋
        </Typography>
        <Typography sx={{ opacity: 0.92, mb: 2.5 }}>
          Let's get your workspace set up. Follow these quick steps to start managing rentals.
        </Typography>
        <Stack spacing={1.5}>
          {steps.map((s, i) => (
            <Stack key={s.label} direction="row" spacing={1.5} alignItems="center">
              {s.done ? (
                <CheckCircleRoundedIcon sx={{ color: '#fff' }} />
              ) : (
                <RadioButtonUncheckedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
              )}
              <Typography
                sx={{ flexGrow: 1, textDecoration: s.done ? 'line-through' : 'none', opacity: s.done ? 0.8 : 1 }}
              >
                {i + 1}. {s.label}
              </Typography>
              {!s.done && (
                <Button
                  size="small"
                  component={RouterLink}
                  to={s.to}
                  sx={{ bgcolor: '#fff', color: 'primary.main', '&:hover': { bgcolor: '#f1f5f9' } }}
                >
                  Start
                </Button>
              )}
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { company } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    dashboardApi
      .get()
      .then(setData)
      .catch((err) => setError(apiErrorMessage(err)));
  }, []);

  const handleRunReminders = async () => {
    setRunning(true);
    try {
      const res = await dashboardApi.runReminders();
      setToast(
        res.notificationsCreated > 0
          ? `Sent ${res.notificationsCreated} reminder(s) — check your email & the bell icon.`
          : 'Reminder scan ran — nothing is due within the reminder window right now.'
      );
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );

  const { stats, expiringDocs, endingSoon } = data;
  const setupComplete = stats.totalVehicles > 0 && stats.totalCustomers > 0 && stats.activeRentals > 0;
  const setupSteps = [
    { label: 'Add your first vehicle', to: '/vehicles', done: stats.totalVehicles > 0 },
    { label: 'Add your first customer', to: '/customers', done: stats.totalCustomers > 0 },
    { label: 'Create your first rental', to: '/rentals/new', done: stats.activeRentals > 0 },
  ];

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="An overview of your fleet and upcoming actions"
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<NotificationsActiveIcon />}
              onClick={handleRunReminders}
              disabled={running}
            >
              {running ? 'Checking…' : 'Check reminders now'}
            </Button>
            <Button variant="contained" component={RouterLink} to="/rentals/new">
              New Rental
            </Button>
          </Stack>
        }
      />

      {!setupComplete && <WelcomeCard companyName={company?.name} steps={setupSteps} />}

      <Grid container spacing={2.5} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard label="Vehicles" value={stats.totalVehicles} icon={<DirectionsCarIcon />} color="#4F46E5" to="/vehicles" />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard label="Available" value={stats.available} icon={<EventAvailableIcon />} color="#16A34A" to="/vehicles?status=available" />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard label="Rented" value={stats.rented} icon={<KeyIcon />} color="#0EA5E9" to="/vehicles?status=rented" />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard label="Maintenance" value={stats.maintenance} icon={<BuildIcon />} color="#F59E0B" to="/vehicles?status=maintenance" />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard label="Customers" value={stats.totalCustomers} icon={<PeopleIcon />} color="#06B6D4" to="/customers" />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard label="Active rentals" value={stats.activeRentals} icon={<ReceiptLongIcon />} color="#7C3AED" to="/rentals?status=active" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Documents expiring soon
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                WOF, registration, insurance and service dates within the next 30 days.
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {expiringDocs.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  Nothing expiring in the next 30 days. 🎉
                </Typography>
              ) : (
                <List>
                  {expiringDocs.map((v) => (
                    <ListItem
                      key={v.vehicleId}
                      secondaryAction={
                        <Button size="small" component={RouterLink} to="/vehicles">
                          View
                        </Button>
                      }
                      sx={{ px: 0 }}
                    >
                      <ListItemText
                        primary={`${v.plateNumber} — ${v.label}`}
                        secondary={
                          <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap" useFlexGap>
                            {v.items.map((it) => (
                              <Chip
                                key={it.type}
                                size="small"
                                color={it.daysLeft < 0 ? 'error' : it.daysLeft <= 7 ? 'warning' : 'default'}
                                label={`${it.type}: ${
                                  it.daysLeft < 0 ? `${Math.abs(it.daysLeft)}d overdue` : `${it.daysLeft}d`
                                }`}
                              />
                            ))}
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rentals ending soon
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Active rentals due back within 3 days.
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {endingSoon.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No rentals ending soon.
                </Typography>
              ) : (
                <List>
                  {endingSoon.map((r) => {
                    const cust = r.customer as Customer;
                    const veh = r.vehicle as Vehicle;
                    return (
                      <ListItem
                        key={r._id}
                        secondaryAction={
                          <Button size="small" component={RouterLink} to={`/rentals/${r._id}`}>
                            Open
                          </Button>
                        }
                        sx={{ px: 0 }}
                      >
                        <ListItemText
                          primary={`${cust?.fullName ?? 'Customer'} — ${veh?.plateNumber ?? ''}`}
                          secondary={`Due ${formatDate(r.returnDate)}`}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={!!toast}
        autoHideDuration={6000}
        onClose={() => setToast('')}
        message={toast}
      />
    </Box>
  );
}
