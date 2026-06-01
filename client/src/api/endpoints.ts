import { api, publicApi } from './client';
import {
  AuthUser,
  Company,
  Vehicle,
  Customer,
  Rental,
  Agreement,
  TeamMember,
  UserRole,
  DashboardData,
  AppNotification,
} from '../types';

// ── Auth ───────────────────────────────────────────────
export const authApi = {
  signup: (data: {
    companyName: string;
    companyEmail: string;
    companyPhone?: string;
    name: string;
    email: string;
    password: string;
  }) =>
    api
      .post<{ accessToken: string; user: AuthUser; company: Company }>('/auth/signup', data)
      .then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api
      .post<{ accessToken: string; user: AuthUser; company: Company }>('/auth/login', data)
      .then((r) => r.data),
  me: () => api.get<{ user: AuthUser; company: Company }>('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<{ message: string }>('/auth/change-password', data).then((r) => r.data),
};

// ── Team members ───────────────────────────────────────
export const userApi = {
  list: () => api.get<TeamMember[]>('/users').then((r) => r.data),
  create: (data: { name: string; email: string; password: string; role: UserRole }) =>
    api.post<TeamMember>('/users', data).then((r) => r.data),
  update: (id: string, data: { name?: string; role?: UserRole; active?: boolean }) =>
    api.patch<TeamMember>(`/users/${id}`, data).then((r) => r.data),
};

// ── Dashboard & notifications ──────────────────────────
export const dashboardApi = {
  get: () => api.get<DashboardData>('/dashboard').then((r) => r.data),
  notifications: () =>
    api
      .get<{ notifications: AppNotification[]; unreadCount: number }>('/dashboard/notifications')
      .then((r) => r.data),
  markRead: (id: string) => api.patch(`/dashboard/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post('/dashboard/notifications/read-all').then((r) => r.data),
  runReminders: () =>
    api
      .post<{ message: string; notificationsCreated: number; expiry: number; ending: number }>(
        '/dashboard/run-reminders'
      )
      .then((r) => r.data),
};

// ── Vehicles ───────────────────────────────────────────
export const vehicleApi = {
  list: (params?: { status?: string; search?: string }) =>
    api.get<Vehicle[]>('/vehicles', { params }).then((r) => r.data),
  get: (id: string) => api.get<Vehicle>(`/vehicles/${id}`).then((r) => r.data),
  create: (data: Partial<Vehicle>) => api.post<Vehicle>('/vehicles', data).then((r) => r.data),
  update: (id: string, data: Partial<Vehicle>) =>
    api.patch<Vehicle>(`/vehicles/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/vehicles/${id}`).then((r) => r.data),
  uploadFile: (id: string, file: File, type: 'photo' | 'document') => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<Vehicle>(`/vehicles/${id}/files?type=${type}`, form)
      .then((r) => r.data);
  },
};

// ── Customers ──────────────────────────────────────────
export const customerApi = {
  list: (params?: { search?: string }) =>
    api.get<Customer[]>('/customers', { params }).then((r) => r.data),
  get: (id: string) =>
    api
      .get<{ customer: Customer; rentals: Rental[] }>(`/customers/${id}`)
      .then((r) => r.data),
  create: (data: Partial<Customer>) =>
    api.post<Customer>('/customers', data).then((r) => r.data),
  update: (id: string, data: Partial<Customer>) =>
    api.patch<Customer>(`/customers/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/customers/${id}`).then((r) => r.data),
  uploadFile: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<Customer>(`/customers/${id}/files`, form).then((r) => r.data);
  },
};

// ── Rentals ────────────────────────────────────────────
export const rentalApi = {
  list: (params?: { status?: string }) =>
    api.get<Rental[]>('/rentals', { params }).then((r) => r.data),
  get: (id: string) => api.get<Rental>(`/rentals/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api
      .post<{ rental: Rental; signingLink?: string }>('/rentals', data)
      .then((r) => r.data),
  return: (id: string, data: Record<string, unknown>) =>
    api.post<Rental>(`/rentals/${id}/return`, data).then((r) => r.data),
  updatePayment: (id: string, data: Record<string, unknown>) =>
    api.patch<Rental>(`/rentals/${id}/payment`, data).then((r) => r.data),
  resendAgreement: (id: string) =>
    api
      .post<{ message: string; channels: string[]; link: string }>(
        `/rentals/${id}/resend-agreement`
      )
      .then((r) => r.data),
  getSigningLink: (id: string) =>
    api.get<{ link: string }>(`/rentals/${id}/signing-link`).then((r) => r.data),
};

// ── Company ────────────────────────────────────────────
export const companyApi = {
  get: () => api.get<Company>('/company').then((r) => r.data),
  update: (data: Partial<Company>) => api.patch<Company>('/company', data).then((r) => r.data),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<Company>('/company/logo', form).then((r) => r.data);
  },
};

// ── Agreements (authenticated) ─────────────────────────
export const agreementApi = {
  list: (params?: { status?: string }) =>
    api.get<Agreement[]>('/agreements', { params }).then((r) => r.data),
  getPublic: (token: string) =>
    publicApi
      .get<{
        status: string;
        content: Record<string, unknown>;
        alreadySigned: boolean;
        signedAt?: string;
        signedPdfUrl?: string;
      }>(`/public/agreements/${token}`)
      .then((r) => r.data),
  sign: (token: string, data: { signedName: string; signatureDataUrl: string; agree: true }) =>
    publicApi
      .post<{ message: string; signedAt: string; signedPdfUrl?: string }>(
        `/public/agreements/${token}/sign`,
        data
      )
      .then((r) => r.data),
};
