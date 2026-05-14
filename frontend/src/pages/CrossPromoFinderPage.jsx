import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function CrossPromoFinderPage() {
  const [formData, setFormData] = useState({
    showName: '',
    niche: '',
    audienceSize: '',
    audienceProfile: '',
    goals: '',
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
      const res = await api.post('/ai/cross-promo-finder', formData);
      setResult(res.data.content);
      setParsed(res.data.parsed);
      toast.success('Cross-promo plan generated');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message || 'Generation failed';
      if (status === 503) {
        toast.error(`AI unavailable: ${msg}`);
      } else {
        toast.error(msg);
      }
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>🤝 Cross-Promo Finder</h2>
          <p className="subtitle">
            Identify realistic cross-promotion opportunities for your show
          </p>
        </div>
      </div>

      <div className="ai-form" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="ai-form-row">
            <div className="form-group">
              <label>Show Name</label>
              <input
                type="text"
                value={formData.showName}
                onChange={(e) => setFormData({ ...formData, showName: e.target.value })}
                placeholder="e.g., The Indie Builder"
              />
            </div>
            <div className="form-group">
              <label>Niche *</label>
              <input
                type="text"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                placeholder="e.g., bootstrapped SaaS"
                required
              />
            </div>
            <div className="form-group">
              <label>Audience Size (monthly)</label>
              <input
                type="text"
                value={formData.audienceSize}
                onChange={(e) => setFormData({ ...formData, audienceSize: e.target.value })}
                placeholder="e.g., 5000"
              />
            </div>
            <div className="form-group">
              <label>Goals</label>
              <input
                type="text"
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                placeholder="e.g., add 1k subs in 90 days"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Audience Profile</label>
            <textarea
              rows={3}
              value={formData.audienceProfile}
              onChange={(e) => setFormData({ ...formData, audienceProfile: e.target.value })}
              placeholder="Demographics, interests, where they hang out..."
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 12 }}
          >
            {loading ? '⏳ Searching...' : '✨ Find Cross-Promo Opportunities'}
          </button>
        </form>
      </div>

      {parsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {parsed.candidate_shows?.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <h4>Candidate Shows</h4>
              <ul>
                {parsed.candidate_shows.map((s, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    <strong>{s.name}</strong> ({s.niche}) — overlap: {s.audience_overlap}, fit: {s.fit_score}
                    <div style={{ color: '#6b7280' }}>{s.outreach_angle}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {parsed.swap_formats?.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <h4>Swap Formats</h4>
              <ul>
                {parsed.swap_formats.map((f, i) => (
                  <li key={i}>
                    <strong>{f.format}</strong> ({f.effort} effort) — {f.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {parsed.outreach_email_template && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <h4>Outreach Email Template</h4>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{parsed.outreach_email_template}</pre>
            </div>
          )}
          {parsed.kpis_to_track?.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <h4>KPIs to Track</h4>
              <ul>
                {parsed.kpis_to_track.map((k, i) => (
                  <li key={i}>{k}</li>
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
            <h4>Cross-Promo Analysis</h4>
          </div>
          <div className="ai-output-content">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
