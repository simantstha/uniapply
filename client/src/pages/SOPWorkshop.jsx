import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import apiClient from '../api/client';
import { Save, ChevronLeft, HelpCircle, X, Clock, FileText } from 'lucide-react';

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
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const [wordCount, setWordCount] = useState(0);
  const saveTimer = useRef(null);
  const sopIdRef = useRef(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-1',
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const count = text.trim().split(/\s+/).filter(Boolean).length;
      setWordCount(count);
      setSaveStatus('unsaved');

      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        autoSave(editor.getHTML());
      }, 30000);
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
        if (res.data.length > 0) {
          const existing = res.data[0];
          setSop(existing);
          sopIdRef.current = existing.id;
          editor?.commands.setContent(existing.content || '');
          const text = existing.content?.replace(/<[^>]*>/g, '') || '';
          setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
        } else {
          const created = await apiClient.post('/api/sops', {
            universityId: parseInt(universityId),
            title: 'Statement of Purpose',
            content: '',
          });
          setSop(created.data);
          sopIdRef.current = created.data.id;
        }
      });
  }, [universityId, editor]);

  useEffect(() => {
    return () => clearTimeout(saveTimer.current);
  }, []);

  if (!university) return <div className="p-8 text-sm text-gray-400">Loading...</div>;

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/universities')} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{university.name}</h1>
            <p className="text-xs text-gray-400">{university.program}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <FileText size={12} />
            {wordCount} words
          </span>
          <SaveIndicator status={saveStatus} />
          <button
            onClick={manualSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Save size={12} /> Save
          </button>
          <button
            onClick={() => setShowGuide((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showGuide ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <HelpCircle size={12} /> Guide
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-2xl mx-auto px-8 py-8">
            <Toolbar editor={editor} />
            <div className="border border-gray-200 rounded-xl p-6 mt-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              <EditorContent editor={editor} />
            </div>
            <p className="text-xs text-gray-300 mt-3 text-right">
              Auto-saves every 30 seconds · {sop?.version || 1} version{(sop?.version || 1) > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Guided Questions Panel */}
        {showGuide && (
          <div className="w-72 border-l border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
              <span className="text-sm font-semibold text-gray-800">Writing Guide</span>
              <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {GUIDED_QUESTIONS.map(({ q, hint }, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-800 mb-1">{i + 1}. {q}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{hint}</p>
                </div>
              ))}
              <div className="bg-blue-50 rounded-lg border border-blue-100 p-3">
                <p className="text-xs font-semibold text-blue-800 mb-1">Target Length</p>
                <p className="text-xs text-blue-600">800–1,000 words is ideal for most programs.</p>
                <div className="mt-2 bg-blue-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min((wordCount / 1000) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-blue-500 mt-1">{wordCount} / 1000 words</p>
              </div>
            </div>
          </div>
        )}

        {/* Critique placeholder panel */}
        <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0">
          <div className="px-4 py-3 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-800">AI Critique</span>
          </div>
          <div className="p-6 flex flex-col items-center justify-center h-64 text-center">
            <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center mb-3">
              <Clock size={20} className="text-violet-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Critique coming in Week 4</p>
            <p className="text-xs text-gray-400">AI-powered feedback with scores across authenticity, specificity, clarity, and impact.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({ status }) {
  const map = {
    saved: { text: 'Saved', color: 'text-green-500' },
    saving: { text: 'Saving...', color: 'text-gray-400' },
    unsaved: { text: 'Unsaved changes', color: 'text-amber-500' },
  };
  const { text, color } = map[status];
  return <span className={`text-xs ${color}`}>{text}</span>;
}

function Toolbar({ editor }) {
  if (!editor) return null;
  const btn = (action, label, active) => (
    <button
      key={label}
      onMouseDown={(e) => { e.preventDefault(); action(); }}
      className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
        active ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-50 border border-gray-200 rounded-lg">
      {btn(() => editor.chain().focus().toggleBold().run(), 'B', editor.isActive('bold'))}
      {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'))}
      {btn(() => editor.chain().focus().toggleBulletList().run(), '• List', editor.isActive('bulletList'))}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. List', editor.isActive('orderedList'))}
      {btn(() => editor.chain().focus().setParagraph().run(), 'P', editor.isActive('paragraph'))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
    </div>
  );
}
