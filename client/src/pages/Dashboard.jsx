import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Building2, FileText, Star, ArrowRight, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ universities: 0, sops: 0, critiques: 0 });

  useEffect(() => {
    apiClient.get('/api/dashboard/stats').then(res => setStats(res.data)).catch(() => {});
  }, []);

  const cards = [
    { label: 'Universities', value: stats.universities, icon: Building2, color: '#0071E3', bg: 'rgba(0,113,227,0.08)', to: '/universities' },
    { label: 'SOPs Written', value: stats.sops, icon: FileText, color: '#BF5AF2', bg: 'rgba(191,90,242,0.08)', to: '/universities' },
    { label: 'Critiques', value: stats.critiques, icon: Sparkles, color: '#34C759', bg: 'rgba(52,199,89,0.08)', to: '/universities' },
  ];

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Good {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Here's your application overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {cards.map(({ label, value, icon: Icon, color, bg, to }) => (
          <Link key={label} to={to} className="card p-5 shadow-apple-sm hover:shadow-apple transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={17} style={{ color }} strokeWidth={1.8} />
              </div>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Getting started */}
        <div className="card p-6 shadow-apple-sm">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Getting Started</h2>
          <ol className="space-y-3">
            {[
              { label: 'Complete your academic profile', to: '/profile' },
              { label: 'Add your target universities', to: '/universities' },
              { label: 'Write your SOP and get AI critique', to: '/universities' },
            ].map(({ label, to }, i) => (
              <li key={i}>
                <Link to={to} className="flex items-center gap-3 text-sm group" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: 'var(--accent)' }}>
                    {i + 1}
                  </span>
                  <span className="group-hover:text-current transition-colors">{label}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        {/* Plan */}
        <div className="card p-6 shadow-apple-sm" style={{ background: 'var(--bg-secondary)' }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Your Plan</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
              style={{ background: user?.plan === 'free' ? 'rgba(142,142,147,0.15)' : 'rgba(0,113,227,0.1)', color: user?.plan === 'free' ? 'var(--text-secondary)' : 'var(--accent)' }}>
              {user?.plan}
            </span>
          </div>
          {user?.plan === 'free' ? (
            <>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                Free plan includes 3 universities and 1 critique per SOP.
              </p>
              <div className="space-y-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <div className="flex justify-between">
                  <span>Universities</span>
                  <span>{stats.universities}/3</span>
                </div>
                <div className="rounded-full h-1" style={{ background: 'var(--border)' }}>
                  <div className="h-1 rounded-full" style={{ width: `${(stats.universities / 3) * 100}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Unlimited universities and critiques.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
