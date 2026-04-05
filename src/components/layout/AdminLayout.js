import  { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useTheme } from '../../Context/ThemeContext';
import logo from '../../assets/Logo.jpeg';
import './AdminLayout.css';

const NAV = [
  { to: '/dashboard',  icon: '📊', label: 'Dashboard' },
  { to: '/properties', icon: '🏘️', label: 'Properties' },
  { to: '/categories', icon: '🗂️', label: 'Categories' },
  { to: '/enquiries',  icon: '📬', label: 'Enquiries' },
  { to: '/users',      icon: '👥', label: 'Users' },
  { to: '/cms',        icon: '✏️', label: 'CMS' },
];

export default function AdminLayout() {
  const { admin, logout }         = useAuth();
  const {  toggle, isDark } = useTheme();
  const navigate                  = useNavigate();
  const location                  = useLocation();
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const currentPage = NAV.find(n => location.pathname.startsWith(n.to))?.label || '';

  return (
    <div className={`shell${collapsed ? ' collapsed' : ''}`}>

      {/* ── Sidebar ───────────────────────────────── */}
      <aside className={`sidebar${mobileOpen ? ' mob-open' : ''}`}>

        {/* Logo */}
        <div className="sb-logo">
          {collapsed ? (
            /* Collapsed: show small square logo */
            <div className="sb-logo__mini">
              <img src={logo} alt="PPP" className="sb-logo__mini-img" />
            </div>
          ) : (
            /* Expanded: show full logo with white bg pill */
            <div className="sb-logo__full">
              <img src={logo} alt="Prime Pro Projects" className="sb-logo__full-img" />
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="sb-nav">
          {NAV.map(({ to, icon, label, dot }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}>
              <span className="sb-link__icon">{icon}</span>
              {!collapsed && <span className="sb-link__label">{label}</span>}
              {!collapsed && dot && <span className="sb-link__dot" />}
              {collapsed && <span className="sb-tooltip">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="sb-bottom">
          {/* Theme toggle */}
          <button className="sb-theme-btn" onClick={toggle} title={isDark ? 'Switch to Light' : 'Switch to Dark'}>
            <span className="sb-theme-btn__icon">{isDark ? '☀️' : '🌙'}</span>
            {!collapsed && (
              <span className="sb-theme-btn__label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </button>

          {/* Collapse toggle */}
          <button className="sb-collapse" onClick={() => setCollapsed(v => !v)}>
            <span>{collapsed ? '→' : '←'}</span>
            {!collapsed && <span>Collapse</span>}
          </button>

          {/* Profile */}
          <div className="sb-profile">
            <div className="sb-profile__av">
              {admin?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            {!collapsed && (
              <div className="sb-profile__info">
                <div className="sb-profile__name">{admin?.name || 'Admin'}</div>
                <div className="sb-profile__role">{admin?.role || 'admin'}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="mob-overlay" onClick={() => setMobileOpen(false)} />}

      {/* ── Main area ─────────────────────────────── */}
      <div className="main-wrap">

        {/* Topbar */}
        <header className="topbar">
          <div className="topbar__left">
            <button className="topbar__burger" onClick={() => setMobileOpen(v => !v)}>☰</button>
            <div className="topbar__bread">
              <span className="topbar__home">Prime Pro Projects</span>
              {currentPage && (
                <>
                  <span className="topbar__sep">›</span>
                  <span className="topbar__cur">{currentPage}</span>
                </>
              )}
            </div>
          </div>

          <div className="topbar__right">
            {/* Theme toggle in topbar (desktop convenience) */}
            <button className="topbar__theme" onClick={toggle} title="Toggle theme">
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Notification bell */}
            {/* <div className="topbar__notif">
              🔔
              <span className="topbar__notif-dot" />
            </div> */}

            {/* Logout */}
            <button className="topbar__theme" onClick={handleLogout}>
              <span >🚪</span> <span >Logout</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}