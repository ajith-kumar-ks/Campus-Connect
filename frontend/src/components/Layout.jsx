import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  CalendarDays, Home, LogOut, Megaphone, Menu, Ticket, UserRound, Users, UsersRound, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { Avatar, Spinner, StatusBadge } from './ui.jsx';

export function FullLoader() {
  return <div className="full-loader"><Spinner size={30} /></div>;
}

export function PublicOnly({ children }) {
  const { user, booting } = useAuth();
  if (booting) return <FullLoader />;
  return user ? <Navigate to="/home" replace /> : children;
}

export function ProtectedLayout() {
  const { user, booting } = useAuth();
  const location = useLocation();
  if (booting) return <FullLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Shell />;
}

const NAV = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/clubs', label: 'Clubs', icon: Users },
  { to: '/tickets', label: 'My tickets', icon: Ticket },
  { to: '/my-clubs', label: 'My clubs', icon: UsersRound },
];

function Shell() {
  const { user, isOrganizer, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);

  const linkClass = ({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`;
  const organizerActive = pathname.startsWith('/organizer') || pathname.startsWith('/manage');

  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to content</a>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Main navigation">
        <div className="sb-top">
          <Link to="/home" aria-label="Campus Connect home"><Logo /></Link>
          <button className="icon-btn sb-close" aria-label="Close menu" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>

        <nav className="sb-nav">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}><Icon size={20} /> {label}</NavLink>
          ))}
          {isOrganizer && (
            <NavLink to="/organizer" className={() => `nav-link ${organizerActive ? 'is-active' : ''}`}>
              <Megaphone size={20} /> Organizer hub
            </NavLink>
          )}
          <NavLink to="/profile" className={linkClass}><UserRound size={20} /> Profile</NavLink>
        </nav>

        <div className="sb-user">
          <Avatar name={user.full_name} size={42} />
          <div className="sb-user-text">
            <strong>{user.full_name}</strong>
            <span>{user.email}</span>
            {user.role === 'admin' && <StatusBadge status="admin" />}
          </div>
          <button className="icon-btn" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={19} /></button>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <button className="icon-btn icon-btn-lg menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <span className="topbar-logo"><Logo size={28} /></span>
          <span className="spacer" />
          <ThemeToggle />
        </header>
        <main id="main" className="page"><Outlet /></main>
      </div>
    </div>
  );
}
