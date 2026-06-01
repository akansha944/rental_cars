import { Link as RouterLink, Navigate } from 'react-router-dom';
import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EventNoteIcon from '@mui/icons-material/EventNote';
import DescriptionIcon from '@mui/icons-material/Description';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PeopleIcon from '@mui/icons-material/People';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import { alpha } from '@mui/material/styles';
import { BRAND_GRADIENT } from '../theme';
import { useColorMode } from '../context/ColorModeContext';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: <DirectionsCarIcon />, title: 'Vehicle management', desc: 'Track every car with WOF, registration, insurance and service dates in one place.' },
  { icon: <DescriptionIcon />, title: 'Digital agreements', desc: 'Auto-generate rental agreements and collect legally-binding e-signatures by email.' },
  { icon: <NotificationsActiveIcon />, title: 'Smart reminders', desc: 'Never miss a WOF or rego deadline — automatic email & SMS alerts before they expire.' },
  { icon: <PeopleIcon />, title: 'Customer records', desc: 'Store licences, IDs and full rental history for every customer, securely.' },
  { icon: <EventNoteIcon />, title: 'Rentals & returns', desc: 'Issue cars in seconds and process returns with odometer, fuel and damage tracking.' },
  { icon: <ShieldIcon />, title: 'Private & secure', desc: 'Each company gets its own isolated workspace with role-based staff access.' },
];

const plans = [
  {
    name: 'Starter',
    price: '$0',
    period: '/mo',
    tagline: 'For getting started',
    features: ['Up to 5 vehicles', 'Unlimited customers', 'Digital agreements', 'Email reminders'],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    tagline: 'For growing fleets',
    features: ['Unlimited vehicles', 'SMS + email reminders', 'Branded agreements', 'Staff roles & permissions', 'Priority support'],
    highlighted: true,
  },
  {
    name: 'Business',
    price: 'Custom',
    period: '',
    tagline: 'For large operations',
    features: ['Everything in Pro', 'Multiple locations', 'API access', 'Dedicated onboarding'],
    highlighted: false,
  },
];

