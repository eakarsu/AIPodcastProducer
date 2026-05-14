import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function EpisodeQualityPage() {
  const [episodeId, setEpisodeId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [parsed, setParsed] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!episodeId && !transcript.trim()) {
      toast.error('Provide an episode ID or paste a transcript');
      return;
    }
    setLoading(true);
    setResult(null);
    setParsed(null);
    try {
      const payload = {};
      if (episodeId) payload.episode_id = episodeId;
      if (transcript.trim()) payload.transcript = transcript.trim();
      const res = await api.post('/ai/episode-quality-score', payload);
      setResult(res.data.content);
      setParsed(res.data.parsed);
      toast.success('Quality score generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    }
    setLoading(false);
  };

  const overall = parsed?.overall_score ?? parsed?.score;
  const factors = parsed?.factors || parsed?.scores || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📊 Episode Quality Score</h2>
          <p className="subtitle">Multi-factor production quality scoring</p>
        </div>
      </div>

      <div className="ai-form" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="ai-form-row">
            <div className="form-group">
              <label>Episode ID (optional)</label>
              <input
                type="text"
                value={episodeId}
                onChange={(e) => setEpisodeId(e.target.value)}
                placeholder="Numeric ID — pulls transcript from server"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Transcript (optional if Episode ID provided)</label>
            <textarea
              rows={8}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste the full episode transcript here..."
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? '⏳ Scoring...' : '✨ Score Episode Quality'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Evaluating production quality...</span>
        </div>
      )}

      {parsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {overall !== undefined && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                Overall Score
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#10b981' }}>{overall}</div>
            </div>
          )}
          {Object.keys(factors).length > 0 && (
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
                Factor Breakdown
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <tbody>
                  {Object.entries(factors).map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 12px', textTransform: 'capitalize' }}>
                        {k.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                        {typeof v === 'object' ? JSON.stringify(v) : v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          {parsed.improvements?.length > 0 && (
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
                Improvements
              </div>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {parsed.improvements.map((s, i) => (
                  <li key={i} style={{ marginBottom: 4, lineHeight: 1.6, color: '#b45309' }}>
                    {typeof s === 'string' ? s : JSON.stringify(s)}
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
            <h4>Quality Analysis</h4>
          </div>
          <div className="ai-output-content">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
