import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CalendarClock, ChevronRight, AlertTriangle, Info, X } from 'lucide-react';

// ─── Milestone data ───────────────────────────────────────────────────────────

const MASTERS_PHD_MILESTONES = [
  { id: 'decide',       monthsBefore: 18, label: 'Decide to apply abroad',          desc: 'Research countries, degree levels, and general program fit.' },
  { id: 'gre',          monthsBefore: 16, label: 'Register & prepare for GRE',       desc: 'Aim for GRE Q160+ for STEM programs. Allow 3–6 months of prep.' },
  { id: 'english_test', monthsBefore: 14, label: 'Take TOEFL or IELTS',              desc: 'Most programs require TOEFL 80+ or IELTS 6.5+. Scores are valid for 2 years.' },
  { id: 'research',     monthsBefore: 12, label: 'Research & shortlist universities', desc: 'Aim for 10–12 schools across Dream, Target, and Safety tiers.' },
  { id: 'contact_prof', monthsBefore: 11, label: 'Contact potential PhD advisors',   desc: 'PhD only: Email professors whose research matches yours before applying.', phdOnly: true },
  { id: 'transcript',   monthsBefore: 10, label: 'Request official transcripts',     desc: 'TU/KU/PU transcripts can take 4–8 weeks. Request early. Also start WES credential evaluation (~$200, takes 4–8 weeks).' },
  { id: 'lor_request',  monthsBefore: 10, label: 'Ask for recommendation letters',   desc: 'Give recommenders at least 2 months notice. Provide your CV and program details.' },
  { id: 'sop_draft',    monthsBefore:  9, label: 'Start writing your SOP',           desc: 'Your Statement of Purpose is the most important part of your application. Start early.' },
  { id: 'applications', monthsBefore:  4, label: 'Submit applications',              desc: 'Most US programs have December–January deadlines for fall enrollment. Submit 1–2 weeks early.' },
  { id: 'decisions',    monthsBefore: -3, label: 'Receive admission decisions',      desc: 'Most decisions arrive February–April. Check email and application portals regularly.' },
  { id: 'accept_offer', monthsBefore: -4, label: 'Accept offer & get I-20/CAS',      desc: 'Accept the offer, pay enrollment deposit, and request your I-20 (US) or CAS (UK).' },
  { id: 'sevis',        monthsBefore: -5, label: 'Pay SEVIS fee & apply for visa',   desc: 'US: Pay $350 SEVIS fee, then apply for F-1 visa. Schedule embassy interview in Kathmandu.' },
  { id: 'depart',       monthsBefore: -6, label: 'Prepare to depart',                desc: 'Book flights, arrange housing, pack documents. Most programs start in August–September.' },
];

