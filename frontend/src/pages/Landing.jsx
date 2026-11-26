import { Link, Navigate } from 'react-router-dom';
import { CalendarCheck, Megaphone, ShieldCheck } from 'lucide-react';
import EventTicket from '../components/EventTicket.jsx';
import Logo from '../components/Logo.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { eventApi } from '../api/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { useTitle } from '../hooks/useTitle.js';

/* Illustration only: shown when the API has no published events yet. */
function samples() {
  const at = (days, h) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, 0, 0, 0); return d.toISOString(); };
  return [
    { id: 11, sample: true, title: 'Open mic night', venue: 'Amphitheatre', category: 'Music', start_time: at(3, 18), end_time: at(3, 21) },
    { id: 12, sample: true, title: 'Hack the weekend', venue: 'Innovation lab', category: 'Technology', start_time: at(6, 9), end_time: at(6, 17) },
    { id: 13, sample: true, title: 'Sunrise photo walk', venue: 'Lake gate', category: 'Arts', start_time: at(9, 6), end_time: at(9, 8) },
  ];
}

const TILTS = ['rotate(-3deg)', 'rotate(2deg)', 'rotate(-1.5deg)'];

export default function Landing() {
  useTitle();
  const { user } = useAuth();
  const { data } = useAsync(() => eventApi.list({ limit: 3 }), []);
  if (user) return <Navigate to="/home" replace />;

  const real = data?.items || [];
  const tickets = data && real.length === 0 ? samples() : real;

  return (
    <div className="landing">
      <header className="land-nav">
        <Logo />
        <div className="row">
          <ThemeToggle />
          <Link to="/login" className="btn btn-ghost">Log in</Link>
          <Link to="/register" className="btn btn-primary">Join now</Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <h1>Find your club. <span className="hl">Save your seat.</span></h1>
          <p>
            Campus Connect lists every club and event at your college. Join a club, reserve a
            spot in one tap, and keep all your tickets in one place.
          </p>
          <div className="row">
            <Link to="/register" className="btn btn-primary btn-lg">Create your account</Link>
            <Link to="/login" className="btn btn-ghost btn-lg">I already have one</Link>
          </div>
        </div>
        <div className="hero-tickets" aria-label="Upcoming events">
          {tickets.map((ev, i) => (
            <div key={ev.id} className="deal" style={{ '--i': i }}>
              <EventTicket event={ev} tilt={TILTS[i % 3]} registered={i === 0} />
            </div>
          ))}
        </div>
      </section>

      <section className="roles">
        <div className="role">
          <span className="stat-icon tone-blue"><CalendarCheck size={22} /></span>
          <h3>For students</h3>
          <p>Browse events by date, club or category, request to join clubs, and cancel a registration any time before the event.</p>
        </div>
        <div className="role">
          <span className="stat-icon tone-pink"><Megaphone size={22} /></span>
          <h3>For organizers</h3>
          <p>Create and publish events, approve membership requests, and export a participant list as a spreadsheet.</p>
        </div>
        <div className="role">
          <span className="stat-icon tone-sun"><ShieldCheck size={22} /></span>
          <h3>For admins</h3>
          <p>Set up clubs, edit their details, and decide who gets to organize them.</p>
        </div>
      </section>
      <footer className="land-foot">Campus Connect</footer>
    </div>
  );
}
