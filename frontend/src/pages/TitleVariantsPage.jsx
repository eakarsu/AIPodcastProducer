import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function TitleVariantsPage() {
  const [formData, setFormData] = useState({ episodeTopic: '', targetAudience: '', keywords: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [parsed, setParsed] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setParsed(null);
    try {
      const res = await api.post('/ai/title-variants', formData);
      setResult(res.data.content);
      setParsed(res.data.parsed);
      toast.success('Title variants generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    }
    setLoading(false);
  };

  const variants = parsed?.variants || [];
  const scoreColor = (score) => {
    if (score >= 8) return '#059669';
    if (score >= 6) return '#d97706';
    return '#dc2626';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Episode Title A/B Tester</h2>
          <p className="subtitle">Generate 5 title variants with engagement score predictions</p>
        </div>
      </div>

      <div className="ai-form" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="ai-form-row">
            <div className="form-group">
              <label>Episode Topic *</label>
              <input type="text" value={formData.episodeTopic} onChange={e => setFormData({ ...formData, episodeTopic: e.target.value })} placeholder="e.g., How AI is changing creative writing" required />
            </div>
            <div className="form-group">
              <label>Target Audience</label>
              <input type="text" value={formData.targetAudience} onChange={e => setFormData({ ...formData, targetAudience: e.target.value })} placeholder="e.g., writers, tech enthusiasts, entrepreneurs" />
            </div>
            <div className="form-group">
              <label>Keywords to Include</label>
              <input type="text" value={formData.keywords} onChange={e => setFormData({ ...formData, keywords: e.target.value })} placeholder="e.g., AI, writing, future" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? '⏳ Generating...' : '✨ Generate Title Variants'}
          </button>
        </form>
      </div>

      {loading && <div className="loading-spinner"><div className="spinner"></div><span>Crafting compelling titles...</span></div>}

      {variants.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {variants.map((v, i) => (
            <div key={i} className="data-table-container" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>{v.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor(v.engagement_score) }}>{v.engagement_score}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>Score</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {v.style && <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{v.style}</span>}
                {v.best_for && <span style={{ background: '#f0fdf4', color: '#059669', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>{v.best_for}</span>}
              </div>
              {v.why_it_works && <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{v.why_it_works}</div>}
            </div>
          ))}
          {parsed?.recommendation && (
            <div className="data-table-container" style={{ padding: 20, background: '#fffbeb', border: '1px solid #fcd34d' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>AI Recommendation</div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{parsed.recommendation}</div>
            </div>
          )}
        </div>
      )}

      {!parsed && result && (
        <div className="ai-output">
          <div className="ai-output-header"><div className="ai-icon">✨</div><h4>Title Variants</h4></div>
          <div className="ai-output-content"><ReactMarkdown>{result}</ReactMarkdown></div>
        </div>
      )}
    </div>
  );
}
