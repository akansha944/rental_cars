import { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { TextField, Button, Typography, Alert, Stack, Link, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import { AuthLayout } from '../components/AuthLayout';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to your company workspace to manage your fleet.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" textAlign="center" mt={4} color="text.secondary">
        New company?{' '}
        <Link component={RouterLink} to="/signup" fontWeight={600}>
          Create an account
        </Link>
      </Typography>
    </AuthLayout>
  );
}
