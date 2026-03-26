import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import apiClient from '../api/client';
import {
  ChevronLeft, Sparkles, CheckCircle, AlertCircle, TrendingUp,
  Bold, Italic, List, ListOrdered, Heading2, Quote, Undo2, Redo2,
  Strikethrough, BookOpen, Save, Minus,
} from 'lucide-react';

// ─── guided questions ─────────────────────────────────────────────────────────
const GUIDED_QUESTIONS = {
  undergraduate: [
    { q: 'Why this major?', hint: 'What sparked your interest? Share a specific moment or experience that made it click for you.' },
    { q: 'Why this university?', hint: 'Mention specific programs, clubs, courses, or values that genuinely excite you about this school.' },
    { q: 'What is your story?', hint: 'What experiences — school, family, community — shaped who you are? Be personal and specific.' },
    { q: 'What are your goals?', hint: 'What do you want to do after college? How does this degree help you get there?' },
    { q: 'What makes you stand out?', hint: 'Achievements, leadership, projects, or skills that show your potential.' },
  ],
  masters: [
    { q: 'Why this university?', hint: 'Mention specific faculty, labs, or programs that directly align with your goals.' },
    { q: 'What is your story?', hint: 'What experiences shaped your academic journey? Be specific and personal.' },
    { q: 'What are your career goals?', hint: 'Where do you see yourself in 5–10 years? How does this degree get you there?' },
    { q: 'Why are you qualified?', hint: 'Key projects, research, or work experience that make you the right fit.' },
    { q: 'What will you contribute?', hint: 'How will you add value to the program and the broader professional community?' },
  ],
  phd: [
    { q: 'What research question drives you?', hint: 'Be specific about the problem you want to solve and why it matters to the field.' },
    { q: 'Why this advisor / lab?', hint: 'Name specific faculty whose work aligns with yours. Show you\'ve read their papers.' },
    { q: 'What is your research background?', hint: 'Your most relevant research experience, methods used, and key findings.' },
    { q: 'What are your career goals?', hint: 'Academia, industry research, policy? How does this PhD prepare you?' },
    { q: 'What will you contribute?', hint: 'How does your unique perspective strengthen the research community?' },
  ],
};

const getGuidedQuestions = d => GUIDED_QUESTIONS[d] || GUIDED_QUESTIONS.masters;

// ─── word count targets ────────────────────────────────────────────────────────
const WORD_TARGETS = {
  undergraduate: { min: 550, max: 650,  label: '550–650' },
  masters:       { min: 500, max: 900,  label: '500–900' },
  phd:           { min: 600, max: 1000, label: '600–1,000' },
};
const getTarget = d => WORD_TARGETS[d] || WORD_TARGETS.masters;

// ─── editor prose styles ───────────────────────────────────────────────────────
const EDITOR_STYLES = `
  .sop-prose .ProseMirror { outline: none; }
  .sop-prose .ProseMirror > * + * { margin-top: 0.85em; }
  .sop-prose .ProseMirror p { margin: 0; }
  .sop-prose .ProseMirror h2 { font-size: 1.15em; font-weight: 700; letter-spacing: -0.01em; margin-top: 1.6em; margin-bottom: 0.4em; }
  .sop-prose .ProseMirror ul { padding-left: 1.4em; list-style-type: disc; }
  .sop-prose .ProseMirror ol { padding-left: 1.4em; list-style-type: decimal; }
  .sop-prose .ProseMirror li + li { margin-top: 0.25em; }
  .sop-prose .ProseMirror blockquote { border-left: 3px solid #0071E3; padding-left: 1em; margin-left: 0; opacity: 0.75; font-style: italic; }
  .sop-prose .ProseMirror strong { font-weight: 650; }
  .sop-prose .ProseMirror s { text-decoration: line-through; opacity: 0.6; }
  .sop-prose .ProseMirror hr { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }
`;

