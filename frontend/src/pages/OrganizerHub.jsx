import { Link } from 'react-router-dom';
import { CalendarDays, Megaphone, Settings2, Ticket, Users } from 'lucide-react';
import EventTicket from '../components/EventTicket.jsx';
import { EmptyState, ErrorState, PageHeader, Skeleton, Stat } from '../components/ui.jsx';
import { organizerApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useTitle } from '../hooks/useTitle.js';
import { coverFor, plural } from '../utils/format.js';

export default function OrganizerHub() {
  useTitle('Organizer hub');
  const { isOrganizer } = useAuth();
  const { data, loading, error, reload } = useAsync(() => (isOrganizer ? organizerApi.dashboard() : Promise.resolve(null)), [isOrganizer]);

  if (!isOrganizer) {
    return (
      <>
        <PageHeader title="Organizer hub" />
        <EmptyState icon={Megaphone} title="You don't organize a club yet">
          Organizers are assigned by a campus admin. Once you are one, your clubs and their events show up here.
        </EmptyState>
      </>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading) return <><Skeleton h={90} r={14} /><div style={{ height: 16 }} /><Skeleton h={260} r={14} /></>;

  const max = Math.max(1, ...data.clubs.map((c) => c.total_active_participants));

  return (
    <>
      <PageHeader title="Organizer hub" subtitle="How your clubs are doing." />
      <div className="stats stats-4">
        <Stat icon={Users} tone="blue" label="Clubs you run" value={data.total_managed_clubs} />
        <Stat icon={CalendarDays} tone="pink" label="Events" value={data.total_events} />
        <Stat icon={Ticket} tone="mint" label="Active participants" value={data.total_active_participants} />
        <Stat icon={Megaphone} tone="sun" label="Upcoming" value={data.total_upcoming_events} />
      </div>

      <h2 className="section-title">Your clubs</h2>
      <ul className="rows">
        {data.clubs.map((c) => (
          <li key={c.id} className="row-item" style={coverFor(c.id)}>
            <div className="date-chip"><b>{c.name.charAt(0).toUpperCase()}</b></div>
            <div className="row-main">
              <Link to={`/clubs/${c.id}`} className="row-title">{c.name}</Link>
              <span className="muted small">{plural(c.total_events, 'event')} and {plural(c.total_active_participants, 'participant')}</span>
              <div className="bar" aria-hidden="true"><i style={{ width: `${(c.total_active_participants / max) * 100}%` }} /></div>
            </div>
            <div className="row-side"><Link to={`/manage/${c.id}`} className="btn btn-primary btn-sm"><Settings2 size={15} /> Manage</Link></div>
          </li>
        ))}
      </ul>

      <h2 className="section-title">Upcoming events</h2>
      {data.upcoming_events.length ? (
        <div className="grid-2">
          {data.upcoming_events.map((ev) => (
            <div key={ev.id} className="stack">
              <EventTicket event={ev} clubName={ev.club_name}>
                <span className="chip chip-link">{plural(ev.total_registrations, 'registration')}</span>
              </EventTicket>
              <Link to={`/manage/${ev.club_id}/events/${ev.id}/participants`} className="btn btn-ghost btn-sm">View participants</Link>
            </div>
          ))}
        </div>
      ) : <p className="muted">No upcoming published events. Create one from a club's manage page.</p>}
    </>
  );
}
