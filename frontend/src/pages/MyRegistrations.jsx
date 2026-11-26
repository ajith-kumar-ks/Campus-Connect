import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { ConfirmDialog, EmptyState, ErrorState, PageHeader, Pagination, Skeleton, StatusBadge, Tabs } from '../components/ui.jsx';
import { eventApi, userApi } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useTitle } from '../hooks/useTitle.js';
import { coverFor, dateParts, fmtRange, isPast } from '../utils/format.js';

const PAGE = 10;

export default function MyRegistrations() {
  useTitle('My tickets');
  const toast = useToast();
  const [tab, setTab] = useState('registered');
  const [skip, setSkip] = useState(0);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsync(
    () => userApi.registrations({ status: tab === 'all' ? undefined : tab, skip, limit: PAGE }), [tab, skip]);

  async function cancel() {
    setBusy(true);
    try { await eventApi.cancel(target.event.id); toast.success('Registration cancelled'); setTarget(null); reload(); }
    catch (err) { toast.error(err.message); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="My tickets" subtitle="Every event you registered for." />
      <Tabs value={tab} onChange={(v) => { setTab(v); setSkip(0); }}
        tabs={[{ value: 'registered', label: 'Going' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'all', label: 'All' }]} />

      {error ? <ErrorState error={error} onRetry={reload} /> : loading ? <Skeleton h={300} r={14} /> : data.items.length ? (
        <>
          <ul className="rows">
            {data.items.map((r) => {
              const p = dateParts(r.event.start_time);
              const over = isPast(r.event.end_time);
              return (
                <li key={r.id} className="row-item" style={coverFor(r.event.id)}>
                  <div className="date-chip"><b>{p.day}</b><span>{p.month}</span></div>
                  <div className="row-main">
                    <Link to={`/events/${r.event.id}`} className="row-title">{r.event.title}</Link>
                    <span className="muted small">{fmtRange(r.event.start_time, r.event.end_time)} at {r.event.venue}</span>
                  </div>
                  <div className="row-side">
                    <StatusBadge status={r.status} />
                    {over && r.status === 'registered' && <span className="badge badge-mute">Attended window over</span>}
                    {r.status === 'registered' && !over && <button className="btn btn-ghost btn-sm" onClick={() => setTarget(r)}>Cancel</button>}
                  </div>
                </li>
              );
            })}
          </ul>
          <Pagination skip={data.skip} limit={data.limit} total={data.total} onChange={setSkip} />
        </>
      ) : (
        <EmptyState icon={Ticket} title="No tickets here" action={<Link to="/events" className="btn btn-primary btn-sm">Browse events</Link>}>
          {tab === 'cancelled' ? 'You have not cancelled any registrations.' : 'Register for an event and your ticket will appear here.'}
        </EmptyState>
      )}
      <ConfirmDialog open={Boolean(target)} danger busy={busy} title="Cancel this registration?" confirmLabel="Cancel registration"
        message={`Your seat for ${target?.event.title || 'this event'} will be released.`} onConfirm={cancel} onClose={() => setTarget(null)} />
    </>
  );
}
