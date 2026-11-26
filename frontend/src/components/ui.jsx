import { useEffect, useRef } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, X } from 'lucide-react';
import { hashStr, initials } from '../utils/format.js';

export function Spinner({ size = 18 }) {
  return <Loader2 size={size} className="spin" aria-hidden="true" />;
}

export function Skeleton({ h = 16, w = '100%', r = 8, style }) {
  return <div className="skel" style={{ height: h, width: w, borderRadius: r, ...style }} />;
}

export function EmptyState({ icon: Icon = Inbox, title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon size={26} /></div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="empty empty-error" role="alert">
      <div className="empty-icon"><AlertTriangle size={26} /></div>
      <h3>{title}</h3>
      <p>{error?.message || 'Try again in a moment.'}</p>
      {onRetry && <button className="btn btn-ghost btn-sm" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`dialog dialog-${size}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={dialogRef}>
        <header className="dialog-head">
          <h2>{title}</h2>
          <button className="icon-btn" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="dialog-body">{children}</div>
        {footer && <footer className="dialog-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, busy, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Keep it</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy && <Spinner size={16} />} {confirmLabel}
          </button>
        </>
      }
    >
      <p className="muted">{message}</p>
    </Modal>
  );
}

const TONES = {
  draft: ['mute', 'Draft'],
  published: ['ok', 'Published'],
  completed: ['info', 'Completed'],
  cancelled: ['bad', 'Cancelled'],
  registered: ['ok', 'Registered'],
  pending: ['warn', 'Pending'],
  active: ['ok', 'Active'],
  rejected: ['bad', 'Rejected'],
  organizer: ['info', 'Organizer'],
  member: ['mute', 'Member'],
  admin: ['warn', 'Admin'],
  student: ['mute', 'Student'],
};

export function StatusBadge({ status, label }) {
  const [tone, text] = TONES[status] || ['mute', status];
  return <span className={`badge badge-${tone}`}>{label || text}</span>;
}

export function Field({ label, hint, error, children }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          className={`tab ${value === t.value ? 'is-active' : ''}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
          {t.count != null && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Pagination({ skip, limit, total, onChange }) {
  if (!total || total <= limit) return null;
  const from = skip + 1;
  const to = Math.min(skip + limit, total);
  return (
    <nav className="pager" aria-label="Pagination">
      <span className="muted">Showing {from} to {to} of {total}</span>
      <div className="row">
        <button className="btn btn-ghost btn-sm" disabled={skip <= 0} onClick={() => onChange(Math.max(0, skip - limit))}>
          <ChevronLeft size={16} /> Previous
        </button>
        <button className="btn btn-ghost btn-sm" disabled={to >= total} onClick={() => onChange(skip + limit)}>
          Next <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}

const AVATAR_TONES = ['#2F4BFF', '#FF4D94', '#2ED3A5', '#FF7A45', '#8B5CF6', '#E0A800'];
export function Avatar({ name, size = 40 }) {
  const bg = AVATAR_TONES[hashStr(name) % AVATAR_TONES.length];
  return (
    <span className="avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function Stat({ icon: Icon, label, value, note, tone = 'blue' }) {
  return (
    <div className="stat">
      <span className={`stat-icon tone-${tone}`}><Icon size={22} /></span>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {note && <div className="stat-note">{note}</div>}
      </div>
    </div>
  );
}
