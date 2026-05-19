const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const auth = require('../middleware/auth');

const columns = ['title', 'scheduled_date', 'episode_id', 'status', 'type', 'assignee', 'priority', 'notes'];

// GET /api/calendar/ics - Generate iCalendar file from content_calendar rows
router.get('/ics', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM content_calendar WHERE scheduled_date IS NOT NULL ORDER BY scheduled_date ASC`
    );

    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AI Podcast Producer//Content Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    result.rows.forEach(row => {
      const uid = `calendar-${row.id}@ai-podcast-producer`;
      const dtstart = row.scheduled_date
        ? new Date(row.scheduled_date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').substring(0, 8)
        : now.substring(0, 8);
      const summary = (row.title || 'Untitled').replace(/[,;\\]/g, '\\$&');
      const description = (row.notes || '').replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');

      ics.push('BEGIN:VEVENT');
      ics.push(`UID:${uid}`);
      ics.push(`DTSTAMP:${now}Z`);
      ics.push(`DTSTART;VALUE=DATE:${dtstart}`);
      ics.push(`SUMMARY:${summary}`);
      if (description) ics.push(`DESCRIPTION:${description}`);
      if (row.status) ics.push(`STATUS:${row.status.toUpperCase()}`);
      ics.push('END:VEVENT');
    });

    ics.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="podcast-calendar.ics"');
    res.send(ics.join('\r\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const countResult = await pool.query(`SELECT COUNT(*) FROM content_calendar`);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(`SELECT * FROM content_calendar ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    res.json({ calendar: result.rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM content_calendar WHERE id = $1`, [req.params.id]);
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
      `INSERT INTO content_calendar (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
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
      `UPDATE content_calendar SET ${setClause}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`,
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
    const result = await pool.query(`DELETE FROM content_calendar WHERE id = $1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
