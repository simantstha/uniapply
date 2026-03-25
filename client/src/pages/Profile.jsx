import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Check } from 'lucide-react';

const steps = [
  { id: 1, label: 'Background' },
  { id: 2, label: 'Test Scores' },
  { id: 3, label: 'Goals' },
  { id: 4, label: 'Experience' },
];

const defaultForm = {
  studyLevel: 'masters',
  undergraduateInstitution: '', undergraduateMajor: '', graduationYear: '', gpa: '',
  satScore: '', actScore: '',
  greVerbal: '', greQuant: '', greWriting: '', toeflScore: '', ieltsScore: '',
  fieldOfStudy: '', careerGoals: '', researchInterests: '', workExperienceYears: '', extracurriculars: '',
};

const LEVEL_LABELS = {
  undergraduate: 'Undergraduate (Bachelor\'s)',
  masters: 'Graduate (Master\'s)',
  phd: 'Graduate (PhD)',
  other: 'Other / Certificate',
};

export default function Profile() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(defaultForm);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const isUndergrad = form.studyLevel === 'undergraduate';

  useEffect(() => {
    apiClient.get('/api/profile').then(res => {
      if (res.data) {
        const data = { ...defaultForm };
        Object.keys(defaultForm).forEach(k => { data[k] = res.data[k] ?? ''; });
        if (!data.studyLevel) data.studyLevel = 'masters';
        setForm(data);
      }
    }).finally(() => setFetching(false));
  }, []);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { ...form };
      ['gpa', 'satScore', 'actScore', 'greVerbal', 'greQuant', 'greWriting', 'toeflScore', 'ieltsScore', 'graduationYear', 'workExperienceYears']
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
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-5 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Profile</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Your academic background — used to personalise AI critiques</p>
      </div>

      {/* Study level selector — always visible */}
      <div className="card p-4 shadow-apple-sm mb-4">
        <label className="label mb-1.5 block">I am applying for</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(LEVEL_LABELS).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setForm(f => ({ ...f, studyLevel: value }))}
              className="px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left"
              style={form.studyLevel === value
                ? { background: 'rgba(0,113,227,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,113,227,0.3)' }
                : { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid transparent' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Step pills */}
      <div className="flex items-center gap-1.5 mb-5 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-secondary)' }}>
        {steps.map(s => (
          <button key={s.id} onClick={() => setStep(s.id)}
            className="px-3 md:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={step === s.id
              ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              : { color: 'var(--text-secondary)' }}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="card p-4 md:p-6 shadow-apple-sm">
        {step === 1 && (
          <div className="space-y-4">
            <SectionTitle>{isUndergrad ? 'Current School' : 'Academic Background'}</SectionTitle>
            <Field
              label={isUndergrad ? 'High School / Current Institution' : 'Undergraduate Institution'}
              value={form.undergraduateInstitution} onChange={set('undergraduateInstitution')}
              placeholder={isUndergrad ? 'e.g. Kathmandu Model School' : 'e.g. Tribhuvan University'} />
            <Field
              label={isUndergrad ? 'Intended Major / Interest' : 'Major'}
              value={form.undergraduateMajor} onChange={set('undergraduateMajor')}
              placeholder={isUndergrad ? 'e.g. Computer Science' : 'e.g. Computer Science'} />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={isUndergrad ? 'Graduation Year' : 'Graduation Year'}
                value={form.graduationYear} onChange={set('graduationYear')}
                placeholder={isUndergrad ? '2025' : '2023'} type="number" />
              <Field label="GPA" value={form.gpa} onChange={set('gpa')} placeholder="3.7" type="number" />
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <SectionTitle>
              Test Scores{' '}
              <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-tertiary)' }}>Leave blank if not taken</span>
            </SectionTitle>
            {isUndergrad ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="SAT" value={form.satScore} onChange={set('satScore')} placeholder="400–1600" type="number" />
                <Field label="ACT" value={form.actScore} onChange={set('actScore')} placeholder="1–36" type="number" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="GRE Verbal" value={form.greVerbal} onChange={set('greVerbal')} placeholder="130–170" type="number" />
                <Field label="GRE Quant" value={form.greQuant} onChange={set('greQuant')} placeholder="130–170" type="number" />
                <Field label="GRE Writing" value={form.greWriting} onChange={set('greWriting')} placeholder="0–6" type="number" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="TOEFL" value={form.toeflScore} onChange={set('toeflScore')} placeholder="0–120" type="number" />
              <Field label="IELTS" value={form.ieltsScore} onChange={set('ieltsScore')} placeholder="0–9" type="number" />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <SectionTitle>Goals & Interests</SectionTitle>
            <Field
              label={isUndergrad ? 'Intended Field of Study' : 'Field of Study'}
              value={form.fieldOfStudy} onChange={set('fieldOfStudy')}
              placeholder={isUndergrad ? 'e.g. Engineering, Business' : 'e.g. Machine Learning'} />
            <TextArea
              label="Career Goals"
              value={form.careerGoals} onChange={set('careerGoals')}
              placeholder={isUndergrad ? 'What do you want to do after college?' : 'What do you want to achieve in your career?'} />
            {!isUndergrad && (
              <TextArea label="Research Interests" value={form.researchInterests} onChange={set('researchInterests')} placeholder="Topics you want to research or explore" />
            )}
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <SectionTitle>Experience & Activities</SectionTitle>
            {!isUndergrad && (
              <Field label="Work Experience (years)" value={form.workExperienceYears} onChange={set('workExperienceYears')} placeholder="2" type="number" />
            )}
            <TextArea
              label={isUndergrad ? 'Extracurriculars, Clubs & Achievements' : 'Extracurriculars & Achievements'}
              value={form.extracurriculars} onChange={set('extracurriculars')}
              placeholder={isUndergrad
                ? 'Sports, clubs, competitions, volunteering, part-time work...'
                : 'Projects, clubs, awards, volunteer work...'} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2">
          {step > 1 && <button onClick={() => setStep(s => s - 1)} className="btn-secondary">Back</button>}
          {step < 4 && <button onClick={() => setStep(s => s + 1)} className="btn-secondary">Next</button>}
        </div>
        <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
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
