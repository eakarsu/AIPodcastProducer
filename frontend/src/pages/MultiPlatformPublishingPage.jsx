import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const ALL_PLATFORMS = ['youtube', 'blog', 'twitter', 'linkedin', 'instagram', 'newsletter', 'tiktok'];

export default function MultiPlatformPublishingPage() {
  const [formData, setFormData] = useState({
    episode_id: '',
    episodeTitle: '',
    summary: '',
    transcript: '',
  });
  const [platforms, setPlatforms] = useState(['youtube', 'blog', 'twitter', 'linkedin']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [parsed, setParsed] = useState(null);

  const togglePlatform = (p) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setParsed(null);
    try {
      const payload = {
        ...formData,
        episode_id: formData.episode_id ? parseInt(formData.episode_id, 10) : undefined,
        platforms,
      };
      const res = await api.post('/ai/multiplatform-publishing-prep', payload);
      setResult(res.data.content);
      setParsed(res.data.parsed);
      toast.success('Publishing packages ready');
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
          <h2>📡 Multi-Platform Publishing Prep</h2>
          <p className="subtitle">
            Repurpose an episode into platform-ready content packages
          </p>
        </div>
      </div>

      <div className="ai-form" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="ai-form-row">
            <div className="form-group">
              <label>Episode Title</label>
              <input
                type="text"
                value={formData.episodeTitle}
                onChange={(e) => setFormData({ ...formData, episodeTitle: e.target.value })}
                placeholder="Required if no transcript / summary"
              />
            </div>
            <div className="form-group">
              <label>Episode ID (loads transcript)</label>
              <input
                type="number"
                value={formData.episode_id}
                onChange={(e) => setFormData({ ...formData, episode_id: e.target.value })}
                placeholder="optional"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Summary</label>
            <textarea
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="One-paragraph episode summary"
            />
          </div>
          <div className="form-group">
            <label>Transcript (optional, used if episode_id has none)</label>
            <textarea
              rows={5}
              value={formData.transcript}
              onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
              placeholder="Paste transcript text here..."
            />
          </div>
          <div className="form-group">
            <label>Target Platforms</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALL_PLATFORMS.map((p) => (
                <label
                  key={p}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    background: platforms.includes(p) ? '#ede9fe' : 'white',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={platforms.includes(p)}
                    onChange={() => togglePlatform(p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 12 }}
          >
            {loading ? '⏳ Packaging...' : '✨ Generate Publishing Packages'}
          </button>
        </form>
      </div>

      {parsed?.platforms?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {parsed.platforms.map((p, i) => (
            <div key={i} className="data-table-container" style={{ padding: 24 }}>
              <h4 style={{ textTransform: 'uppercase' }}>{p.platform}</h4>
              {p.title && <div><strong>Title:</strong> {p.title}</div>}
              {p.body && (
                <div style={{ marginTop: 6 }}>
                  <strong>Body:</strong>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{p.body}</pre>
                </div>
              )}
              {p.hashtags?.length > 0 && (
                <div style={{ color: '#7c3aed' }}>
                  {p.hashtags.map((h, j) => (
                    <span key={j} style={{ marginRight: 6 }}>#{h.replace(/^#/, '')}</span>
                  ))}
                </div>
              )}
              {p.cta && <div><strong>CTA:</strong> {p.cta}</div>}
              {p.thumbnail_brief && <div><strong>Thumbnail:</strong> {p.thumbnail_brief}</div>}
              {p.best_post_time && <div><strong>Best post time:</strong> {p.best_post_time}</div>}
            </div>
          ))}
          {parsed.video_clip_briefs?.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <h4>Video Clip Briefs</h4>
              <ul>
                {parsed.video_clip_briefs.map((c, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    <strong>{c.clip_title}</strong> ({c.approx_start}–{c.approx_end}) — {c.hook}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {parsed.email_subject_lines?.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <h4>Email Subject Lines</h4>
              <ul>
                {parsed.email_subject_lines.map((s, i) => (
                  <li key={i}>{s}</li>
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
            <h4>Publishing Packages</h4>
          </div>
          <div className="ai-output-content">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
