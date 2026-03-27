import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { getUpcomingMilestones } from './Timeline';
import ErrorCard from '../components/ErrorCard';
import { DashboardSkeleton } from '../components/common/Skeleton';
import {
  Building2, FileText, Sparkles, ArrowRight, Calendar,
  CheckCircle, Clock, User, ChevronRight,
  PenLine, FolderOpen, Check, Circle, CalendarClock, X, Mail,
} from 'lucide-react';

const statusConfig = {
  not_started: { label: 'Not Started', color: 'var(--text-tertiary)', bg: 'var(--bg-secondary)' },
  in_progress:  { label: 'In Progress',  color: '#D4A843', bg: 'rgba(212,168,67,0.12)' },
  submitted:    { label: 'Submitted',    color: 'var(--text-primary)', bg: 'rgba(30,45,64,0.08)' },
  accepted:     { label: 'Accepted',     color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  rejected:     { label: 'Rejected',     color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
  waitlisted:   { label: 'Waitlisted',   color: '#D4A843', bg: 'rgba(212,168,67,0.12)' },
};

const categoryConfig = {
  dream:  { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  target: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  safety: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)' },
};

function getJourneySteps(data) {
  return [
    {
      num: 1,
      title: 'Complete your profile',
      desc: 'Add GPA, test scores, and background info',
      done: (data?.profileCompletion ?? 0) >= 60,
      partial: (data?.profileCompletion ?? 0) > 0,
      to: '/profile',
      cta: 'Go to Profile',
      icon: User,
      color: '#7C3AED',
    },
    {
      num: 2,
      title: 'Add your universities',
      desc: 'Build a dream, target & safety school list',
      done: (data?.universities ?? 0) >= 3,
      partial: (data?.universities ?? 0) > 0,
      to: '/universities',
      cta: 'Add Universities',
      icon: Building2,
      color: '#3B82F6',
    },
    {
      num: 3,
      title: 'Upload your documents',
      desc: 'Transcripts, test scores, recommendation letters',
      done: (data?.documents ?? 0) >= 2,
      partial: (data?.documents ?? 0) > 0,
      to: '/documents',
      cta: 'Upload Documents',
      icon: FolderOpen,
      color: '#D4A843',
    },
    {
      num: 4,
      title: 'Write your personal statement',
      desc: 'Select a university to open its SOP editor',
      done: (data?.sops ?? 0) > 0,
      partial: false,
      to: '/universities',
      cta: 'Open SOP Editor',
      icon: FileText,
      color: '#34C759',
    },
    {
      num: 5,
      title: 'Get AI feedback',
      desc: 'Select a university, then open a draft to get AI feedback',
      done: (data?.critiques ?? 0) > 0,
      partial: false,
      to: '/universities',
      cta: 'Get Critique',
      icon: Sparkles,
      color: '#C4622D',
    },
  ];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [upcomingMilestones] = useState(() => getUpcomingMilestones(3));
  const [verificationBannerDismissed, setVerificationBannerDismissed] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      await apiClient.post('/api/auth/resend-verification');
      setResendSuccess(true);
    } catch {
      // Silently fail — banner stays
    } finally {
      setResendingVerification(false);
    }
  };

  const showVerificationBanner = user && !user.emailVerified && !verificationBannerDismissed;

  const fetchStats = () => {
    setError(false);
    apiClient.get('/api/dashboard/stats')
      .then(res => setData(res.data))
      .catch(() => setError(true));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const journeySteps = getJourneySteps(data);
  const completedSteps = journeySteps.filter(s => s.done).length;
  const nextStep = journeySteps.find(s => !s.done);

  return (
    <div className="p-4 md:p-8 max-w-5xl space-y-4">

      {/* Email verification banner */}
      {showVerificationBanner && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3 relative"
          style={{ background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.3)' }}>
          <Mail size={15} style={{ color: '#D4A843', flexShrink: 0 }} strokeWidth={1.8} />
          <div className="flex-1 min-w-0">
            {resendSuccess ? (
              <p className="text-sm" style={{ color: '#1E2D40' }}>
                Verification email sent! Check your inbox.
              </p>
            ) : (
              <p className="text-sm" style={{ color: '#1E2D40' }}>
                Please verify your email address.{' '}
                <button
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="font-semibold underline underline-offset-2 disabled:opacity-60"
                  style={{ color: '#C4622D', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {resendingVerification ? 'Sending...' : 'Resend verification email'}
                </button>
              </p>
            )}
          </div>
          <button
            onClick={() => setVerificationBannerDismissed(true)}
            className="flex-shrink-0 p-1 rounded-lg transition-opacity hover:opacity-60"
            style={{ color: '#D4A843', background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="card p-5 shadow-apple-sm flex items-center justify-between overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, rgba(196,98,45,0.06) 0%, rgba(212,168,67,0.05) 60%, rgba(30,45,64,0.04) 100%)' }}>
        {/* decorative circle */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-5 pointer-events-none"
          style={{ background: 'var(--accent)' }} />
        <div className="min-w-0 relative">
          <p className="text-xs font-semibold mb-0.5 uppercase tracking-widest" style={{ color: 'var(--accent)' }}>{getGreeting()}</p>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)', fontFamily: 'Fraunces, serif' }}>
            {user?.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
              style={{ background: user?.plan === 'free' ? 'var(--bg-secondary)' : 'var(--accent-subtle)', color: user?.plan === 'free' ? 'var(--text-secondary)' : 'var(--accent)' }}>
              {user?.plan} plan
            </span>
            {memberSince && (
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Since {memberSince}</span>
            )}
          </div>
        </div>
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ml-3"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--gold))', fontFamily: 'Fraunces, serif' }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Loading skeleton */}
      {!data && !error && <DashboardSkeleton />}

      {/* Error state */}
      {error && (
        <ErrorCard message="Couldn't load your stats" onRetry={fetchStats} />
      )}

      {/* Journey Panel — only render once data is loaded */}
      {data && <div className="card shadow-apple-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Your Application Journey</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {completedSteps === 5 ? 'All steps complete — you\'re ready to apply!' : `${completedSteps} of 5 steps complete`}
              </p>
            </div>
            <span className="text-sm font-bold" style={{ color: completedSteps === 5 ? '#34C759' : 'var(--accent)' }}>
              {Math.round((completedSteps / 5) * 100)}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="rounded-full h-2 cursor-pointer" style={{ background: 'var(--border)' }}
            onClick={() => setShowAllSteps(s => !s)}>
            <div className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(completedSteps / 5) * 100}%`,
                background: completedSteps === 5 ? '#34C759' : 'linear-gradient(90deg, var(--accent), var(--gold))',
              }} />
          </div>
          <p className="text-xs mt-1.5 cursor-pointer select-none" style={{ color: 'var(--text-tertiary)' }}
            onClick={() => setShowAllSteps(s => !s)}>
            {completedSteps}/5 complete · click to {showAllSteps ? 'hide' : 'see all'}
          </p>
        </div>

        {/* Steps */}
        {completedSteps === 5 && !showAllSteps ? (
          <div className="px-5 py-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(52,199,89,0.12)' }}>
              <Check size={16} color="#34C759" strokeWidth={3} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>All done — you're ready to apply!</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Click the progress bar above to review completed steps.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {(showAllSteps ? journeySteps : journeySteps.filter(s => !s.done)).map((step) => {
              const Icon = step.icon;
              const isNext = nextStep?.num === step.num;
              return (
                <div key={step.num}
                  className="px-5 py-3.5 flex items-center gap-3 transition-all"
                  style={{ background: isNext ? `rgba(0,113,227,0.03)` : 'transparent', opacity: step.done ? 0.6 : 1 }}>
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {step.done ? (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#34C759' }}>
                        <Check size={12} color="white" strokeWidth={3} />
                      </div>
                    ) : step.partial ? (
                      <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: step.color }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: step.color }} />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{step.num}</span>
                      </div>
                    )}
                  </div>

                  {/* Icon */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: step.done ? 'rgba(52,199,89,0.1)' : `${step.color}14` }}>
                    <Icon size={14} style={{ color: step.done ? '#34C759' : step.color }} strokeWidth={1.8} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: step.done ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {step.title}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>{step.desc}</p>
                  </div>

                  {/* CTA */}
                  {!step.done && (
                    <Link to={step.to}
                      className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
                      style={isNext
                        ? { background: 'var(--accent)', color: 'white' }
                        : { color: 'var(--text-tertiary)', background: 'var(--bg-secondary)' }}>
                      {isNext ? step.cta : <ChevronRight size={13} />}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>}

      {/* Timeline widget */}
      <div className="card shadow-apple-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <CalendarClock size={14} style={{ color: 'var(--text-secondary)' }} strokeWidth={1.8} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Your Timeline</p>
          </div>
          <Link to="/timeline" className="text-xs font-medium flex items-center gap-0.5" style={{ color: 'var(--accent)' }}>
            View full timeline <ChevronRight size={12} />
          </Link>
        </div>

        {upcomingMilestones === null ? (
          <div className="px-5 py-5 flex flex-col gap-3">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Set your target enrollment date to see your application timeline.
            </p>
            <Link to="/timeline"
              className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5 self-start">
              <CalendarClock size={11} /> Set enrollment date
            </Link>
          </div>
        ) : upcomingMilestones.length === 0 ? (
          <div className="px-5 py-5">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No upcoming milestones — check your full timeline for overdue items.
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {upcomingMilestones.map(m => {
              const isDueSoon = m.status === 'due-soon';
              const dotColor  = isDueSoon ? '#D4A843' : 'var(--text-tertiary)';
              return (
                <div key={m.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: dotColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{m.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {m.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  {isDueSoon && (
                    <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(212,168,67,0.12)', color: '#D4A843' }}>
                      Due soon
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Universities', value: data?.universities ?? '—', icon: Building2, color: '#C4622D', bg: 'rgba(196,98,45,0.08)', to: '/universities' },
          { label: 'Documents',    value: data?.documents    ?? '—', icon: FolderOpen, color: '#D4A843', bg: 'rgba(212,168,67,0.1)',  to: '/documents' },
          { label: 'SOPs',         value: data?.sops         ?? '—', icon: FileText,   color: '#1E2D40', bg: 'rgba(30,45,64,0.08)',   to: '/universities' },
          { label: 'Critiques',    value: data?.critiques    ?? '—', icon: Sparkles,   color: '#34C759', bg: 'rgba(52,199,89,0.08)',  to: '/universities' },
        ].map(({ label, value, icon: Icon, color, bg, to }) => (
          <Link key={label} to={to} className="card p-3 md:p-4 shadow-apple-sm hover:shadow-apple transition-all group">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center mb-2" style={{ background: bg }}>
              <Icon size={13} style={{ color }} strokeWidth={1.8} />
            </div>
            <p className="text-lg md:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </Link>
        ))}
      </div>

      {/* Profile + Category + Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            <div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>No universities yet.</p>
              <Link to="/universities" className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5">
                <Building2 size={11} /> Add now
              </Link>
            </div>
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

        {/* Status breakdown */}
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
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Deadlines + Recent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      <p className="text-xs font-semibold" style={{ color: isUrgent ? '#FF3B30' : 'var(--text-primary)' }}>{daysLeft}d left</p>
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

        {/* Recently added */}
        <div className="card p-5 shadow-apple-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: 'var(--text-secondary)' }} strokeWidth={1.8} />
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
                const cat = categoryConfig[u.category?.toLowerCase()] ?? categoryConfig.target;
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
                      className="flex-shrink-0 ml-2 p-1.5 rounded-lg transition-opacity"
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
