import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, userApi } from '../api/index.js';
import { TOKEN_KEY } from '../api/client.js';
import { useToast } from './ToastContext.jsx';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [booting, setBooting] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const clear = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setMemberships([]);
  }, []);

  /* Organizer rights are per club (a membership with role "organizer"), so besides /users/me
     we also load the user's memberships (/users/me/clubs, max 100). */
  const loadProfile = useCallback(async () => {
    const [me, mine] = await Promise.all([userApi.me(), userApi.clubs({ limit: 100 })]);
    setUser(me);
    setMemberships(mine.items);
    return me;
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    loadProfile().catch(clear).finally(() => setBooting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onExpired = () => {
      if (localStorage.getItem(TOKEN_KEY)) {
        clear();
        toast.info('Your session ended. Log in again to continue.');
      }
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [clear, toast]);

  const login = useCallback(async (email, password) => {
    // The API lowercases the email on login, so always send it lowercased.
    const { access_token } = await authApi.login(email.trim().toLowerCase(), password);
    localStorage.setItem(TOKEN_KEY, access_token);
    try {
      await loadProfile();
    } catch (err) {
      clear();
      throw err;
    }
  }, [loadProfile, clear]);

  const register = useCallback(async ({ full_name, email, password }) => {
    // Store the email lowercased too: the API saves it as typed but compares lowercase on login.
    const normalized = email.trim().toLowerCase();
    await authApi.register({ full_name: full_name.trim(), email: normalized, password });
    await login(normalized, password);
  }, [login]);

  const value = useMemo(() => {
    const organizerClubs = memberships.filter((m) => m.role === 'organizer' && m.status === 'active');
    return {
      user,
      booting,
      memberships,
      organizerClubs,
      isAdmin: user?.role === 'admin',
      isOrganizer: organizerClubs.length > 0,
      membershipFor: (clubId) => memberships.find((m) => m.club.id === Number(clubId)),
      isOrganizerOf: (clubId) => organizerClubs.some((m) => m.club.id === Number(clubId)),
      login,
      register,
      logout: clear,
      refreshProfile: loadProfile,
      refreshMemberships: async () => {
        const mine = await userApi.clubs({ limit: 100 });
        setMemberships(mine.items);
      },
    };
  }, [user, booting, memberships, login, register, clear, loadProfile]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
