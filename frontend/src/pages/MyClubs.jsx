import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings2, UsersRound } from 'lucide-react';
import { EmptyState, PageHeader, StatusBadge, Tabs } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTitle } from '../hooks/useTitle.js';
import { coverFor, fmtDate } from '../utils/format.js';

export default function MyClubs() {
  useTitle('My clubs');
  const { memberships } = useAuth();
  const [tab, setTab] = useState('all');
  const count = (s) => memberships.filter((m) => m.status === s).length;
  const list = memberships.filter((m) => tab === 'all' || m.status === tab);

  return (
    <>
      <PageHeader title="My clubs" subtitle="Your memberships and join requests." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'all', label: 'All', count: memberships.length },
        { value: 'active', label: 'Active', count: count('active') },
        { value: 'pending', label: 'Pending', count: count('pending') },
        { value: 'rejected', label: 'Rejected', count: count('rejected') },
      ]} />
      {list.length ? (
        <ul className="rows">
          {list.map((m) => (
            <li key={m.id} className="row-item" style={coverFor(m.club.id)}>
              <div className="date-chip"><b>{m.club.name.charAt(0).toUpperCase()}</b></div>
              <div className="row-main">
                <Link to={`/clubs/${m.club.id}`} className="row-title">{m.club.name}</Link>
                <span className="muted small">{m.joined_at ? `Joined ${fmtDate(m.joined_at)}` : 'Waiting for an organizer to respond'}</span>
              </div>
              <div className="row-side">
                {m.status === 'active' && <StatusBadge status={m.role} />}
                <StatusBadge status={m.status} />
                {m.status === 'active' && m.role === 'organizer' && <Link to={`/manage/${m.club.id}`} className="btn btn-sun btn-sm"><Settings2 size={15} /> Manage</Link>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={UsersRound} title="Nothing here yet" action={<Link to="/clubs" className="btn btn-primary btn-sm">Find a club</Link>}>
          Join a club and it will be listed here.
        </EmptyState>
      )}
    </>
  );
}
