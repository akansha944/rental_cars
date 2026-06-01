import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { authApi } from '../api/endpoints';
import { setAccessToken, getAccessToken, refreshAccessToken } from '../api/client';
import { AuthUser, Company } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  company: Company | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: Parameters<typeof authApi.signup>[0]) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const data = await authApi.me();
      setUser(data.user);
      setCompany(data.company);
    } catch {
      setUser(null);
      setCompany(null);
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => undefined);
    setAccessToken(null);
    setUser(null);
    setCompany(null);
  }, []);

  // Bootstrap session on mount: use a stored access token, otherwise try to
  // restore the session from the httpOnly refresh-token cookie.
  useEffect(() => {
    (async () => {
      let token = getAccessToken();
      if (!token) {
        token = await refreshAccessToken();
      }
      if (token) {
        await loadProfile();
      }
      setLoading(false);
    })();
  }, [loadProfile]);

  // Force logout when a refresh fails (emitted by the axios interceptor).
  useEffect(() => {
    const handler = () => {
      setAccessToken(null);
      setUser(null);
      setCompany(null);
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    setCompany(data.company);
  }, []);

  const signup = useCallback(async (payload: Parameters<typeof authApi.signup>[0]) => {
    const data = await authApi.signup(payload);
    setAccessToken(data.accessToken);
    setUser(data.user);
    setCompany(data.company);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, company, loading, login, signup, logout, refreshProfile: loadProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
