import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Building2, FileText, Sparkles, ArrowRight, Calendar, CheckCircle, Clock, AlertCircle, User, ChevronRight, PenLine } from 'lucide-react';

const statusConfig = {
  not_started: { label: 'Not Started', color: 'var(--text-tertiary)', bg: 'var(--bg-secondary)' },
  in_progress: { label: 'In Progress', color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
  submitted: { label: 'Submitted', color: '#0071E3', bg: 'rgba(0,113,227,0.1)' },
  accepted: { label: 'Accepted', color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  rejected: { label: 'Rejected', color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
  waitlisted: { label: 'Waitlisted', color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
};

const categoryConfig = {
  dream: { color: '#BF5AF2', bg: 'rgba(191,90,242,0.1)' },
  target: { color: '#0071E3', bg: 'rgba(0,113,227,0.1)' },
  safety: { color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    apiClient.get('/api/dashboard/stats').then(res => setData(res.data)).catch(() => {});
  }, []);

  const greeting = getGreeting();
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null;

  return (
    <div className="p-8 max-w-5xl space-y-6">

      {/* Hero greeting */}
      <div className="card p-6 shadow-apple-sm flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(0,113,227,0.08) 0%, rgba(191,90,242,0.06) 100%)' }}>
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--accent)' }}>{greeting}</p>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {user?.name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
              style={{ background: user?.plan === 'free' ? 'rgba(142,142,147,0.15)' : 'rgba(0,113,227,0.12)', color: user?.plan === 'free' ? 'var(--text-secondary)' : 'var(--accent)' }}>
              {user?.plan} plan
            </span>
            {memberSince && (
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Member since {memberSince}</span>
            )}
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0071E3, #BF5AF2)' }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Universities', value: data?.universities ?? '—', icon: Building2, color: '#0071E3', bg: 'rgba(0,113,227,0.08)', to: '/universities' },
          { label: 'SOPs Written', value: data?.sops ?? '—', icon: FileText, color: '#BF5AF2', bg: 'rgba(191,90,242,0.08)', to: '/universities' },
          { label: 'AI Critiques', value: data?.critiques ?? '—', icon: Sparkles, color: '#34C759', bg: 'rgba(52,199,89,0.08)', to: '/universities' },
        ].map(({ label, value, icon: Icon, color, bg, to }) => (
          <Link key={label} to={to} className="card p-5 shadow-apple-sm hover:shadow-apple transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={16} style={{ color }} strokeWidth={1.8} />
              </div>
              <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* Profile completion */}
        <div className="card p-5 shadow-apple-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User size={14} style={{ color: 'var(--text-secondary)' }} strokeWidth={1.8} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Profile</p>
            </div>
            <Link to="/profile" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Edit</Link>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{data?.profileCompletion ?? 0}%</span>
            <span className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>complete</span>
          </div>
          <div className="rounded-full h-1.5 mb-3" style={{ background: 'var(--border)' }}>
            <div className="h-1.5 rounded-full transition-all"
              style={{ width: `${data?.profileCompletion ?? 0}%`, background: (data?.profileCompletion ?? 0) >= 80 ? '#34C759' : (data?.profileCompletion ?? 0) >= 40 ? '#FF9F0A' : 'var(--accent)' }} />
          </div>
          {(data?.profileCompletion ?? 0) < 100 && (
            <Link to="/profile" className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Complete your profile <ChevronRight size={11} />
            </Link>
          )}
        </div>

        {/* Category breakdown */}
        <div className="card p-5 shadow-apple-sm">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={14} style={{ color: 'var(--text-secondary)' }} strokeWidth={1.8} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>By Category</p>
          </div>
          {!data?.categoryBreakdown || Object.keys(data.categoryBreakdown).length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No universities added yet.</p>
          ) : (
            <div className="space-y-2.5">
              {['dream', 'target', 'safety'].map(cat => {
                const count = data.categoryBreakdown[cat] || 0;
                const total = data.universities || 1;
                const cfg = categoryConfig[cat];
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="capitalize font-medium" style={{ color: cfg.color }}>{cat}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{count}</span>
                    </div>
                    <div className="rounded-full h-1" style={{ background: 'var(--border)' }}>
                      <div className="h-1 rounded-full" style={{ width: `${(count / total) * 100}%`, background: cfg.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Application status */}
        <div className="card p-5 shadow-apple-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={14} style={{ color: 'var(--text-secondary)' }} strokeWidth={1.8} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Status</p>
          </div>
          {!data?.statusBreakdown || Object.keys(data.statusBreakdown).length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No universities added yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.statusBreakdown).map(([status, count]) => {
                const cfg = statusConfig[status];
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Upcoming deadlines */}
        <div className="card p-5 shadow-apple-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={14} style={{ color: 'var(--text-secondary)' }} strokeWidth={1.8} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Upcoming Deadlines</p>
            </div>
            <Link to="/universities" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>View all</Link>
          </div>
          {!data?.upcomingDeadlines?.length ? (
            <div className="flex items-center gap-2 py-2">
              <Clock size={13} style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No deadlines in the next 60 days.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.upcomingDeadlines.map(u => {
                const deadline = new Date(u.applicationDeadline);
                const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysLeft <= 14;
                return (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{u.program}</p>
                    </div>
                    <div className="flex-shrink-0 ml-3 text-right">
                      <p className="text-xs font-semibold" style={{ color: isUrgent ? '#FF3B30' : 'var(--text-primary)' }}>
                        {daysLeft}d left
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent universities */}
        <div className="card p-5 shadow-apple-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} style={{ color: 'var(--text-secondary)' }} strokeWidth={1.8} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recently Added</p>
            </div>
            <Link to="/universities" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>View all</Link>
          </div>
          {!data?.recentUniversities?.length ? (
            <div className="py-2">
              <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>No universities added yet.</p>
              <Link to="/universities" className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5">
                <Building2 size={11} /> Add University
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentUniversities.map(u => {
                const cat = categoryConfig[u.category];
                return (
                  <div key={u.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cat.bg }}>
                        <Building2 size={12} style={{ color: cat.color }} strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{u.program}</p>
                      </div>
                    </div>
                    <Link to={`/sop/${u.id}`}
                      className="flex-shrink-0 ml-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      <PenLine size={11} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
