import { useCallback, useEffect, useRef, useState } from 'react';

/* Runs `fn` on mount and whenever `deps` change.
   loading    -> first load (no data yet): show skeletons
   refreshing -> reloading while old data is still on screen */
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    setBusy(true);
    setError(null);
    Promise.resolve()
      .then(() => fnRef.current())
      .then((d) => { if (alive) { setData(d); setBusy(false); } })
      .catch((e) => { if (alive) { setError(e); setBusy(false); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, setData, error, reload, loading: busy && data === null && !error, refreshing: busy && data !== null };
}
