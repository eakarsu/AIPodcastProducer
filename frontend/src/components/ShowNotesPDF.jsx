import React, { useEffect, useState } from 'react';
import api from '../services/api';

// NON-VIZ — Episode show-notes "PDF" preview + print/download
export default function ShowNotesPDF() {
  const [episodeId, setEpisodeId] = useState(1);
  const [doc, setDoc] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = (id) => {
    setLoading(true);
    setErr(null);
    api.get(`/custom-views/show-notes-pdf/${id}`)
      .then(r => setDoc(r.data))
      .catch(e => setErr(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(episodeId); /* eslint-disable-next-line */ }, [episodeId]);

  const downloadJson = () => {
    if (!doc) return;
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `show-notes-ep${doc.episodeId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 10, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Show Notes PDF</h3>
        <label style={{ fontSize: 13, marginLeft: 12 }}>
          Episode ID:{' '}
          <input
            type="number"
            min="1"
            value={episodeId}
            onChange={e => setEpisodeId(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: 64 }}
          />
        </label>
        <button onClick={() => load(episodeId)} style={btn()}>Reload</button>
        <button onClick={() => window.print()} style={btn('#3b82f6', '#fff')}>Print / Save as PDF</button>
        <button onClick={downloadJson} style={btn('#10b981', '#fff')} disabled={!doc}>Download JSON</button>
      </div>

      {err && <div style={{ color: '#ef4444' }}>Error: {err}</div>}
      {loading && <div>Loading…</div>}

      {doc && (
        <article style={{
          background: '#fafafa', border: '1px dashed #cbd5e1', borderRadius: 8,
          padding: 20, fontFamily: 'Georgia, serif', color: '#0f172a', lineHeight: 1.5,
        }}>
          <h2 style={{ marginTop: 0 }}>{doc.title}</h2>
          <div style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
            Host: {doc.meta.host} • Guest: {doc.meta.guest} • Recorded: {doc.meta.recordedAt} • Duration: {doc.meta.duration}
          </div>
          {doc.sections.map((s, i) => (
            <section key={i} style={{ marginBottom: 14 }}>
              <h3 style={{ marginBottom: 4 }}>{s.heading}</h3>
              {s.body && <p style={{ margin: 0 }}>{s.body}</p>}
              {s.bullets && (
                <ul>{s.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
              )}
              {s.timestamps && (
                <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                  {s.timestamps.map((t, j) => (
                    <li key={j}><strong>{t.time}</strong> — {t.label}</li>
                  ))}
                </ul>
              )}
              {s.links && (
                <ul>
                  {s.links.map((l, j) => (
                    <li key={j}><a href={l.url} target="_blank" rel="noreferrer">{l.label}</a></li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <footer style={{ fontSize: 12, color: '#64748b', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
            Generated {new Date(doc.generatedAt).toLocaleString()} • ~{doc.pageEstimate} page(s)
          </footer>
        </article>
      )}
    </div>
  );
}

function btn(bg = '#e5e7eb', color = '#0f172a') {
  return {
    background: bg, color, border: 'none', padding: '6px 12px',
    borderRadius: 6, cursor: 'pointer', fontSize: 13,
  };
}
