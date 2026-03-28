// client/src/components/ApplicationStatusPicker.jsx
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const APPLICATION_STATUSES = [
  { value: 'not_applied', label: 'Not Applied', color: 'var(--text-tertiary)',    bg: 'var(--bg-secondary)' },
  { value: 'applied',     label: 'Applied',     color: '#3B82F6',                bg: 'rgba(59,130,246,0.1)' },
  { value: 'interview',   label: 'Interview',   color: '#7C3AED',                bg: 'rgba(124,58,237,0.1)' },
  { value: 'admitted',    label: 'Admitted',    color: '#34C759',                bg: 'rgba(52,199,89,0.1)' },
  { value: 'rejected',    label: 'Rejected',    color: '#FF3B30',                bg: 'rgba(255,59,48,0.1)' },
  { value: 'waitlisted',  label: 'Waitlisted',  color: '#D4A843',                bg: 'rgba(212,168,67,0.12)' },
];

export default function ApplicationStatusPicker({ value = 'not_applied', onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const ref = useRef(null);

  const current = APPLICATION_STATUSES.find(s => s.value === value) || APPLICATION_STATUSES[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleOpen() {
    if (disabled) return;
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(o => !o);
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        disabled={disabled}
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 20,
          background: current.bg,
          border: `1px solid ${current.color}22`,
          color: current.color,
          fontSize: 12, fontWeight: 500, cursor: disabled ? 'default' : 'pointer',
          whiteSpace: 'nowrap',
        }}>
        {current.label}
        {!disabled && <ChevronDown size={11} strokeWidth={2} />}
      </button>

      {open && (
        <div style={{
          position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 4, minWidth: 140,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          {APPLICATION_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => { onChange(s.value); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '6px 10px', borderRadius: 7,
                background: s.value === value ? s.bg : 'transparent',
                color: s.value === value ? s.color : 'var(--text-primary)',
                fontSize: 13, fontWeight: s.value === value ? 500 : 400,
                border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={e => { if (s.value !== value) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={e => { if (s.value !== value) e.currentTarget.style.background = 'transparent'; }}>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
