// Custom Views for AIPodcastProducer (podcast production domain)
// Provides 4 endpoints:
//   GET  /api/custom-views/episode-downloads        (VIZ: line/bar chart series)
//   GET  /api/custom-views/audio-quality-heatmap    (VIZ: episode x metric matrix)
//   GET  /api/custom-views/show-notes-pdf/:id       (NON-VIZ: PDF-ready show notes document)
//   GET  /api/custom-views/workflow-rules           (NON-VIZ: list workflow rules)
//   POST /api/custom-views/workflow-rules           (NON-VIZ: create)
//   PUT  /api/custom-views/workflow-rules/:id       (NON-VIZ: update)
//   DELETE /api/custom-views/workflow-rules/:id     (NON-VIZ: delete)

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// ---- In-memory store for workflow rules (CRUD) -------------------------------
let RULE_SEQ = 5;
const workflowRules = [
  { id: 1, name: 'Auto-publish on Friday',  trigger: 'episode.scheduled', action: 'publish',        condition: 'weekday==Friday',        enabled: true,  priority: 1 },
  { id: 2, name: 'Notify guest on edit',    trigger: 'episode.edited',    action: 'notify_guest',   condition: 'has_guest==true',        enabled: true,  priority: 2 },
  { id: 3, name: 'Generate show notes',     trigger: 'episode.recorded',  action: 'generate_notes', condition: 'duration>10min',         enabled: true,  priority: 3 },
  { id: 4, name: 'Push to YouTube',         trigger: 'episode.published', action: 'youtube_upload', condition: 'category==interview',    enabled: false, priority: 4 },
];

