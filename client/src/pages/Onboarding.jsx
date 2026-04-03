import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { GraduationCap, BookOpen, FlaskConical, ChevronRight, ChevronLeft, Check, Sparkles, Star, Target, Shield } from 'lucide-react';
import { LogoWordmark } from '../components/Logo';

const GPA_SCALES = {
  us_4:       { min: 0, max: 4.0,  label: '0–4.0', placeholder: '3.7' },
  cgpa_10:    { min: 0, max: 10.0, label: '0–10',  placeholder: '8.5' },
  percentage: { min: 0, max: 100,  label: '0–100', placeholder: '85'  },
};

const STUDY_LEVELS = [
  {
    value: 'undergraduate',
    icon: BookOpen,
    title: 'Undergraduate',
    subtitle: 'High school → US college (Bachelor\'s)',
    color: '#0071E3',
    bg: 'rgba(0,113,227,0.08)',
  },
  {
    value: 'masters',
    icon: GraduationCap,
    title: "Master's",
    subtitle: 'Bachelor\'s → US graduate school (MS/MA/MBA)',
    color: '#BF5AF2',
    bg: 'rgba(191,90,242,0.08)',
  },
  {
    value: 'phd',
    icon: FlaskConical,
    title: 'PhD',
    subtitle: 'Research doctorate program',
    color: '#34C759',
    bg: 'rgba(52,199,89,0.08)',
  },
  {
    value: 'other',
    icon: GraduationCap,
    title: 'Other',
    subtitle: 'Certificate, diploma, or transfer',
    color: '#FF9F0A',
    bg: 'rgba(255,159,10,0.08)',
  },
];

const FIELDS = [
  'Computer Science', 'Engineering', 'Business / MBA', 'Data Science',
  'Medicine / Pre-Med', 'Law', 'Psychology', 'Economics',
  'Political Science', 'Biology', 'Architecture', 'Design',
  'Education', 'Social Work', 'Communications', 'Other',
];

const TARGET_COUNTRIES = [
  'USA', 'Canada', 'Australia', 'UK', 'Germany',
  'Japan', 'South Korea', 'Netherlands', 'New Zealand',
];

const NEPALI_INSTITUTIONS = [
  'Tribhuvan University (TU)',
  'Kathmandu University (KU)',
  'Pokhara University (PU)',
  'Purbanchal University',
  'Far Western University',
  'Mid-Western University',
  'Agriculture and Forestry University (AFU)',
  'Other',
];

const buildTimelines = () => {
  const now = new Date();
  const y = now.getFullYear();
  const isBeforeAug = now.getMonth() < 7; // before August 1

  if (isBeforeAug) {
    return [
      { value: `Fall ${y}`,     label: `Fall ${y}`,     note: `Applications mostly due Jan–Feb ${y}` },
      { value: `Spring ${y+1}`, label: `Spring ${y+1}`, note: `Applications due Sep–Oct ${y}` },
      { value: `Fall ${y+1}`,   label: `Fall ${y+1}`,   note: `Applications due Nov ${y} – Feb ${y+1}` },
      { value: `Fall ${y+2}`,   label: `Fall ${y+2}`,   note: 'Plenty of time to prepare' },
    ];
  } else {
    return [
      { value: `Spring ${y+1}`, label: `Spring ${y+1}`, note: `Applications due Sep–Oct ${y}` },
      { value: `Fall ${y+1}`,   label: `Fall ${y+1}`,   note: `Applications due Nov ${y} – Feb ${y+1}` },
      { value: `Fall ${y+2}`,   label: `Fall ${y+2}`,   note: 'Plenty of time to prepare' },
      { value: `Fall ${y+3}`,   label: `Fall ${y+3}`,   note: 'Early planning — great start!' },
    ];
  }
};

const TIMELINES = buildTimelines();

const JOURNEY_STEPS = [
  { num: 1, title: 'Complete your profile', desc: 'Add GPA, test scores, and background info' },
  { num: 2, title: 'Add your universities', desc: 'Build your dream, target & safety list' },
  { num: 3, title: 'Upload your documents', desc: 'Transcripts, test scores, recommendation letters' },
  { num: 4, title: 'Write your personal statement', desc: 'Guided editor helps you tell your story' },
  { num: 5, title: 'Get AI feedback', desc: 'Our AI critiques your statement and scores it' },
];