const UNDERGRAD_MILESTONES = [
  { id: 'sat_prep',     monthsBefore: 24, label: 'Start SAT/ACT preparation',                  desc: 'Allow 6+ months of prep. SAT target: 1300+ for competitive schools.' },
  { id: 'sat_first',    monthsBefore: 18, label: 'Take SAT/ACT (first attempt)',                desc: 'Take your first attempt early so you have time to retake if needed.' },
  { id: 'english_test', monthsBefore: 14, label: 'Take IELTS/TOEFL',                            desc: 'Most programs require TOEFL 80+ or IELTS 6.5+. Scores are valid for 2 years.' },
  { id: 'research',     monthsBefore: 12, label: 'Research universities',                        desc: 'Aim for 10–12 schools across Dream, Target, and Safety tiers.' },
  { id: 'transcript',   monthsBefore: 10, label: 'Request transcripts & SLC/SEE certificates',  desc: 'Board transcripts can take several weeks. Request early and get multiple certified copies.' },
  { id: 'lor_request',  monthsBefore: 10, label: 'Ask for recommendation letters',               desc: 'Give recommenders at least 2 months notice. Provide your CV and a short bio.' },
  { id: 'essay',        monthsBefore:  9, label: 'Write personal statement',                     desc: 'Your personal essay is the most important part of your application. Start early and revise often.' },
  { id: 'applications', monthsBefore:  4, label: 'Submit applications',                          desc: 'Most US undergraduate deadlines: November 1 (early) or January 1 (regular). Apply early action where possible.' },
  { id: 'decisions',    monthsBefore: -3, label: 'Receive admission decisions',                  desc: 'Most decisions arrive March–April. Check portals and email regularly.' },
  { id: 'accept_offer', monthsBefore: -4, label: 'Accept offer & pay enrollment deposit',        desc: 'Accept the offer, pay enrollment deposit, and request your I-20 (US) or CAS (UK).' },
  { id: 'sevis',        monthsBefore: -5, label: 'Pay SEVIS fee & apply for visa',               desc: 'US: Pay $350 SEVIS fee, then apply for F-1 visa. Schedule embassy interview in Kathmandu.' },
  { id: 'depart',       monthsBefore: -6, label: 'Prepare to depart',                            desc: 'Book flights, arrange housing, pack documents. Most programs start in August–September.' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date(2026, 2, 26); // March 26 2026 — per system date

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function getMilestoneDate(enrollmentDate, monthsBefore) {
  return addMonths(enrollmentDate, -monthsBefore);
}

function getMilestoneStatus(milestoneDate) {
  const diffDays = Math.ceil((milestoneDate - TODAY) / (1000 * 60 * 60 * 24));
  if (diffDays < -30) return 'complete';
  if (diffDays < 0)   return 'overdue';
  if (diffDays <= 30) return 'due-soon';
  return 'upcoming';
}

const STATUS_CONFIG = {
  upcoming:  { dot: 'var(--text-tertiary)',   bg: 'var(--bg-secondary)',          label: 'Upcoming' },
  'due-soon':{ dot: '#D4A843',               bg: 'rgba(212,168,67,0.10)',         label: 'Due Soon' },
  overdue:   { dot: '#FF3B30',               bg: 'rgba(255,59,48,0.08)',          label: 'Overdue' },
  complete:  { dot: '#34C759',               bg: 'rgba(52,199,89,0.08)',          label: 'Complete' },
};

function formatMonth(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function defaultEnrollmentDate() {
  // Default: August 2027
  return new Date(2027, 7, 1);
}

function buildMonthOptions() {
  // 6 months from today up to 3 years out
  const options = [];
  const start = addMonths(TODAY, 6);
  const end   = addMonths(TODAY, 36);
  let cursor  = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    options.push(new Date(cursor));
    cursor = addMonths(cursor, 1);
  }
  return options;
}

const MONTH_OPTIONS = buildMonthOptions();
const MONTH_NAMES   = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── Main component ───────────────────────────────────────────────────────────

export default function Timeline() {
  // ── Persistent state
  const [enrollmentDate, setEnrollmentDate] = useState(() => {
    const saved = localStorage.getItem('uniapply_enrollment_date');
    return saved ? new Date(saved) : defaultEnrollmentDate();
  });

  const [degreeLevel, setDegreeLevel] = useState(() =>
    localStorage.getItem('uniapply_degree_level') || 'masters'
  );

  const [introDismissed, setIntroDismissed] = useState(() =>
    localStorage.getItem('uniapply_timeline_intro_dismissed') === 'true'
  );

  // ── Picker state (controlled selects)
  const [pickerMonth, setPickerMonth] = useState(enrollmentDate.getMonth());
  const [pickerYear,  setPickerYear]  = useState(enrollmentDate.getFullYear());

  // Sync localStorage
  useEffect(() => {
    localStorage.setItem('uniapply_enrollment_date', enrollmentDate.toISOString());
  }, [enrollmentDate]);

  useEffect(() => {
    localStorage.setItem('uniapply_degree_level', degreeLevel);
  }, [degreeLevel]);

  // Apply picker changes
  function applyPickerDate(month, year) {
    const d = new Date(year, month, 1);
    // Clamp to valid range
    if (d >= MONTH_OPTIONS[0] && d <= MONTH_OPTIONS[MONTH_OPTIONS.length - 1]) {
      setEnrollmentDate(d);
    }
  }

  function handleMonthChange(e) {
    const m = parseInt(e.target.value, 10);
    setPickerMonth(m);
    applyPickerDate(m, pickerYear);
  }

  function handleYearChange(e) {
    const y = parseInt(e.target.value, 10);
    setPickerYear(y);
    applyPickerDate(pickerMonth, y);
  }

  const dismissIntro = () => {
    localStorage.setItem('uniapply_timeline_intro_dismissed', 'true');
    setIntroDismissed(true);
  };

  // ── Compute milestones
  const baseMilestones = degreeLevel === 'undergrad' ? UNDERGRAD_MILESTONES : MASTERS_PHD_MILESTONES;
  const milestones = baseMilestones
    .filter(m => degreeLevel !== 'masters' || !m.phdOnly) // for masters hide PhD-only; PhD keeps them
    .map(m => {
      const date   = getMilestoneDate(enrollmentDate, m.monthsBefore);
      const status = getMilestoneStatus(date);
      return { ...m, date, status };
    });

  // "You are here" position: find first upcoming/due-soon milestone
  const todayIndex = milestones.findIndex(m => m.status === 'upcoming' || m.status === 'due-soon');

  // ── Warnings
  const monthsUntilEnrollment = Math.ceil((enrollmentDate - TODAY) / (1000 * 60 * 60 * 24 * 30.44));
  const isCompressed = monthsUntilEnrollment < 12;

  // ── Available years in picker
  const availableYears = [...new Set(MONTH_OPTIONS.map(d => d.getFullYear()))];

  return (
    <div className="p-4 md:p-8 max-w-3xl space-y-5">

      {/* Page header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Fraunces, serif' }}>
          Application Timeline
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Backwards-calculated milestones from your target enrollment date.
        </p>
      </div>

      {/* Intro banner — shown until dismissed */}
      {!introDismissed && (
        <div className="card shadow-apple-sm overflow-hidden">
          <div className="px-5 py-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(52,199,89,0.1)' }}>
              <CalendarClock size={20} style={{ color: '#34C759' }} strokeWidth={1.6} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>How your timeline works</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Set your target enrollment date below and we'll work backwards to give you a personalised milestone schedule — covering test prep, LOR requests, SOP drafts, and application deadlines.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  'Application deadline countdown per school',
                  'Test prep milestones (GRE, TOEFL)',
                  'LOR request reminders',
                  'SOP draft & revision schedule',
                ].map(item => (
                  <span key={item} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: '#34C759' }}>✓</span> {item}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={dismissIntro}
              className="flex-shrink-0 p-1 rounded-lg transition-opacity hover:opacity-60"
              style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Controls card */}
      <div className="card p-5 shadow-apple-sm space-y-5">
        {/* Enrollment date */}
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            When do you plan to start your program?
          </label>
          <div className="flex gap-2">
            <select
              value={pickerMonth}
              onChange={handleMonthChange}
              className="flex-1 text-sm rounded-xl px-3 py-2 border outline-none transition-all"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)', fontFamily: 'inherit' }}
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>{name}</option>
              ))}
            </select>
            <select
              value={pickerYear}
              onChange={handleYearChange}
              className="text-sm rounded-xl px-3 py-2 border outline-none transition-all"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)', fontFamily: 'inherit' }}
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
            Target enrollment: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatMonth(enrollmentDate)}</span>
            {' '}· {monthsUntilEnrollment > 0 ? `${monthsUntilEnrollment} months away` : 'Already passed'}
          </p>
        </div>

        {/* Degree level */}
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            What are you applying for?
          </label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'undergrad', label: 'Undergraduate' },
              { value: 'masters',  label: "Master's" },
              { value: 'phd',      label: 'PhD' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setDegreeLevel(opt.value)}
                className="px-4 py-1.5 rounded-xl text-sm font-medium transition-all border"
                style={degreeLevel === opt.value
                  ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' }
                  : { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compressed timeline warning */}
      {isCompressed && (
        <div className="flex gap-3 p-4 rounded-2xl border" style={{ background: 'rgba(212,168,67,0.08)', borderColor: 'rgba(212,168,67,0.3)' }}>
          <AlertTriangle size={16} style={{ color: '#D4A843', flexShrink: 0, marginTop: 1 }} strokeWidth={1.8} />
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            <span className="font-semibold">Your timeline is compressed.</span>{' '}
            You may need to consider a later intake or prioritize applications to schools with rolling admissions.
          </p>
        </div>
      )}

      {/* PhD funding callout */}
      {degreeLevel === 'phd' && (
        <div className="flex gap-3 p-4 rounded-2xl border" style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.2)' }}>
          <Info size={16} style={{ color: '#3B82F6', flexShrink: 0, marginTop: 1 }} strokeWidth={1.8} />
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            <span className="font-semibold">PhD programs in the US, Canada, and many European countries are typically fully funded</span>{' '}
            through Teaching/Research Assistantships — you may not need to pay tuition at all.
          </p>
        </div>
      )}

      {/* Vertical timeline */}
      <div className="card shadow-apple-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Your Milestones</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {milestones.filter(m => m.status === 'complete').length} of {milestones.length} complete
          </p>
        </div>

        <div className="relative px-5 py-4">
          {/* Vertical connector line */}
          <div
            className="absolute"
            style={{ left: 'calc(1.25rem + 9px)', top: '1rem', bottom: '1rem', width: 2, background: 'var(--border-subtle)' }}
          />

          <div className="space-y-0">
            {milestones.map((m, idx) => {
              const cfg     = STATUS_CONFIG[m.status];
              const isToday = todayIndex === idx;
              const isNext  = todayIndex === idx;

              return (
                <div key={m.id}>
                  {/* "You are here" banner */}
                  {isToday && (
                    <div className="flex items-center gap-2 my-2 relative z-10" style={{ marginLeft: 24 }}>
                      <div className="h-px flex-1" style={{ background: 'var(--accent)', opacity: 0.4 }} />
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--accent)', color: 'white', whiteSpace: 'nowrap' }}>
                        You are here · {formatMonth(TODAY)}
                      </span>
                      <div className="h-px flex-1" style={{ background: 'var(--accent)', opacity: 0.4 }} />
                    </div>
                  )}

                  <div
                    className="flex gap-3 py-3 rounded-xl transition-all"
                    style={{ background: isNext && m.status !== 'complete' ? cfg.bg : 'transparent' }}
                  >
                    {/* Dot */}
                    <div className="flex-shrink-0 relative z-10" style={{ width: 20, paddingTop: 2 }}>
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                        style={{
                          background: m.status === 'complete' ? cfg.dot : 'var(--bg-elevated)',
                          borderColor: cfg.dot,
                        }}
                      >
                        {m.status === 'complete' && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium" style={{ color: m.status === 'complete' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                            {m.label}
                          </p>
                          {m.phdOnly && (
                            <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}>
                              PhD
                            </span>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs font-semibold" style={{ color: cfg.dot }}>
                            {formatMonth(m.date)}
                          </p>
                          <span className="text-xs" style={{ color: cfg.dot, opacity: 0.85 }}>{cfg.label}</span>
                        </div>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{m.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spacer for mobile nav */}
      <div className="h-2" />
    </div>
  );
}

// ─── Exported helper for Dashboard widget ─────────────────────────────────────

export function getUpcomingMilestones(count = 3) {
  const savedDate  = localStorage.getItem('uniapply_enrollment_date');
  const savedLevel = localStorage.getItem('uniapply_degree_level') || 'masters';
  if (!savedDate) return null;

  const enrollmentDate  = new Date(savedDate);
  const baseMilestones  = savedLevel === 'undergrad' ? UNDERGRAD_MILESTONES : MASTERS_PHD_MILESTONES;
  const filtered        = baseMilestones.filter(m => savedLevel !== 'masters' || !m.phdOnly);

  const computed = filtered.map(m => ({
    ...m,
    date:   getMilestoneDate(enrollmentDate, m.monthsBefore),
    status: getMilestoneStatus(getMilestoneDate(enrollmentDate, m.monthsBefore)),
  }));

  return computed
    .filter(m => m.status === 'upcoming' || m.status === 'due-soon')
    .slice(0, count);
}
