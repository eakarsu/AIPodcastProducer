import React from 'react';
import EpisodeDownloadChart from '../components/EpisodeDownloadChart';
import AudioQualityHeatmap from '../components/AudioQualityHeatmap';
import ShowNotesPDF from '../components/ShowNotesPDF';
import WorkflowRulesEditor from '../components/WorkflowRulesEditor';

export default function CustomViewsPage() {
  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100%' }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Podcast Views</h1>
        <p style={{ margin: '4px 0 0', color: '#475569', fontSize: 14 }}>
          Custom production dashboards: download trends, audio-quality heatmap, printable show notes, and workflow rules.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(560px, 1fr))', gap: 16 }}>
        <section data-testid="viz-downloads"><EpisodeDownloadChart /></section>
        <section data-testid="viz-heatmap"><AudioQualityHeatmap /></section>
        <section data-testid="nonviz-shownotes" style={{ gridColumn: '1 / -1' }}><ShowNotesPDF /></section>
        <section data-testid="nonviz-rules" style={{ gridColumn: '1 / -1' }}><WorkflowRulesEditor /></section>
      </div>
    </div>
  );
}
