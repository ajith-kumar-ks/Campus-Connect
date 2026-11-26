import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <section className="auth-form-side">
        <div className="auth-top">
          <Link to="/" aria-label="Campus Connect home"><Logo /></Link>
          <ThemeToggle />
        </div>
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
          <p className="auth-foot">{footer}</p>
        </div>
      </section>
      <aside className="auth-art" aria-hidden="true">
        <div className="art-ticket art-a"><b>Admit one</b><span>Open mic night</span></div>
        <div className="art-ticket art-b"><b>Admit one</b><span>Hack the weekend</span></div>
        <div className="art-ticket art-c"><b>Admit one</b><span>Sunrise photo walk</span></div>
        <p className="art-line">Every club. Every event. One place on campus.</p>
      </aside>
    </div>
  );
}
