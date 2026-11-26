import { useMemo, useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import ClubCard from '../components/ClubCard.jsx';
import ClubFormModal from '../components/ClubFormModal.jsx';
import { ConfirmDialog, EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui.jsx';
import { clubApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useClubs } from '../context/ClubsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useTitle } from '../hooks/useTitle.js';

export default function Clubs() {
  useTitle('Clubs');
  const toast = useToast();
  const { clubs, loading, reload } = useClubs();
  const { isAdmin, membershipFor, isOrganizerOf, refreshMemberships } = useAuth();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [joining, setJoining] = useState(null);
  const [form, setForm] = useState({ open: false, club: null });
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const categories = useMemo(() => [...new Set(clubs.map((c) => c.category))].sort(), [clubs]);
  const visible = clubs.filter((c) =>
    (!category || c.category === category) &&
    (!q || `${c.name} ${c.description}`.toLowerCase().includes(q.toLowerCase())));

  async function join(club) {
    setJoining(club.id);
    try {
      await clubApi.join(club.id);
      await refreshMemberships();
      toast.success(`Request sent to ${club.name}. An organizer will review it.`);
    } catch (err) { toast.error(err.message); } finally { setJoining(null); }
  }

  async function deactivate() {
    setBusy(true);
    try {
      await clubApi.remove(removing.id);
      toast.success(`${removing.name} was deactivated`);
      setRemoving(null);
      reload();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader
        title="Clubs"
        subtitle="Find a community and ask to join."
        actions={isAdmin && <button className="btn btn-primary" onClick={() => setForm({ open: true, club: null })}><Plus size={18} /> New club</button>}
      />
      <div className="toolbar">
        <span className="input-wrap grow">
          <Search size={17} className="input-icon" />
          <input className="input has-icon" placeholder="Search clubs" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clubs" />
        </span>
        <div className="chips">
          <button className={`chip-btn ${!category ? 'is-on' : ''}`} onClick={() => setCategory('')}>All</button>
          {categories.map((c) => <button key={c} className={`chip-btn ${category === c ? 'is-on' : ''}`} onClick={() => setCategory(c)}>{c}</button>)}
        </div>
      </div>

      {loading && !clubs.length ? (
        <div className="grid-3">{[0, 1, 2].map((i) => <Skeleton key={i} h={280} r={22} />)}</div>
      ) : visible.length ? (
        <div className="grid-3">
          {visible.map((c) => (
            <ClubCard key={c.id} club={c} membership={membershipFor(c.id)} joining={joining === c.id} onJoin={join}
              isAdmin={isAdmin} canManage={isOrganizerOf(c.id)}
              onEdit={(club) => setForm({ open: true, club })} onDeactivate={setRemoving} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Users} title={clubs.length ? 'No clubs match your search' : 'No clubs yet'}>
          {clubs.length ? 'Try a different word or category.' : isAdmin ? 'Create the first club to get started.' : 'An admin has not created any clubs yet.'}
        </EmptyState>
      )}

      <ClubFormModal open={form.open} club={form.club} onClose={() => setForm({ open: false, club: null })} onSaved={reload} />
      <ConfirmDialog open={Boolean(removing)} title="Deactivate this club?" danger busy={busy} confirmLabel="Deactivate"
        message={`${removing?.name || 'This club'} will disappear from the club list for everyone.`}
        onConfirm={deactivate} onClose={() => setRemoving(null)} />
    </>
  );
}
