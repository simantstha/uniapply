import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 md:bottom-6 md:right-6 z-40 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        style={{ background: 'var(--accent)', color: '#fff' }}
        title="Report an issue"
      >
        <MessageSquare size={18} />
      </button>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}
