import { Link } from 'react-router-dom';
import { CalendarDays, Megaphone, Ticket, Users } from 'lucide-react';
import EventTicket from '../components/EventTicket.jsx';
import { EmptyState, ErrorState, PageHeader, Skeleton, Stat, StatusBadge } from '../components/ui.jsx';
import { eventApi, userApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useTitle } from '../hooks/useTitle.js';
import { firstName, fmtDate, plural, timeUntil } from '../utils/format.js';

export default function Dashboard() {
  useTitle('Home');
  const { user, memberships, isOrganizer, organizerClubs } = useAuth();
  const { data, loading, error, reload } = useAsync(() => userApi.dashboard(), []);
  const ideas = useAsync(() => eventApi.list({ limit: 4 }), []);

  // The API's total_joined_clubs counts pending/rejected requests too, so count active ones here.
  const joined = memberships.filter((m) => m.status === 'active').length;
  const pending = memberships.filter((m) => m.status === 'pending').length;
  const upcoming = data?.upcoming_events || [];
  const next = upcoming[0];

  return (
    <>
      <PageHeader
        title={`Hey, ${firstName(user.full_name)}`}
        subtitle={fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}
        actions={<Link to="/events" className="btn btn-primary"><CalendarDays size={18} /> Browse events</Link>}
      />

      {error ? <ErrorState error={error} onRetry={reload} /> : (
        <>
          <div className="stats">
            <Stat icon={Users} tone="blue" label="Clubs joined" value={joined} note={pending ? `${plural(pending, 'request')} waiting` : null} />
            <Stat icon={Ticket} tone="pink" label="Active tickets" value={loading ? '-' : data.total_active_registrations} />
            <Stat icon={CalendarDays} tone="mint" label="Coming up" value={loading ? '-' : upcoming.length} note={next ? `Next ${timeUntil(next.start_time)}` : null} />
          </div>

          {isOrganizer && (
            <Link to="/organizer" className="callout">
              <Megaphone size={22} />
              <div>
                <strong>You organize {plural(organizerClubs.length, 'club')}</strong>
                <span>Open the organizer hub to manage events, requests and members.</span>
              </div>
              <span className="btn btn-sun btn-sm">Open hub</span>
            </Link>
          )}

          <div className="split">
            <section>
              <h2 className="section-title">Your next events</h2>
              {loading ? (
                <div className="stack"><Skeleton h={130} r={22} /><Skeleton h={130} r={22} /></div>
              ) : upcoming.length ? (
                <div className="stack-lg">{upcoming.map((ev) => <EventTicket key={ev.id} event={ev} registered />)}</div>
              ) : (
                <>
                  <EmptyState icon={Ticket} title="No tickets yet" action={<Link to="/events" className="btn btn-primary btn-sm">Find an event</Link>}>
                    Register for an event and it will show up here.
                  </EmptyState>
                  {ideas.data?.items?.length > 0 && (
                    <>
                      <h2 className="section-title">Happening on campus</h2>
                      <div className="stack-lg">{ideas.data.items.map((ev) => <EventTicket key={ev.id} event={ev} />)}</div>
                    </>
                  )}
                </>
              )}
            </section>

            <section>
              <h2 className="section-title">Recent activity</h2>
              {loading ? <Skeleton h={220} r={14} /> : data.recent_activity.length ? (
                <ol className="timeline">
                  {data.recent_activity.map((a) => (
                    <li key={a.id}>
                      <Link to={`/events/${a.event.id}`}>{a.event.title}</Link>
                      <div className="row"><StatusBadge status={a.status} /><span className="muted small">{timeUntil(a.registered_at)}</span></div>
                    </li>
                  ))}
                </ol>
              ) : <p className="muted">Nothing here yet. Your registrations will be listed as you make them.</p>}
            </section>
          </div>
        </>
      )}
    </>
  );
}
