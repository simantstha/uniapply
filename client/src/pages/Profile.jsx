import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Check } from 'lucide-react';
import GlossaryTooltip from '../components/GlossaryTooltip';

const steps = [
  { id: 1, label: 'Background' },
  { id: 2, label: 'Test Scores' },
  { id: 3, label: 'Goals' },
  { id: 4, label: 'Experience' },
];

const GPA_SCALES = {
  us_4:       { min: 0, max: 4.0,  label: '0–4.0', placeholder: '3.7' },
  cgpa_10:    { min: 0, max: 10.0, label: '0–10',  placeholder: '8.5' },
  percentage: { min: 0, max: 100,  label: '0–100', placeholder: '85'  },
};

const TARGET_COUNTRIES = ['USA', 'Canada', 'Australia', 'UK', 'Germany', 'Japan', 'South Korea', 'Netherlands', 'New Zealand'];

const defaultForm = {
  studyLevel: 'masters',
  undergraduateInstitution: '', undergraduateMajor: '', graduationYear: '', gpa: '', gpaScale: 'us_4',
  satScore: '', actScore: '',
  greVerbal: '', greQuant: '', greWriting: '', toeflScore: '', ieltsScore: '',
  fieldOfStudy: '', careerGoals: '', researchInterests: '', workExperienceYears: '', extracurriculars: '',
  workExperience: '', communityService: '', targetCountries: '',
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

  const SCORE_RANGES = {
    gpa:               { ...GPA_SCALES[form.gpaScale || 'us_4'] },
    satScore:          { min: 400, max: 1600, label: '400–1600' },
    actScore:          { min: 1,   max: 36,   label: '1–36' },
    greVerbal:         { min: 130, max: 170,  label: '130–170' },
    greQuant:          { min: 130, max: 170,  label: '130–170' },
    greWriting:        { min: 0,   max: 6,    label: '0–6' },
    toeflScore:        { min: 0,   max: 120,  label: '0–120' },
    ieltsScore:        { min: 0,   max: 9,    label: '0–9' },
    graduationYear:    { min: 1990, max: 2035, label: '1990–2035' },
    workExperienceYears: { min: 0, max: 50,   label: '0–50' },
  };

  const [errors, setErrors] = useState({});

  const setGpaScale = scale => {
    setForm(f => ({ ...f, gpaScale: scale, gpa: '' }));
    setErrors(err => { const next = { ...err }; delete next.gpa; return next; });
  };

  const set = field => e => {
    const val = e.target.value;
    setForm(f => ({ ...f, [field]: val }));
    if (val !== '' && SCORE_RANGES[field]) {
      const { min, max, label } = SCORE_RANGES[field];
      const num = Number(val);
      if (num < min || num > max) {
        setErrors(err => ({ ...err, [field]: `Must be ${label}` }));
      } else {
        setErrors(err => { const next = { ...err }; delete next[field]; return next; });
      }
    } else {
      setErrors(err => { const next = { ...err }; delete next[field]; return next; });
    }
  };

  const handleSave = async () => {
    // Block save if any field has a validation error
    if (Object.keys(errors).length > 0) return;
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
      <div className="flex items-center gap-1.5 mb-5 p-1 rounded-xl w-full" style={{ background: 'var(--bg-secondary)' }}>
        {steps.map(s => (
          <button key={s.id} onClick={() => setStep(s.id)}
            className="flex-1 px-3 md:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all"
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
                placeholder={isUndergrad ? '2025' : '2023'} type="number"
                min={1990} max={2035} error={errors.graduationYear} />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label">GPA</label>
                  <div className="flex gap-1">
                    {[['us_4','4.0'],['cgpa_10',<><GlossaryTooltip term="CGPA" /></>],['percentage','%']].map(([key, lbl]) => (
                      <button key={key} type="button" onClick={() => setGpaScale(key)}
                        className="px-2 py-0.5 rounded-md text-xs font-medium transition-all"
                        style={form.gpaScale === key
                          ? { background: 'rgba(0,113,227,0.12)', color: 'var(--accent)', border: '1px solid rgba(0,113,227,0.3)' }
                          : { background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <input type="number" value={form.gpa} onChange={set('gpa')}
                  placeholder={GPA_SCALES[form.gpaScale || 'us_4'].placeholder}
                  min={0} max={GPA_SCALES[form.gpaScale || 'us_4'].max} step={0.01}
                  className="input"
                  style={errors.gpa ? { borderColor: '#FF3B30', background: 'rgba(255,59,48,0.04)' } : {}} />
                {errors.gpa && <p className="text-xs mt-1" style={{ color: '#FF3B30' }}>{errors.gpa}</p>}
              </div>
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
                <Field label="SAT" value={form.satScore} onChange={set('satScore')} placeholder="400–1600" type="number"
                  min={400} max={1600} error={errors.satScore} />
                <Field label="ACT" value={form.actScore} onChange={set('actScore')} placeholder="1–36" type="number"
                  min={1} max={36} error={errors.actScore} />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <FieldWithTooltip label={<GlossaryTooltip term="GRE" />} value={form.greVerbal} onChange={set('greVerbal')} placeholder="130–170" type="number"
                  min={130} max={170} error={errors.greVerbal} subLabel="Verbal" />
                <FieldWithTooltip label={<GlossaryTooltip term="GRE" />} value={form.greQuant} onChange={set('greQuant')} placeholder="130–170" type="number"
                  min={130} max={170} error={errors.greQuant} subLabel="Quant" />
                <FieldWithTooltip label={<GlossaryTooltip term="GRE" />} value={form.greWriting} onChange={set('greWriting')} placeholder="0–6" type="number"
                  min={0} max={6} step={0.5} error={errors.greWriting} subLabel="Writing" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label={<GlossaryTooltip term="TOEFL" />} value={form.toeflScore} onChange={set('toeflScore')} placeholder="0–120" type="number"
                min={0} max={120} error={errors.toeflScore} />
              <Field label={<GlossaryTooltip term="IELTS" />} value={form.ieltsScore} onChange={set('ieltsScore')} placeholder="0–9" type="number"
                min={0} max={9} step={0.5} error={errors.ieltsScore} />
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
            <div>
              <label className="label mb-1.5 block">Target Countries</label>
              <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Select all countries you're open to applying in</p>
              <div className="flex flex-wrap gap-2">
                {TARGET_COUNTRIES.map(country => {
                  const selected = (form.targetCountries || '').split(',').filter(Boolean).includes(country);
                  return (
                    <button key={country} type="button"
                      onClick={() => {
                        const current = (form.targetCountries || '').split(',').filter(Boolean);
                        const next = selected ? current.filter(c => c !== country) : [...current, country];
                        setForm(f => ({ ...f, targetCountries: next.join(',') }));
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={selected
                        ? { background: 'rgba(196,98,45,0.12)', color: 'var(--accent)', border: '1.5px solid rgba(196,98,45,0.4)' }
                        : { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1.5px solid transparent' }}>
                      {country}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <SectionTitle>Experience & Activities</SectionTitle>
            {!isUndergrad && (
              <Field label="Work Experience (years)" value={form.workExperienceYears} onChange={set('workExperienceYears')} placeholder="2" type="number"
                min={0} max={50} error={errors.workExperienceYears} />
            )}
            <TextArea
              label={isUndergrad ? 'Work & Internship Experience' : 'Work & Internship Experience'}
              value={form.workExperience} onChange={set('workExperience')}
              placeholder={isUndergrad
                ? 'Part-time jobs, internships, shadowing experiences...'
                : 'Describe your internships, jobs, or research positions — company, role, what you did'} />
            <TextArea
              label={isUndergrad ? 'Extracurriculars, Clubs & Achievements' : 'Extracurriculars & Achievements'}
              value={form.extracurriculars} onChange={set('extracurriculars')}
              placeholder={isUndergrad
                ? 'Sports, clubs, competitions, awards...'
                : 'Projects, clubs, competitions, publications, awards...'} />
            <TextArea
              label="Community Service & Volunteering"
              value={form.communityService} onChange={set('communityService')}
              placeholder="NGO work, tutoring, social initiatives, community programs, teaching..." />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2">
          {step > 1 && <button onClick={() => setStep(s => s - 1)} className="btn-secondary">Back</button>}
          {step < 4 && <button onClick={() => setStep(s => s + 1)} className="btn-secondary">Next</button>}
        </div>
        <button onClick={handleSave} disabled={loading || Object.keys(errors).length > 0}
          className="btn-primary flex items-center gap-2"
          style={Object.keys(errors).length > 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
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

function Field({ label, value, onChange, placeholder, type = 'text', min, max, step, error }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        min={min} max={max} step={step}
        className="input"
        style={error ? { borderColor: '#FF3B30', background: 'rgba(255,59,48,0.04)' } : {}}
      />
      {error && <p className="text-xs mt-1" style={{ color: '#FF3B30' }}>{error}</p>}
    </div>
  );
}

function FieldWithTooltip({ label, value, onChange, placeholder, type = 'text', min, max, step, error, subLabel }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="label">{label}</label>
        {subLabel && <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>({subLabel})</span>}
      </div>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        min={min} max={max} step={step}
        className="input"
        style={error ? { borderColor: '#FF3B30', background: 'rgba(255,59,48,0.04)' } : {}}
      />
      {error && <p className="text-xs mt-1" style={{ color: '#FF3B30' }}>{error}</p>}
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
