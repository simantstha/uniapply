// Light mode accent: #C4622D  Dark mode accent: #E07840
// Uses CSS var(--accent) so it switches automatically with the theme.

export function LogoIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ color: 'var(--accent)' }}>
      {/* Mortarboard board */}
      <polygon points="16,3 29,10 16,17 3,10" fill="currentColor" />
      {/* Cap body */}
      <path
        d="M8 13.5v6.5c0 2.8 3.6 5 8 5s8-2.2 8-5v-6.5"
        fill="currentColor" opacity="0.45"
      />
      {/* Tassel string */}
      <line x1="29" y1="10" x2="29" y2="20"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* Tassel end */}
      <circle cx="29" cy="22.5" r="2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function LogoWordmark({ size = 'md' }) {
  const fontSize = size === 'sm' ? '0.9rem' : size === 'lg' ? '1.3rem' : '1.05rem';
  const iconSize = size === 'sm' ? 22 : size === 'lg' ? 32 : 26;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
      <LogoIcon size={iconSize} />
      <span style={{ fontWeight: 700, fontSize, letterSpacing: '-0.025em', lineHeight: 1 }}>
        <span style={{ color: 'var(--text-primary)' }}>uni</span>
        <span style={{ color: 'var(--accent)' }}>apply</span>
      </span>
    </div>
  );
}
