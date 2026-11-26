import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Users } from 'lucide-react';
import { Avatar, EmptyState, ErrorState, PageHeader, Pagination, Skeleton, Spinner, StatusBadge } from '../components/ui.jsx';
import { clubApi, eventApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useTitle } from '../hooks/useTitle.js';
import { fmtDateTime } from '../utils/format.js';
import { findCached } from '../utils/eventCache.js';

const PAGE = 20;

export default function Participants() {
  const { clubId, eventId } = useParams();
  const toast = useToast();
  const { isOrganizerOf } = useAuth();
  const [skip, setSkip] = useState(0);
  const [exporting, setExporting] = useState(false);

  const list = useAsync(() => eventApi.participants(clubId, eventId, { skip, limit: PAGE }), [clubId, eventId, skip]);
  // The participants endpoint only returns user ids, so resolve names through the club's member list.
  const members = useAsync(() => clubApi.members(clubId), [clubId]);
  const event = useAsync(() => eventApi.get(eventId).catch(() => findCached(clubId, eventId) || null), [eventId]);
  const byUser = useMemo(() => Object.fromEntries((members.data || []).map((m) => [m.user.id, m.user])), [members.data]);
  useTitle('Participants');

  async function download() {
    setExporting(true);
    try {
      const blob = await eventApi.exportParticipants(clubId, eventId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-${eventId}-participants.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { toast.error(err.message); } finally { setExporting(false); }
  }

  if (!isOrganizerOf(clubId)) return <EmptyState title="Organizers only">You can't view this participant list.</EmptyState>;

  return (
    <>
      <Link to={`/manage/${clubId}`} className="back"><ArrowLeft size={16} /> Back to club</Link>
      <PageHeader
        title="Participants"
        subtitle={event.data?.title || `Event ${eventId}`}
        actions={<button className="btn btn-primary" onClick={download} disabled={exporting}>{exporting ? <Spinner size={16} /> : <Download size={18} />} Export CSV</button>}
      />
      {list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : list.loading ? <Skeleton h={260} r={14} /> : list.data.items.length ? (
        <>
          <p className="muted result-count">{list.data.total} registered or cancelled. Names show for club members; the CSV export has everyone.</p>
          <ul className="rows">
            {list.data.items.map((r) => {
              const u = byUser[r.user_id];
              return (
                <li key={r.id} className="row-item">
                  <Avatar name={u?.full_name || `S ${r.user_id}`} />
                  <div className="row-main">
                    <span className="row-title">{u?.full_name || `Student #${r.user_id}`}</span>
                    <span className="muted small">{u ? `${u.email}. ` : ''}Registered {fmtDateTime(r.registered_at)}</span>
                  </div>
                  <div className="row-side"><StatusBadge status={r.status} /></div>
                </li>
              );
            })}
          </ul>
          <Pagination skip={list.data.skip} limit={list.data.limit} total={list.data.total} onChange={setSkip} />
        </>
      ) : <EmptyState icon={Users} title="No registrations yet">When students register, they will be listed here.</EmptyState>}
    </>
  );
}
