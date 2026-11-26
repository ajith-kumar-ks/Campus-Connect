import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Ban, Check, CheckCheck, CirclePlus, ClipboardList, Lock, Pencil, Send, Trash2, UserMinus, UserPlus, Users, X } from 'lucide-react';
import EventFormModal from '../components/EventFormModal.jsx';
import { Avatar, ConfirmDialog, EmptyState, ErrorState, PageHeader, Skeleton, Spinner, StatusBadge, Tabs } from '../components/ui.jsx';
import { clubApi, eventApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useClubs } from '../context/ClubsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useTitle } from '../hooks/useTitle.js';
import { coverFor, dateParts, fmtDate, fmtRange, plural } from '../utils/format.js';
import { mergeEvents, readCache, removeCached, upsertCached } from '../utils/eventCache.js';

export default function ManageClub() {
  const { clubId } = useParams();
  const { isOrganizerOf, isAdmin } = useAuth();
  const { clubMap } = useClubs();
  const [tab, setTab] = useState('events');
  const allowed = isOrganizerOf(clubId);
  const name = clubMap[clubId]?.name || 'Club';
  useTitle(`Manage ${name}`);

  const requests = useAsync(() => (allowed ? clubApi.requests(clubId) : Promise.resolve([])), [clubId, allowed]);
  const members = useAsync(() => (allowed ? clubApi.members(clubId) : Promise.resolve([])), [clubId, allowed]);

  if (!allowed) {
    return (
      <EmptyState icon={Lock} title="Organizers only" action={<Link to="/clubs" className="btn btn-primary btn-sm">Back to clubs</Link>}>
        You need to be an active organizer of this club to manage it.
      </EmptyState>
    );
  }

  return (
    <>
      <PageHeader
        title={name}
        subtitle="Manage events, join requests and members."
        actions={<Link to={`/clubs/${clubId}`} className="btn btn-ghost">View public page</Link>}
      />
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'events', label: 'Events' },
        { value: 'requests', label: 'Requests', count: requests.data?.length },
        { value: 'members', label: 'Members', count: members.data?.length },
      ]} />
      {tab === 'events' && <EventsTab clubId={clubId} />}
      {tab === 'requests' && <RequestsTab clubId={clubId} state={requests} onChanged={members.reload} />}
      {tab === 'members' && <MembersTab clubId={clubId} state={members} isAdmin={isAdmin} />}
    </>
  );
}

