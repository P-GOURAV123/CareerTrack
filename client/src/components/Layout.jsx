import { NavLink } from 'react-router-dom';
import { BarChart3, BriefcaseBusiness, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/applications', label: 'Applications', icon: BriefcaseBusiness },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export default function Layout({ children }) {
  const { logout, user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true">CT</div>
            <div className="brand-copy">
              <h1>CareerTrack</h1>
              <span>Career workspace</span>
            </div>
          </div>
        </div>

        <nav className="nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="user-card">
          <ThemeToggle />
          <p>Signed in as</p>
          <strong>{user?.name || 'CareerSeeker'}</strong>
          <button type="button" className="logout-btn" onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="page-content">{children}</main>
    </div>
  );
}
