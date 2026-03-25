import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import apiClient from '../api/client';
import { Save, ChevronLeft, HelpCircle, X, FileText, Sparkles, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

const GUIDED_QUESTIONS = [
  { q: 'Why this university?', hint: 'Mention specific faculty, labs, or programs that align with your goals.' },
  { q: 'What is your unique story?', hint: 'What experiences shaped your academic journey? Be specific and personal.' },
  { q: 'What are your career goals?', hint: 'Where do you see yourself in 5–10 years? How does this degree help?' },
  { q: 'Why are you qualified?', hint: 'Highlight key projects, research, or achievements that make you stand out.' },
  { q: 'What will you contribute?', hint: 'How will you add value to the program and the research community?' },
];

export default function SOPWorkshop() {
  const { universityId } = useParams();
  const navigate = useNavigate();
  const [university, setUniversity] = useState(null);
  const [sop, setSop] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [wordCount, setWordCount] = useState(0);
  const [critique, setCritique] = useState(null);
  const [critiquing, setCritiquing] = useState(false);
  const [critiqueError, setCritiqueError] = useState('');
  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'critique'
  const saveTimer = useRef(null);
  const sopIdRef = useRef(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: { attributes: { class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-1' } },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
      setSaveStatus('unsaved');
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => autoSave(editor.getHTML()), 30000);
    },
  });

  const autoSave = useCallback(async (content) => {
    if (!sopIdRef.current) return;
    setSaveStatus('saving');
    try {
      await apiClient.put(`/api/sops/${sopIdRef.current}`, { content });
      setSaveStatus('saved');
    } catch { setSaveStatus('unsaved'); }
  }, []);

  const manualSave = async () => {
    if (!editor || !sopIdRef.current) return;
    clearTimeout(saveTimer.current);
    await autoSave(editor.getHTML());
  };

  useEffect(() => {
    apiClient.get(`/api/universities/${universityId}`)
      .then(res => setUniversity(res.data))
      .catch(() => navigate('/universities'));

    apiClient.get(`/api/sops?universityId=${universityId}`)
      .then(async res => {
        let existing;
        if (res.data.length > 0) {
          existing = res.data[0];
        } else {
          const created = await apiClient.post('/api/sops', {
            universityId: parseInt(universityId), title: 'Statement of Purpose', content: '',
          });
          existing = created.data;
        }
        setSop(existing);
        sopIdRef.current = existing.id;
        if (existing.content) {
          editor?.commands.setContent(existing.content);
          const text = existing.content.replace(/<[^>]*>/g, '');
          setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
        }
        const critiqueRes = await apiClient.get(`/api/critiques/${existing.id}`);
        if (critiqueRes.data.length > 0) setCritique(parseCritique(critiqueRes.data[0]));
      });
  }, [universityId, editor]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const handleGetCritique = async () => {
    if (!sopIdRef.current) return;
    await manualSave();
    setCritiquing(true);
    setCritiqueError('');
    try {
      const res = await apiClient.post('/api/critiques', { sopId: sopIdRef.current });
      setCritique(parseCritique(res.data));
    } catch (err) {
      setCritiqueError(err.response?.data?.error || 'Failed to generate critique');
    } finally { setCritiquing(false); }
  };

  if (!university) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
    </div>
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 md:px-5 py-3 border-b flex-shrink-0" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button onClick={() => navigate('/universities')}
            className="p-1.5 rounded-lg transition-colors flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <ChevronLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{university.name}</h1>
            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{university.program}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          <span className="hidden sm:flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <FileText size={11} />{wordCount} words
          </span>
          <SaveIndicator status={saveStatus} />
          <button onClick={manualSave}
            className="flex items-center gap-1 px-2 md:px-3 py-1.5 text-xs font-medium rounded-xl border transition-all"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
            <Save size={11} /><span className="hidden sm:inline ml-1">Save</span>
          </button>
          <button onClick={() => setShowGuide(v => !v)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all"
            style={showGuide
              ? { background: 'rgba(0,113,227,0.1)', borderColor: 'rgba(0,113,227,0.3)', color: 'var(--accent)' }
              : { color: 'var(--text-secondary)', borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
            <HelpCircle size={11} /> Guide
          </button>
        </div>
      </div>

      {/* Mobile tab switcher */}
      <div className="flex md:hidden border-b flex-shrink-0" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
        {[{ id: 'editor', label: 'Editor' }, { id: 'guide', label: 'Guide' }, { id: 'critique', label: 'AI Critique' }].map(tab => (
          <button key={tab.id} onClick={() => setMobileTab(tab.id)}
            className="flex-1 py-2.5 text-xs font-medium transition-all"
            style={mobileTab === tab.id
              ? { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' }
              : { color: 'var(--text-secondary)', borderBottom: '2px solid transparent' }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className={`flex-1 overflow-y-auto ${mobileTab !== 'editor' ? 'hidden md:block' : ''}`} style={{ background: 'var(--bg)' }}>
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-4 md:py-6">
            <Toolbar editor={editor} />
            <div className="card shadow-apple-sm p-4 md:p-6 mt-3 focus-within:ring-2 transition-all" style={{ '--tw-ring-color': 'rgba(0,113,227,0.3)' }}>
              <EditorContent editor={editor} />
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Auto-saves every 30s · v{sop?.version || 1}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: wordCount >= 1000 ? '#34C759' : 'var(--text-tertiary)' }}>{wordCount}/1000</span>
                <div className="w-24 rounded-full h-1" style={{ background: 'var(--border)' }}>
                  <div className="h-1 rounded-full transition-all" style={{ width: `${Math.min((wordCount / 1000) * 100, 100)}%`, background: wordCount >= 800 ? '#34C759' : 'var(--accent)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guide Panel — sidebar on desktop, tab on mobile */}
        {showGuide && (
          <div className="hidden md:block w-64 border-l overflow-y-auto flex-shrink-0" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Writing Guide</span>
              <button onClick={() => setShowGuide(false)} style={{ color: 'var(--text-tertiary)' }}><X size={13} /></button>
            </div>
            <div className="p-3 space-y-2">
              {GUIDED_QUESTIONS.map(({ q, hint }, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{i + 1}. {q}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{hint}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {mobileTab === 'guide' && (
          <div className="md:hidden flex-1 overflow-y-auto" style={{ background: 'var(--bg-elevated)' }}>
            <div className="p-4 space-y-3">
              {GUIDED_QUESTIONS.map(({ q, hint }, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{i + 1}. {q}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{hint}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critique Panel — sidebar on desktop, tab on mobile */}
        <div className={`border-l overflow-y-auto flex-shrink-0 flex flex-col md:w-80 ${mobileTab === 'critique' ? 'flex-1' : 'hidden md:flex'}`} style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Critique</span>
            {critique && <AssessmentBadge value={critique.overallAssessment} />}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {!critique && !critiquing && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(191,90,242,0.1)' }}>
                  <Sparkles size={20} style={{ color: '#BF5AF2' }} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Get AI Feedback</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Write at least 50 words to get detailed feedback on authenticity, clarity, and impact.
                  </p>
                </div>
                {critiqueError && (
                  <p className="text-xs px-3 py-2 rounded-xl w-full" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}>{critiqueError}</p>
                )}
                <button onClick={handleGetCritique} disabled={wordCount < 50}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: '#BF5AF2' }}>
                  <Sparkles size={12} /> Get Critique
                </button>
              </div>
            )}

            {critiquing && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#BF5AF2', borderTopColor: 'transparent' }} />
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Analysing your SOP...</p>
              </div>
            )}

            {critique && !critiquing && (
              <div className="space-y-4">
                {/* AI Detection */}
                {critique.aiLikelihood != null && (
                  <AiDetection likelihood={critique.aiLikelihood} reasoning={critique.aiReasoning} />
                )}

                {/* Scores */}
                <div className="p-3 rounded-xl space-y-2.5" style={{ background: 'var(--bg-secondary)' }}>
                  {[
                    { label: 'Authenticity', value: critique.authenticityScore },
                    { label: 'Specificity', value: critique.specificityScore },
                    { label: 'Clarity', value: critique.clarityScore },
                    { label: 'Impact', value: critique.impactScore },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                        <span>{label}</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{value}/10</span>
                      </div>
                      <div className="rounded-full h-1.5" style={{ background: 'var(--border)' }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${value * 10}%`, background: value >= 7 ? '#34C759' : value >= 4 ? '#FF9F0A' : '#FF3B30' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <CritiqueSection icon={<CheckCircle size={13} />} title="Strengths" items={critique.strengths} color="#34C759" bg="rgba(52,199,89,0.08)" />
                <CritiqueSection icon={<AlertCircle size={13} />} title="Weaknesses" items={critique.weaknesses} color="#FF9F0A" bg="rgba(255,159,10,0.08)" />
                <CritiqueSection icon={<TrendingUp size={13} />} title="Suggestions" items={critique.suggestions} color="#0071E3" bg="rgba(0,113,227,0.08)" />

                {critiqueError && <p className="text-xs" style={{ color: '#FF3B30' }}>{critiqueError}</p>}

                <button onClick={handleGetCritique} disabled={critiquing}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all border"
                  style={{ color: '#BF5AF2', borderColor: 'rgba(191,90,242,0.3)', background: 'rgba(191,90,242,0.06)' }}>
                  <Sparkles size={12} /> Re-critique
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssessmentBadge({ value }) {
  const config = {
    weak: { color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
    good: { color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
    strong: { color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  };
  const c = config[value] || config.good;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ color: c.color, background: c.bg }}>
      {value}
    </span>
  );
}

function CritiqueSection({ icon, title, items, color, bg }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2" style={{ color }}>
        {icon}
        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items?.map((item, i) => (
          <li key={i} className="text-xs px-3 py-2 rounded-xl leading-relaxed" style={{ background: bg, color: 'var(--text-primary)' }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function AiDetection({ likelihood, reasoning }) {
  const isHigh = likelihood >= 70;
  const isMid = likelihood >= 40;
  const color = isHigh ? '#FF3B30' : isMid ? '#FF9F0A' : '#34C759';
  const bg = isHigh ? 'rgba(255,59,48,0.08)' : isMid ? 'rgba(255,159,10,0.08)' : 'rgba(52,199,89,0.08)';
  const border = isHigh ? 'rgba(255,59,48,0.2)' : isMid ? 'rgba(255,159,10,0.2)' : 'rgba(52,199,89,0.2)';
  const label = isHigh ? 'Likely AI-generated' : isMid ? 'Possibly AI-assisted' : 'Likely human-written';

  return (
    <div className="p-3 rounded-xl border" style={{ background: bg, borderColor: border }}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold" style={{ color }}>AI Detection</p>
        <span className="text-xs font-bold" style={{ color }}>{likelihood}%</span>
      </div>
      <div className="rounded-full h-1.5 mb-2" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${likelihood}%`, background: color }} />
      </div>
      <p className="text-xs font-medium mb-1" style={{ color }}>{label}</p>
      {reasoning && <p className="text-xs leading-relaxed" style={{ color, opacity: 0.8 }}>{reasoning}</p>}
    </div>
  );
}

function parseCritique(raw) {
  return {
    ...raw,
    strengths: typeof raw.strengths === 'string' ? JSON.parse(raw.strengths) : raw.strengths,
    weaknesses: typeof raw.weaknesses === 'string' ? JSON.parse(raw.weaknesses) : raw.weaknesses,
    suggestions: typeof raw.suggestions === 'string' ? JSON.parse(raw.suggestions) : raw.suggestions,
  };
}

function SaveIndicator({ status }) {
  const map = { saved: ['Saved', '#34C759'], saving: ['Saving...', 'var(--text-tertiary)'], unsaved: ['Unsaved', '#FF9F0A'] };
  const [text, color] = map[status];
  return <span className="text-xs" style={{ color }}>{text}</span>;
}

function Toolbar({ editor }) {
  if (!editor) return null;
  const btn = (action, label, active) => (
    <button key={label} onMouseDown={e => { e.preventDefault(); action(); }}
      className="px-2.5 py-1 text-xs rounded-lg font-medium transition-all"
      style={active ? { background: 'var(--accent)', color: 'white' } : { color: 'var(--text-secondary)' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = ''; }}>
      {label}
    </button>
  );
  return (
    <div className="flex items-center gap-0.5 p-1 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
      {btn(() => editor.chain().focus().toggleBold().run(), 'B', editor.isActive('bold'))}
      {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'))}
      {btn(() => editor.chain().focus().toggleBulletList().run(), '• List', editor.isActive('bulletList'))}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. List', editor.isActive('orderedList'))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
    </div>
  );
}
