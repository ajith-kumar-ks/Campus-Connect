import { Link } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import { coverFor, dateParts, fmtTime } from '../utils/format.js';

/* The signature element of the app: every event is a ticket stub.
   `event.sample` renders a non-clickable illustration (landing page only). */
export default function EventTicket({ event, clubName, registered, children, tilt }) {
  const parts = dateParts(event.start_time);
  const Tag = event.sample ? 'div' : Link;
  const props = event.sample ? {} : { to: `/events/${event.id}` };

  return (
    <Tag {...props} className="ticket" style={{ ...coverFor(event.id), ...(tilt ? { transform: tilt } : null) }}>
      <div className="ticket-date">
        <span className="t-month">{parts.month}</span>
        <span className="t-day">{parts.day}</span>
        <span className="t-week">{parts.weekday}</span>
      </div>
      <div className="ticket-body">
        <h3 className="ticket-title">{event.title}</h3>
        {clubName && <p className="ticket-club">{clubName}</p>}
        <ul className="meta">
          <li><Clock size={15} /> {fmtTime(event.start_time)} to {fmtTime(event.end_time)}</li>
          <li><MapPin size={15} /> {event.venue}</li>
        </ul>
        {(event.category || children) && (
          <div className="ticket-tags">
            {event.category && <span className="chip">{event.category}</span>}
            {children}
          </div>
        )}
      </div>
      {registered && <span className="stamp">Going</span>}
    </Tag>
  );
}