export default function LandingPage() {
  const { mode, toggle } = useColorMode();
  const { user } = useAuth();

  // Logged-in users go straight to the app.
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <Box sx={{ bgcolor: 'background.default', overflowX: 'hidden' }}>
      {/* ── Nav ───────────────────────────────────────── */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'saturate(180%) blur(12px)',
          backgroundColor: (t) => alpha(t.palette.background.default, 0.8),
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" sx={{ py: 1.5 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexGrow: 1 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2.5,
                  background: BRAND_GRADIENT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DirectionsCarIcon sx={{ color: '#fff', fontSize: 20 }} />
              </Box>
              <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: '1.2rem' }}>
                RentalFlow
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton onClick={toggle} size="small">
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
              <Button
                component={RouterLink}
                to="/login"
                color="inherit"
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Sign in
              </Button>
              <Button component={RouterLink} to="/signup" variant="contained">
                Get started
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ── Hero ──────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 10 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Chip
              label="Built for rental car companies"
              sx={{ mb: 3, fontWeight: 600, bgcolor: (t) => alpha(t.palette.primary.main, 0.1), color: 'primary.main' }}
            />
            <Typography variant="h2" sx={{ fontSize: { xs: '2.4rem', md: '3.4rem' }, mb: 2 }}>
              Manage your rental fleet,{' '}
              <Box
                component="span"
                sx={{
                  background: BRAND_GRADIENT,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                effortlessly.
              </Box>
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 4, maxWidth: 520 }}>
              RentalFlow keeps your vehicles, customers, rentals, signed agreements and compliance
              dates organised in one secure platform — so nothing slips through the cracks.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button component={RouterLink} to="/signup" variant="contained" size="large">
                Start free today
              </Button>
              <Button component={RouterLink} to="/login" variant="outlined" size="large">
                Sign in
              </Button>
            </Stack>
            <Stack direction="row" spacing={3} sx={{ mt: 4, flexWrap: 'wrap', rowGap: 1 }}>
              {['No credit card', 'Setup in minutes', 'Cancel anytime'].map((t) => (
                <Stack key={t} direction="row" spacing={0.75} alignItems="center">
                  <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    {t}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                borderRadius: 5,
                p: { xs: 4, md: 6 },
                background: BRAND_GRADIENT,
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
                minHeight: 340,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: '0 30px 60px -20px rgba(79,70,229,0.5)',
              }}
            >
              <Box sx={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.12)', top: -80, right: -60 }} />
              <DirectionsCarIcon sx={{ fontSize: 56, mb: 2, position: 'relative' }} />
              <Typography variant="h4" sx={{ mb: 1, position: 'relative' }}>
                Everything in one dashboard
              </Typography>
              <List sx={{ position: 'relative' }}>
                {['See which cars are available or rented', 'Documents expiring soon, at a glance', 'Signed agreements stored automatically'].map((t) => (
                  <ListItem key={t} disableGutters sx={{ py: 0.4 }}>
                    <ListItemIcon sx={{ minWidth: 32, color: '#fff' }}>
                      <CheckCircleRoundedIcon />
                    </ListItemIcon>
                    <ListItemText primary={t} primaryTypographyProps={{ fontWeight: 500 }} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* ── Features ──────────────────────────────────── */}
      <Box sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.04), py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Stack alignItems="center" textAlign="center" sx={{ mb: 6 }}>
            <Typography variant="h3" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, mb: 1.5 }}>
              Everything you need to run a rental business
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 600 }}>
              Replace messy spreadsheets and paperwork with one professional platform.
            </Typography>
          </Stack>
          <Grid container spacing={3}>
            {features.map((f) => (
              <Grid item xs={12} sm={6} md={4} key={f.title}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.main',
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                        mb: 2,
                      }}
                    >
                      {f.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {f.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Pricing ───────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Stack alignItems="center" textAlign="center" sx={{ mb: 6 }}>
          <Typography variant="h3" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, mb: 1.5 }}>
            Simple, transparent pricing
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            Start free. Upgrade as your fleet grows.
          </Typography>
        </Stack>
        <Grid container spacing={3} alignItems="stretch" justifyContent="center">
          {plans.map((plan) => (
            <Grid item xs={12} md={4} key={plan.name}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  ...(plan.highlighted && {
                    borderColor: 'primary.main',
                    boxShadow: '0 20px 50px -20px rgba(79,70,229,0.5)',
                  }),
                }}
              >
                {plan.highlighted && (
                  <Chip
                    label="Most popular"
                    color="primary"
                    size="small"
                    sx={{ position: 'absolute', top: 16, right: 16 }}
                  />
                )}
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="overline" color="text.secondary">
                    {plan.tagline}
                  </Typography>
                  <Typography variant="h5" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 2 }}>
                    <Typography variant="h3" sx={{ fontSize: '2.4rem' }}>
                      {plan.price}
                    </Typography>
                    <Typography color="text.secondary">{plan.period}</Typography>
                  </Stack>
                  <Button
                    component={RouterLink}
                    to="/signup"
                    fullWidth
                    variant={plan.highlighted ? 'contained' : 'outlined'}
                    sx={{ mb: 2 }}
                  >
                    Get started
                  </Button>
                  <Divider sx={{ mb: 2 }} />
                  <List dense disablePadding>
                    {plan.features.map((feat) => (
                      <ListItem key={feat} disableGutters sx={{ py: 0.3 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText primary={feat} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ── CTA ───────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            borderRadius: 5,
            px: { xs: 4, md: 8 },
            py: { xs: 6, md: 8 },
            background: BRAND_GRADIENT,
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <CloudDoneIcon sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h3" sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, mb: 2 }}>
            Ready to organise your rental business?
          </Typography>
          <Typography sx={{ opacity: 0.9, mb: 4, maxWidth: 540, mx: 'auto' }}>
            Join rental companies who run their fleet the smart way. Set up your workspace in minutes.
          </Typography>
          <Button
            component={RouterLink}
            to="/signup"
            size="large"
            sx={{ bgcolor: '#fff', color: 'primary.main', '&:hover': { bgcolor: '#f1f5f9' } }}
          >
            Create your free account
          </Button>
        </Box>
      </Container>

      {/* ── Footer ────────────────────────────────────── */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', py: 4 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} RentalFlow. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3}>
              <Typography variant="body2" color="text.secondary">Privacy</Typography>
              <Typography variant="body2" color="text.secondary">Terms</Typography>
              <Typography variant="body2" color="text.secondary">Contact</Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