export default function Onboarding() {
  const { user, loading, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [studyLevel, setStudyLevel] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [careerGoals, setCareerGoals] = useState('');
  const [timeline, setTimeline] = useState('');
  const [gpa, setGpa] = useState('');
  const [gpaScale, setGpaScaleState] = useState('us_4');
  const [institution, setInstitution] = useState('');
  const [toefl, setToefl] = useState('');
  const [sat, setSat] = useState('');
  const [gre, setGre] = useState('');
  const [scoreErrors, setScoreErrors] = useState({});
  const [nebScore, setNebScore] = useState('');

  const [targetCountries, setTargetCountries] = useState(['USA']);

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(null);
  const [selectedSchools, setSelectedSchools] = useState(new Set());
  const [addingSchools, setAddingSchools] = useState(false);

  const toggleCountry = (country) => {
    setTargetCountries(prev =>
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
  };

  const handleGpaScaleChange = scale => {
    setGpaScaleState(scale);
    setGpa('');
    setScoreErrors(e => { const n = { ...e }; delete n.gpa; return n; });
  };

  const SCORE_RANGES = {
    gpa:   { ...GPA_SCALES[gpaScale] },
    sat:   { min: 400, max: 1600, label: '400–1600' },
    gre:   { min: 130, max: 170,  label: '130–170' },
    toefl: { min: 0,   max: 120,  label: '0–120' },
  };

  const validateScore = (field, val) => {
    if (val === '') { setScoreErrors(e => { const n = { ...e }; delete n[field]; return n; }); return; }
    const { min, max, label } = SCORE_RANGES[field];
    const num = Number(val);
    if (num < min || num > max) {
      setScoreErrors(e => ({ ...e, [field]: `Must be ${label}` }));
    } else {
      setScoreErrors(e => { const n = { ...e }; delete n[field]; return n; });
    }
  };

  // Guards (after all hooks)
  if (!loading && !user) { navigate('/login', { replace: true }); return null; }
  // Allow step 5 (university suggestions) even after onboarding is marked complete
  if (!loading && user?.onboardingCompleted && step < 5) { navigate('/dashboard', { replace: true }); return null; }
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
    </div>
  );

  const isUndergrad = studyLevel === 'undergraduate';

  const canNext = () => {
    if (step === 1) return !!studyLevel;
    if (step === 2) return !!fieldOfStudy && !!timeline;
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const profileData = {
        studyLevel,
        fieldOfStudy,
        careerGoals: careerGoals || null,
        undergraduateInstitution: institution || null,
        nebScore: nebScore ? parseFloat(nebScore) : null,
        gpa: gpa ? parseFloat(gpa) : null,
        gpaScale,
        toeflScore: toefl ? parseInt(toefl) : null,
        targetCountries: targetCountries.length > 0 ? targetCountries.join(',') : null,
      };
      if (isUndergrad && sat) profileData.satScore = parseInt(sat);
      if (!isUndergrad && gre) profileData.greVerbal = parseInt(gre);

      await apiClient.put('/api/profile', profileData);
      await completeOnboarding();
      // Go to step 5 for university suggestions
      setStep(5);
      fetchSuggestions();
    } catch (err) {
      console.error(err);
      // still finish even if save fails
      await completeOnboarding();
      setStep(5);
      fetchSuggestions();
    } finally {
      setSaving(false);
    }
  };

  const fetchSuggestions = async () => {
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    try {
      const res = await apiClient.post('/api/onboarding/suggest-universities');
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error(err);
      setSuggestionsError('Couldn\'t load suggestions.');
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const toggleSchool = (idx) => {
    setSelectedSchools(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleAddSchools = async () => {
    setAddingSchools(true);
    try {
      const selected = suggestions.filter((_, idx) => selectedSchools.has(idx));
      for (const school of selected) {
        const category = school.tier === 'dream' ? 'Dream' : school.tier === 'target' ? 'Target' : 'Safety';
        await apiClient.post('/api/universities', {
          name: school.name,
          program: school.program,
          category,
          degreeLevel: studyLevel || 'masters',
          status: 'not_started',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingSchools(false);
      navigate('/dashboard');
    }
  };

  const TIER_CONFIG = {
    dream:  { label: 'Dream',  color: '#BF5AF2', bg: 'rgba(191,90,242,0.06)',  border: 'rgba(191,90,242,0.35)', Icon: Star },
    target: { label: 'Target', color: '#0071E3', bg: 'rgba(0,113,227,0.06)',   border: 'rgba(0,113,227,0.35)',  Icon: Target },
    safety: { label: 'Safety', color: '#34C759', bg: 'rgba(52,199,89,0.06)',   border: 'rgba(52,199,89,0.35)',  Icon: Shield },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <LogoWordmark />
      </div>

      {/* Card */}
      <div className="card w-full max-w-lg shadow-apple-lg" style={{ padding: '2rem' }}>

        {/* Progress dots */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="rounded-full transition-all"
                style={{
                  width: s === step ? '24px' : '8px',
                  height: '8px',
                  background: s <= step ? 'var(--accent)' : 'var(--border)',
                }} />
            ))}
          </div>
        )}

        {/* Step 1: Study Level */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Welcome, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              What level are you applying for?
            </p>
            <div className="space-y-2.5">
              {STUDY_LEVELS.map(({ value, icon: Icon, title, subtitle, color, bg }) => (
                <button key={value} onClick={() => setStudyLevel(value)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all"
                  style={{
                    borderColor: studyLevel === value ? color : 'var(--border)',
                    background: studyLevel === value ? bg : 'var(--bg-secondary)',
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: bg }}>
                    <Icon size={16} style={{ color }} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: studyLevel === value ? color : 'var(--text-primary)' }}>{title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
                  </div>
                  {studyLevel === value && (
                    <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: color }}>
                      <Check size={11} color="white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Field + Timeline */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>What do you want to study?</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>This helps us tailor your application plan.</p>

            <div className="space-y-4">
              <div>
                <label className="label">Field of Study</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {FIELDS.map(f => (
                    <button key={f} type="button" onClick={() => setFieldOfStudy(prev => prev === f ? '' : f)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                      style={fieldOfStudy === f
                        ? { background: 'var(--accent)', color: 'white' }
                        : { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      {f}
                    </button>
                  ))}
                </div>
                {!FIELDS.includes(fieldOfStudy) && (
                  <input value={fieldOfStudy} onChange={e => setFieldOfStudy(e.target.value)}
                    placeholder="Or type your field..." className="input text-sm" />
                )}
              </div>

              <div>
                <label className="label">When are you applying?</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIMELINES.map(t => (
                    <button key={t.value} type="button" onClick={() => setTimeline(t.value)}
                      className="p-3 rounded-xl text-left transition-all border"
                      style={timeline === t.value
                        ? { borderColor: 'var(--accent)', background: 'rgba(0,113,227,0.06)' }
                        : { borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                      <p className="text-sm font-semibold" style={{ color: timeline === t.value ? 'var(--accent)' : 'var(--text-primary)' }}>{t.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t.note}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Career goals <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span></label>
                <textarea value={careerGoals} onChange={e => setCareerGoals(e.target.value)}
                  placeholder="What do you want to do after graduating? (2–3 sentences)"
                  className="input text-sm resize-none" rows={3} />
              </div>

              <div>
                <label className="label">Where do you want to study? <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {TARGET_COUNTRIES.map(country => {
                    const selected = targetCountries.includes(country);
                    return (
                      <button key={country} type="button" onClick={() => toggleCountry(country)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                        style={selected
                          ? { background: 'var(--accent)', color: 'white' }
                          : { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        {country}
                      </button>
                    );
                  })}
                </div>
                {targetCountries.length === 0 && (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                    No preference — we'll suggest from multiple countries
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Academic background */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Tell us where you stand</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              All fields optional — you can update these later in your profile.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label">Current GPA</label>
                    <div className="flex gap-1">
                      {[['us_4','4.0'],['cgpa_10','/10'],['percentage','%']].map(([key, lbl]) => (
                        <button key={key} type="button" onClick={() => handleGpaScaleChange(key)}
                          className="px-2 py-0.5 rounded-md text-xs font-medium transition-all"
                          style={gpaScale === key
                            ? { background: 'rgba(0,113,227,0.12)', color: 'var(--accent)', border: '1px solid rgba(0,113,227,0.3)' }
                            : { background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input value={gpa} onChange={e => { setGpa(e.target.value); validateScore('gpa', e.target.value); }}
                    type="number" step="0.01" min="0" max={GPA_SCALES[gpaScale].max}
                    placeholder={`e.g. ${GPA_SCALES[gpaScale].placeholder}`} className="input text-sm"
                    style={scoreErrors.gpa ? { borderColor: '#FF3B30' } : {}} />
                  {scoreErrors.gpa && <p className="text-xs mt-1" style={{ color: '#FF3B30' }}>{scoreErrors.gpa}</p>}
                </div>
                <div>
                  <label className="label">
                    {isUndergrad ? 'SAT Score' : 'GRE Verbal'}
                    <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}> ({isUndergrad ? '400–1600' : '130–170'})</span>
                  </label>
                  <input
                    value={isUndergrad ? sat : gre}
                    onChange={e => {
                      const field = isUndergrad ? 'sat' : 'gre';
                      isUndergrad ? setSat(e.target.value) : setGre(e.target.value);
                      validateScore(field, e.target.value);
                    }}
                    type="number"
                    min={isUndergrad ? 400 : 130} max={isUndergrad ? 1600 : 170}
                    placeholder={isUndergrad ? 'e.g. 1450' : 'e.g. 160'} className="input text-sm"
                    style={scoreErrors[isUndergrad ? 'sat' : 'gre'] ? { borderColor: '#FF3B30' } : {}} />
                  {scoreErrors[isUndergrad ? 'sat' : 'gre'] && (
                    <p className="text-xs mt-1" style={{ color: '#FF3B30' }}>{scoreErrors[isUndergrad ? 'sat' : 'gre']}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">TOEFL Score <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>(0–120)</span></label>
                  <input value={toefl} onChange={e => { setToefl(e.target.value); validateScore('toefl', e.target.value); }}
                    type="number" min="0" max="120" placeholder="e.g. 100" className="input text-sm"
                    style={scoreErrors.toefl ? { borderColor: '#FF3B30' } : {}} />
                  {scoreErrors.toefl && <p className="text-xs mt-1" style={{ color: '#FF3B30' }}>{scoreErrors.toefl}</p>}
                </div>
                <div>
                  <label className="label">{isUndergrad ? 'Current School' : 'Undergrad Institution'}</label>
                  <select
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    className="w-full text-sm rounded-xl px-3 py-2.5 border outline-none transition-all"
                    style={{ background: 'var(--bg-secondary)', color: institution ? 'var(--text-primary)' : 'var(--text-tertiary)', borderColor: 'var(--border)', fontFamily: 'inherit' }}
                  >
                    <option value="">Select your university</option>
                    {NEPALI_INSTITUTIONS.map(inst => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                </div>
              </div>

              {studyLevel === 'undergraduate' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    NEB / HSEB Score <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={nebScore}
                    onChange={e => setNebScore(e.target.value)}
                    placeholder="e.g. 78.5"
                    className="w-full text-sm rounded-xl px-3 py-2.5 border outline-none transition-all"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)', fontFamily: 'inherit' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Your +2 percentage score from NEB or HSEB</p>
                </div>
              )}

              <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(0,113,227,0.06)', color: 'var(--text-secondary)' }}>
                💡 Don't have test scores yet? That's fine — most students take them in 11th–12th grade. You can add them later.
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Your plan */}
        {step === 4 && (
          <div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto"
              style={{ background: 'rgba(52,199,89,0.1)' }}>
              <Sparkles size={22} style={{ color: '#34C759' }} />
            </div>
            <h2 className="text-xl font-semibold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
              You're all set, {user?.name?.split(' ')[0]}!
            </h2>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
              Here's your personalized application roadmap. We'll track your progress every step of the way.
            </p>

            <div className="space-y-2.5 mb-6">
              {JOURNEY_STEPS.map((s, i) => (
                <div key={s.num} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: i === 0 ? 'rgba(0,113,227,0.06)' : 'var(--bg-secondary)' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
                    style={{
                      background: i === 0 ? 'var(--accent)' : 'var(--border)',
                      color: i === 0 ? 'white' : 'var(--text-tertiary)',
                    }}>
                    {s.num}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: i === 0 ? 'var(--accent)' : 'var(--text-primary)' }}>{s.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
                  </div>
                  {i === 0 && (
                    <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'var(--accent)', color: 'white' }}>
                      Next →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: University Suggestions */}
        {step === 5 && (
          <div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto"
              style={{ background: 'rgba(191,90,242,0.1)' }}>
              <Sparkles size={22} style={{ color: '#BF5AF2' }} />
            </div>
            <h2 className="text-xl font-semibold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
              Let's find your schools
            </h2>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
              Based on your profile, here are some universities to consider.
            </p>

            {suggestionsLoading && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--border)', borderTopColor: '#BF5AF2' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Finding the best programs for you...
                </p>
              </div>
            )}

            {!suggestionsLoading && suggestionsError && (
              <div className="flex flex-col items-center gap-4 py-8">
                <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                  Couldn't load suggestions. You can add universities manually from your dashboard.
                </p>
                <button onClick={() => navigate('/dashboard')} className="btn-primary">
                  Go to Dashboard
                </button>
              </div>
            )}

            {!suggestionsLoading && !suggestionsError && suggestions.length > 0 && (
              <div className="space-y-5">
                {['dream', 'target', 'safety'].map(tier => {
                  const { label, color, bg, border, Icon } = TIER_CONFIG[tier];
                  const tierSchools = suggestions.filter(s => s.tier === tier);
                  return (
                    <div key={tier}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={14} style={{ color }} strokeWidth={2} />
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>
                          {label}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {tierSchools.map((school, i) => {
                          const idx = suggestions.indexOf(school);
                          const isSelected = selectedSchools.has(idx);
                          return (
                            <button key={i} type="button" onClick={() => toggleSchool(idx)}
                              className="w-full text-left p-3 rounded-xl border-2 transition-all relative"
                              style={{
                                borderColor: isSelected ? color : 'var(--border)',
                                background: isSelected ? bg : 'var(--bg-secondary)',
                              }}>
                              <div className="pr-7">
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {school.name}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                  {school.program}
                                </p>
                                <p className="text-xs italic mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                  {school.reason}
                                </p>
                                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{ background: isSelected ? border : 'var(--border)', color: isSelected ? color : 'var(--text-tertiary)' }}>
                                  {school.country}
                                </span>
                              </div>
                              <div className="absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                style={{
                                  borderColor: isSelected ? color : 'var(--border)',
                                  background: isSelected ? color : 'transparent',
                                }}>
                                {isSelected && <Check size={10} color="white" strokeWidth={3} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="flex gap-2 pt-2">
                  <button onClick={() => navigate('/dashboard')}
                    className="btn-secondary text-sm flex-shrink-0"
                    style={{ color: 'var(--text-tertiary)' }}>
                    Skip, I'll add manually
                  </button>
                  <button
                    onClick={handleAddSchools}
                    disabled={selectedSchools.size === 0 || addingSchools}
                    className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                    style={selectedSchools.size === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
                    {addingSchools
                      ? 'Adding...'
                      : `Add ${selectedSchools.size > 0 ? selectedSchools.size : ''} selected school${selectedSchools.size !== 1 ? 's' : ''} →`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation — hidden on step 5 which has its own action bar */}
        {step < 5 && (
          <>
            <div className={`flex gap-2 mt-6 ${step === 1 ? 'justify-end' : 'justify-between'}`}>
              {step > 1 && step < 4 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="btn-secondary flex items-center gap-1.5">
                  <ChevronLeft size={14} /> Back
                </button>
              )}

              {step < 3 && (
                <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                  className="btn-primary flex items-center gap-1.5 ml-auto"
                  style={!canNext() ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
                  Continue <ChevronRight size={14} />
                </button>
              )}

              {step === 3 && (
                <button onClick={() => setStep(4)}
                  className="btn-primary flex items-center gap-1.5 ml-auto">
                  See my plan <ChevronRight size={14} />
                </button>
              )}

              {step === 4 && (
                <button onClick={handleFinish} disabled={saving}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                  {saving ? 'Saving...' : 'Start my journey →'}
                </button>
              )}
            </div>

            {/* Skip link */}
            {step < 4 && (
              <div className="text-center mt-4">
                <button onClick={async () => { await completeOnboarding(); navigate('/dashboard'); }}
                  className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Skip for now
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
