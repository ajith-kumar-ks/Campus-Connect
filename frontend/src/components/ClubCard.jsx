import { Link } from 'react-router-dom';
import { Pencil, Settings2, Trash2 } from 'lucide-react';
import { coverFor } from '../utils/format.js';
import { Spinner, StatusBadge } from './ui.jsx';

export default function ClubCard({ club, membership, onJoin, joining, isAdmin, canManage, onEdit, onDeactivate }) {
  const status = membership?.status;
  return (
    <article className="club-card" style={coverFor(club.id)}>
      <Link to={`/clubs/${club.id}`} className="club-cover" aria-label={`Open ${club.name}`}>
        <span className="club-letter" aria-hidden="true">{club.name.charAt(0).toUpperCase()}</span>
        <span className="chip chip-solid">{club.category}</span>
      </Link>
      <div className="club-body">
        <h3 className="club-name"><Link to={`/clubs/${club.id}`}>{club.name}</Link></h3>
        <p className="club-desc">{club.description}</p>
        <div className="club-foot">
          {status === 'active' && <StatusBadge status={membership.role === 'organizer' ? 'organizer' : 'active'} label={membership.role === 'organizer' ? 'You organize this' : 'You are a member'} />}
          {status === 'pending' && <StatusBadge status="pending" label="Request pending" />}
          {(!status || status === 'rejected') && (
            <button className="btn btn-primary btn-sm" onClick={() => onJoin?.(club)} disabled={joining}>
              {joining && <Spinner size={14} />} {status === 'rejected' ? 'Request again' : 'Join club'}
            </button>
          )}
          <span className="spacer" />
          {canManage && (
            <Link to={`/manage/${club.id}`} className="icon-btn" aria-label={`Manage ${club.name}`} title="Manage club"><Settings2 size={18} /></Link>
          )}
          {isAdmin && (
            <>
              <button className="icon-btn" aria-label={`Edit ${club.name}`} title="Edit club" onClick={() => onEdit?.(club)}><Pencil size={17} /></button>
              <button className="icon-btn icon-danger" aria-label={`Deactivate ${club.name}`} title="Deactivate club" onClick={() => onDeactivate?.(club)}><Trash2 size={17} /></button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