/* ---------------------------------------------------------------- Events */
function EventsTab({ clubId }) {
  const toast = useToast();
  const api = useAsync(() => eventApi.list({ club_id: clubId, limit: 100 }), [clubId]);
  const [version, setVersion] = useState(0);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ open: false, event: null });
  const [confirm, setConfirm] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const events = useMemo(
    () => mergeEvents(api.data?.items || [], readCache(clubId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api.data, clubId, version]
  );
  const shown = events.filter((e) =>
    filter === 'all' || (filter === 'closed' ? ['completed', 'cancelled'].includes(e.status) : e.status === filter));
  const hasDrafts = events.some((e) => e.status !== 'published');

  const refresh = () => { setVersion((v) => v + 1); api.reload(); };

  async function run(ev, fn, ok) {
    setBusyId(ev.id);
    try { await fn(); toast.success(ok); refresh(); }
    catch (err) { toast.error(err.message); } finally { setBusyId(null); setConfirm(null); }
  }
  const setStatus = (ev, status, ok) => run(ev, async () => upsertCached(clubId, await eventApi.setStatus(clubId, ev.id, status)), ok);
  const remove = (ev) => run(ev, async () => { await eventApi.remove(clubId, ev.id); removeCached(clubId, ev.id); }, 'Draft deleted');

  return (
    <>
      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filter events">
          {[['all', 'All'], ['draft', 'Drafts'], ['published', 'Published'], ['closed', 'Closed']].map(([v, label]) => (
            <button key={v} className={`chip-btn ${filter === v ? 'is-on' : ''}`} onClick={() => setFilter(v)}>{label}</button>
          ))}
        </div>
        <span className="spacer" />
        <button className="btn btn-primary" onClick={() => setForm({ open: true, event: null })}><CirclePlus size={18} /> New event</button>
      </div>

      {hasDrafts && (
        <p className="note">
          Drafts, cancelled and completed events are remembered on this device only, because the API can only list published events.
        </p>
      )}

      {api.error ? <ErrorState error={api.error} onRetry={api.reload} /> : api.loading ? <Skeleton h={240} r={14} /> : shown.length ? (
        <ul className="rows">
          {shown.map((ev) => {
            const p = dateParts(ev.start_time);
            const busy = busyId === ev.id;
            const open = ev.status === 'draft' || ev.status === 'published';
            return (
              <li key={ev.id} className="row-item row-wrap" style={coverFor(ev.id)}>
                <div className="date-chip"><b>{p.day}</b><span>{p.month}</span></div>
                <div className="row-main">
                  <span className="row-title">{ev.title} <StatusBadge status={ev.status} /></span>
                  <span className="muted small">{fmtRange(ev.start_time, ev.end_time)} at {ev.venue}</span>
                </div>
                <div className="row-actions">
                  {busy && <Spinner />}
                  {(ev.status === 'published' || ev.status === 'completed') && (
                    <Link className="btn btn-ghost btn-sm" to={`/manage/${clubId}/events/${ev.id}/participants`}><ClipboardList size={15} /> Participants</Link>
                  )}
                  {ev.status === 'draft' && <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => setStatus(ev, 'published', 'Event published')}><Send size={15} /> Publish</button>}
                  {ev.status === 'published' && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setStatus(ev, 'completed', 'Marked as completed')}><CheckCheck size={15} /> Complete</button>}
                  {open && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setForm({ open: true, event: ev })}><Pencil size={15} /> Edit</button>}
                  {open && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setConfirm({ type: 'cancel', ev })}><Ban size={15} /> Cancel</button>}
                  {ev.status === 'draft' && <button className="icon-btn icon-danger" aria-label="Delete draft" disabled={busy} onClick={() => setConfirm({ type: 'delete', ev })}><Trash2 size={17} /></button>}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={ClipboardList} title={events.length ? 'No events in this view' : 'No events yet'}>
          {events.length ? 'Pick another filter.' : 'Create your first event. Save it as a draft or publish it right away.'}
        </EmptyState>
      )}

      <EventFormModal open={form.open} clubId={clubId} event={form.event} onClose={() => setForm({ open: false, event: null })} onSaved={refresh} />
      <ConfirmDialog
        open={Boolean(confirm)} danger busy={busyId !== null}
        title={confirm?.type === 'delete' ? 'Delete this draft?' : 'Cancel this event?'}
        confirmLabel={confirm?.type === 'delete' ? 'Delete draft' : 'Cancel event'}
        message={confirm?.type === 'delete' ? 'Only drafts can be deleted. This cannot be undone.' : 'The event disappears from the public list. This cannot be reversed.'}
        onConfirm={() => (confirm.type === 'delete' ? remove(confirm.ev) : setStatus(confirm.ev, 'cancelled', 'Event cancelled'))}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}

/* -------------------------------------------------------------- Requests */
function RequestsTab({ clubId, state, onChanged }) {
  const toast = useToast();
  const { refreshMemberships } = useAuth();
  const [busyId, setBusyId] = useState(null);

  async function decide(req, approve) {
    setBusyId(req.id);
    try {
      await (approve ? clubApi.approve(clubId, req.id) : clubApi.reject(clubId, req.id));
      toast.success(approve ? `${req.user.full_name} is now a member` : 'Request rejected');
      state.reload(); onChanged?.(); refreshMemberships();
    } catch (err) { toast.error(err.message); } finally { setBusyId(null); }
  }

  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (state.loading) return <Skeleton h={200} r={14} />;
  if (!state.data.length) return <EmptyState icon={UserPlus} title="No pending requests">New join requests will show up here.</EmptyState>;

  return (
    <ul className="rows">
      {state.data.map((r) => (
        <li key={r.id} className="row-item row-wrap">
          <Avatar name={r.user.full_name} />
          <div className="row-main"><span className="row-title">{r.user.full_name}</span><span className="muted small">{r.user.email}</span></div>
          <div className="row-actions">
            {busyId === r.id && <Spinner />}
            <button className="btn btn-primary btn-sm" disabled={busyId === r.id} onClick={() => decide(r, true)}><Check size={15} /> Approve</button>
            <button className="btn btn-ghost btn-sm" disabled={busyId === r.id} onClick={() => decide(r, false)}><X size={15} /> Reject</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------------------- Members */
function MembersTab({ clubId, state, isAdmin }) {
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);
  const [target, setTarget] = useState(null);

  async function run(fn, ok) {
    setBusyId(target?.id ?? -1);
    try { await fn(); toast.success(ok); state.reload(); setTarget(null); }
    catch (err) { toast.error(err.message); } finally { setBusyId(null); }
  }
  const quick = async (m, fn, ok) => {
    setBusyId(m.id);
    try { await fn(); toast.success(ok); state.reload(); } catch (err) { toast.error(err.message); } finally { setBusyId(null); }
  };

  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (state.loading) return <Skeleton h={200} r={14} />;
  if (!state.data.length) return <EmptyState icon={Users} title="No members yet">Approved students will be listed here.</EmptyState>;

  return (
    <>
      {!isAdmin && <p className="note">Only admins can change who is an organizer.</p>}
      <ul className="rows">
        {state.data.map((m) => (
          <li key={m.id} className="row-item row-wrap">
            <Avatar name={m.user.full_name} />
            <div className="row-main">
              <span className="row-title">{m.user.full_name} <StatusBadge status={m.role} /></span>
              <span className="muted small">{m.user.email}. Joined {fmtDate(m.joined_at)}</span>
            </div>
            <div className="row-actions">
              {busyId === m.id && <Spinner />}
              {isAdmin && m.role === 'member' && <button className="btn btn-ghost btn-sm" disabled={busyId === m.id} onClick={() => quick(m, () => clubApi.promote(clubId, m.id), `${m.user.full_name} is now an organizer`)}><UserPlus size={15} /> Make organizer</button>}
              {isAdmin && m.role === 'organizer' && <button className="btn btn-ghost btn-sm" disabled={busyId === m.id} onClick={() => quick(m, () => clubApi.demote(clubId, m.id), `${m.user.full_name} is now a member`)}><UserMinus size={15} /> Make member</button>}
              {m.role === 'member' && <button className="icon-btn icon-danger" aria-label={`Remove ${m.user.full_name}`} onClick={() => setTarget(m)}><Trash2 size={17} /></button>}
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog open={Boolean(target)} danger busy={busyId !== null} title="Remove this member?" confirmLabel="Remove"
        message={`${target?.user.full_name || 'This member'} will lose access to the club. They can request to join again.`}
        onConfirm={() => run(() => clubApi.removeMember(clubId, target.id), 'Member removed')} onClose={() => setTarget(null)} />
    </>
  );
}
