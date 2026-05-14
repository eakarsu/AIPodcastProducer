import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function AudienceSentimentPage() {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [parsed, setParsed] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast.error('Please paste audience feedback');
      return;
    }
    setLoading(true);
    setResult(null);
    setParsed(null);
    try {
      // Try splitting on blank lines into an array; otherwise send as string
      const blocks = feedback
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = { feedback: blocks.length > 1 ? blocks : feedback.trim() };
      const res = await api.post('/ai/audience-sentiment-analyze', payload);
      setResult(res.data.content);
      setParsed(res.data.parsed);
      toast.success('Sentiment analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    }
    setLoading(false);
  };

  const renderList = (label, items, color = '#374151') =>
    items?.length > 0 && (
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
          {label}
        </div>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {items.map((s, i) => (
            <li key={i} style={{ marginBottom: 4, lineHeight: 1.6, color }}>
              {typeof s === 'string' ? s : JSON.stringify(s)}
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>💬 Audience Sentiment</h2>
          <p className="subtitle">Themes, complaints, requests, and recommended actions</p>
        </div>
      </div>

      <div className="ai-form" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Audience Feedback *</label>
            <textarea
              rows={10}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Paste reviews, comments, or DMs (separate items with blank lines)..."
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? '⏳ Analyzing...' : '✨ Analyze Sentiment'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Reading the room...</span>
        </div>
      )}

      {parsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {parsed.overall_sentiment && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                Overall Sentiment
              </div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {typeof parsed.overall_sentiment === 'string'
                  ? parsed.overall_sentiment
                  : JSON.stringify(parsed.overall_sentiment)}
              </div>
            </div>
          )}
          {renderList('Themes', parsed.themes)}
          {renderList('Praise', parsed.praise, '#065f46')}
          {renderList('Complaints', parsed.complaints, '#991b1b')}
          {renderList('Requests', parsed.requests, '#1d4ed8')}
          {renderList('Recommended Actions', parsed.recommended_actions || parsed.actions, '#7c3aed')}
        </div>
      )}

      {!parsed && result && (
        <div className="ai-output">
          <div className="ai-output-header">
            <div className="ai-icon">✨</div>
            <h4>Sentiment Analysis</h4>
          </div>
          <div className="ai-output-content">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
