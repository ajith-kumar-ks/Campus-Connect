import { useState } from 'react';
import { Field, ConfirmDialog, PageHeader, Spinner, StatusBadge, Avatar } from '../components/ui.jsx';
import { userApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useTitle } from '../hooks/useTitle.js';

export default function Profile() {
  useTitle('Profile');
  const toast = useToast();
  const { user, refreshProfile, logout } = useAuth();
  const [name, setName] = useState(user.full_name);
  const [nameErr, setNameErr] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErr, setPwErr] = useState({});
  const [savingPw, setSavingPw] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function saveName(e) {
    e.preventDefault();
    const v = name.trim();
    if (v.length < 2 || v.length > 100) return setNameErr('Use 2 to 100 characters.');
    setNameErr('');
    setSavingName(true);
    try { await userApi.update({ full_name: v }); await refreshProfile(); toast.success('Name updated'); }
    catch (err) { setNameErr(err.fieldErrors.full_name || err.message); } finally { setSavingName(false); }
  }

  async function savePw(e) {
    e.preventDefault();
    const found = {};
    if (!pw.current) found.current = 'Enter your current password.';
    if (pw.next.length < 8 || pw.next.length > 128) found.next = 'Use 8 to 128 characters.';
    if (pw.confirm !== pw.next) found.confirm = 'Passwords do not match.';
    setPwErr(found);
    if (Object.keys(found).length) return;
    setSavingPw(true);
    try {
      await userApi.changePassword({ current_password: pw.current, new_password: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      toast.success('Password changed');
    } catch (err) { setPwErr({ current: err.fieldErrors.current_password || err.message }); } finally { setSavingPw(false); }
  }

  async function deactivate() {
    setBusy(true);
    try { await userApi.deactivate(); logout(); toast.info('Your account was deactivated.'); }
    catch (err) { toast.error(err.message); setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your account details." />
      <div className="narrow stack-lg">
        <section className="card profile-head">
          <Avatar name={user.full_name} size={64} />
          <div>
            <h2>{user.full_name}</h2>
            <p className="muted">{user.email}</p>
            <StatusBadge status={user.role} />
          </div>
        </section>

        <form className="card stack" onSubmit={saveName} noValidate>
          <h2 className="section-title">Your name</h2>
          <Field label="Full name" error={nameErr}><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <div><button className="btn btn-primary" disabled={savingName || name.trim() === user.full_name}>{savingName && <Spinner size={16} />} Save name</button></div>
        </form>

        <form className="card stack" onSubmit={savePw} noValidate>
          <h2 className="section-title">Change password</h2>
          <Field label="Current password" error={pwErr.current}><input className="input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
          <Field label="New password" error={pwErr.next} hint="At least 8 characters."><input className="input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
          <Field label="Confirm new password" error={pwErr.confirm}><input className="input" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
          <div><button className="btn btn-primary" disabled={savingPw}>{savingPw && <Spinner size={16} />} Update password</button></div>
        </form>

        <section className="card danger-zone">
          <h2 className="section-title">Deactivate account</h2>
          <p className="muted">You will be logged out and will not be able to log in again until the account is reactivated.</p>
          <button className="btn btn-danger" onClick={() => setConfirm(true)}>Deactivate my account</button>
        </section>
      </div>
      <ConfirmDialog open={confirm} danger busy={busy} title="Deactivate your account?" confirmLabel="Deactivate" message="This logs you out immediately." onConfirm={deactivate} onClose={() => setConfirm(false)} />
    </>
  );
}
