import { useEffect, useState } from 'react';
import { clubApi } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';
import { CATEGORY_SUGGESTIONS } from '../utils/format.js';
import { Field, Modal, Spinner } from './ui.jsx';

const EMPTY = { name: '', description: '', category: '' };

/* Limits mirror backend/app/schemas/club.py */
function validate(f) {
  const e = {};
  if (f.name.trim().length < 3 || f.name.trim().length > 60) e.name = 'Use 3 to 60 characters.';
  if (f.description.trim().length < 10 || f.description.trim().length > 2000) e.description = 'Use 10 to 2000 characters.';
  if (f.category.trim().length < 3 || f.category.trim().length > 50) e.category = 'Use 3 to 50 characters.';
  return e;
}

export default function ClubFormModal({ open, club, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const editing = Boolean(club);

  useEffect(() => {
    if (open) {
      setForm(club ? { name: club.name, description: club.description, category: club.category } : EMPTY);
      setErrors({});
    }
  }, [open, club]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
    };

    setBusy(true);
    try {
      let saved;
      if (editing) {
        // PATCH rejects an empty body, so send only what changed.
        const diff = Object.fromEntries(Object.entries(payload).filter(([k, v]) => v !== club[k]));
        if (!Object.keys(diff).length) { onClose(); return; }
        saved = await clubApi.update(club.id, diff);
        toast.success('Club updated');
      } else {
        saved = await clubApi.create(payload);
        toast.success('Club created');
      }
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
      title={editing ? 'Edit club' : 'Create a club'}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="club-form" className="btn btn-primary" disabled={busy}>
            {busy && <Spinner size={16} />} {editing ? 'Save changes' : 'Create club'}
          </button>
        </>
      }
    >
      <form id="club-form" className="stack" onSubmit={submit} noValidate>
        {errors.form && <div className="form-error" role="alert">{errors.form}</div>}
        <Field label="Club name" error={errors.name}>
          <input className="input" value={form.name} onChange={set('name')} maxLength={60} autoFocus />
        </Field>
        <Field label="Category" error={errors.category} hint="Pick a suggestion or type your own.">
          <input className="input" list="club-categories" value={form.category} onChange={set('category')} maxLength={50} />
          <datalist id="club-categories">{CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Description" error={errors.description} hint="Tell students what the club does and who it is for.">
          <textarea className="textarea" rows={5} value={form.description} onChange={set('description')} maxLength={2000} />
        </Field>
      </form>
    </Modal>
  );
}
