import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { TextField, Button, Typography, Alert, Stack, Link, Divider, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import { AuthLayout } from '../components/AuthLayout';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Create your workspace
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Set up your company account in under a minute.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary">
            Company details
          </Typography>
          <TextField label="Company name" value={form.companyName} onChange={update('companyName')} required fullWidth />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Company email" type="email" value={form.companyEmail} onChange={update('companyEmail')} required fullWidth />
            <TextField label="Company phone" value={form.companyPhone} onChange={update('companyPhone')} fullWidth />
          </Stack>

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" color="text.secondary">
            Your owner account
          </Typography>
          <TextField label="Your name" value={form.name} onChange={update('name')} required fullWidth />
          <TextField label="Your email" type="email" value={form.email} onChange={update('email')} required fullWidth />
          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={update('password')}
            required
            fullWidth
            helperText="At least 8 characters"
          />

          <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
            {loading ? 'Creating…' : 'Create account'}
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" textAlign="center" mt={3} color="text.secondary">
        Already have an account?{' '}
        <Link component={RouterLink} to="/login" fontWeight={600}>
          Sign in
        </Link>
      </Typography>
    </AuthLayout>
  );
}
