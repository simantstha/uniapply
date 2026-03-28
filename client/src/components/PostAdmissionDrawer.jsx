// client/src/components/PostAdmissionDrawer.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatMonth(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getSteps(enrollmentDate) {
  const enroll = enrollmentDate ? new Date(enrollmentDate) : null;

  return [
    {
      id: 'accept',
      label: 'Accept your offer & pay enrollment deposit',
      detail: 'Deposit is typically $500–$1,000 and non-refundable. Confirm the deadline in your offer letter.',
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -8))}` : 'Within 2–4 weeks of offer letter',
    },
    {
      id: 'i20',
      label: 'Request your I-20 from the school',
      detail: 'Contact the international students office immediately after accepting. I-20 takes 3–6 weeks to arrive.',
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -7))}` : 'Right after accepting — allow 3–6 weeks',
    },
    {
      id: 'sevis',
      label: 'Pay SEVIS fee ($350)',
      detail: "Pay at FMJfee.com using your I-20 SEVIS ID. Keep the receipt — you'll need it at the visa interview.",
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -6))}` : 'After receiving I-20, before visa appointment',
      link: { url: 'https://www.fmjfee.com', label: 'Pay at FMJfee.com' },
    },
    {
      id: 'ds160',
      label: 'Complete DS-160 form (online)',
      detail: "The DS-160 is the US visa application form. Print the confirmation page — you'll need it at the interview.",
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -5))}` : 'At least 3 weeks before visa appointment',
      link: { url: 'https://ceac.state.gov/genniv/', label: 'Fill DS-160' },
    },
    {
      id: 'visa_appt',
      label: 'Schedule F-1 visa appointment (US Embassy, Kathmandu)',
      detail: 'Book via the US Embassy Kathmandu portal. Slots fill up 4–8 weeks out — book early.',
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -5))}` : 'Book early — slots fill 4–8 weeks out',
      link: { url: 'https://np.usembassy.gov/visas/nonimmigrant-visas/', label: 'US Embassy Kathmandu' },
    },
    {
      id: 'visa_docs',
      label: 'Prepare visa documents',
      detail: 'Required: I-20, DS-160 confirmation, SEVIS receipt, valid passport, passport photo, bank statements (3+ months), admission letter, academic transcripts.',
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -4))}` : '1 week before your appointment',
    },
    {
      id: 'visa_interview',
      label: 'Attend F-1 visa interview',
      detail: 'Arrive 15 minutes early. Be ready to explain your study plans and ties to Nepal. Most Nepali students are approved.',
      timing: 'On your appointment date',
    },
    {
      id: 'orientation',
      label: 'Register for orientation + arrange housing',
      detail: 'On-campus housing fills fast. Most universities open housing applications 3–4 months before arrival.',
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -3))}` : 'As soon as visa is stamped',
    },
    {
      id: 'flights',
      label: 'Book flights to your university city',
      detail: 'Book 4–6 weeks out for best prices. Plan to arrive 3–5 days before orientation.',
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -2))}` : '4–6 weeks before program start',
    },
  ];
}

export default function PostAdmissionDrawer({ university, onClose }) {
  const [visible, setVisible] = useState(false);
  const [rowsVisible, setRowsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => setRowsVisible(true), 250);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 280);
  }

  if (!university) return null;

  const enrollmentDate = localStorage.getItem('uniapply_enrollment_date');
  const steps = getSteps(enrollmentDate);

  return createPortal(
    <>
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.4)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 280ms ease',
        }}
      />
      <div style={{
        position: 'fixed', right: 0, top: 0, height: '100dvh', width: '100%', maxWidth: 440,
        background: 'var(--bg-elevated)', borderLeft: '1px solid var(--border)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 30px rgba(0,0,0,0.15)',
        overflowY: 'auto',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} style={{ color: '#34C759' }} strokeWidth={1.6} />
                <h2 className="text-base font-semibold" style={{ color: '#34C759' }}>
                  You got in!
                </h2>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {university.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {university.program}
              </p>
            </div>
            <button onClick={handleClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', flexShrink: 0 }}>
              <X size={18} />
            </button>
          </div>
          {!enrollmentDate && (
            <div className="mt-3 text-xs px-3 py-2 rounded-lg"
              style={{ background: 'rgba(212,168,67,0.1)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.2)' }}>
              Set your enrollment date on the{' '}
              <Link to="/timeline" onClick={onClose} style={{ color: '#D4A843', fontWeight: 600 }}>
                Timeline page
              </Link>{' '}
              to see target dates for each step.
            </div>
          )}
        </div>

        <div className="p-5 space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-4"
            style={{ color: 'var(--text-tertiary)' }}>
            Your next steps
          </h3>
          {steps.map((step, i) => (
            <div key={step.id} className="flex gap-3 pb-4"
              style={{
                borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none',
                opacity: rowsVisible ? 1 : 0,
                animation: rowsVisible ? `rowSlideIn 320ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 60}ms both` : 'none',
              }}>
              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                style={{ background: 'rgba(52,199,89,0.1)', color: '#34C759' }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                  {step.label}
                </p>
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {step.detail}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium" style={{ color: '#D4A843' }}>
                    {step.timing}
                  </span>
                  {step.link && (
                    <a href={step.link.url} target="_blank" rel="noreferrer"
                      className="text-xs flex items-center gap-0.5"
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                      {step.link.label} <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}
