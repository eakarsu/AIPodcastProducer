import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function GuestFitScorePage() {
  const [formData, setFormData] = useState({
    guestName: '',
    guestBio: '',
    expertise: '',
    podcastTopic: '',
    audience: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [parsed, setParsed] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setParsed(null);
    try {
      const res = await api.post('/ai/guest-fit-score', formData);
      setResult(res.data.content);
      setParsed(res.data.parsed);
      toast.success('Fit score generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    }
    setLoading(false);
  };

  const score = parsed?.fit_score ?? parsed?.score;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>🎯 Guest Fit Score</h2>
          <p className="subtitle">Score how well a prospective guest fits your podcast</p>
        </div>
      </div>

      <div className="ai-form" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="ai-form-row">
            <div className="form-group">
              <label>Guest Name *</label>
              <input
                type="text"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                placeholder="e.g., Dr. Jane Smith"
                required
              />
            </div>
            <div className="form-group">
              <label>Guest Expertise</label>
              <input
                type="text"
                value={formData.expertise}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                placeholder="e.g., AI ethics, machine learning"
              />
            </div>
            <div className="form-group">
              <label>Podcast Topic *</label>
              <input
                type="text"
                value={formData.podcastTopic}
                onChange={(e) => setFormData({ ...formData, podcastTopic: e.target.value })}
                placeholder="e.g., Responsible AI for product teams"
                required
              />
            </div>
            <div className="form-group">
              <label>Audience</label>
              <input
                type="text"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                placeholder="e.g., PMs, startup founders"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Guest Bio / Background</label>
            <textarea
              rows={4}
              value={formData.guestBio}
              onChange={(e) => setFormData({ ...formData, guestBio: e.target.value })}
              placeholder="Background, prior podcast appearances, recent publications..."
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? '⏳ Scoring...' : '✨ Score Guest Fit'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Analyzing fit...</span>
        </div>
      )}

      {parsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {score !== undefined && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                Fit Score
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#7c3aed' }}>{score}</div>
            </div>
          )}
          {parsed.strengths?.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <div
                style={{
                  marginBottom: 8,
                  fontSize: 12,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Strengths
              </div>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {parsed.strengths.map((s, i) => (
                  <li key={i} style={{ marginBottom: 4, lineHeight: 1.6 }}>
                    {typeof s === 'string' ? s : JSON.stringify(s)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {parsed.risks?.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <div
                style={{
                  marginBottom: 8,
                  fontSize: 12,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Risks
              </div>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {parsed.risks.map((r, i) => (
                  <li key={i} style={{ marginBottom: 4, lineHeight: 1.6, color: '#b45309' }}>
                    {typeof r === 'string' ? r : JSON.stringify(r)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {parsed.suggested_topics?.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <div
                style={{
                  marginBottom: 8,
                  fontSize: 12,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Suggested Episode Topics
              </div>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {parsed.suggested_topics.map((t, i) => (
                  <li key={i} style={{ marginBottom: 4, lineHeight: 1.6 }}>
                    {typeof t === 'string' ? t : JSON.stringify(t)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!parsed && result && (
        <div className="ai-output">
          <div className="ai-output-header">
            <div className="ai-icon">✨</div>
            <h4>Fit Analysis</h4>
          </div>
          <div className="ai-output-content">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
