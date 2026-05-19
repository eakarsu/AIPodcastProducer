require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
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


// === Custom Feature Mounts (batch_06) ===
app.use('/api/cf-agentic-episode-orchestration', require('./routes/customFeat01_AgenticEpisodeOrchestration'));
app.use('/api/cf-real-time-transcription-editing', require('./routes/customFeat02_RealTimeTranscriptionEditing'));
app.use('/api/cf-audience-intelligence', require('./routes/customFeat03_AudienceIntelligence'));
app.use('/api/cf-guest-matching', require('./routes/customFeat04_GuestMatching'));
app.use('/api/cf-multi-platform-publishing-orchestration', require('./routes/customFeat05_MultiPlatformPublishingOrchestration'));


// === Batch 06 Gaps & Frontend Mounts ===
app.use('/api/gap-guests-without-guest', require('./routes/gapFeat_guests_without_guest'));
app.use('/api/gap-episodes-without-episode', require('./routes/gapFeat_episodes_without_episode'));
app.use('/api/gap-analytics-without-audience', require('./routes/gapFeat_analytics_without_audience'));
app.use('/api/gap-no-integration-with-podcast-hosts-buzzsprout-ancho', require('./routes/gapFeat_no_integration_with_podcast_hosts_buzzsprout_ancho'));
app.use('/api/gap-no-audience-management-email-lists-community', require('./routes/gapFeat_no_audience_management_email_lists_community'));
app.use('/api/gap-no-monetization-features-sponsorship-tracking-affi', require('./routes/gapFeat_no_monetization_features_sponsorship_tracking_affi'));
app.use('/api/gap-limited-analytics-listener-growth-retention', require('./routes/gapFeat_limited_analytics_listener_growth_retention'));
app.use('/api/gap-no-integration-with-video-platforms-youtube', require('./routes/gapFeat_no_integration_with_video_platforms_youtube'));
app.use('/api/gap-no-notifications-module-grep-0', require('./routes/gapFeat_no_notifications_module_grep_0'));
app.use('/api/gap-no-audit-logging-grep-0', require('./routes/gapFeat_no_audit_logging_grep_0'));
app.use('/api/gap-no-webhooks-for-episode-publish-events', require('./routes/gapFeat_no_webhooks_for_episode_publish_events'));
app.use('/api/gap-no-file-upload-for-audio-masters', require('./routes/gapFeat_no_file_upload_for_audio_masters'));

// === Custom Views (4 endpoints — VIZ + NON-VIZ) ===
app.use('/api/custom-views', require('./routes/customViews'));

// 404 handler (must be after all routes)
app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
