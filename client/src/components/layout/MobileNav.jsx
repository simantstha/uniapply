import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, Building2, FolderOpen } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/universities', icon: Building2, label: 'Universities' },
  { to: '/documents', icon: FolderOpen, label: 'Documents' },
];

export default function MobileNav() {
  const location = useLocation();
  if (location.pathname.startsWith('/sop/')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t flex md:hidden"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors"
          style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' })}>
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-xs font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
