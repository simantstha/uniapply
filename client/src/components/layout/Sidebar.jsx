import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, Building2, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/universities', icon: Building2, label: 'Universities' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-56 flex flex-col border-r flex-shrink-0" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-apple-blue rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">U</span>
          </div>
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>UniApply</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-apple-blue text-white shadow-apple-sm'
                  : 'hover:bg-opacity-60'
              }`
            }
            style={({ isActive }) => isActive ? {} : { color: 'var(--text-secondary)' }}
            onMouseEnter={e => { if (!e.currentTarget.classList.contains('bg-apple-blue')) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
            onMouseLeave={e => { if (!e.currentTarget.classList.contains('bg-apple-blue')) e.currentTarget.style.backgroundColor = ''; }}
          >
            <Icon size={15} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 space-y-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
        >
          {dark ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* User */}
        <div className="px-3 py-2">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{user?.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
        >
          <LogOut size={15} strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
