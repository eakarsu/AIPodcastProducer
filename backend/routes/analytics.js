const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const auth = require('../middleware/auth');

const columns = ['episode_id', 'metric_name', 'metric_value', 'period', 'platform', 'notes', 'category'];

// GET all analytics with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const countResult = await pool.query(`SELECT COUNT(*) FROM analytics`);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(`SELECT * FROM analytics ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    res.json({ analytics: result.rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET analytics summary
router.get('/summary', auth, async (req, res) => {
  try {
    // Aggregate by metric_name
    const aggResult = await pool.query(`
      SELECT metric_name,
        SUM(metric_value::numeric) as total,
        AVG(metric_value::numeric) as avg,
        COUNT(*) as count
      FROM analytics
      WHERE metric_value IS NOT NULL
      GROUP BY metric_name
    `);

    const metrics = {};
    aggResult.rows.forEach(row => {
      metrics[row.metric_name] = {
        total: parseFloat(row.total) || 0,
        avg: parseFloat(row.avg) || 0,
        count: parseInt(row.count)
      };
    });

    // Top episodes by downloads
    const topEpisodesResult = await pool.query(`
      SELECT e.id, e.title,
        SUM(a.metric_value::numeric) as total_metric
      FROM episodes e
      LEFT JOIN analytics a ON a.episode_id = e.id
      WHERE a.metric_value IS NOT NULL
      GROUP BY e.id, e.title
      ORDER BY total_metric DESC
      LIMIT 5
    `).catch(() => ({ rows: [] }));

    res.json({
      total_downloads: metrics['downloads']?.total || 0,
      total_plays: metrics['plays']?.total || 0,
      avg_completion_rate: metrics['completion_rate']?.avg || 0,
      top_episodes: topEpisodesResult.rows,
      all_metrics: metrics
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM analytics WHERE id = $1`, [req.params.id]);
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
      `INSERT INTO analytics (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
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
      `UPDATE analytics SET ${setClause}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`,
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
    const result = await pool.query(`DELETE FROM analytics WHERE id = $1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
