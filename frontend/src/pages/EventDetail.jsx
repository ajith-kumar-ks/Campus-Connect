import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarClock, CalendarDays, MapPin, Settings2, Users } from 'lucide-react';
import { ConfirmDialog, ErrorState, Skeleton, Spinner, StatusBadge } from '../components/ui.jsx';
import { eventApi, userApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useClubs } from '../context/ClubsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useTitle } from '../hooks/useTitle.js';
import { coverFor, fmtDateTime, fmtRange, isPast, timeUntil } from '../utils/format.js';

export default function EventDetail() {
  const { eventId } = useParams();
  const toast = useToast();
  const { clubMap } = useClubs();
  const { isOrganizerOf } = useAuth();
  const ev = useAsync(() => eventApi.get(eventId), [eventId]);
  const regs = useAsync(() => userApi.registrations({ limit: 100 }), [eventId]);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [fresh, setFresh] = useState(false);
  const event = ev.data;
  useTitle(event?.title || 'Event');

  if (ev.error) {
    return <ErrorState title="This event isn't available" error={{ message: ev.error.status === 404 ? 'It may be a draft, cancelled, or removed.' : ev.error.message }} onRetry={ev.reload} />;
  }
  if (ev.loading) return <><Skeleton h={220} r={22} /><div style={{ height: 16 }} /><Skeleton h={260} r={14} /></>;

  const club = clubMap[event.club_id];
  const myReg = regs.data?.items.find((r) => r.event.id === event.id);
  const going = myReg?.status === 'registered';
  const ended = isPast(event.end_time);
  const closed = isPast(event.registration_deadline);

  async function act(fn, ok) {
    setBusy(true);
    try { await fn(); toast.success(ok); regs.reload(); return true; }
    catch (err) { toast.error(err.message); return false; }
    finally { setBusy(false); }
  }
  const register = async () => { if (await act(() => eventApi.register(event.id), 'You are registered. See you there!')) setFresh(true); };
  const cancel = async () => { if (await act(() => eventApi.cancel(event.id), 'Registration cancelled')) { setFresh(false); setConfirm(false); } };

  return (
    <>
      <section className="poster" style={coverFor(event.id)}>
        <div className="poster-tags">
          <span className="chip chip-solid">{event.category}</span>
          {ended && <StatusBadge status="completed" label="Ended" />}
        </div>
        <h1>{event.title}</h1>
        {club && <Link className="poster-club" to={`/clubs/${club.id}`}>Hosted by {club.name}</Link>}
      </section>

      <div className="detail">
        <div className="stack-lg">
          <section className="card">
            <h2 className="section-title">About this event</h2>
            <p className="prose">{event.description}</p>
          </section>
          <section className="card">
            <h2 className="section-title">Details</h2>
            <dl className="kv">
              <dt><CalendarDays size={17} /> When</dt><dd>{fmtRange(event.start_time, event.end_time)}</dd>
              <dt><MapPin size={17} /> Where</dt><dd>{event.venue}</dd>
              <dt><CalendarClock size={17} /> Register by</dt><dd>{fmtDateTime(event.registration_deadline)}</dd>
              <dt><Users size={17} /> Seats</dt><dd>{event.capacity ? `${event.capacity} seats` : 'No limit'}</dd>
            </dl>
          </section>
        </div>

        <aside className="ticket-panel">
          <div className="card card-strong">
            {going && (
              <div className="going">
                <span className={`stamp stamp-lg ${fresh ? 'stamp-new' : ''}`}>Going</span>
                <h3>You're in</h3>
                <p className="muted">{ended ? 'This event has ended.' : `Starts ${timeUntil(event.start_time)}.`}</p>
                {!ended && <button className="btn btn-ghost btn-block" onClick={() => setConfirm(true)}>Cancel registration</button>}
              </div>
            )}
            {!going && (
              <>
                <h3>{ended ? 'This event has ended' : closed ? 'Registration closed' : `Starts ${timeUntil(event.start_time)}`}</h3>
                <p className="muted">
                  {ended ? 'Check the events page for what is coming next.'
                    : closed ? `Sign-ups closed on ${fmtDateTime(event.registration_deadline)}.`
                    : `Sign-ups close ${timeUntil(event.registration_deadline)}.`}
                </p>
                {!ended && !closed && (
                  <button className="btn btn-primary btn-lg btn-block" onClick={register} disabled={busy || regs.loading}>
                    {busy && <Spinner size={16} />} {myReg ? 'Register again' : 'Reserve my seat'}
                  </button>
                )}
              </>
            )}
          </div>
          {isOrganizerOf(event.club_id) && (
            <Link to={`/manage/${event.club_id}`} className="btn btn-sun btn-block"><Settings2 size={17} /> Manage this club</Link>
          )}
        </aside>
      </div>

      <ConfirmDialog open={confirm} title="Cancel your registration?" message="Your seat is released. You can register again later while sign-ups are open." confirmLabel="Cancel registration" danger busy={busy} onConfirm={cancel} onClose={() => setConfirm(false)} />
    </>
  );
}
