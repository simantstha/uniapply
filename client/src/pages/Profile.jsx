import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Check } from 'lucide-react';

const steps = [
  { id: 1, label: 'Academic' },
  { id: 2, label: 'Test Scores' },
  { id: 3, label: 'Goals' },
  { id: 4, label: 'Experience' },
];

const defaultForm = {
  undergraduateInstitution: '', undergraduateMajor: '', graduationYear: '', gpa: '',
  greVerbal: '', greQuant: '', greWriting: '', toeflScore: '', ieltsScore: '',
  fieldOfStudy: '', careerGoals: '', researchInterests: '', workExperienceYears: '', extracurriculars: '',
};

export default function Profile() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(defaultForm);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    apiClient.get('/api/profile').then(res => {
      if (res.data) {
        const data = { ...defaultForm };
        Object.keys(defaultForm).forEach(k => { data[k] = res.data[k] ?? ''; });
        setForm(data);
      }
    }).finally(() => setFetching(false));
  }, []);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { ...form };
      ['gpa', 'greVerbal', 'greQuant', 'greWriting', 'toeflScore', 'ieltsScore', 'graduationYear', 'workExperienceYears']
        .forEach(k => { payload[k] = payload[k] !== '' ? Number(payload[k]) : null; });
      await apiClient.put('/api/profile', payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Profile</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Academic background used for SOP critiques</p>
      </div>

      {/* Step pills */}
      <div className="flex items-center gap-1.5 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-secondary)' }}>
        {steps.map(s => (
          <button key={s.id} onClick={() => setStep(s.id)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={step === s.id
              ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              : { color: 'var(--text-secondary)' }}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="card p-6 shadow-apple-sm">
        {step === 1 && (
          <div className="space-y-4">
            <SectionTitle>Academic Background</SectionTitle>
            <Field label="Undergraduate Institution" value={form.undergraduateInstitution} onChange={set('undergraduateInstitution')} placeholder="e.g. Tribhuvan University" />
            <Field label="Major" value={form.undergraduateMajor} onChange={set('undergraduateMajor')} placeholder="e.g. Computer Science" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Graduation Year" value={form.graduationYear} onChange={set('graduationYear')} placeholder="2023" type="number" />
              <Field label="GPA" value={form.gpa} onChange={set('gpa')} placeholder="3.7" type="number" />
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <SectionTitle>Test Scores <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-tertiary)' }}>Leave blank if not applicable</span></SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              <Field label="GRE Verbal" value={form.greVerbal} onChange={set('greVerbal')} placeholder="130–170" type="number" />
              <Field label="GRE Quant" value={form.greQuant} onChange={set('greQuant')} placeholder="130–170" type="number" />
              <Field label="GRE Writing" value={form.greWriting} onChange={set('greWriting')} placeholder="0–6" type="number" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="TOEFL" value={form.toeflScore} onChange={set('toeflScore')} placeholder="0–120" type="number" />
              <Field label="IELTS" value={form.ieltsScore} onChange={set('ieltsScore')} placeholder="0–9" type="number" />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <SectionTitle>Goals & Interests</SectionTitle>
            <Field label="Field of Study" value={form.fieldOfStudy} onChange={set('fieldOfStudy')} placeholder="e.g. Machine Learning" />
            <TextArea label="Career Goals" value={form.careerGoals} onChange={set('careerGoals')} placeholder="What do you want to achieve in your career?" />
            <TextArea label="Research Interests" value={form.researchInterests} onChange={set('researchInterests')} placeholder="Topics you want to research or explore" />
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <SectionTitle>Experience</SectionTitle>
            <Field label="Work Experience (years)" value={form.workExperienceYears} onChange={set('workExperienceYears')} placeholder="2" type="number" />
            <TextArea label="Extracurriculars & Achievements" value={form.extracurriculars} onChange={set('extracurriculars')} placeholder="Projects, clubs, awards, volunteer work..." />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2">
          {step > 1 && <button onClick={() => setStep(s => s - 1)} className="btn-secondary">Back</button>}
          {step < 4 && <button onClick={() => setStep(s => s + 1)} className="btn-secondary">Next</button>}
        </div>
        <button onClick={handleSave} disabled={loading}
          className="btn-primary flex items-center gap-2">
          {saved && <Check size={13} />}
          {saved ? 'Saved' : loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</p>;
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="input" />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3}
        className="input resize-none" />
    </div>
  );
}
