// client/src/components/CostCalculatorBanner.jsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign, Lightbulb } from 'lucide-react';
import { APPLICATION_FEES, DEFAULT_FEE, SCORE_SEND_COSTS } from '../data/applicationFees';

export default function CostCalculatorBanner({ universities, profile }) {
  const [open, setOpen] = useState(false);

  if (!universities || universities.length === 0) return null;

  const breakdown = universities.map(u => {
    const appFee = APPLICATION_FEES[u.name] ?? DEFAULT_FEE;
    const gre  = (profile?.greVerbal || profile?.greQuant) ? SCORE_SEND_COSTS.gre   : 0;
    const toefl = profile?.toeflScore                      ? SCORE_SEND_COSTS.toefl : 0;
    const ielts = profile?.ieltsScore                      ? SCORE_SEND_COSTS.ielts : 0;
    return { name: u.name, appFee, gre, toefl, ielts, total: appFee + gre + toefl + ielts };
  });

  const minTotal = breakdown.reduce((sum, b) => sum + b.appFee, 0);
  const maxTotal = breakdown.reduce((sum, b) => sum + b.total, 0);
  const freeSchools = universities.filter(u => (APPLICATION_FEES[u.name] ?? DEFAULT_FEE) === 0);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <div className="flex items-center gap-2">
          <DollarSign size={15} style={{ color: '#34C759' }} strokeWidth={1.8} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Application Cost Estimate
          </span>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            — {universities.length} school{universities.length !== 1 ? 's' : ''},{' '}
            <strong>${minTotal.toLocaleString()}–${maxTotal.toLocaleString()}</strong>
          </span>
        </div>
        {open
          ? <ChevronUp size={15} style={{ color: 'var(--text-tertiary)' }} />
          : <ChevronDown size={15} style={{ color: 'var(--text-tertiary)' }} />}
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <div className="px-4 py-3 space-y-1">
            {breakdown.map(b => (
              <div key={b.name} className="flex items-center justify-between text-xs py-1"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="truncate mr-4" style={{ color: 'var(--text-primary)', maxWidth: 220 }}>
                  {b.name}
                </span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span style={{ color: 'var(--text-tertiary)' }}>app fee ${b.appFee}</span>
                  {b.gre > 0   && <span style={{ color: 'var(--text-tertiary)' }}>GRE +${b.gre}</span>}
                  {b.toefl > 0 && <span style={{ color: 'var(--text-tertiary)' }}>TOEFL +${b.toefl}</span>}
                  {b.ielts > 0 && <span style={{ color: 'var(--text-tertiary)' }}>IELTS +${b.ielts}</span>}
                  <span className="font-medium" style={{ color: 'var(--text-primary)', minWidth: 40, textAlign: 'right' }}>
                    ${b.total}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}>
              <span>Total estimate</span>
              <span>${minTotal.toLocaleString()}–${maxTotal.toLocaleString()}</span>
            </div>
            <p className="text-xs pt-1" style={{ color: 'var(--text-tertiary)' }}>
              Fees verified where possible — confirm on each school's portal before applying.
            </p>
          </div>

          <div className="px-4 py-3" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={13} style={{ color: '#D4A843' }} strokeWidth={1.8} />
              <span className="text-xs font-semibold" style={{ color: '#D4A843' }}>
                Ways to reduce costs
              </span>
            </div>
            <ul className="space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {freeSchools.length > 0 && (
                <li>• <strong style={{ color: '#34C759' }}>No fee:</strong>{' '}
                  {freeSchools.map(s => s.name).join(', ')} — free to apply</li>
              )}
              <li>• Attend a virtual info session — many schools email a fee waiver code afterward</li>
              <li>• Email admissions directly and ask for a fee waiver — works more often than you'd expect</li>
              <li>• TOEFL includes 4 free score sends at test time — use them strategically</li>
              <li>• Some schools offer an early-application fee reduction — check each portal</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
