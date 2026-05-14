import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function GuestOutreachPage() {
  const [formData, setFormData] = useState({ guestName: '', podcastTopic: '', hostInfo: '', podcastName: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [parsed, setParsed] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setParsed(null);
    try {
      const res = await api.post('/ai/guest-outreach', formData);
      setResult(res.data.content);
      setParsed(res.data.parsed);
      toast.success('Outreach email generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Guest Outreach Emailer</h2>
          <p className="subtitle">AI-generated personalized outreach emails to invite podcast guests</p>
        </div>
      </div>

      <div className="ai-form" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="ai-form-row">
            <div className="form-group">
              <label>Guest Name *</label>
              <input type="text" value={formData.guestName} onChange={e => setFormData({ ...formData, guestName: e.target.value })} placeholder="e.g., Dr. Jane Smith" required />
            </div>
            <div className="form-group">
              <label>Podcast Name</label>
              <input type="text" value={formData.podcastName} onChange={e => setFormData({ ...formData, podcastName: e.target.value })} placeholder="e.g., The AI Today Podcast" />
            </div>
            <div className="form-group">
              <label>Podcast Topic *</label>
              <input type="text" value={formData.podcastTopic} onChange={e => setFormData({ ...formData, podcastTopic: e.target.value })} placeholder="e.g., AI ethics and responsible technology" required />
            </div>
            <div className="form-group">
              <label>Host Info</label>
              <input type="text" value={formData.hostInfo} onChange={e => setFormData({ ...formData, hostInfo: e.target.value })} placeholder="e.g., 50K listeners, focused on tech innovation" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? '⏳ Generating...' : '✨ Generate Outreach Email'}
          </button>
        </form>
      </div>

      {loading && <div className="loading-spinner"><div className="spinner"></div><span>Writing your personalized outreach...</span></div>}

      {parsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="data-table-container" style={{ padding: 24 }}>
            <div style={{ marginBottom: 8, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Email Subject</div>
            <div style={{ fontSize: 16, fontWeight: 600, background: '#f3f4f6', padding: '10px 14px', borderRadius: 6 }}>{parsed.subject}</div>
          </div>
          <div className="data-table-container" style={{ padding: 24 }}>
            <div style={{ marginBottom: 8, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Email Body</div>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.7, fontSize: 14 }}>{parsed.body}</pre>
          </div>
          {parsed.follow_up_subject && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <div style={{ marginBottom: 8, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Follow-Up Email</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Subject: {parsed.follow_up_subject}</div>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.7, fontSize: 14 }}>{parsed.follow_up_body}</pre>
            </div>
          )}
          {parsed.tips && parsed.tips.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <div style={{ marginBottom: 8, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Outreach Tips</div>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {parsed.tips.map((t, i) => <li key={i} style={{ marginBottom: 4, lineHeight: 1.6 }}>{t}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {!parsed && result && (
        <div className="ai-output">
          <div className="ai-output-header"><div className="ai-icon">✨</div><h4>Generated Outreach</h4></div>
          <div className="ai-output-content"><ReactMarkdown>{result}</ReactMarkdown></div>
        </div>
      )}
    </div>
  );
}
