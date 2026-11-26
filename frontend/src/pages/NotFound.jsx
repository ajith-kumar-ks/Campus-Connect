import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTitle } from '../hooks/useTitle.js';

export default function NotFound() {
  useTitle('Page not found');
  const { user } = useAuth();
  return (
    <div className="not-found">
      <div className="nf-ticket"><b>404</b><span>No seat here</span></div>
      <h1>We couldn't find that page</h1>
      <p className="muted">The link may be old, or the page moved.</p>
      <Link to={user ? '/home' : '/'} className="btn btn-primary">Take me home</Link>
    </div>
  );
}
