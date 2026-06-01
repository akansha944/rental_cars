import { ReactNode } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { BRAND_GRADIENT } from '../theme';

const highlights = [
  'Track every vehicle, WOF, rego & insurance date',
  'Digital rental agreements signed online',
  'Automatic expiry & return reminders',
  'Your customers and data, kept private & secure',
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Brand panel (hidden on small screens) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '46%',
          p: 6,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          background: BRAND_GRADIENT,
        }}
      >
        {/* decorative blobs */}
        <Box
          sx={{
            position: 'absolute',
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            top: -120,
            right: -120,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            bottom: -80,
            left: -60,
          }}
        />

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: 'relative' }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DirectionsCarIcon />
          </Box>
          <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: '1.4rem' }}>
            RentalFlow
          </Typography>
        </Stack>

        <Box sx={{ position: 'relative' }}>
          <Typography
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 800,
              fontSize: '2.4rem',
              lineHeight: 1.1,
              mb: 3,
              letterSpacing: '-0.02em',
            }}
          >
            Run your rental business like a pro.
          </Typography>
          <Stack spacing={1.5}>
            {highlights.map((h) => (
              <Stack key={h} direction="row" spacing={1.5} alignItems="center">
                <CheckCircleRoundedIcon sx={{ fontSize: 22, opacity: 0.95 }} />
                <Typography sx={{ fontWeight: 500, opacity: 0.95 }}>{h}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Typography variant="caption" sx={{ opacity: 0.8, position: 'relative' }}>
          © {new Date().getFullYear()} RentalFlow. All rights reserved.
        </Typography>
      </Box>

      {/* Form panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 5 },
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>{children}</Box>
      </Box>
    </Box>
  );
}
