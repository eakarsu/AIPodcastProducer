import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function ListenerGrowthStrategyPage() {
  const [formData, setFormData] = useState({
    showName: '',
    niche: '',
    currentDownloads: '',
    currentSubscribers: '',
    channels: '',
    budget: '',
    constraints: '',
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
      const res = await api.post('/ai/listener-growth-strategy', formData);
      setResult(res.data.content);
      setParsed(res.data.parsed);
      toast.success('Growth strategy generated');
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
          <h2>📈 Listener Growth Strategy</h2>
          <p className="subtitle">90-day growth plan tailored to your show</p>
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
              />
            </div>
            <div className="form-group">
              <label>Niche *</label>
              <input
                type="text"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Avg Downloads / Episode</label>
              <input
                type="text"
                value={formData.currentDownloads}
                onChange={(e) => setFormData({ ...formData, currentDownloads: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Subscribers</label>
              <input
                type="text"
                value={formData.currentSubscribers}
                onChange={(e) => setFormData({ ...formData, currentSubscribers: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Active Channels</label>
              <input
                type="text"
                value={formData.channels}
                onChange={(e) => setFormData({ ...formData, channels: e.target.value })}
                placeholder="Spotify, Apple, YouTube..."
              />
            </div>
            <div className="form-group">
              <label>Budget (USD/mo)</label>
              <input
                type="text"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Constraints</label>
            <textarea
              rows={3}
              value={formData.constraints}
              onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
              placeholder="Time limits, no-paid-ads, etc."
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 12 }}
          >
            {loading ? '⏳ Building plan...' : '✨ Generate 90-Day Plan'}
          </button>
        </form>
      </div>

      {parsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {parsed.phases?.map((p, i) => (
            <div key={i} className="data-table-container" style={{ padding: 24 }}>
              <h4>
                Weeks {p.week_range} — {p.focus}
              </h4>
              <ul>
                {(p.tactics || []).map((t, j) => (
                  <li key={j} style={{ marginBottom: 4 }}>
                    <strong>{t.tactic}</strong> ({t.effort} effort, impact: {t.expected_impact})
                    {t.channel && <span style={{ color: '#6b7280' }}> — {t.channel}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {parsed.kpis?.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <h4>KPIs</h4>
              <ul>
                {parsed.kpis.map((k, i) => (
                  <li key={i}>
                    <strong>{k.metric}</strong>: {k.baseline} → {k.target}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {parsed.experiments?.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <h4>Experiments</h4>
              <ul>
                {parsed.experiments.map((e, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    <strong>Hypothesis:</strong> {e.hypothesis}
                    <div style={{ color: '#6b7280' }}>Method: {e.method}</div>
                    <div style={{ color: '#6b7280' }}>Success: {e.success_metric}</div>
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
            <h4>Growth Plan</h4>
          </div>
          <div className="ai-output-content">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
