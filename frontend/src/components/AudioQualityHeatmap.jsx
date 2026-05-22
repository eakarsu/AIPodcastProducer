import React, { useEffect, useState } from 'react';
import api from '../services/api';

// VIZ component — heatmap of audio quality (episode rows x metric cols)
export default function AudioQualityHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancel = false;
    api.get('/custom-views/audio-quality-heatmap')
      .then(r => { if (!cancel) setData(r.data); })
      .catch(e => { if (!cancel) setErr(e.response?.data?.error || e.message); });
    return () => { cancel = true; };
  }, []);

  if (err) return <div style={{ color: '#ef4444' }}>Error: {err}</div>;
  if (!data) return <div>Loading heatmap…</div>;

  const colorFor = v => {
    const tier = data.legend.find(L => v >= L.from && v <= L.to);
    return tier ? tier.color : '#cbd5e1';
  };

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 10, border: '1px solid #e5e7eb' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>{data.title}</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 4, fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '2px 6px', color: '#64748b' }}>Episode \\ Metric</th>
              {data.xAxis.values.map(m => (
                <th key={m} style={{ padding: '2px 6px', color: '#475569' }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.yAxis.values.map((ep, rIdx) => (
              <tr key={ep}>
                <td style={{ padding: '2px 6px', whiteSpace: 'nowrap', color: '#334155' }}>{ep}</td>
                {data.matrix[rIdx].map((val, cIdx) => (
                  <td key={cIdx}
                      title={`${ep} • ${data.xAxis.values[cIdx]}: ${val}`}
                      style={{
                        width: 56, height: 32, background: colorFor(val),
                        color: '#fff', textAlign: 'center', borderRadius: 4, fontWeight: 600,
                      }}>
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        {data.legend.map(L => (
          <div key={L.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 16, height: 12, background: L.color, borderRadius: 2 }} />
            <span>{L.label} ({L.from}-{L.to})</span>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#475569' }}>
          Average score: <strong>{data.summary.averageScore}</strong>
        </span>
      </div>
    </div>
  );
}
