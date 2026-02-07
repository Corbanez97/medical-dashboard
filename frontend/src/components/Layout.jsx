import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, Search, FlaskConical } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">IT</div>
          <div className="logo-text">
            <h1>INSTITUTO TATSCH</h1>
            <span>EMAGRECIMENTO E LONGEVIDADE</span>
          </div>
        </div>

        <nav className="nav-menu">
          <Link to="/" className={`nav-item ${isActive('/')}`}>
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/patients" className={`nav-item ${isActive('/patients')}`}>
            <Users size={20} />
            Patients
          </Link>
          <Link to="/lab-definitions" className={`nav-item ${isActive('/lab-definitions')}`}>
            <FlaskConical size={20} />
            Lab Definitions
          </Link>
          <Link to="/patients/new" className={`nav-item ${isActive('/patients/new')}`}>
            <UserPlus size={20} />
            New Patient
          </Link>
          {/* Placeholder for Search - implementing later */}
          <Link to="#" className="nav-item">
            <Search size={20} />
            Search
          </Link>
        </nav>
      </aside>

      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <style>{`
        .layout {
          display: flex;
          min-height: 100vh;
        }

        .sidebar {
          width: 280px;
          background-color: var(--color-surface);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          padding: var(--spacing-xl) var(--spacing-md);
        }

        .logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: var(--spacing-2xl);
        }

        .logo-icon {
          width: 60px;
          height: 60px;
          background-color: var(--color-gold-500);
          color: white;
          font-size: 2rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--spacing-md);
          border-radius: var(--radius-sm); /* Square-ish like the logo */
        }

        .logo-text h1 {
          font-size: 1.25rem;
          color: var(--color-gold-600);
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 0.2rem;
        }

        .logo-text span {
          font-size: 0.65rem;
          color: var(--color-gold-700);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .nav-item:hover {
          background-color: var(--color-gold-50);
          color: var(--color-gold-600);
        }

        .nav-item.active {
          background-color: var(--color-gold-100);
          color: var(--color-gold-700);
          font-weight: 600;
        }

        .main-content {
          flex: 1;
          padding: var(--spacing-xl);
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}
