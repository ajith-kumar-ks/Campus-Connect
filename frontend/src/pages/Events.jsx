import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarX, SlidersHorizontal, Search, X } from 'lucide-react';
import EventTicket from '../components/EventTicket.jsx';
import { EmptyState, ErrorState, Field, PageHeader, Pagination, Skeleton } from '../components/ui.jsx';
import { eventApi } from '../api/index.js';
import { useClubs } from '../context/ClubsContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useRegisteredIds } from '../hooks/useRegisteredIds.js';
import { useTitle } from '../hooks/useTitle.js';

const PAGE = 10;

export default function Events() {
  useTitle('Events');
  const { clubs, clubMap } = useClubs();
  const { ids } = useRegisteredIds();
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') || '';
  const club = sp.get('club') || '';
  const category = sp.get('category') || '';
  const from = sp.get('from') || '';
  const to = sp.get('to') || '';
  const page = Number(sp.get('page') || 1);

  const [qInput, setQInput] = useState(q);
  const [showFilters, setShowFilters] = useState(false);
  const debounced = useDebounce(qInput, 350);

  const update = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries({ page: '', ...patch }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setSp(next, { replace: true });
  };

  useEffect(() => { if (debounced !== q) update({ q: debounced }); /* eslint-disable-next-line */ }, [debounced]);

  const { data, loading, refreshing, error, reload } = useAsync(
    () => eventApi.list({
      search: q || undefined,
      category: category || undefined,
      club_id: club || undefined,
      start_date: from ? `${from}T00:00:00` : undefined,
      end_date: to ? `${to}T23:59:59` : undefined,
      skip: (page - 1) * PAGE,
      limit: PAGE,
    }),
    [q, club, category, from, to, page]
  );

  // Category filter matches exactly on the API, so offer the categories that really exist.
  const all = useAsync(() => eventApi.list({ limit: 100 }), []);
  const categories = useMemo(() => [...new Set((all.data?.items || []).map((e) => e.category))].sort(), [all.data]);
  const hasFilters = q || club || category || from || to;

  return (
    <>
      <PageHeader title="Events" subtitle="Everything published by campus clubs." />
      <button className="btn btn-ghost filters-toggle" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
        <SlidersHorizontal size={17} /> {showFilters ? 'Hide filters' : 'Filters'}{hasFilters ? ' (on)' : ''}
      </button>
      <div className="browse">
        <aside className={`filters card ${showFilters ? 'is-open' : ''}`}>
          <Field label="Search">
            <span className="input-wrap">
              <Search size={17} className="input-icon" />
              <input className="input has-icon" placeholder="Title or description" value={qInput} onChange={(e) => setQInput(e.target.value)} />
            </span>
          </Field>
          <Field label="Club">
            <select className="select" value={club} onChange={(e) => update({ club: e.target.value })}>
              <option value="">All clubs</option>
              {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="field">
            <span className="field-label">Category</span>
            <div className="chips">
              <button className={`chip-btn ${!category ? 'is-on' : ''}`} onClick={() => update({ category: '' })}>All</button>
              {categories.map((c) => (
                <button key={c} className={`chip-btn ${category === c ? 'is-on' : ''}`} onClick={() => update({ category: c })}>{c}</button>
              ))}
            </div>
          </div>
          <Field label="From"><input className="input" type="date" value={from} onChange={(e) => update({ from: e.target.value })} /></Field>
          <Field label="Until"><input className="input" type="date" value={to} onChange={(e) => update({ to: e.target.value })} /></Field>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setQInput(''); setSp({}, { replace: true }); }}>
              <X size={15} /> Clear filters
            </button>
          )}
        </aside>

        <section className={refreshing ? 'is-refreshing' : ''}>
          {error ? <ErrorState error={error} onRetry={reload} /> : loading ? (
            <div className="grid-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={150} r={22} />)}</div>
          ) : data.items.length ? (
            <>
              <p className="muted result-count">{data.total} {data.total === 1 ? 'event' : 'events'}</p>
              <div className="grid-2">
                {data.items.map((ev) => (
                  <EventTicket key={ev.id} event={ev} clubName={clubMap[ev.club_id]?.name} registered={ids.has(ev.id)} />
                ))}
              </div>
              <Pagination skip={data.skip} limit={data.limit} total={data.total} onChange={(skip) => update({ page: String(skip / PAGE + 1) })} />
            </>
          ) : (
            <EmptyState icon={CalendarX} title="No events match">
              {hasFilters ? 'Try removing a filter or searching for something else.' : 'No club has published an event yet. Check back soon.'}
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
