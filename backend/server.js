require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/episodes', require('./routes/episodes'));
app.use('/api/guests', require('./routes/guests'));
app.use('/api/scripts', require('./routes/scripts'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/show-notes', require('./routes/showNotes'));
app.use('/api/intros', require('./routes/intros'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/channels', require('./routes/channels'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/transcripts', require('./routes/transcripts'));
app.use('/api/social-posts', require('./routes/socialPosts'));
app.use('/api/seo', require('./routes/seo'));
app.use('/api/ai', require('./routes/ai'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
