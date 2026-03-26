import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { glossary } from '../data/glossary';

export default function GlossaryTooltip({ term }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);

  const definition = glossary[term];
  if (!definition) return <span>{term}</span>;

  // Close on click outside
  useEffect(() => {
    if (!showTooltip) return;
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTooltip]);

  return (
    <span className="inline-flex items-center gap-1" ref={tooltipRef}>
      <span>{term}</span>
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center"
        style={{ cursor: 'help', padding: '2px' }}>
        <HelpCircle size={12} strokeWidth={2} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
      </button>
      {showTooltip && (
        <div
          className="absolute z-50 max-w-xs p-3 rounded-lg shadow-lg text-xs"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            marginTop: '4px',
            marginLeft: '-8px',
            top: '100%',
            whiteSpace: 'normal',
            lineHeight: '1.4',
          }}>
          {definition}
          <div className="absolute -top-1.5 left-4 w-3 h-3" style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderLeft: 'none',
            transform: 'rotate(45deg)',
          }} />
        </div>
      )}
    </span>
  );
}
