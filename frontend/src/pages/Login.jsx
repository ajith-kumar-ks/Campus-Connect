import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import { Field, Spinner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTitle } from '../hooks/useTitle.js';

export default function Login() {
  useTitle('Log in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Enter a valid email address.');
    if (!form.password) return setError('Enter your password.');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || '/home', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your tickets and clubs."
      footer={<>New to Campus Connect? <Link to="/register">Create an account</Link></>}
    >
      <form className="stack" onSubmit={submit} noValidate>
        {error && <div className="form-error" role="alert">{error}</div>}
        <Field label="Email">
          <input className="input" type="email" autoComplete="email" autoFocus value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <span className="input-wrap">
            <input className="input" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" className="icon-btn input-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy && <Spinner size={16} />} Log in</button>
      </form>
    </AuthShell>
  );
}
