import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function SEOOptimizerPage() {
  const [formData, setFormData] = useState({ episodeTitle: '', description: '', currentKeywords: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [parsed, setParsed] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setParsed(null);
    try {
      const res = await api.post('/ai/seo-optimize', formData);
      setResult(res.data.content);
      setParsed(res.data.parsed);
      toast.success('SEO optimization complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'SEO optimization failed');
    }
    setLoading(false);
  };

  const scoreColor = (score) => {
    if (score >= 80) return '#059669';
    if (score >= 60) return '#d97706';
    return '#dc2626';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>SEO Optimizer</h2>
          <p className="subtitle">AI-powered SEO optimization with keyword suggestions for maximum podcast discoverability</p>
        </div>
      </div>

      <div className="ai-form" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Episode Title *</label>
            <input type="text" value={formData.episodeTitle} onChange={e => setFormData({ ...formData, episodeTitle: e.target.value })} placeholder="e.g., How to Build a Profitable Online Business in 2024" required />
          </div>
          <div className="form-group">
            <label>Episode Description</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Current episode description..." rows={4} />
          </div>
          <div className="form-group">
            <label>Current Keywords (comma-separated)</label>
            <input type="text" value={formData.currentKeywords} onChange={e => setFormData({ ...formData, currentKeywords: e.target.value })} placeholder="e.g., online business, entrepreneurship, passive income" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? '⏳ Optimizing...' : '🔍 Optimize SEO'}
          </button>
        </form>
      </div>

      {loading && <div className="loading-spinner"><div className="spinner"></div><span>Analyzing and optimizing for search...</span></div>}

      {parsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* SEO Score */}
          {parsed.seo_score !== undefined && (
            <div className="data-table-container" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: scoreColor(parsed.seo_score) }}>{parsed.seo_score}</div>
                <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>SEO Score</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ background: '#e5e7eb', borderRadius: 8, height: 12, overflow: 'hidden' }}>
                  <div style={{ width: `${parsed.seo_score}%`, height: '100%', background: scoreColor(parsed.seo_score), borderRadius: 8, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>
          )}

          {/* Optimized Title & Description */}
          {(parsed.optimized_title || parsed.optimized_description) && (
            <div className="data-table-container" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Optimized Content</div>
              {parsed.optimized_title && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Optimized Title</div>
                  <div style={{ fontSize: 16, fontWeight: 600, background: '#f0fdf4', padding: '10px 14px', borderRadius: 6, border: '1px solid #bbf7d0' }}>{parsed.optimized_title}</div>
                </div>
              )}
              {parsed.meta_title && parsed.meta_title !== parsed.optimized_title && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Meta Title (60 chars)</div>
                  <div style={{ fontSize: 14, background: '#eff6ff', padding: '10px 14px', borderRadius: 6 }}>{parsed.meta_title}</div>
                </div>
              )}
              {parsed.optimized_description && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Optimized Description</div>
                  <div style={{ fontSize: 14, background: '#f9fafb', padding: '12px 14px', borderRadius: 6, lineHeight: 1.6 }}>{parsed.optimized_description}</div>
                </div>
              )}
              {parsed.meta_description && (
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Meta Description (160 chars)</div>
                  <div style={{ fontSize: 14, background: '#f9fafb', padding: '12px 14px', borderRadius: 6, lineHeight: 1.6 }}>{parsed.meta_description}</div>
                </div>
              )}
            </div>
          )}

          {/* Keywords */}
          {(parsed.primary_keywords?.length > 0 || parsed.secondary_keywords?.length > 0 || parsed.long_tail_keywords?.length > 0) && (
            <div className="data-table-container" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Keyword Strategy</div>
              {parsed.primary_keywords?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>Primary Keywords</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {parsed.primary_keywords.map((k, i) => <span key={i} style={{ background: '#059669', color: 'white', padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 600 }}>{k}</span>)}
                  </div>
                </div>
              )}
              {parsed.secondary_keywords?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>Secondary Keywords</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {parsed.secondary_keywords.map((k, i) => <span key={i} style={{ background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: 16, fontSize: 13 }}>{k}</span>)}
                  </div>
                </div>
              )}
              {parsed.long_tail_keywords?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>Long-Tail Keywords</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {parsed.long_tail_keywords.map((k, i) => <span key={i} style={{ background: '#f3f4f6', color: '#374151', padding: '4px 12px', borderRadius: 16, fontSize: 12 }}>{k}</span>)}
                  </div>
                </div>
              )}
              {parsed.tags?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>Recommended Tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {parsed.tags.map((t, i) => <span key={i} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: 12, fontSize: 12 }}>#{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Improvements */}
          {parsed.improvements?.length > 0 && (
            <div className="data-table-container" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Recommended Improvements</div>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {parsed.improvements.map((imp, i) => <li key={i} style={{ marginBottom: 6, lineHeight: 1.5 }}>{imp}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {!parsed && result && (
        <div className="ai-output">
          <div className="ai-output-header"><div className="ai-icon">🔍</div><h4>SEO Analysis</h4></div>
          <div className="ai-output-content"><ReactMarkdown>{result}</ReactMarkdown></div>
        </div>
      )}
    </div>
  );
}
