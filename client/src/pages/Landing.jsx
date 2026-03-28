import { Link } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { LogoWordmark } from '../components/Logo';
import {
  Sparkles, FileText, ClipboardList, UserCheck,
  BarChart2, Calendar, ArrowRight, CheckCircle, Globe, BookOpen, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = (delay = 0) => ({
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1], delay } },
});

// Instant variants for prefers-reduced-motion
const noMotion = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};
const noMotionStagger = () => noMotion;

function Section({ children, className = '', style }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
      style={style}>
      {children}
    </motion.section>
  );
}

const features = [
  {
    icon: Sparkles,
    title: 'AI University Suggestions',
    desc: 'Get Dream, Target, and Safety school recommendations tailored to your GPA, test scores, and goals — not a generic list.',
  },
  {
    icon: FileText,
    title: 'SOP Workshop',
    desc: 'Write, critique, and refine your statement of purpose with AI feedback scored across clarity, fit, and narrative.',
  },
  {
    icon: ClipboardList,
    title: 'Application Checklist',
    desc: 'Per-university checklists enriched with real program requirements — GRE minimums, TOEFL cutoffs, credential evaluation.',
  },
  {
    icon: UserCheck,
    title: 'LOR Tracker',
    desc: 'Manage recommenders, track submission status per university, and generate a personalised request email in one click.',
  },
  {
    icon: BarChart2,
    title: 'Fit Score',
    desc: 'See how your profile stacks up against each program\'s requirements — Strong Fit, Borderline, or Reach — before you apply.',
  },
  {
    icon: Calendar,
    title: 'Timeline Calculator',
    desc: 'Enter your enrollment date and get a backwards milestone schedule covering every step of the application process.',
  },
];

const testimonial = {
  quote: "I had no idea which schools to even apply to. UniApply gave me a shortlist in 10 minutes and told me exactly what my SOP was missing.",
  name: "Priya S.",
  detail: "Admitted to 3 Master's programs, cycle 2025",
};

const steps = [
  {
    number: '01',
    title: 'Build your profile',
    desc: 'Enter your GPA, test scores, field of study, and goals. Takes 5 minutes.',
  },
  {
    number: '02',
    title: 'Get AI suggestions',
    desc: 'Claude analyses your profile and recommends 9 schools across Dream, Target, and Safety tiers.',
  },
  {
    number: '03',
    title: 'Track everything',
    desc: 'Manage SOPs, documents, LORs, and deadlines in one place — no spreadsheets.',
  },
];

