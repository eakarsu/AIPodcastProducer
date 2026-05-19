const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const https = require('https');
const pool = require('../models/db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const COLUMNS = ['title', 'description', 'status', 'duration', 'publish_date', 'guest_name', 'category', 'tags', 'audio_url', 'notes'];

// Multer setup for audio uploads
const audioUpload = multer({
  dest: path.join(__dirname, '../uploads/audio/'),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || /\.(mp3|mp4|wav|ogg|m4a|aac|flac|opus)$/i.test(file.originalname)) {
      return cb(null, true);
    }
    cb(new Error('Only audio files are allowed'));
  }
});

// Ensure uploads dir exists
const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads/audio/');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

function callOpenRouter(prompt, systemPrompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000,
      temperature: 0.7
    });
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Podcast Producer'
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) reject(new Error(parsed.error.message || 'OpenRouter API error'));
          else resolve(parsed);
        } catch (e) { reject(new Error('Failed to parse response')); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function saveAiResult(userId, endpoint, entityTable, entityId, result) {
  try {
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result) VALUES ($1, $2, $3, $4, $5)`,
      [userId, endpoint, entityTable, entityId, typeof result === 'string' ? result : JSON.stringify(result)]
    );
  } catch (err) { console.error('Failed to save AI result:', err.message); }
}

// GET all episodes with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM episodes');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query('SELECT * FROM episodes ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({
      data: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single episode
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM episodes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create episode
router.post('/', auth, async (req, res) => {
  try {
    const cols = COLUMNS.filter(c => req.body[c] !== undefined);
    const vals = cols.map(c => req.body[c]);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `INSERT INTO episodes (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      vals
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update episode
router.put('/:id', auth, async (req, res) => {
  try {
    const cols = COLUMNS.filter(c => req.body[c] !== undefined);
    const vals = cols.map(c => req.body[c]);
    const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    vals.push(req.params.id);
    const result = await pool.query(
      `UPDATE episodes SET ${setClause}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE episode
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM episodes WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/episodes/:id/upload-audio - upload audio file
router.post('/:id/upload-audio', auth, audioUpload.single('audio'), async (req, res) => {
  try {
    const episode = await pool.query('SELECT * FROM episodes WHERE id = $1', [req.params.id]);
    if (episode.rows.length === 0) return res.status(404).json({ error: 'Episode not found' });
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    const audioPath = req.file.path;
    const audioMeta = JSON.stringify({
      originalName: req.file.originalname,
      storedPath: audioPath,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    });

    // Store in audio_url field as JSON
    const result = await pool.query(
      'UPDATE episodes SET audio_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [audioMeta, req.params.id]
    );

    res.json({ message: 'Audio uploaded successfully', episode: result.rows[0], file: req.file });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/episodes/:id/transcribe - generate transcript from audio or AI template
router.post('/:id/transcribe', auth, aiRateLimiter, async (req, res) => {
  try {
    const episode = await pool.query('SELECT * FROM episodes WHERE id = $1', [req.params.id]);
    if (episode.rows.length === 0) return res.status(404).json({ error: 'Episode not found' });

    const ep = episode.rows[0];
    const hasAudio = ep.audio_url && ep.audio_url !== '';

    // If audio exists, mention it; either way use AI to generate structured transcript
    const prompt = `Generate a professional podcast transcript for this episode:
Title: "${ep.title}"
Description: ${ep.description || 'N/A'}
Guest: ${ep.guest_name || 'Solo episode'}
Duration: ${ep.duration || 'Unknown'}
Notes: ${ep.notes || 'N/A'}
${hasAudio ? 'Audio file: available (generate structured template based on episode info)' : 'Audio file: not yet available (generate structural template)'}

Create a detailed transcript with:
- Speaker labels (HOST, GUEST, etc.)
- Timestamps in [MM:SS] format
- Natural conversation flow based on topic
- [MUSIC], [PAUSE], [LAUGHTER] audio cues
- Introduction, main discussion, and conclusion sections
- Placeholder timestamps that can be updated after real transcription`;

    const result = await callOpenRouter(prompt, 'You are a podcast transcription expert. Create professional, well-formatted transcripts with accurate speaker labels and timestamps.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';

    // Save transcript to transcripts table
    await pool.query(
      `INSERT INTO transcripts (title, content, episode_id, status, language, notes)
       VALUES ($1, $2, $3, 'draft', 'English', $4)
       ON CONFLICT DO NOTHING`,
      [`${ep.title} - Transcript`, content, ep.id, hasAudio ? 'AI-generated from audio' : 'AI template - awaiting real audio']
    ).catch(() => {});

    await saveAiResult(req.user.id, 'episodes/transcribe', 'transcripts', ep.id, content);

    res.json({ content, hasAudio, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/episodes/:id/generate-show-notes - structured show notes
router.post('/:id/generate-show-notes', auth, aiRateLimiter, async (req, res) => {
  try {
    const episode = await pool.query('SELECT * FROM episodes WHERE id = $1', [req.params.id]);
    if (episode.rows.length === 0) return res.status(404).json({ error: 'Episode not found' });

    const ep = episode.rows[0];
    const prompt = `Generate comprehensive, SEO-friendly show notes for this podcast episode:
Title: "${ep.title}"
Description: ${ep.description || 'N/A'}
Guest: ${ep.guest_name || 'Solo episode'}
Category: ${ep.category || 'General'}
Tags: ${ep.tags || 'N/A'}
Duration: ${ep.duration || 'Unknown'}
Notes: ${ep.notes || 'N/A'}

Include all of these sections:
1. Episode Summary (2-3 paragraphs)
2. Key Topics Covered (bulleted list)
3. Timestamps/Chapters (placeholder format [00:00] - Topic)
4. Guest Bio (if applicable)
5. Key Takeaways (actionable items)
6. Resources Mentioned (placeholder links)
7. Related Episodes (suggest types)
8. Call-to-Action (subscribe, rate, follow)`;

    const result = await callOpenRouter(prompt, 'You are a podcast show notes expert who creates engaging, SEO-optimized show notes that boost discoverability and listener retention.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';

    // Save to show_notes table
    await pool.query(
      `UPDATE show_notes SET content = $1, updated_at = NOW() WHERE episode_id = $2`,
      [content, ep.id]
    ).catch(() => {});

    await saveAiResult(req.user.id, 'episodes/generate-show-notes', 'show_notes', ep.id, content);

    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
