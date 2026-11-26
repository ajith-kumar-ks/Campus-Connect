import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { Field, Spinner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useTitle } from '../hooks/useTitle.js';

export default function Register() {
  useTitle('Create account');
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const found = {};
    const name = form.full_name.trim();
    if (name.length < 2 || name.length > 100) found.full_name = 'Use 2 to 100 characters.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = 'Enter a valid email address.';
    if (form.password.length < 8 || form.password.length > 128) found.password = 'Use 8 to 128 characters.';
    if (form.confirm !== form.password) found.confirm = 'Passwords do not match.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await register(form);
      toast.success('Account created. Welcome!');
      navigate('/home', { replace: true });
    } catch (err) {
      setErrors(Object.keys(err.fieldErrors).length ? err.fieldErrors : { form: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join clubs and reserve seats at campus events."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <form className="stack" onSubmit={submit} noValidate>
        {errors.form && <div className="form-error" role="alert">{errors.form}</div>}
        <Field label="Full name" error={errors.full_name}>
          <input className="input" autoComplete="name" autoFocus value={form.full_name} onChange={set('full_name')} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters.">
          <input className="input" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <input className="input" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy && <Spinner size={16} />} Create account</button>
      </form>
    </AuthShell>
  );
}
