import React, { useEffect, useState } from 'react';
import api from '../services/api';

// VIZ component — line chart of episode downloads over time (pure SVG)
export default function EpisodeDownloadChart() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    let cancel = false;
    api.get('/custom-views/episode-downloads', { params: { days } })
      .then(r => { if (!cancel) setData(r.data); })
      .catch(e => { if (!cancel) setErr(e.response?.data?.error || e.message); });
    return () => { cancel = true; };
  }, [days]);

  if (err) return <div style={{ color: '#ef4444' }}>Error: {err}</div>;
  if (!data) return <div>Loading download chart…</div>;

  const w = 760, h = 280, padL = 50, padB = 36, padT = 16, padR = 16;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const allVals = data.series.flatMap(s => s.data);
  const maxY = Math.max(1, ...allVals);
  const xCount = data.xAxis.values.length;
  const xStep = innerW / Math.max(1, xCount - 1);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const toPath = arr => arr.map((v, i) => {
    const x = padL + i * xStep;
    const y = padT + innerH - (v / maxY) * innerH;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 10, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>{data.title}</h3>
        <label style={{ fontSize: 13, color: '#475569' }}>
          Window:{' '}
          <select value={days} onChange={e => setDays(Number(e.target.value))}>
            <option value={14}>14d</option>
            <option value={30}>30d</option>
            <option value={60}>60d</option>
            <option value={90}>90d</option>
          </select>
        </label>
      </div>
      <svg width={w} height={h} role="img" aria-label="Episode downloads chart">
        <rect x="0" y="0" width={w} height={h} fill="#fafafa" />
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = padT + innerH - t * innerH;
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#e5e7eb" />
              <text x={padL - 6} y={y + 3} fontSize="10" textAnchor="end" fill="#64748b">
                {Math.round(maxY * t)}
              </text>
            </g>
          );
        })}
        {data.series.map((s, i) => (
          <path key={s.episodeId} d={toPath(s.data)} fill="none" stroke={colors[i % colors.length]} strokeWidth="2" />
        ))}
        <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="#94a3b8" />
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
        {data.series.map((s, i) => (
          <div key={s.episodeId} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 12, height: 3, background: colors[i % colors.length] }} />
            <span>{s.episodeTitle} ({s.total.toLocaleString()})</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>
        Total: {data.summary.totalDownloads.toLocaleString()} | Top: {data.summary.topEpisode}
      </div>
    </div>
  );
}