export default function Landing() {
  const { dark, toggle } = useTheme();
  const prefersReduced = useReducedMotion();
  const FU = prefersReduced ? noMotion : fadeUp;
  const ST = prefersReduced ? noMotionStagger : stagger;
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-primary)', minHeight: '100vh' }}>

      {/* Skip to content — keyboard accessibility */}
      <a href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-semibold focus:text-white"
        style={{ background: 'var(--accent)' }}>
        Skip to content
      </a>

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between px-6 md:px-12 py-4 sticky top-0 z-50 backdrop-blur-md"
        style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(var(--bg-rgb, 247,245,242), 0.85)' }}>
        <LogoWordmark size="md" />
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggle}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            aria-label="Toggle theme">
            {dark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
          </button>
          <Link to="/login"
            className="text-sm font-medium px-4 py-2 rounded-xl transition-all"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <span className="sm:hidden">Log in</span>
            <span className="hidden sm:inline">Sign in</span>
          </Link>
          <Link to="/signup"
            className="text-sm font-medium px-4 py-2 rounded-xl text-white transition-all active:scale-95"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}>
            <span className="sm:hidden">Sign up</span>
            <span className="hidden sm:inline">Get started free</span>
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <div id="main-content" className="px-6 md:px-12 pt-20 pb-24 max-w-5xl mx-auto text-center">
        <motion.div variants={ST(0.1)} initial="hidden" animate="visible">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            <Globe size={11} strokeWidth={2.5} />
            Built for South Asian students applying abroad
          </span>
        </motion.div>

        <motion.h1
          variants={ST(0.2)} initial="hidden" animate="visible"
          className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6"
          style={{ fontFamily: 'Fraunces, serif' }}>
          Most students apply blind.<br />
          <span style={{ color: 'var(--accent)' }}>You won't.</span>
        </motion.h1>

        <motion.p
          variants={ST(0.3)} initial="hidden" animate="visible"
          className="text-lg md:text-xl mb-10 max-w-2xl mx-auto"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          AI university suggestions, SOP critique, LOR tracking, and deadline management —
          everything consultancies charge <strong style={{ color: 'var(--text-primary)' }}>NPR 60,000</strong> for, free during early access.
        </motion.p>

        <motion.div
          variants={ST(0.4)} initial="hidden" animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/signup"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}>
            Start for free
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
          <Link to="/login"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>
            Sign in
          </Link>
        </motion.div>

        <motion.div
          variants={ST(0.5)} initial="hidden" animate="visible"
          className="flex items-center justify-center gap-6 mt-10 flex-wrap">
          {['Free early access', 'No credit card', 'AI-powered'].map(label => (
            <span key={label} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              <CheckCircle size={13} strokeWidth={2} style={{ color: 'var(--accent)' }} />
              {label}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Problem strip */}
      <Section className="px-6 md:px-12 py-14" style={{ background: 'var(--bg-secondary)' }}>
        <motion.div variants={FU} className="max-w-3xl mx-auto text-center">
          <p className="text-2xl md:text-3xl font-bold tracking-tight leading-snug" style={{ fontFamily: 'Fraunces, serif' }}>
            <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)' }}>NPR 60,000</span>
            {' '}
            <span style={{ color: 'var(--accent)' }}>→ NPR 0.</span>
            {' '}That's what we cost.
          </p>
          <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Consultancies in Nepal charge NPR 50,000–80,000 for advice that's largely template-based.
            UniApply gives every student the same guidance — powered by AI, not a middleman.
          </p>
        </motion.div>
      </Section>

      {/* Features */}
      <div className="px-6 md:px-12 py-24 max-w-5xl mx-auto">
        <Section>
          <motion.div variants={FU} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
              Everything you need to apply
            </h2>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
              From first school list to submitted application — in one dashboard.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Section key={f.title}>
                  <motion.div
                    variants={ST(i * 0.07)}
                    className="card p-5 h-full transition-all"
                    style={{ cursor: 'default' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '';
                      e.currentTarget.style.boxShadow = '';
                    }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: 'var(--accent-subtle)' }}>
                      <Icon size={17} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
                    </div>
                    <h3 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                  </motion.div>
                </Section>
              );
            })}
          </div>
        </Section>
      </div>

      {/* How it works */}
      <div style={{ background: 'var(--bg-secondary)' }}>
        <div className="px-6 md:px-12 py-24 max-w-4xl mx-auto">
          <Section>
            <motion.div variants={FU} className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
                How it works
              </h2>
              <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                Get from zero to a complete application list in under 10 minutes.
              </p>
            </motion.div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Connector line — desktop only */}
              <div className="hidden md:block absolute top-5 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px"
                style={{ background: 'var(--border)' }} aria-hidden="true" />

              {steps.map((step, i) => (
                <Section key={step.number}>
                  <motion.div variants={ST(i * 0.1)} className="text-center relative">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3 mx-auto"
                      style={{ background: 'var(--bg-secondary)', border: '2px solid var(--accent)' }}>
                      <span className="text-sm font-bold tabular-nums" aria-hidden="true"
                        style={{ fontFamily: 'Fraunces, serif', color: 'var(--accent)' }}>
                        {step.number}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                  </motion.div>
                </Section>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* CTA */}
      <Section className="px-6 md:px-12 py-24">
        <motion.div variants={FU} className="max-w-2xl mx-auto text-center">
          <div className="card p-10 md:p-14">
            {/* Testimonial */}
            <div className="mb-8 p-5 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>
                "{testimonial.quote}"
              </p>
              <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{testimonial.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{testimonial.detail}</p>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
              Students who plan get in.<br />
              <span style={{ color: 'var(--accent)' }}>Start planning.</span>
            </h2>
            <p className="text-base mb-8" style={{ color: 'var(--text-secondary)' }}>
              Free during early access. No credit card required.
            </p>
            <Link to="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}>
              Create your free account
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
          </div>
        </motion.div>
      </Section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <LogoWordmark size="sm" />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Built for students who deserve better than overpriced consultancies.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs transition-colors" style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              Sign in
            </Link>
            <Link to="/signup" className="text-xs transition-colors" style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              Sign up
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