export default function SOPWorkshop() {
  const { universityId, sopId } = useParams();
  const navigate = useNavigate();

  const [university, setUniversity] = useState(null);
  const [sop, setSop] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [wordCount, setWordCount] = useState(0);
  const [critique, setCritique] = useState(null);
  const [critiquing, setCritiquing] = useState(false);
  const [critiqueError, setCritiqueError] = useState('');
  const [activeTab, setActiveTab] = useState('guide'); // 'guide' | 'critique'
  const [mobileTab, setMobileTab] = useState('editor');
  const saveTimer = useRef(null);
  const sopIdRef = useRef(null);

  // inject editor styles once
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'sop-editor-styles';
    el.textContent = EDITOR_STYLES;
    document.head.appendChild(el);
    return () => document.getElementById('sop-editor-styles')?.remove();
  }, []);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'sop-prose',
        style: 'font-size:16.5px;line-height:1.85;color:var(--text-primary);min-height:480px;',
      },
    },
    onUpdate: ({ editor }) => {
      const words = editor.getText().trim().split(/\s+/).filter(Boolean).length;
      setWordCount(words);
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
    if (!editor) return;
    apiClient.get(`/api/sops/${sopId}`)
      .then(res => {
        const existing = res.data;
        setSop(existing);
        setUniversity(existing.university);
        sopIdRef.current = existing.id;
        if (existing.content) {
          editor.commands.setContent(existing.content);
          const text = existing.content.replace(/<[^>]*>/g, '');
          setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
        }
        if (existing.critiques?.length > 0) {
          setCritique(parseCritique(existing.critiques[0]));
          setActiveTab('critique');
        }
      })
      .catch(() => navigate(`/sop/${universityId}`));
  }, [sopId, editor]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const handleGetCritique = async () => {
    if (!sopIdRef.current) return;
    await manualSave();
    setCritiquing(true);
    setCritiqueError('');
    setActiveTab('critique');
    setMobileTab('critique');
    try {
      const res = await apiClient.post('/api/critiques', { sopId: sopIdRef.current });
      setCritique(parseCritique(res.data));
    } catch (err) {
      setCritiqueError(err.response?.data?.error || 'Failed to generate critique');
    } finally { setCritiquing(false); }
  };

  const degreeLevel = university?.degreeLevel || 'masters';
  const isUndergrad = degreeLevel === 'undergraduate';
  const essayLabel = isUndergrad ? 'Personal Statement' : 'Statement of Purpose';
  const target = getTarget(degreeLevel);
  const targetPct = Math.min((wordCount / target.max) * 100, 100);
  const inRange = wordCount >= target.min && wordCount <= target.max;
  const wordColor = wordCount > target.max ? '#FF3B30' : inRange ? '#34C759' : wordCount >= target.min * 0.6 ? '#FF9F0A' : 'var(--text-tertiary)';

  if (!university) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
    </div>
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 md:px-5 py-3 border-b flex-shrink-0"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <button onClick={() => navigate(`/sop/${universityId}`)}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <ChevronLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{university.name}</h1>
              <span className="hidden sm:inline text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0"
                style={{ background: 'rgba(0,113,227,0.08)', color: 'var(--accent)' }}>
                {essayLabel}
              </span>
            </div>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{university.program}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <SaveIndicator status={saveStatus} />
          <button onClick={manualSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}>
            <Save size={12} strokeWidth={1.8} />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button onClick={handleGetCritique} disabled={wordCount < 50 || critiquing}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-all"
            style={{ background: wordCount < 50 ? 'rgba(191,90,242,0.4)' : '#BF5AF2', cursor: wordCount < 50 ? 'not-allowed' : 'pointer' }}>
            <Sparkles size={12} strokeWidth={2} />
            {critiquing ? 'Analysing...' : 'Get AI Critique'}
          </button>
        </div>
      </div>

      {/* ── Mobile tab bar ───────────────────────────────────────────────── */}
      <div className="flex md:hidden border-b flex-shrink-0"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
        {[
          { id: 'editor', label: 'Write' },
          { id: 'guide', label: 'Guide' },
          { id: 'critique', label: 'AI Critique' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setMobileTab(tab.id)}
            className="flex-1 py-2.5 text-xs font-medium transition-all"
            style={mobileTab === tab.id
              ? { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' }
              : { color: 'var(--text-secondary)', borderBottom: '2px solid transparent' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Editor column */}
        <div className={`flex-1 overflow-y-auto min-h-0 ${mobileTab !== 'editor' ? 'hidden md:flex' : 'flex'} flex-col`}
          style={{ background: 'var(--bg)' }}>
          <div className="flex-1 w-full max-w-[740px] mx-auto px-4 md:px-8 py-5 flex flex-col gap-3">

            {/* Toolbar */}
            <EditorToolbar editor={editor} />

            {/* Document paper */}
            <div className="rounded-2xl shadow-apple overflow-hidden"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div className="px-8 md:px-12 py-10">
                {/* Essay type label */}
                <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--text-tertiary)' }}>
                  {essayLabel} · {university.name}
                </p>
                <EditorContent editor={editor} />
              </div>
            </div>

            {/* Word count bar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold tabular-nums" style={{ color: wordColor }}>{wordCount}</span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>/ {target.label} words recommended</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-20 md:w-28 rounded-full h-1.5" style={{ background: 'var(--border)' }}>
                  <div className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${targetPct}%`, background: wordColor }} />
                </div>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Auto-saves every 30s
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ── Right panel ──────────────────────────────────────────────── */}
        <div className={`border-l flex-col flex-shrink-0 md:w-[340px] overflow-hidden
          ${mobileTab === 'guide' || mobileTab === 'critique' ? 'flex max-md:flex-1' : 'hidden md:flex'}`}
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>

          {/* Panel tab bar */}
          <div className="flex border-b flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
            {[
              { id: 'guide', label: 'Writing Guide', icon: BookOpen },
              { id: 'critique', label: 'AI Critique', icon: Sparkles },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id}
                onClick={() => { setActiveTab(id); setMobileTab(id); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all"
                style={activeTab === id
                  ? { color: 'var(--accent)', borderBottom: '2px solid var(--accent)', background: 'transparent' }
                  : { color: 'var(--text-tertiary)', borderBottom: '2px solid transparent' }}>
                <Icon size={12} strokeWidth={activeTab === id ? 2.2 : 1.8} />
                {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto min-h-0">

            {/* Writing Guide */}
            {activeTab === 'guide' && (
              <div className="p-4 space-y-3">
                <p className="text-xs px-1" style={{ color: 'var(--text-tertiary)' }}>
                  Answer these questions to structure your {essayLabel.toLowerCase()}:
                </p>
                {getGuidedQuestions(degreeLevel).map(({ q, hint }, i) => (
                  <div key={i} className="rounded-2xl p-4"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-start gap-2.5 mb-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(0,113,227,0.12)', color: 'var(--accent)' }}>
                        {i + 1}
                      </span>
                      <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{q}</p>
                    </div>
                    <p className="text-xs leading-relaxed pl-7.5" style={{ color: 'var(--text-secondary)', paddingLeft: '29px' }}>{hint}</p>
                  </div>
                ))}
                <div className="rounded-2xl p-4 mt-2" style={{ background: 'rgba(0,113,227,0.05)', border: '1px solid rgba(0,113,227,0.12)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>💡 Tip</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Don't try to answer every question in order. Start with what you feel most passionate about — authenticity matters more than structure.
                  </p>
                </div>
              </div>
            )}

            {/* AI Critique */}
            {activeTab === 'critique' && (
              <div className="p-4">

                {/* Empty state */}
                {!critique && !critiquing && (
                  <div className="flex flex-col items-center text-center gap-4 pt-8 pb-4">
                    <div className="w-14 h-14 rounded-3xl flex items-center justify-center"
                      style={{ background: 'rgba(191,90,242,0.1)' }}>
                      <Sparkles size={24} style={{ color: '#BF5AF2' }} strokeWidth={1.6} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Ready for feedback?</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Write at least 50 words, then get a detailed AI critique covering authenticity, clarity, and impact.
                      </p>
                    </div>
                    {critiqueError && (
                      <p className="text-xs px-3 py-2.5 rounded-xl w-full text-left"
                        style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}>
                        {critiqueError}
                      </p>
                    )}
                    <button onClick={handleGetCritique} disabled={wordCount < 50}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-95"
                      style={{ background: wordCount < 50 ? 'rgba(191,90,242,0.4)' : '#BF5AF2', cursor: wordCount < 50 ? 'not-allowed' : 'pointer' }}>
                      <Sparkles size={14} strokeWidth={2} />
                      {wordCount < 50 ? `Need ${50 - wordCount} more words` : 'Get AI Critique'}
                    </button>
                  </div>
                )}

                {/* Loading */}
                {critiquing && (
                  <div className="flex flex-col items-center justify-center gap-4 pt-12">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(191,90,242,0.1)' }}>
                      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#BF5AF2', borderTopColor: 'transparent' }} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Analysing your writing...</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>This takes 10–20 seconds</p>
                    </div>
                  </div>
                )}

                {/* Critique results */}
                {critique && !critiquing && (
                  <div className="space-y-4">

                    {/* Overall assessment */}
                    <div className="rounded-2xl p-4 flex items-center justify-between"
                      style={{ background: assessmentStyle(critique.overallAssessment).bg, border: `1px solid ${assessmentStyle(critique.overallAssessment).border}` }}>
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: assessmentStyle(critique.overallAssessment).color }}>Overall Assessment</p>
                        <p className="text-lg font-bold capitalize" style={{ color: assessmentStyle(critique.overallAssessment).color }}>
                          {critique.overallAssessment || '—'}
                        </p>
                      </div>
                      <div className="text-3xl font-bold tabular-nums" style={{ color: assessmentStyle(critique.overallAssessment).color }}>
                        {overallScore(critique)}<span className="text-base font-normal opacity-60">/10</span>
                      </div>
                    </div>

                    {/* Score grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Authenticity', value: critique.authenticityScore },
                        { label: 'Specificity',  value: critique.specificityScore },
                        { label: 'Clarity',      value: critique.clarityScore },
                        { label: 'Impact',        value: critique.impactScore },
                      ].map(({ label, value }) => (
                        <ScoreCard key={label} label={label} value={value} />
                      ))}
                    </div>

                    {/* AI Detection */}
                    {critique.aiLikelihood != null && (
                      <AiDetection likelihood={critique.aiLikelihood} reasoning={critique.aiReasoning} />
                    )}

                    {/* Feedback sections */}
                    <CritiqueSection
                      icon={<CheckCircle size={13} strokeWidth={2} />}
                      title="Strengths" items={critique.strengths}
                      color="#34C759" bg="rgba(52,199,89,0.07)" border="rgba(52,199,89,0.15)" />
                    <CritiqueSection
                      icon={<AlertCircle size={13} strokeWidth={2} />}
                      title="Areas to Improve" items={critique.weaknesses}
                      color="#FF9F0A" bg="rgba(255,159,10,0.07)" border="rgba(255,159,10,0.15)" />
                    <CritiqueSection
                      icon={<TrendingUp size={13} strokeWidth={2} />}
                      title="Suggestions" items={critique.suggestions}
                      color="#0071E3" bg="rgba(0,113,227,0.07)" border="rgba(0,113,227,0.15)" />

                    {critiqueError && (
                      <p className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}>
                        {critiqueError}
                      </p>
                    )}

                    <button onClick={handleGetCritique} disabled={critiquing}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: 'rgba(191,90,242,0.08)', color: '#BF5AF2', border: '1px solid rgba(191,90,242,0.2)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(191,90,242,0.14)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(191,90,242,0.08)'}>
                      <Sparkles size={12} strokeWidth={2} /> Re-analyse
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── sub-components ────────────────────────────────────────────────────────────

function EditorToolbar({ editor }) {
  if (!editor) return null;

  const ToolBtn = ({ onClick, active, children, title }) => (
    <button
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
      style={active
        ? { background: 'var(--accent)', color: 'white' }
        : { color: 'var(--text-secondary)' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = ''; }}>
      {children}
    </button>
  );

  const Sep = () => <div className="w-px h-4 mx-0.5 flex-shrink-0" style={{ background: 'var(--border)' }} />;

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-xl w-fit"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (⌘B)">
        <Bold size={13} strokeWidth={2.5} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (⌘I)">
        <Italic size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough size={13} strokeWidth={2} />
      </ToolBtn>

      <Sep />

      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading">
        <Heading2 size={13} strokeWidth={2} />
      </ToolBtn>

      <Sep />

      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
        <List size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
        <ListOrdered size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
        <Quote size={13} strokeWidth={2} />
      </ToolBtn>

      <Sep />

      <ToolBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo (⌘Z)">
        <Undo2 size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo (⌘⇧Z)">
        <Redo2 size={13} strokeWidth={2} />
      </ToolBtn>
    </div>
  );
}

function ScoreCard({ label, value }) {
  const color = value >= 7 ? '#34C759' : value >= 4 ? '#FF9F0A' : '#FF3B30';
  const bg = value >= 7 ? 'rgba(52,199,89,0.07)' : value >= 4 ? 'rgba(255,159,10,0.07)' : 'rgba(255,59,48,0.07)';
  const border = value >= 7 ? 'rgba(52,199,89,0.15)' : value >= 4 ? 'rgba(255,159,10,0.15)' : 'rgba(255,59,48,0.15)';
  return (
    <div className="rounded-xl p-3.5 flex flex-col" style={{ background: bg, border: `1px solid ${border}` }}>
      <span className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value}<span className="text-sm font-normal opacity-50">/10</span>
      </span>
      <span className="text-xs mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div className="rounded-full h-1 mt-2" style={{ background: 'var(--border)' }}>
        <div className="h-1 rounded-full" style={{ width: `${value * 10}%`, background: color }} />
      </div>
    </div>
  );
}

function CritiqueSection({ icon, title, items, color, bg, border }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5" style={{ color }}>
        {icon}
        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs px-3 py-2.5 rounded-xl leading-relaxed"
            style={{ background: bg, border: `1px solid ${border}`, color: 'var(--text-primary)' }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AiDetection({ likelihood, reasoning }) {
  const isHigh = likelihood >= 70;
  const isMid = likelihood >= 40;
  const color = isHigh ? '#FF3B30' : isMid ? '#FF9F0A' : '#34C759';
  const bg = isHigh ? 'rgba(255,59,48,0.07)' : isMid ? 'rgba(255,159,10,0.07)' : 'rgba(52,199,89,0.07)';
  const border = isHigh ? 'rgba(255,59,48,0.2)' : isMid ? 'rgba(255,159,10,0.2)' : 'rgba(52,199,89,0.2)';
  const label = isHigh ? 'Likely AI-generated' : isMid ? 'Possibly AI-assisted' : 'Looks human-written';
  return (
    <div className="rounded-xl p-3.5" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>AI Detection</p>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color, border: `1px solid ${border}` }}>
          {likelihood}% AI
        </span>
      </div>
      <div className="rounded-full h-1.5 mb-2" style={{ background: 'var(--border)' }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${likelihood}%`, background: color }} />
      </div>
      <p className="text-xs font-medium" style={{ color }}>{label}</p>
      {reasoning && <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>{reasoning}</p>}
    </div>
  );
}

function SaveIndicator({ status }) {
  const map = {
    saved:   { text: 'Saved',     color: '#34C759' },
    saving:  { text: 'Saving…',   color: 'var(--text-tertiary)' },
    unsaved: { text: 'Unsaved',   color: '#FF9F0A' },
  };
  const { text, color } = map[status];
  return <span className="text-xs tabular-nums" style={{ color }}>{text}</span>;
}

// ─── helpers ───────────────────────────────────────────────────────────────────

function assessmentStyle(val) {
  return {
    weak:   { color: '#FF3B30', bg: 'rgba(255,59,48,0.07)',  border: 'rgba(255,59,48,0.15)' },
    good:   { color: '#FF9F0A', bg: 'rgba(255,159,10,0.07)', border: 'rgba(255,159,10,0.15)' },
    strong: { color: '#34C759', bg: 'rgba(52,199,89,0.07)',  border: 'rgba(52,199,89,0.15)' },
  }[val] || { color: 'var(--text-secondary)', bg: 'var(--bg-secondary)', border: 'var(--border)' };
}

function overallScore(critique) {
  const scores = [critique.authenticityScore, critique.specificityScore, critique.clarityScore, critique.impactScore].filter(Boolean);
  if (!scores.length) return '—';
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
}

function parseCritique(raw) {
  return {
    ...raw,
    strengths:  typeof raw.strengths  === 'string' ? JSON.parse(raw.strengths)  : raw.strengths,
    weaknesses: typeof raw.weaknesses === 'string' ? JSON.parse(raw.weaknesses) : raw.weaknesses,
    suggestions: typeof raw.suggestions === 'string' ? JSON.parse(raw.suggestions) : raw.suggestions,
  };
}
