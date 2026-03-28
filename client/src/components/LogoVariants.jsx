/**
 * Logo options for review — delete this file once a direction is chosen.
 */

const BLUE   = '#0071E3';
const INDIGO = '#5856D6';

// Gradient as a CSS background — avoids SVG ID collisions when the same
// component renders more than once on the page.
const textGrad = {
  background: `linear-gradient(135deg, ${BLUE}, ${INDIGO})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

// ─── A: Graduation Cap ────────────────────────────────────────────────────────
export function LogoA({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Board */}
      <polygon points="16,3 29,10 16,17 3,10" fill={BLUE} />
      {/* Cap body */}
      <path d="M8 13.5v6.5c0 2.8 3.6 5 8 5s8-2.2 8-5v-6.5" fill={INDIGO} opacity="0.55" />
      {/* Tassel */}
      <line x1="29" y1="10" x2="29" y2="20" stroke={INDIGO} strokeWidth="2" strokeLinecap="round" />
      <circle cx="29" cy="22.5" r="2" fill={INDIGO} />
    </svg>
  );
}

// ─── B: Stacked Application Cards ────────────────────────────────────────────
export function LogoB({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="8"  y="10" width="20" height="16" rx="3" fill={INDIGO} opacity="0.2" />
      <rect x="5"  y="7"  width="20" height="16" rx="3" fill={BLUE}   opacity="0.4" />
      <rect x="3"  y="4"  width="20" height="16" rx="3" fill={BLUE} />
      <polyline
        points="7.5,12 11.5,16 18,9"
        stroke="white" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── C: Target ────────────────────────────────────────────────────────────────
export function LogoC({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="17" r="12" stroke={BLUE}   strokeWidth="2.5" />
      <circle cx="16" cy="17" r="7"  stroke={INDIGO} strokeWidth="2.5" opacity="0.7" />
      <circle cx="16" cy="17" r="2.5" fill={BLUE} />
      {/* Arrow tip shooting out the top */}
      <polygon points="16,1 12.5,8 19.5,8" fill={BLUE} />
    </svg>
  );
}

// ─── D: Rising Arrow ─────────────────────────────────────────────────────────
export function LogoD({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Arrowhead */}
      <polygon points="16,2 7,16 25,16" fill={BLUE} />
      {/* Shaft */}
      <rect x="13" y="15" width="6" height="11" rx="3" fill={INDIGO} opacity="0.7" />
      {/* Base */}
      <rect x="6" y="28" width="20" height="2.5" rx="1.25" fill={INDIGO} opacity="0.35" />
    </svg>
  );
}

// ─── Preview ──────────────────────────────────────────────────────────────────
function Wordmark({ Icon }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.45rem' }}>
      <Icon size={26} />
      <span style={{ fontWeight:700, fontSize:'1rem', letterSpacing:'-0.025em', lineHeight:1 }}>
        <span style={{ color:'var(--text-primary)' }}>uni</span>
        <span style={textGrad}>apply</span>
      </span>
    </div>
  );
}

const OPTIONS = [
  { Icon: LogoA, label: 'A — Graduation Cap',   desc: 'Traditional, instantly recognisable' },
  { Icon: LogoB, label: 'B — Stacked Cards',    desc: 'Multiple apps, organised' },
  { Icon: LogoC, label: 'C — Target',           desc: 'Goal-oriented, aim for your schools' },
  { Icon: LogoD, label: 'D — Rising Arrow',     desc: 'Minimal, modern, directional' },
];

export function LogoPreview() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', maxWidth:560, padding:'1rem' }}>
      {OPTIONS.map(({ Icon, label, desc }) => (
        <div key={label} style={{
          padding:'1.25rem',
          borderRadius:16,
          border:'1px solid var(--border-subtle)',
          background:'var(--bg-elevated)',
        }}>
          <p style={{ fontSize:'0.7rem', fontWeight:600, color:'var(--accent)', marginBottom:2 }}>{label}</p>
          <p style={{ fontSize:'0.65rem', color:'var(--text-tertiary)', marginBottom:'1rem' }}>{desc}</p>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'0.75rem' }}>
            <Icon size={48} />
            <Icon size={32} />
            <Icon size={20} />
          </div>
          <Wordmark Icon={Icon} />
        </div>
      ))}
    </div>
  );
}
