export function LogoIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ua-grad" x1="3" y1="3" x2="29" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0071E3" />
          <stop offset="100%" stopColor="#5856D6" />
        </linearGradient>
      </defs>

      {/* Mortarboard board (diamond/rhombus) */}
      <polygon points="16,3 29,10 16,17 3,10" fill="url(#ua-grad)" />

      {/* Cap body */}
      <path
        d="M8 13.5 L8 20 C8 22.8 11.6 25 16 25 C20.4 25 24 22.8 24 20 L24 13.5"
        fill="url(#ua-grad)"
        opacity="0.6"
      />

      {/* Tassel string */}
      <line x1="29" y1="10" x2="29" y2="20" stroke="url(#ua-grad)" strokeWidth="2" strokeLinecap="round" />

      {/* Tassel end */}
      <circle cx="29" cy="22.5" r="2" fill="url(#ua-grad)" />
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
        <span style={{
          background: 'linear-gradient(135deg, #0071E3, #5856D6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>apply</span>
      </span>
    </div>
  );
}
