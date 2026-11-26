import { useMemo } from 'react';
import { useAsync } from './useAsync.js';
import { userApi } from '../api/index.js';

/* Events don't say whether the current user registered, so derive it from
   /users/me/registrations (the API caps a page at 100). */
export function useRegisteredIds() {
  const { data, reload } = useAsync(() => userApi.registrations({ status: 'registered', limit: 100 }), []);
  const ids = useMemo(() => new Set((data?.items || []).map((r) => r.event.id)), [data]);
  return { ids, reload };
}
