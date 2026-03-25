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
  const saveTimer = useRef(null);
  const sopIdRef = useRef(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: { class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-1' },
    },
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
    } catch {
      setSaveStatus('unsaved');
    }
  }, []);

  const manualSave = async () => {
    if (!editor || !sopIdRef.current) return;
    clearTimeout(saveTimer.current);
    await autoSave(editor.getHTML());
  };

  useEffect(() => {
    apiClient.get(`/api/universities/${universityId}`)
      .then((res) => setUniversity(res.data))
      .catch(() => navigate('/universities'));

    apiClient.get(`/api/sops?universityId=${universityId}`)
      .then(async (res) => {
        let existing;
        if (res.data.length > 0) {
          existing = res.data[0];
        } else {
          const created = await apiClient.post('/api/sops', {
            universityId: parseInt(universityId),
            title: 'Statement of Purpose',
            content: '',
          });
          existing = created.data;
        }
        setSop(existing);
        sopIdRef.current = existing.id;
        if (existing.content) editor?.commands.setContent(existing.content);

        // Load latest critique
        const critiqueRes = await apiClient.get(`/api/critiques/${existing.id}`);
        if (critiqueRes.data.length > 0) {
          setCritique(parseCritique(critiqueRes.data[0]));
        }
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
    } finally {
      setCritiquing(false);
    }
  };

  if (!university) return <div className="p-8 text-sm text-gray-400">Loading...</div>;

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/universities')} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{university.name}</h1>
            <p className="text-xs text-gray-400">{university.program}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <FileText size={12} />{wordCount} words
          </span>
          <SaveIndicator status={saveStatus} />
          <button onClick={manualSave} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Save size={12} /> Save
          </button>
          <button
            onClick={() => setShowGuide(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${showGuide ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <HelpCircle size={12} /> Guide
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-2xl mx-auto px-8 py-6">
            <Toolbar editor={editor} />
            <div className="border border-gray-200 rounded-xl p-6 mt-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              <EditorContent editor={editor} />
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-300">
                Auto-saves every 30s · v{sop?.version || 1}
              </p>
              <div className="w-32 bg-gray-100 rounded-full h-1">
                <div className="bg-blue-400 h-1 rounded-full transition-all" style={{ width: `${Math.min((wordCount / 1000) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Guided Questions Panel */}
        {showGuide && (
          <div className="w-64 border-l border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
              <span className="text-xs font-semibold text-gray-800">Writing Guide</span>
              <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
            </div>
            <div className="p-3 space-y-3">
              {GUIDED_QUESTIONS.map(({ q, hint }, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-800 mb-1">{i + 1}. {q}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{hint}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critique Panel */}
        <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">AI Critique</span>
            {critique && <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${assessmentStyle[critique.overallAssessment]}`}>{critique.overallAssessment}</span>}
          </div>

          <div className="flex-1 p-4">
            {!critique && !critiquing && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center">
                  <Sparkles size={20} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Get AI Feedback</p>
                  <p className="text-xs text-gray-400">Write at least 50 words, then get detailed critique on your SOP.</p>
                </div>
                {critiqueError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{critiqueError}</p>
                )}
                <button onClick={handleGetCritique} disabled={critiquing || wordCount < 50}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-medium rounded-lg transition-colors">
                  <Sparkles size={12} /> Get Critique
                </button>
              </div>
            )}

            {critiquing && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-500">Analysing your SOP...</p>
              </div>
            )}

            {critique && !critiquing && (
              <div className="space-y-4">
                {/* Scores */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Scores</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Authenticity', value: critique.authenticityScore },
                      { label: 'Specificity', value: critique.specificityScore },
                      { label: 'Clarity', value: critique.clarityScore },
                      { label: 'Impact', value: critique.impactScore },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                          <span>{label}</span><span className="font-medium">{value}/10</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-1.5">
                          <div className="bg-violet-400 h-1.5 rounded-full" style={{ width: `${value * 10}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths */}
                <CritiqueSection icon={<CheckCircle size={13} className="text-green-500" />} title="Strengths" items={critique.strengths} color="green" />

                {/* Weaknesses */}
                <CritiqueSection icon={<AlertCircle size={13} className="text-amber-500" />} title="Weaknesses" items={critique.weaknesses} color="amber" />

                {/* Suggestions */}
                <CritiqueSection icon={<TrendingUp size={13} className="text-blue-500" />} title="Suggestions" items={critique.suggestions} color="blue" />

                <button onClick={handleGetCritique} disabled={critiquing}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-violet-50 hover:bg-violet-100 text-violet-600 text-xs font-medium rounded-lg transition-colors border border-violet-200">
                  <Sparkles size={12} /> Re-critique
                </button>
                {critiqueError && <p className="text-xs text-red-500">{critiqueError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CritiqueSection({ icon, title, items, color }) {
  const colors = { green: 'bg-green-50 text-green-700', amber: 'bg-amber-50 text-amber-700', blue: 'bg-blue-50 text-blue-700' };
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-xs font-semibold text-gray-700">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className={`text-xs px-2.5 py-1.5 rounded-lg ${colors[color]}`}>{item}</li>
        ))}
      </ul>
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

const assessmentStyle = {
  weak: 'bg-red-100 text-red-600',
  good: 'bg-amber-100 text-amber-600',
  strong: 'bg-green-100 text-green-600',
};

function SaveIndicator({ status }) {
  const map = { saved: ['Saved', 'text-green-500'], saving: ['Saving...', 'text-gray-400'], unsaved: ['Unsaved', 'text-amber-500'] };
  const [text, color] = map[status];
  return <span className={`text-xs ${color}`}>{text}</span>;
}

function Toolbar({ editor }) {
  if (!editor) return null;
  const btn = (action, label, active) => (
    <button key={label} onMouseDown={(e) => { e.preventDefault(); action(); }}
      className={`px-2 py-1 text-xs rounded font-medium transition-colors ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>
      {label}
    </button>
  );
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-50 border border-gray-200 rounded-lg">
      {btn(() => editor.chain().focus().toggleBold().run(), 'B', editor.isActive('bold'))}
      {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'))}
      {btn(() => editor.chain().focus().toggleBulletList().run(), '• List', editor.isActive('bulletList'))}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. List', editor.isActive('orderedList'))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
    </div>
  );
}
