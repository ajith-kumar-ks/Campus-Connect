import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clubApi } from '../api/index.js';
import { useAuth } from './AuthContext.jsx';

const ClubsCtx = createContext(null);

/* Events only carry club_id, so keep one shared club list to resolve names. */
export function ClubsProvider({ children }) {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try { setClubs(await clubApi.list()); } catch { /* pages show their own errors */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (user) reload(); else setClubs([]);
  }, [user, reload]);

  const value = useMemo(
    () => ({ clubs, loading, reload, clubMap: Object.fromEntries(clubs.map((c) => [c.id, c])) }),
    [clubs, loading, reload]
  );
  return <ClubsCtx.Provider value={value}>{children}</ClubsCtx.Provider>;
}

export const useClubs = () => useContext(ClubsCtx);
