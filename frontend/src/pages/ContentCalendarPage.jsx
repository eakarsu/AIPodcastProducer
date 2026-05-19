import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function ContentCalendarPage() {
  const [formData, setFormData] = useState({
    podcastNiche: '',
    publishingFrequency: 'Weekly',
    dateRange: 'next 3 months',
    targetAudience: ''
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
      const res = await api.post('/ai/content-calendar', formData);
      setResult(res.data.content);
      setParsed(res.data.parsed);
      toast.success('Content calendar generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    }
    setLoading(false);
  };

  const calendar = parsed?.calendar || [];
  const themes = parsed?.themes || [];
  const mix = parsed?.content_mix || {};

  const typeColor = { solo: '#eff6ff', interview: '#f0fdf4', panel: '#fef3c7' };
  const typeBadge = { solo: '#1d4ed8', interview: '#059669', panel: '#d97706' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Content Calendar Generator</h2>
          <p className="subtitle">AI-generated editorial calendar with episode ideas, types, and SEO keywords</p>
        </div>
      </div>

      <div className="ai-form" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="ai-form-row">
            <div className="form-group">
              <label>Podcast Niche *</label>
              <input type="text" value={formData.podcastNiche} onChange={e => setFormData({ ...formData, podcastNiche: e.target.value })} placeholder="e.g., Personal Finance, Tech Startups, Health & Wellness" required />
            </div>
            <div className="form-group">
              <label>Publishing Frequency *</label>
              <select value={formData.publishingFrequency} onChange={e => setFormData({ ...formData, publishingFrequency: e.target.value })}>
                <option>Daily</option>
                <option>Twice Weekly</option>
                <option>Weekly</option>
                <option>Biweekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date Range</label>
              <select value={formData.dateRange} onChange={e => setFormData({ ...formData, dateRange: e.target.value })}>
                <option value="next month">Next Month</option>
                <option value="next 3 months">Next 3 Months</option>
                <option value="next 6 months">Next 6 Months</option>
                <option value="Q1 2025">Q1 2025</option>
                <option value="Q2 2025">Q2 2025</option>
              </select>
            </div>
            <div className="form-group">
              <label>Target Audience</label>
              <input type="text" value={formData.targetAudience} onChange={e => setFormData({ ...formData, targetAudience: e.target.value })} placeholder="e.g., millennials, small business owners" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? '⏳ Generating...' : '✨ Generate Content Calendar'}
          </button>
        </form>
      </div>

      {loading && <div className="loading-spinner"><div className="spinner"></div><span>Planning your content strategy...</span></div>}

      {parsed && (
        <>
          {(themes.length > 0 || Object.keys(mix).length > 0) && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              {themes.length > 0 && (
                <div className="data-table-container" style={{ flex: 2, padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Content Themes</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {themes.map((t, i) => <span key={i} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: 12, fontSize: 12 }}>{t}</span>)}
                  </div>
                </div>
              )}
              {Object.keys(mix).length > 0 && (
                <div className="data-table-container" style={{ flex: 1, padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Content Mix</div>
                  {mix.solo_percent !== undefined && <div style={{ fontSize: 13, marginBottom: 3 }}>Solo: {mix.solo_percent}%</div>}
                  {mix.interview_percent !== undefined && <div style={{ fontSize: 13, marginBottom: 3 }}>Interviews: {mix.interview_percent}%</div>}
                  {mix.panel_percent !== undefined && <div style={{ fontSize: 13 }}>Panels: {mix.panel_percent}%</div>}
                </div>
              )}
            </div>
          )}

          {calendar.length > 0 && (
            <div className="data-table-container" style={{ marginBottom: 24 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 16 }}>
                Editorial Calendar ({calendar.length} episodes)
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Topic</th>
                    <th>Key Points</th>
                    <th>Keywords</th>
                  </tr>
                </thead>
                <tbody>
                  {calendar.map((ep, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>{ep.episode_number || i + 1}</td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{ep.suggested_date || '-'}</td>
                      <td className="title-cell">{ep.title}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                          background: typeColor[ep.episode_type] || '#f3f4f6',
                          color: typeBadge[ep.episode_type] || '#6b7280'
                        }}>
                          {ep.episode_type || 'solo'}
                        </span>
                        {ep.guest_type && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{ep.guest_type}</div>}
                      </td>
                      <td style={{ fontSize: 13, maxWidth: 200 }}>{ep.topic}</td>
                      <td style={{ fontSize: 12, color: '#6b7280' }}>
                        {(ep.key_talking_points || []).slice(0, 3).map((p, pi) => <div key={pi}>• {p}</div>)}
                      </td>
                      <td style={{ fontSize: 11 }}>
                        {(ep.seo_keywords || []).slice(0, 3).map((k, ki) => (
                          <span key={ki} style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: 8, marginRight: 3, display: 'inline-block', marginBottom: 2 }}>{k}</span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!parsed && result && (
        <div className="ai-output">
          <div className="ai-output-header"><div className="ai-icon">✨</div><h4>Content Calendar</h4></div>
          <div className="ai-output-content"><ReactMarkdown>{result}</ReactMarkdown></div>
        </div>
      )}
    </div>
  );
}
