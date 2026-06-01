import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Divider,
  Alert,
  Snackbar,
  Stack,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  Tabs,
  Tab,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/BusinessOutlined';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import HelpIcon from '@mui/icons-material/HelpOutlineOutlined';
import UploadIcon from '@mui/icons-material/Upload';
import PersonAddIcon from '@mui/icons-material/PersonAddAlt1';
import { companyApi, userApi, authApi } from '../api/endpoints';
import { api } from '../api/client';
import { Company, TeamMember, UserRole } from '../types';
import { PageHeader, formatDate } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const fileUrl = (url: string) => (url.startsWith('http') ? url : `${API_BASE}${url}`);
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'aggarwalakansha944@gmail.com';

const ROLE_OPTIONS: UserRole[] = ['owner', 'manager', 'staff'];

export default function SettingsPage() {
  const { user, refreshProfile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = user?.role === 'owner' || user?.role === 'manager';
  const isOwner = user?.role === 'owner';

  const [tab, setTab] = useState<'company' | 'team' | 'security' | 'support'>('company');
  const [signingLinkBase, setSigningLinkBase] = useState('');

  // ── Team state ──
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ name: '', email: '', password: '', role: 'staff' as UserRole });
  const [inviting, setInviting] = useState(false);

  // ── Password state ──
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    companyApi.get().then(setCompany).catch((err) => setError(apiErrorMessage(err)));
    if (user?.role === 'owner' || user?.role === 'manager') {
      userApi.list().then(setTeam).catch(() => undefined);
    }
    api
      .get<{ clientUrl: string }>('/health')
      .then((r) => setSigningLinkBase(r.data.clientUrl.replace(/\/+$/, '')))
      .catch(() => undefined);
  }, [user?.role]);

  const liveOrigin =
    typeof window !== 'undefined' ? window.location.origin.replace(/\/+$/, '') : '';
  const linkConfigBad =
    signingLinkBase &&
    (/localhost|127\.0\.0\.1|onrender\.com/i.test(signingLinkBase) ||
      (liveOrigin && !liveOrigin.includes('localhost') && signingLinkBase !== liveOrigin));

  const set = (key: keyof Company) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCompany((c) => (c ? { ...c, [key]: e.target.value } : c));

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    setError('');
    try {
      await companyApi.update({
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        city: company.city,
        country: company.country,
        termsAndConditions: company.termsAndConditions,
      });
      await refreshProfile();
      setToast('Company settings saved.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const updated = await companyApi.uploadLogo(file);
      setCompany(updated);
      await refreshProfile();
      setToast('Logo updated.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInvite = async () => {
    setInviting(true);
    setError('');
    try {
      await userApi.create(invite);
      setInviteOpen(false);
      setInvite({ name: '', email: '', password: '', role: 'staff' });
      setTeam(await userApi.list());
      setToast('Team member added. Share their email and password so they can log in.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (member: TeamMember, role: UserRole) => {
    try {
      await userApi.update(member.id, { role });
      setTeam(await userApi.list());
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const handleActiveToggle = async (member: TeamMember, active: boolean) => {
    try {
      await userApi.update(member.id, { active });
      setTeam(await userApi.list());
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const handleChangePassword = async () => {
    setError('');
    if (pw.next.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (pw.next !== pw.confirm) {
      setError('New password and confirmation do not match.');
      return;
    }
    setChangingPw(true);
    try {
      await authApi.changePassword({ currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      setToast('Password updated.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setChangingPw(false);
    }
  };

  if (!company) return null;

  return (
    <Box>
      <PageHeader title="Settings" subtitle="Company profile, team, and account security" />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {!canEdit && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Only owners and managers can edit company settings and manage the team.
        </Alert>
      )}

      <Box sx={{ maxWidth: 880 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { minHeight: 48 } }}
        >
          <Tab value="company" icon={<BusinessIcon />} iconPosition="start" label="Company" />
          {canEdit && <Tab value="team" icon={<GroupIcon />} iconPosition="start" label="Team" />}
          <Tab value="security" icon={<LockIcon />} iconPosition="start" label="Security" />
          <Tab value="support" icon={<HelpIcon />} iconPosition="start" label="Support" />
        </Tabs>

        {/* ── Company profile ── */}
        {tab === 'company' && (
        <Card>
          <CardContent>
            {linkConfigBad && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Agreement email links are configured as <strong>{signingLinkBase}</strong> but you
                are using <strong>{liveOrigin || 'this site'}</strong>. Email links may not open on
                phones. In Render, set <strong>CLIENT_URL</strong> to your exact Vercel URL (no
                trailing slash), then create a new rental.
              </Alert>
            )}
            {signingLinkBase && !linkConfigBad && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Agreement email links use: <strong>{signingLinkBase}</strong> — matches this site.
              </Alert>
            )}
            <Typography variant="h6" gutterBottom>
              Company profile
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              These details appear on generated rental agreements and customer emails.
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Avatar
                src={company.logo ? fileUrl(company.logo) : undefined}
                variant="rounded"
                sx={{ width: 72, height: 72, bgcolor: 'action.hover', color: 'text.secondary' }}
              >
                {company.name?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle2">Company logo</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Shown on agreements and the signing page. PNG or JPG recommended.
                </Typography>
                {canEdit && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      hidden
                      onChange={handleLogo}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? 'Uploading…' : company.logo ? 'Replace logo' : 'Upload logo'}
                    </Button>
                  </>
                )}
              </Box>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Company name" value={company.name ?? ''} onChange={set('name')} fullWidth disabled={!canEdit} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email" value={company.email ?? ''} onChange={set('email')} fullWidth disabled={!canEdit} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Phone" value={company.phone ?? ''} onChange={set('phone')} fullWidth disabled={!canEdit} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Address" value={company.address ?? ''} onChange={set('address')} fullWidth disabled={!canEdit} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="City" value={company.city ?? ''} onChange={set('city')} fullWidth disabled={!canEdit} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Country" value={company.country ?? ''} onChange={set('country')} fullWidth disabled={!canEdit} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Rental terms & conditions"
                  value={company.termsAndConditions ?? ''}
                  onChange={set('termsAndConditions')}
                  fullWidth
                  multiline
                  rows={6}
                  disabled={!canEdit}
                />
              </Grid>
            </Grid>
            {canEdit && (
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
        )}

        {/* ── Team members ── */}
        {canEdit && tab === 'team' && (
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6">Team members</Typography>
                <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setInviteOpen(true)}>
                  Add member
                </Button>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Give your staff their own logins. Owners manage everything, managers run day-to-day
                operations, and staff handle rentals.
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <TableContainer>
                <Table sx={{ minWidth: 640 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Last login</TableCell>
                      <TableCell align="center">Active</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {team.map((m) => {
                      const isSelf = m.id === user?.id;
                      // Only an owner can assign/alter the owner role.
                      const roleOptions = isOwner ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r !== 'owner');
                      const canManageRow = isOwner || m.role !== 'owner';
                      return (
                        <TableRow key={m.id} hover>
                          <TableCell>
                            <strong>{m.name}</strong>
                            {isSelf && <Chip label="You" size="small" sx={{ ml: 1 }} />}
                          </TableCell>
                          <TableCell>{m.email}</TableCell>
                          <TableCell>
                            <TextField
                              select
                              size="small"
                              value={m.role}
                              onChange={(e) => handleRoleChange(m, e.target.value as UserRole)}
                              disabled={!canManageRow || isSelf}
                              sx={{ minWidth: 120, textTransform: 'capitalize' }}
                            >
                              {roleOptions.map((r) => (
                                <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>
                                  {r}
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          <TableCell>{m.lastLoginAt ? formatDate(m.lastLoginAt) : 'Never'}</TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={m.active}
                              onChange={(e) => handleActiveToggle(m, e.target.checked)}
                              disabled={!canManageRow || isSelf}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* ── Security ── */}
        {tab === 'security' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Change password
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Use at least 8 characters. You'll stay logged in here, but other devices will need to
              sign in again.
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Current password"
                  type="password"
                  value={pw.current}
                  onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="New password"
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Confirm new password"
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                  fullWidth
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={changingPw || !pw.current || !pw.next}
              >
                {changingPw ? 'Updating…' : 'Update password'}
              </Button>
            </Box>
          </CardContent>
        </Card>
        )}

        {/* ── Support ── */}
        {tab === 'support' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Help & support
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Questions, feedback, or something not working? We'd love to hear from you — email{' '}
              <Link href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link> and we'll get back to you.
            </Typography>
          </CardContent>
        </Card>
        )}
      </Box>

      {/* ── Invite dialog ── */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add team member</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                label="Full name"
                value={invite.name}
                onChange={(e) => setInvite((i) => ({ ...i, name: e.target.value }))}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                value={invite.email}
                onChange={(e) => setInvite((i) => ({ ...i, email: e.target.value }))}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={7}>
              <TextField
                label="Temporary password"
                value={invite.password}
                onChange={(e) => setInvite((i) => ({ ...i, password: e.target.value }))}
                fullWidth
                required
                helperText="At least 8 characters. Share this with them to log in."
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                select
                label="Role"
                value={invite.role}
                onChange={(e) => setInvite((i) => ({ ...i, role: e.target.value as UserRole }))}
                fullWidth
              >
                {(isOwner ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r !== 'owner')).map((r) => (
                  <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleInvite}
            disabled={inviting || !invite.name || !invite.email || invite.password.length < 8}
          >
            {inviting ? 'Adding…' : 'Add member'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
