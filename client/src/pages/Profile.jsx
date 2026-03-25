import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { CheckCircle } from 'lucide-react';

const steps = [
  { id: 1, label: 'Academic' },
  { id: 2, label: 'Test Scores' },
  { id: 3, label: 'Goals' },
  { id: 4, label: 'Experience' },
];

const defaultForm = {
  undergraduateInstitution: '',
  undergraduateMajor: '',
  graduationYear: '',
  gpa: '',
  greVerbal: '',
  greQuant: '',
  greWriting: '',
  toeflScore: '',
  ieltsScore: '',
  fieldOfStudy: '',
  careerGoals: '',
  researchInterests: '',
  workExperienceYears: '',
  extracurriculars: '',
};

export default function Profile() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(defaultForm);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    apiClient.get('/api/profile')
      .then((res) => {
        if (res.data) {
          const data = { ...defaultForm };
          Object.keys(defaultForm).forEach((k) => {
            data[k] = res.data[k] ?? '';
          });
          setForm(data);
        }
      })
      .finally(() => setFetching(false));
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { ...form };
      ['gpa', 'greVerbal', 'greQuant', 'greWriting', 'toeflScore', 'ieltsScore', 'graduationYear', 'workExperienceYears'].forEach((k) => {
        payload[k] = payload[k] !== '' ? Number(payload[k]) : null;
      });
      await apiClient.put('/api/profile', payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-sm text-gray-400">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-1">Your Profile</h1>
      <p className="text-sm text-gray-500 mb-6">Academic background used for SOP critiques</p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                step === s.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s.id}. {s.label}
            </button>
            {i < steps.length - 1 && <div className="w-4 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {step === 1 && (
          <>
            <h2 className="font-semibold text-gray-800 mb-2">Academic Background</h2>
            <Field label="Undergraduate Institution" value={form.undergraduateInstitution} onChange={set('undergraduateInstitution')} placeholder="e.g. Tribhuvan University" />
            <Field label="Major" value={form.undergraduateMajor} onChange={set('undergraduateMajor')} placeholder="e.g. Computer Science" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Graduation Year" value={form.graduationYear} onChange={set('graduationYear')} placeholder="e.g. 2023" type="number" />
              <Field label="GPA" value={form.gpa} onChange={set('gpa')} placeholder="e.g. 3.7" type="number" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-semibold text-gray-800 mb-2">Test Scores</h2>
            <p className="text-xs text-gray-400 mb-2">Leave blank if not applicable</p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="GRE Verbal" value={form.greVerbal} onChange={set('greVerbal')} placeholder="130–170" type="number" />
              <Field label="GRE Quant" value={form.greQuant} onChange={set('greQuant')} placeholder="130–170" type="number" />
              <Field label="GRE Writing" value={form.greWriting} onChange={set('greWriting')} placeholder="0–6" type="number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="TOEFL Score" value={form.toeflScore} onChange={set('toeflScore')} placeholder="0–120" type="number" />
              <Field label="IELTS Score" value={form.ieltsScore} onChange={set('ieltsScore')} placeholder="0–9" type="number" />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-semibold text-gray-800 mb-2">Goals & Interests</h2>
            <Field label="Field of Study" value={form.fieldOfStudy} onChange={set('fieldOfStudy')} placeholder="e.g. Machine Learning" />
            <TextArea label="Career Goals" value={form.careerGoals} onChange={set('careerGoals')} placeholder="What do you want to achieve in your career?" />
            <TextArea label="Research Interests" value={form.researchInterests} onChange={set('researchInterests')} placeholder="Topics you want to research or explore" />
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="font-semibold text-gray-800 mb-2">Experience</h2>
            <Field label="Work Experience (years)" value={form.workExperienceYears} onChange={set('workExperienceYears')} placeholder="e.g. 2" type="number" />
            <TextArea label="Extracurriculars & Achievements" value={form.extracurriculars} onChange={set('extracurriculars')} placeholder="Projects, clubs, awards, volunteer work..." />
          </>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Back
            </button>
          )}
          {step < 4 && (
            <button onClick={() => setStep(s => s + 1)} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700">
              Next
            </button>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
        >
          {saved && <CheckCircle size={14} />}
          {saved ? 'Saved!' : loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
    </div>
  );
}
