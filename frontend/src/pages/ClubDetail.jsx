import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarX, Settings2 } from 'lucide-react';
import EventTicket from '../components/EventTicket.jsx';
import { EmptyState, ErrorState, Skeleton, Spinner, StatusBadge } from '../components/ui.jsx';
import { clubApi, eventApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useRegisteredIds } from '../hooks/useRegisteredIds.js';
import { useTitle } from '../hooks/useTitle.js';
import { coverFor } from '../utils/format.js';

export default function ClubDetail() {
  const { clubId } = useParams();
  const toast = useToast();
  const { membershipFor, isOrganizerOf, refreshMemberships } = useAuth();
  const { ids } = useRegisteredIds();
  const club = useAsync(() => clubApi.get(clubId), [clubId]);
  const events = useAsync(() => eventApi.list({ club_id: clubId, limit: 50 }), [clubId]);
  const [joining, setJoining] = useState(false);
  useTitle(club.data?.name || 'Club');

  if (club.error) return <ErrorState error={club.error} onRetry={club.reload} title="Club not found" />;
  if (club.loading) return <Skeleton h={240} r={22} />;

  const c = club.data;
  const m = membershipFor(c.id);

  async function join() {
    setJoining(true);
    try { await clubApi.join(c.id); await refreshMemberships(); toast.success('Request sent. An organizer will review it.'); }
    catch (err) { toast.error(err.message); } finally { setJoining(false); }
  }

  return (
    <>
      <section className="poster" style={coverFor(c.id)}>
        <div className="poster-tags"><span className="chip chip-solid">{c.category}</span></div>
        <h1>{c.name}</h1>
        <p className="poster-desc">{c.description}</p>
        <div className="row">
          {m?.status === 'active' && <StatusBadge status="active" label={m.role === 'organizer' ? 'You organize this club' : 'You are a member'} />}
          {m?.status === 'pending' && <StatusBadge status="pending" label="Request pending" />}
          {(!m || m.status === 'rejected') && (
            <button className="btn btn-primary" onClick={join} disabled={joining}>{joining && <Spinner size={16} />} {m ? 'Request again' : 'Join club'}</button>
          )}
          {isOrganizerOf(c.id) && <Link to={`/manage/${c.id}`} className="btn btn-sun"><Settings2 size={17} /> Manage club</Link>}
        </div>
      </section>

      <h2 className="section-title">Upcoming events</h2>
      {events.loading ? <Skeleton h={140} r={22} /> : events.data?.items.length ? (
        <div className="grid-2">{events.data.items.map((ev) => <EventTicket key={ev.id} event={ev} registered={ids.has(ev.id)} />)}</div>
      ) : (
        <EmptyState icon={CalendarX} title="No published events">This club has nothing scheduled right now.</EmptyState>
      )}
    </>
  );
}
