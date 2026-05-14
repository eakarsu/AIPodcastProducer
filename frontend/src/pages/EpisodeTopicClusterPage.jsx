import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function EpisodeTopicClusterPage() {
  const [topicsText, setTopicsText] = useState('');
  const [episodesLimit, setEpisodesLimit] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [parsed, setParsed] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setParsed(null);
    try {
      const topics = topicsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = topics.length
        ? { topics }
        : { episodes_limit: parseInt(episodesLimit, 10) || 30 };
      const res = await api.post('/ai/episode-topic-cluster', payload);
      setResult(res.data.content);
      setParsed(res.data.parsed);
      toast.success(`Clustered ${res.data.items_analyzed || ''} topics`);
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
          <h2>🧭 Episode Topic Clustering</h2>
          <p className="subtitle">
            Group your topics into thematic content pillars and surface gaps
          </p>
        </div>
      </div>

      <div className="ai-form" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Topics / Episode Titles (one per line)</label>
            <textarea
              rows={6}
              value={topicsText}
              onChange={(e) => setTopicsText(e.target.value)}
              placeholder={'Leave blank to use your most recent episodes...\nOr paste topics here, one per line'}
            />
          </div>
          <div className="ai-form-row">
            <div className="form-group">
              <label>Episodes to fetch (if no topics pasted)</label>
              <input
                type="number"
                min={1}
                max={200}
                value={episodesLimit}
                onChange={(e) => setEpisodesLimit(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 12 }}
          >
            {loading ? '⏳ Clustering...' : '✨ Cluster Topics'}
          </button>
        </form>
      </div>

      {parsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {parsed.clusters?.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <h4>Clusters</h4>
              <ul>
                {parsed.clusters.map((c, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    <strong>{c.theme}</strong> ({c.size} items, audience: {c.audience_interest})
                    <div style={{ color: '#6b7280' }}>{c.summary}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {parsed.content_pillars?.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <h4>Content Pillars</h4>
              <ul>
                {parsed.content_pillars.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {parsed.gaps?.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <h4>Gaps</h4>
              <ul>
                {parsed.gaps.map((g, i) => (
                  <li key={i} style={{ color: '#b45309' }}>
                    <strong>{g.topic}</strong> — {g.why} ({g.priority})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {parsed.next_episode_suggestions?.length > 0 && (
            <div className="data-table-container" style={{ padding: 24 }}>
              <h4>Next Episode Suggestions</h4>
              <ul>
                {parsed.next_episode_suggestions.map((s, i) => (
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
            <h4>Cluster Analysis</h4>
          </div>
          <div className="ai-output-content">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