// ---- Synthetic data helpers (deterministic per episode) ----------------------
function pseudoRand(seed) {
  // Simple deterministic PRNG so charts/heatmaps look real but stable
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const EPISODE_TITLES = [
  'Ep 01 — Welcome to the Show',
  'Ep 02 — Future of AI Podcasting',
  'Ep 03 — Indie Creator Economy',
  'Ep 04 — Live from PodFest',
  'Ep 05 — Audio Branding 101',
  'Ep 06 — Voice Cloning Ethics',
  'Ep 07 — Monetization Deep Dive',
  'Ep 08 — Guest: Industry Veteran',
];

const QUALITY_METRICS = [
  'loudness_lufs',
  'noise_floor_db',
  'silence_ratio',
  'speech_clarity',
  'music_balance',
  'compression_quality',
];

// ============================================================================
// 1) VIZ — Episode downloads over time (per episode time series)
// ============================================================================
router.get('/episode-downloads', auth, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
    const today = new Date();
    const labels = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      labels.push(d.toISOString().slice(0, 10));
    }

    const series = EPISODE_TITLES.slice(0, 6).map((title, epIdx) => {
      const base = 200 + epIdx * 40;
      const data = labels.map((_, dayIdx) => {
        const r = pseudoRand((epIdx + 1) * 13.37 + dayIdx * 1.7);
        const decay = Math.exp(-dayIdx / (12 + epIdx * 2));
        return Math.round(base * (0.4 + r * 1.2) + base * decay);
      });
      return {
        episodeId: epIdx + 1,
        episodeTitle: title,
        data,
        total: data.reduce((a, b) => a + b, 0),
      };
    });

    res.json({
      chartType: 'line',
      title: 'Episode Downloads (last ' + days + ' days)',
      xAxis: { label: 'Date', values: labels },
      yAxis: { label: 'Downloads' },
      series,
      summary: {
        totalDownloads: series.reduce((s, e) => s + e.total, 0),
        topEpisode: series.slice().sort((a, b) => b.total - a.total)[0]?.episodeTitle || null,
        episodes: series.length,
        days,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 2) VIZ — Audio quality heatmap (episode x metric)
// ============================================================================
router.get('/audio-quality-heatmap', auth, async (req, res) => {
  try {
    const episodes = EPISODE_TITLES;
    const metrics = QUALITY_METRICS;
    const matrix = episodes.map((title, epIdx) =>
      metrics.map((metric, mIdx) => {
        const r = pseudoRand((epIdx + 1) * 7.31 + (mIdx + 1) * 2.11);
        // Normalized 0..100 score (higher = better)
        return Math.round(40 + r * 60);
      })
    );

    res.json({
      chartType: 'heatmap',
      title: 'Audio Quality Heatmap (Episode × Metric)',
      xAxis: { label: 'Metric', values: metrics },
      yAxis: { label: 'Episode', values: episodes },
      matrix,
      scale: { min: 0, max: 100, units: 'score' },
      legend: [
        { from: 0,  to: 40,  color: '#ef4444', label: 'Poor' },
        { from: 40, to: 70,  color: '#f59e0b', label: 'Fair' },
        { from: 70, to: 90,  color: '#10b981', label: 'Good' },
        { from: 90, to: 100, color: '#3b82f6', label: 'Excellent' },
      ],
      summary: {
        episodes: episodes.length,
        metrics: metrics.length,
        averageScore: Math.round(
          matrix.flat().reduce((a, b) => a + b, 0) / (episodes.length * metrics.length)
        ),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 3) NON-VIZ — Show notes PDF document (structured payload ready for PDF render)
// ============================================================================
router.get('/show-notes-pdf/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10) || 1;
    const epIdx = (id - 1) % EPISODE_TITLES.length;
    const title = EPISODE_TITLES[epIdx];
    const r = pseudoRand(id * 3.14);

    const doc = {
      format: 'pdf-document',
      version: '1.0',
      episodeId: id,
      title,
      meta: {
        host: 'Alex Morgan',
        guest: id % 2 === 0 ? 'Dr. Priya Shah' : 'Jordan Reeves',
        recordedAt: '2026-05-' + String(((id - 1) % 28) + 1).padStart(2, '0'),
        duration: Math.round(28 + r * 25) + ' min',
        publishedAt: '2026-05-' + String(((id - 1) % 28) + 2).padStart(2, '0'),
      },
      sections: [
        { heading: 'Summary', body: 'In this episode of PodcastPro we dig into ' + title + '. Listeners will hear practical insights, real production stories, and concrete takeaways.' },
        { heading: 'Topics Covered', bullets: [
          'Background and context for the episode topic',
          'Key interview moments and standout quotes',
          'Production tips drawn from the recording session',
          'Resources mentioned during the conversation',
        ]},
        { heading: 'Timestamps', timestamps: [
          { time: '00:00', label: 'Cold open' },
          { time: '01:45', label: 'Guest introduction' },
          { time: '08:20', label: 'Main interview begins' },
          { time: '22:10', label: 'Listener questions' },
          { time: '31:05', label: 'Wrap-up & credits' },
        ]},
        { heading: 'Links', links: [
          { label: 'Show website', url: 'https://podcastpro.example/episodes/' + id },
          { label: 'Guest profile', url: 'https://podcastpro.example/guests/' + id },
          { label: 'Sponsor', url: 'https://sponsor.example' },
        ]},
        { heading: 'Credits', body: 'Produced by PodcastPro AI. Music: "Indie Drift" by Soundroll. Editing: Alex Morgan.' },
      ],
      pageEstimate: 2,
      generatedAt: new Date().toISOString(),
    };

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 4) NON-VIZ — Workflow rules editor (CRUD)
// ============================================================================
router.get('/workflow-rules', auth, async (req, res) => {
  res.json({
    rules: workflowRules.slice().sort((a, b) => a.priority - b.priority),
    triggers: ['episode.scheduled', 'episode.recorded', 'episode.edited', 'episode.published', 'guest.confirmed'],
    actions: ['publish', 'notify_guest', 'generate_notes', 'youtube_upload', 'send_newsletter', 'tweet'],
    total: workflowRules.length,
  });
});

router.post('/workflow-rules', auth, async (req, res) => {
  const { name, trigger, action, condition, enabled, priority } = req.body || {};
  if (!name || !trigger || !action) {
    return res.status(400).json({ error: 'name, trigger and action are required' });
  }
  const rule = {
    id: ++RULE_SEQ,
    name: String(name),
    trigger: String(trigger),
    action: String(action),
    condition: condition ? String(condition) : '',
    enabled: enabled === undefined ? true : !!enabled,
    priority: Number.isFinite(+priority) ? +priority : workflowRules.length + 1,
  };
  workflowRules.push(rule);
  res.status(201).json(rule);
});

router.put('/workflow-rules/:id', auth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rule = workflowRules.find(r => r.id === id);
  if (!rule) return res.status(404).json({ error: 'rule not found' });
  const { name, trigger, action, condition, enabled, priority } = req.body || {};
  if (name !== undefined) rule.name = String(name);
  if (trigger !== undefined) rule.trigger = String(trigger);
  if (action !== undefined) rule.action = String(action);
  if (condition !== undefined) rule.condition = String(condition);
  if (enabled !== undefined) rule.enabled = !!enabled;
  if (priority !== undefined && Number.isFinite(+priority)) rule.priority = +priority;
  res.json(rule);
});

router.delete('/workflow-rules/:id', auth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = workflowRules.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'rule not found' });
  const [removed] = workflowRules.splice(idx, 1);
  res.json({ deleted: true, rule: removed });
});

module.exports = router;
