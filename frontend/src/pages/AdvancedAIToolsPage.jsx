import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * Apply pass 5 — combined page for 4 additive AI endpoints:
 *  - /api/ai/sponsorship-pitch
 *  - /api/ai/episode-pacing-review
 *  - /api/ai/competitor-analysis
 *  - /api/ai/episode-followup-email
 *
 * 503 (missing OPENROUTER_API_KEY) surfaced via toast as "AI unavailable".
 */

const TOOLS = {
  'sponsorship-pitch': {
    label: 'Sponsorship Pitch',
    fields: [
      { key: 'podcastName', label: 'Podcast Name *', required: true },
      { key: 'audienceProfile', label: 'Audience Profile' },
      { key: 'sponsorBrief', label: 'Sponsor Brief', textarea: true },
      { key: 'adFormat', label: 'Ad Format', placeholder: 'e.g. mid-roll host-read 60s' },
      { key: 'episode_id', label: 'Episode ID (optional)' },
    ],
  },
  'episode-pacing-review': {
    label: 'Episode Pacing Review',
    fields: [
      { key: 'episodeTitle', label: 'Episode Title' },
      { key: 'transcript', label: 'Transcript', textarea: true },
      { key: 'outline', label: 'Outline (alt. to transcript)', textarea: true },
      { key: 'episode_id', label: 'Episode ID (alt.)' },
    ],
  },
  'competitor-analysis': {
    label: 'Competitor Analysis',
    fields: [
      { key: 'yourShow', label: 'Your show description *', required: true, textarea: true },
      { key: 'competitorShows', label: 'Competitor shows (one per line) *', required: true, textarea: true, list: 'lines' },
      { key: 'dimensions', label: 'Dimensions (comma-sep, optional)', list: 'csv' },
    ],
  },
  'episode-followup-email': {
    label: 'Episode Follow-up Email',
    fields: [
      { key: 'guestName', label: 'Guest Name *', required: true },
      { key: 'episodeTitle', label: 'Episode Title *', required: true },
      { key: 'airDate', label: 'Air Date' },
      { key: 'listenerCount', label: 'Listener Count' },
      { key: 'highlights', label: 'Highlights (comma-sep)', list: 'csv' },
      { key: 'tone', label: 'Tone', placeholder: 'warm and professional' },
      { key: 'episode_id', label: 'Episode ID (optional)' },
    ],
  },
};

export default function AdvancedAIToolsPage() {
  const [active, setActive] = useState('sponsorship-pitch');
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [parsed, setParsed] = useState(null);

  const tool = TOOLS[active];

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const f of tool.fields) {
      if (f.required && !form[f.key]) {
        toast.error(`${f.label.replace(/\*$/, '').trim()} is required`);
        return;
      }
    }
    setLoading(true); setResult(null); setParsed(null);
    try {
      const payload = {};
      for (const f of tool.fields) {
        const raw = form[f.key];
        if (raw == null || raw === '') continue;
        if (f.list === 'csv') payload[f.key] = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
        else if (f.list === 'lines') payload[f.key] = String(raw).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        else payload[f.key] = raw;
      }
      const res = await api.post(`/ai/${active}`, payload);
      setResult(res.data.content);
      setParsed(res.data.parsed);
      toast.success(`${tool.label} generated`);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message || 'Request failed';
      if (status === 503) toast.error(`AI unavailable: ${msg}`);
      else toast.error(msg);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Advanced AI Tools</h2>
          <p className="subtitle">Sponsorship pitch, pacing review, competitor analysis, follow-up emails</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.entries(TOOLS).map(([id, t]) => (
          <button
            key={id}
            type="button"
            onClick={() => { setActive(id); setForm({}); setResult(null); setParsed(null); }}
            style={{
              padding: '6px 12px',
              border: '1px solid',
              borderColor: active === id ? '#4f46e5' : '#d1d5db',
              background: active === id ? '#4f46e5' : '#fff',
              color: active === id ? '#fff' : '#374151',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="ai-form" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          {tool.fields.map((f) => (
            <div key={f.key} className="form-group" style={{ marginBottom: 12 }}>
              <label>{f.label}</label>
              {f.textarea ? (
                <textarea
                  rows={4}
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder || ''}
                />
              ) : (
                <input
                  type="text"
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder || ''}
                />
              )}
            </div>
          ))}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Working...' : `Run ${tool.label}`}
          </button>
        </form>
      </div>

      {result && (
        <div className="ai-result" style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
          <h3>Result</h3>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '60vh', overflow: 'auto' }}>
            {parsed ? JSON.stringify(parsed, null, 2) : result}
          </pre>
        </div>
      )}
    </div>
  );
}
