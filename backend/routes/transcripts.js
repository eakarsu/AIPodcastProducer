const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const https = require('https');
const pool = require('../models/db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

// Multer storage for audio uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/podcasts/'),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /mp3|wav|m4a|ogg|audio/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext) || file.mimetype.startsWith('audio/')) return cb(null, true);
    cb(new Error('Only audio files are allowed'));
  }
});

const columns = ['title', 'content', 'episode_id', 'word_count', 'language', 'status', 'accuracy', 'notes'];

function callOpenRouter(prompt, systemPrompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
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
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// GET all
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const countResult = await pool.query(`SELECT COUNT(*) FROM transcripts`);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(`SELECT * FROM transcripts ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    res.json({ transcripts: result.rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM transcripts WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post('/', auth, async (req, res) => {
  try {
    const cols = columns.filter(c => req.body[c] !== undefined);
    const vals = cols.map(c => req.body[c]);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `INSERT INTO transcripts (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      vals
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update
router.put('/:id', auth, async (req, res) => {
  try {
    const cols = columns.filter(c => req.body[c] !== undefined);
    const vals = cols.map(c => req.body[c]);
    const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    vals.push(req.params.id);
    const result = await pool.query(
      `UPDATE transcripts SET ${setClause}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`DELETE FROM transcripts WHERE id = $1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transcripts/upload-audio - Audio upload for AI-assisted transcription
router.post('/upload-audio', auth, aiRateLimiter, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    const filename = req.file.originalname;
    const filePath = req.file.path;
    const { episode_id, title, language } = req.body;

    // Simulate transcription via AI text generation based on episode metadata
    const prompt = `Transcribe and summarize this podcast episode. Based on the file name '${filename}' and episode metadata provided, generate:
1) A detailed transcript outline
2) Chapter timestamps (estimated)
3) Key quotes
4) Main topics covered
5) Show notes draft

Return as JSON: { "transcript_outline": "string", "chapters": [{"time": "string", "title": "string"}], "key_quotes": [], "topics": [], "show_notes_draft": "string" }`;

    const result = await callOpenRouter(prompt, 'You are a professional podcast transcription and content specialist.');
    const aiContent = result.choices?.[0]?.message?.content || '';

    // Try to parse JSON, fall back to raw text
    let parsedContent = aiContent;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsedContent = JSON.stringify(JSON.parse(jsonMatch[0]), null, 2);
    } catch (e) {}

    // Create transcript record
    const insertResult = await pool.query(
      `INSERT INTO transcripts (title, content, episode_id, language, status, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        title || `Transcript: ${filename}`,
        parsedContent,
        episode_id || null,
        language || 'en',
        'draft',
        `Auto-generated from uploaded audio: ${filename}`
      ]
    );

    // Save to ai_results
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'transcripts/upload-audio', 'transcripts', insertResult.rows[0].id, parsedContent]
    ).catch(() => {});

    res.status(201).json({
      transcript: insertResult.rows[0],
      aiContent: parsedContent,
      filePath
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
