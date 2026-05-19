const express = require('express');
const router = express.Router();
const https = require('https');
const pool = require('../models/db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const columns = ['name', 'email', 'bio', 'expertise', 'company', 'social_links', 'status', 'notes', 'episode_count', 'rating'];

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

// GET all with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const countResult = await pool.query(`SELECT COUNT(*) FROM guests`);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(`SELECT * FROM guests ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    res.json({ guests: result.rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM guests WHERE id = $1`, [req.params.id]);
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
      `INSERT INTO guests (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
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
      `UPDATE guests SET ${setClause}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`,
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
    const result = await pool.query(`DELETE FROM guests WHERE id = $1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/guests/:id/generate-outreach - AI guest outreach email
router.post('/:id/generate-outreach', auth, aiRateLimiter, async (req, res) => {
  try {
    const guestResult = await pool.query(`SELECT * FROM guests WHERE id = $1`, [req.params.id]);
    if (guestResult.rows.length === 0) return res.status(404).json({ error: 'Guest not found' });
    const guest = guestResult.rows[0];

    const prompt = `Write a professional podcast guest outreach email for ${guest.name} who is a ${guest.bio || guest.expertise || 'industry expert'}. Include: subject line, personalized intro, value proposition, specific episode idea, call to action. Return JSON: { "subject": "string", "email_body": "string", "follow_up_template": "string" }`;
    const result = await callOpenRouter(prompt, 'You are an expert podcast producer and outreach specialist. Write compelling, personalized outreach emails that get responses.');
    const content = result.choices?.[0]?.message?.content || '';

    // Parse JSON
    let parsed = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {}

    // Save to ai_results
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'guests/generate-outreach', 'guests', guest.id, content]
    ).catch(() => {});

    res.json({ content, parsed, guest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
