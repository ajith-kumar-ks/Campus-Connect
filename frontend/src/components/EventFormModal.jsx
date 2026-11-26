import { useEffect, useState } from 'react';
import { eventApi } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';
import { CATEGORY_SUGGESTIONS, parseDate, toApiDateTime, toInputValue } from '../utils/format.js';
import { upsertCached } from '../utils/eventCache.js';
import { Field, Modal, Spinner } from './ui.jsx';

const pad = (n) => String(n).padStart(2, '0');
const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function defaults() {
  const start = new Date();
  start.setDate(start.getDate() + 7);
  start.setHours(17, 0, 0, 0);
  const end = new Date(start.getTime() + 2 * 3600e3);
  const deadline = new Date(start.getTime() - 24 * 3600e3);
  return {
    title: '', description: '', category: '', venue: '', capacity: '', publish: false,
    start_time: local(start), end_time: local(end), registration_deadline: local(deadline),
  };
}

/* Rules mirror backend/app/schemas/event.py */
function validate(f) {
  const e = {};
  if (f.title.trim().length < 3 || f.title.trim().length > 150) e.title = 'Use 3 to 150 characters.';
  if (f.description.trim().length < 10) e.description = 'Use at least 10 characters.';
  if (f.category.trim().length < 3 || f.category.trim().length > 50) e.category = 'Use 3 to 50 characters.';
  if (f.venue.trim().length < 3 || f.venue.trim().length > 255) e.venue = 'Use 3 to 255 characters.';
  const s = parseDate(f.start_time), en = parseDate(f.end_time), d = parseDate(f.registration_deadline);
  if (!s) e.start_time = 'Choose a start time.';
  if (!en) e.end_time = 'Choose an end time.';
  if (!d) e.registration_deadline = 'Choose a registration deadline.';
  if (s && en && en <= s) e.end_time = 'The event must end after it starts.';
  if (s && d && d > s) e.registration_deadline = 'Registration must close before the event starts.';
  if (f.capacity !== '' && (!Number.isInteger(Number(f.capacity)) || Number(f.capacity) < 1)) e.capacity = 'Enter a whole number above 0, or leave empty for no limit.';
  return e;
}

export default function EventFormModal({ open, clubId, event, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(defaults);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const editing = Boolean(event);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(event ? {
      title: event.title, description: event.description, category: event.category, venue: event.venue,
      capacity: event.capacity ?? '', publish: false,
      start_time: toInputValue(event.start_time), end_time: toInputValue(event.end_time),
      registration_deadline: toInputValue(event.registration_deadline),
    } : defaults());
  }, [open, event]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      venue: form.venue.trim(),
      start_time: toApiDateTime(form.start_time),
      end_time: toApiDateTime(form.end_time),
      registration_deadline: toApiDateTime(form.registration_deadline),
      capacity: form.capacity === '' ? null : Number(form.capacity),
    };

    setBusy(true);
    try {
      let saved;
      if (editing) {
        saved = await eventApi.update(clubId, event.id, payload);
        toast.success('Event updated');
      } else {
        saved = await eventApi.create(clubId, payload);
        upsertCached(clubId, saved);
        if (form.publish) {
          try {
            saved = await eventApi.setStatus(clubId, saved.id, 'published');
            toast.success('Event published');
          } catch (err) {
            toast.error(`Saved as a draft, but publishing failed: ${err.message}`);
          }
        } else {
          toast.success('Draft saved');
        }
      }
      upsertCached(clubId, saved);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      if (Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
      else setErrors({ form: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      size="lg"
      title={editing ? 'Edit event' : 'Create an event'}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="event-form" className="btn btn-primary" disabled={busy}>
            {busy && <Spinner size={16} />} {editing ? 'Save changes' : form.publish ? 'Create and publish' : 'Save draft'}
          </button>
        </>
      }
    >
      <form id="event-form" className="form-grid" onSubmit={submit} noValidate>
        {errors.form && <div className="form-error span-2" role="alert">{errors.form}</div>}
        <div className="span-2">
          <Field label="Title" error={errors.title}>
            <input className="input" value={form.title} onChange={set('title')} maxLength={150} autoFocus />
          </Field>
        </div>
        <Field label="Category" error={errors.category}>
          <input className="input" list="event-categories" value={form.category} onChange={set('category')} maxLength={50} />
          <datalist id="event-categories">{CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Venue" error={errors.venue}>
          <input className="input" value={form.venue} onChange={set('venue')} maxLength={255} />
        </Field>
        <Field label="Starts" error={errors.start_time}>
          <input className="input" type="datetime-local" value={form.start_time} onChange={set('start_time')} />
        </Field>
        <Field label="Ends" error={errors.end_time}>
          <input className="input" type="datetime-local" value={form.end_time} onChange={set('end_time')} />
        </Field>
        <Field label="Registration closes" error={errors.registration_deadline} hint="Must be before the event starts.">
          <input className="input" type="datetime-local" value={form.registration_deadline} onChange={set('registration_deadline')} />
        </Field>
        <Field label="Seats" error={errors.capacity} hint="Leave empty for no limit.">
          <input className="input" type="number" min="1" value={form.capacity} onChange={set('capacity')} />
        </Field>
        <div className="span-2">
          <Field label="Description" error={errors.description}>
            <textarea className="textarea" rows={5} value={form.description} onChange={set('description')} />
          </Field>
        </div>
        {!editing && (
          <label className="check span-2">
            <input type="checkbox" checked={form.publish} onChange={(e) => setForm((f) => ({ ...f, publish: e.target.checked }))} />
            <span>Publish right away so students can register</span>
          </label>
        )}
      </form>
    </Modal>
  );
}
