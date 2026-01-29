import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { reportIssue } from 'store/requests/logRequests';
import { logger } from 'utils';

interface ReportIssueProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportIssue: React.FC<ReportIssueProps> = ({ isOpen, onClose }) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Bug');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { if (!isOpen) { setText(''); setCategory('Bug'); setSubmitting(false); setSuccess(false); } }, [isOpen]);
  if (!isOpen) return null;

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await reportIssue(text.trim(), category, { route: typeof window !== 'undefined' ? window.location.pathname : '' });
      setSuccess(true);
      logger.info('issue_report_submit', 'Issue reported');
      setTimeout(onClose, 1200);
    } catch (e) {
      logger.error('issue_report_error', 'Failed to report issue', { error: (e as any)?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="issue-modal-title" style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: 'min(560px, 92vw)', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', color: 'var(--text-primary)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgb(var(--text-primary-rgb) / 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgb(var(--mode-accent-rgb) / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🐞</div>
            <div>
              <div id="issue-modal-title" style={{ fontSize: 15, fontWeight: 700 }}>Report an Issue</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Send feedback to the team</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'rgb(var(--text-primary-rgb) / 0.06)', border: '1px solid rgb(var(--text-primary-rgb) / 0.12)', width: 28, height: 28, borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <select
              aria-label="Issue category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)', borderRadius: 8, padding: '8px 10px' }}
            >
              {/* Ensure native dropdown menus (often white) show dark text for contrast */}
              <option value="Bug" style={{ color: '#111', backgroundColor: '#fff' }}>Bug</option>
              <option value="Feedback" style={{ color: '#111', backgroundColor: '#fff' }}>Feedback</option>
              <option value="Other" style={{ color: '#111', backgroundColor: '#fff' }}>Other</option>
            </select>
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="What happened? What did you expect?" style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)', borderRadius: 8, padding: 10, fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>Cancel</button>
            <button onClick={submit} disabled={submitting || text.trim().length < 3} style={{ padding: '8px 12px', borderRadius: 8, background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)', border: 'none', color: 'var(--text-inverse)', fontWeight: 800, opacity: (submitting || text.trim().length < 3) ? 0.6 : 1 }}>{success ? 'Sent!' : (submitting ? 'Sending…' : 'Send')}</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReportIssue;

