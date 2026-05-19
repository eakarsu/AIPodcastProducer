const router = require('express').Router();
const https = require('https');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const pool = require('../models/db');

// Sentinel error for missing API key — handlers catch this to map to 503.
class AIKeyMissingError extends Error {
  constructor(msg) { super(msg || 'AI not configured: OPENROUTER_API_KEY is missing'); this.code = 'AI_KEY_MISSING'; }
}

function callOpenRouter(prompt, systemPrompt) {
  if (!process.env.OPENROUTER_API_KEY) {
    return Promise.reject(new AIKeyMissingError());
  }
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
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'OpenRouter API error'));
          } else {
            resolve(parsed);
          }
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

// Ensure ai_results table exists
async function ensureAiResultsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      endpoint VARCHAR(100),
      entity_table VARCHAR(50),
      entity_id INTEGER,
      result TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}
ensureAiResultsTable().catch(console.error);

async function saveAiResult(userId, endpoint, entityTable, entityId, result) {
  try {
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_table, entity_id, result) VALUES ($1, $2, $3, $4, $5)`,
      [userId, endpoint, entityTable, entityId, typeof result === 'string' ? result : JSON.stringify(result)]
    );
  } catch (err) {
    console.error('Failed to save AI result:', err.message);
  }
}

// Generate podcast script
router.post('/generate-script', auth, aiRateLimiter, async (req, res) => {
  try {
    const { topic, duration, tone, guestName, episode_id } = req.body;
    const prompt = `Create a detailed podcast script about "${topic}". Duration: ${duration || '30 minutes'}. Tone: ${tone || 'conversational'}. ${guestName ? `Guest: ${guestName}` : 'Solo episode'}. Include an engaging intro, main talking points with transitions, audience engagement moments, and a compelling outro.`;
    const result = await callOpenRouter(prompt, 'You are an expert podcast script writer. Create engaging, well-structured podcast scripts that captivate listeners.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';

    if (episode_id) {
      await pool.query(`UPDATE scripts SET content = $1, updated_at = NOW() WHERE episode_id = $2`, [content, episode_id]).catch(() => {});
    }
    await saveAiResult(req.user.id, 'generate-script', 'scripts', episode_id || null, content);

    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Research guest
router.post('/research-guest', auth, aiRateLimiter, async (req, res) => {
  try {
    const { guestName, expertise, company, guest_id } = req.body;
    const prompt = `Research and compile a comprehensive guest profile for podcast preparation:
    Guest: ${guestName}
    Expertise: ${expertise || 'Not specified'}
    Company: ${company || 'Not specified'}

    Include: background summary, key achievements, interesting talking points, potential controversial topics to avoid, suggested conversation starters, and fun facts.`;
    const result = await callOpenRouter(prompt, 'You are a podcast research assistant. Compile detailed guest profiles to help podcast hosts prepare for engaging interviews.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';

    if (guest_id) {
      await pool.query(`UPDATE guests SET notes = $1, updated_at = NOW() WHERE id = $2`, [content, guest_id]).catch(() => {});
    }
    await saveAiResult(req.user.id, 'research-guest', 'guests', guest_id || null, content);

    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Suggest topics
router.post('/suggest-topics', auth, aiRateLimiter, async (req, res) => {
  try {
    const { category, audience, count } = req.body;
    const prompt = `Suggest ${count || 10} trending and engaging podcast topics for the category: "${category || 'Technology'}". Target audience: ${audience || 'general'}. For each topic include: title, brief description, why it's trending, potential guest types, and estimated listener appeal (1-10).`;
    const result = await callOpenRouter(prompt, 'You are a podcast content strategist. Suggest trending, engaging topics that will attract and retain listeners.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';

    await saveAiResult(req.user.id, 'suggest-topics', 'topics', null, content);

    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate show notes
router.post('/generate-show-notes', auth, aiRateLimiter, async (req, res) => {
  try {
    const { episodeTitle, description, guestName, keyTopics, episode_id } = req.body;
    const prompt = `Generate comprehensive show notes for the podcast episode:
    Title: "${episodeTitle}"
    Description: ${description || 'N/A'}
    Guest: ${guestName || 'Solo episode'}
    Key Topics: ${keyTopics || 'N/A'}

    Include: episode summary, timestamps/chapters, key takeaways, mentioned resources/links, guest bio, related episodes suggestions, and call-to-action.`;
    const result = await callOpenRouter(prompt, 'You are a podcast show notes expert. Create detailed, SEO-friendly show notes that help listeners and boost discoverability.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';

    if (episode_id) {
      await pool.query(`UPDATE show_notes SET content = $1, updated_at = NOW() WHERE episode_id = $2`, [content, episode_id]).catch(() => {});
    }
    await saveAiResult(req.user.id, 'generate-show-notes', 'show_notes', episode_id || null, content);

    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate intro/outro
router.post('/generate-intro-outro', auth, aiRateLimiter, async (req, res) => {
  try {
    const { episodeTitle, type, tone, podcastName, episode_id } = req.body;
    const prompt = `Generate a ${type || 'both intro and outro'} for the podcast episode:
    Podcast: "${podcastName || 'The Podcast'}"
    Episode: "${episodeTitle}"
    Tone: ${tone || 'professional and engaging'}

    The ${type || 'intro'} should hook listeners immediately. Include sponsor mention placeholder, social media call-to-action, and make it memorable.`;
    const result = await callOpenRouter(prompt, 'You are a podcast intro/outro specialist. Create compelling openings and closings that brand the podcast and engage listeners.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';

    if (episode_id) {
      await pool.query(`UPDATE intros SET content = $1, updated_at = NOW() WHERE episode_id = $2`, [content, episode_id]).catch(() => {});
    }
    await saveAiResult(req.user.id, 'generate-intro-outro', 'intros', episode_id || null, content);

    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate interview questions
router.post('/generate-questions', auth, aiRateLimiter, async (req, res) => {
  try {
    const { guestName, expertise, topic, questionCount, episode_id } = req.body;
    const prompt = `Generate ${questionCount || 15} interview questions for a podcast episode:
    Guest: ${guestName || 'General'}
    Expertise: ${expertise || 'N/A'}
    Topic: ${topic || 'General discussion'}

    Mix of: icebreakers, deep-dive questions, audience-submitted style questions, rapid-fire questions, and closing questions. Include follow-up prompts for each question.`;
    const result = await callOpenRouter(prompt, 'You are a podcast interview coach. Create thought-provoking questions that lead to authentic, engaging conversations.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';

    if (episode_id) {
      await pool.query(`UPDATE questions SET content = $1, updated_at = NOW() WHERE episode_id = $2`, [content, episode_id]).catch(() => {});
    }
    await saveAiResult(req.user.id, 'generate-questions', 'questions', episode_id || null, content);

    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate transcript
router.post('/generate-transcript', auth, aiRateLimiter, async (req, res) => {
  try {
    const { episodeTitle, script, notes, episode_id } = req.body;
    const prompt = `Based on the following podcast episode details, generate a polished transcript:
    Episode: "${episodeTitle}"
    ${script ? `Script outline: ${script}` : ''}
    ${notes ? `Notes: ${notes}` : ''}

    Format as a professional transcript with speaker labels, timestamps, and proper formatting. Include [MUSIC], [PAUSE], and other audio cues.`;
    const result = await callOpenRouter(prompt, 'You are a podcast transcription expert. Create clean, well-formatted transcripts that are accessible and SEO-friendly.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';

    if (episode_id) {
      await pool.query(`UPDATE transcripts SET content = $1, updated_at = NOW() WHERE episode_id = $2`, [content, episode_id]).catch(() => {});
    }
    await saveAiResult(req.user.id, 'generate-transcript', 'transcripts', episode_id || null, content);

    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate social media posts
router.post('/generate-social-post', auth, aiRateLimiter, async (req, res) => {
  try {
    const { episodeTitle, platform, keyPoints, tone, episode_id } = req.body;
    const prompt = `Create engaging social media content for the podcast episode:
    Episode: "${episodeTitle}"
    Platform: ${platform || 'Twitter, LinkedIn, Instagram'}
    Key Points: ${keyPoints || 'N/A'}
    Tone: ${tone || 'engaging and shareable'}

    Generate platform-specific posts with relevant hashtags, emojis, and calls-to-action. Include a thread/carousel option for longer content.`;
    const result = await callOpenRouter(prompt, 'You are a social media marketing expert for podcasts. Create viral, engaging content that drives listeners to episodes.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';

    if (episode_id) {
      await pool.query(`UPDATE social_posts SET content = $1, updated_at = NOW() WHERE episode_id = $2`, [content, episode_id]).catch(() => {});
    }
    await saveAiResult(req.user.id, 'generate-social-post', 'social_posts', episode_id || null, content);

    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEO optimization
router.post('/optimize-seo', auth, aiRateLimiter, async (req, res) => {
  try {
    const { episodeTitle, description, currentKeywords, episode_id } = req.body;
    const prompt = `Optimize the SEO for this podcast episode:
    Title: "${episodeTitle}"
    Description: ${description || 'N/A'}
    Current Keywords: ${currentKeywords || 'None'}

    Provide: optimized title suggestions, meta description, primary and secondary keywords, tag suggestions, SEO score analysis, and actionable improvement tips for podcast discoverability.`;
    const result = await callOpenRouter(prompt, 'You are a podcast SEO specialist. Optimize podcast content for maximum discoverability across platforms.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';

    if (episode_id) {
      await pool.query(`UPDATE seo_optimizations SET keywords = $1, updated_at = NOW() WHERE episode_id = $2`, [content, episode_id]).catch(() => {});
    }
    await saveAiResult(req.user.id, 'optimize-seo', 'seo_optimizations', episode_id || null, content);

    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3-strategy JSON parser for AI responses
function parseAIJson(text) {
  // Strategy 1: direct parse
  try { return JSON.parse(text); } catch (e) {}
  // Strategy 2: strip markdown fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) { try { return JSON.parse(fenceMatch[1].trim()); } catch (e) {} }
  // Strategy 3: find first { to }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) { try { return JSON.parse(jsonMatch[0]); } catch (e) {} }
  return null;
}

// Guest outreach emailer
router.post('/guest-outreach', auth, aiRateLimiter, async (req, res) => {
  try {
    const { guestName, podcastTopic, hostInfo, podcastName } = req.body;
    if (!guestName || !podcastTopic) return res.status(400).json({ error: 'guestName and podcastTopic are required' });

    const prompt = `Write a personalized, professional outreach email to invite a guest onto a podcast.
Guest Name: ${guestName}
Podcast Topic: ${podcastTopic}
Podcast Name: ${podcastName || 'Our Podcast'}
Host Info: ${hostInfo || 'The host is an experienced podcaster'}

Return ONLY valid JSON in this exact format:
{"subject":"","body":"","follow_up_subject":"","follow_up_body":"","tips":["tip1"]}`;

    const result = await callOpenRouter(prompt, 'You are an expert podcast outreach specialist. Write compelling, personalized guest invitation emails that get responses. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);

    await saveAiResult(req.user.id, 'guest-outreach', null, null, content);
    res.json({ content, parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Episode title A/B generator - 5 variants with engagement score predictions
router.post('/title-variants', auth, aiRateLimiter, async (req, res) => {
  try {
    const { episodeTopic, targetAudience, keywords } = req.body;
    if (!episodeTopic) return res.status(400).json({ error: 'episodeTopic is required' });

    const prompt = `Generate 5 compelling podcast episode title variants for:
Topic: ${episodeTopic}
Target Audience: ${targetAudience || 'general audience'}
Keywords to include: ${keywords || 'none specified'}

Return ONLY valid JSON in this exact format:
{"variants":[{"title":"","style":"","engagement_score":0,"why_it_works":"","best_for":""}],"recommendation":""}`;

    const result = await callOpenRouter(prompt, 'You are a podcast title expert who creates scroll-stopping, SEO-optimized episode titles that drive clicks. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);

    await saveAiResult(req.user.id, 'title-variants', null, null, content);
    res.json({ content, parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Content calendar generator
router.post('/content-calendar', auth, aiRateLimiter, async (req, res) => {
  try {
    const { podcastNiche, publishingFrequency, dateRange, targetAudience } = req.body;
    if (!podcastNiche || !publishingFrequency) return res.status(400).json({ error: 'podcastNiche and publishingFrequency are required' });

    const prompt = `Create a structured editorial content calendar for a podcast:
Niche: ${podcastNiche}
Publishing Frequency: ${publishingFrequency}
Date Range: ${dateRange || 'next 3 months'}
Target Audience: ${targetAudience || 'general audience'}

Return ONLY valid JSON in this exact format:
{"calendar":[{"episode_number":1,"suggested_date":"","title":"","topic":"","episode_type":"solo|interview|panel","guest_type":"","key_talking_points":["point"],"content_pillars":["pillar"],"seo_keywords":["keyword"]}],"themes":["theme"],"content_mix":{"solo_percent":0,"interview_percent":0,"panel_percent":0}}`;

    const result = await callOpenRouter(prompt, 'You are a podcast content strategist who creates data-driven editorial calendars. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);

    await saveAiResult(req.user.id, 'content-calendar', null, null, content);
    res.json({ content, parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEO optimizer - structured JSON output
router.post('/seo-optimize', auth, aiRateLimiter, async (req, res) => {
  try {
    const { episodeTitle, description, currentKeywords } = req.body;
    if (!episodeTitle) return res.status(400).json({ error: 'episodeTitle is required' });

    const prompt = `SEO-optimize this podcast episode:
Title: "${episodeTitle}"
Description: ${description || 'N/A'}
Current Keywords: ${currentKeywords || 'none'}

Return ONLY valid JSON in this exact format:
{"optimized_title":"","optimized_description":"","primary_keywords":["kw"],"secondary_keywords":["kw"],"long_tail_keywords":["kw"],"tags":["tag"],"seo_score":0,"improvements":["improvement"],"meta_title":"","meta_description":""}`;

    const result = await callOpenRouter(prompt, 'You are a podcast SEO expert specializing in maximizing discoverability on Spotify, Apple Podcasts, and Google. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);

    await saveAiResult(req.user.id, 'seo-optimize', null, null, content);
    res.json({ content, parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/guest-fit-score - predict if a prospective guest will be a good fit for the show
router.post('/guest-fit-score', auth, aiRateLimiter, async (req, res) => {
  try {
    const { guestName, guestBio, guestExpertise, recentWork, showTopic, showAudience, hostStyle } = req.body;
    if (!guestName) return res.status(400).json({ error: 'guestName is required' });

    const prompt = `You are a podcast booking strategist. Score this prospective guest's fit and predict episode performance.

Guest: ${guestName}
Bio: ${guestBio || 'n/a'}
Expertise: ${guestExpertise || 'n/a'}
Recent work / public profile: ${recentWork || 'n/a'}
Show Topic: ${showTopic || 'n/a'}
Show Audience: ${showAudience || 'n/a'}
Host Style: ${hostStyle || 'n/a'}

Return ONLY valid JSON:
{
  "fit_score": 0,
  "audience_alignment": 0,
  "expected_engagement": "low|medium|high",
  "strengths": ["string"],
  "risks": ["string"],
  "topics_to_explore": ["string"],
  "topics_to_avoid": ["string"],
  "recommended_format": "interview|panel|deep_dive|short",
  "summary": "string"
}`;

    const result = await callOpenRouter(prompt, 'You are a podcast booking strategist. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);

    await saveAiResult(req.user.id, 'guest-fit-score', 'guests', null, content);
    res.json({ content, parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/episode-quality-score - rate an episode's production quality from transcript / show notes
router.post('/episode-quality-score', auth, aiRateLimiter, async (req, res) => {
  try {
    const { episode_id, transcript, showNotes, durationMinutes, listenerFeedback } = req.body;
    let txt = transcript;
    if (!txt && episode_id) {
      try {
        const t = await pool.query('SELECT content FROM transcripts WHERE episode_id = $1 ORDER BY created_at DESC LIMIT 1', [episode_id]);
        txt = t.rows[0]?.content || '';
      } catch (_) {}
    }
    if (!txt && !showNotes) return res.status(400).json({ error: 'Provide transcript or showNotes (or an episode_id with stored transcript)' });

    const truncated = (txt || '').slice(0, 8000);

    const prompt = `Rate this podcast episode's production quality.

Duration (min): ${durationMinutes || 'unknown'}
Show Notes: ${showNotes || 'n/a'}
Listener Feedback: ${listenerFeedback || 'n/a'}
Transcript (first 8k chars):
"""
${truncated}
"""

Return ONLY valid JSON:
{
  "overall_score": 0,
  "scores": {"narrative": 0, "audio_quality_inferred": 0, "engagement": 0, "structure": 0, "guest_chemistry": 0},
  "strengths": ["string"],
  "weaknesses": ["string"],
  "edit_recommendations": ["string"],
  "promotion_angles": ["string"],
  "summary": "string"
}`;

    const result = await callOpenRouter(prompt, 'You are a senior podcast producer. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);

    await saveAiResult(req.user.id, 'episode-quality-score', 'episodes', episode_id || null, content);
    res.json({ content, parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/audience-sentiment-analyze - analyze listener feedback for sentiment, themes, requests
router.post('/audience-sentiment-analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const { feedback, source, episode_id } = req.body;
    if (!feedback || (Array.isArray(feedback) && feedback.length === 0)) {
      return res.status(400).json({ error: 'feedback (string or array) is required' });
    }
    const items = Array.isArray(feedback) ? feedback : [feedback];

    const prompt = `Analyze these listener feedback items and surface sentiment, themes, and actionable requests.

Source: ${source || 'mixed'}
Items:
${items.map((it, i) => `${i + 1}. ${typeof it === 'string' ? it : JSON.stringify(it)}`).join('\n')}

Return ONLY valid JSON:
{
  "overall_sentiment": "negative|mixed|positive",
  "sentiment_score": 0,
  "themes": [{"theme": "string", "count": 0, "examples": ["string"]}],
  "complaints": [{"issue": "string", "frequency": 0, "severity": "low|med|high"}],
  "requests": [{"ask": "string", "frequency": 0}],
  "praise": [{"highlight": "string", "frequency": 0}],
  "recommended_actions": ["string"]
}`;

    const result = await callOpenRouter(prompt, 'You are an audience-research analyst for podcasts. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);

    await saveAiResult(req.user.id, 'audience-sentiment-analyze', 'episodes', episode_id || null, content);
    res.json({ content, parsed, items_analyzed: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to map AI_KEY_MISSING errors to 503 consistently.
function send503IfNoKey(err, res) {
  if (err && err.code === 'AI_KEY_MISSING') {
    res.status(503).json({ error: err.message });
    return true;
  }
  return false;
}

// POST /api/ai/episode-topic-cluster - cluster a list of episode topics/titles into themes
router.post('/episode-topic-cluster', auth, aiRateLimiter, async (req, res) => {
  try {
    let { topics, episodes_limit } = req.body || {};
    let items = Array.isArray(topics) ? topics.filter(Boolean) : [];
    // If topics not supplied, pull from user's recent episodes
    if (items.length === 0) {
      try {
        const limit = parseInt(episodes_limit) || 30;
        const r = await pool.query(
          'SELECT title FROM episodes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
          [req.user.id, limit]
        );
        items = r.rows.map(row => row.title).filter(Boolean);
      } catch (_) {}
    }
    if (items.length === 0) {
      return res.status(400).json({ error: 'Provide topics array or have existing episodes to cluster' });
    }

    const prompt = `Cluster the following podcast episode topics/titles into thematic groups. Identify content pillars and gaps.

Topics:
${items.map((t, i) => `${i + 1}. ${typeof t === 'string' ? t : JSON.stringify(t)}`).join('\n')}

Return ONLY valid JSON:
{
  "clusters": [{"theme": "string", "size": 0, "members": ["topic"], "audience_interest": "low|medium|high", "summary": "string"}],
  "content_pillars": ["pillar"],
  "gaps": [{"topic": "string", "why": "string", "priority": "low|medium|high"}],
  "next_episode_suggestions": ["suggestion"],
  "summary": "string"
}`;

    const result = await callOpenRouter(prompt, 'You are a podcast content strategist. Cluster topics, surface pillars and gaps. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);

    await saveAiResult(req.user.id, 'episode-topic-cluster', null, null, content);
    res.json({ content, parsed, items_analyzed: items.length });
  } catch (err) {
    if (send503IfNoKey(err, res)) return;
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/cross-promo-finder - find cross-promotion opportunities with similar shows
router.post('/cross-promo-finder', auth, aiRateLimiter, async (req, res) => {
  try {
    const { showName, niche, audienceSize, audienceProfile, goals } = req.body || {};
    if (!niche) return res.status(400).json({ error: 'niche is required' });

    const prompt = `You are a podcast cross-promotion strategist. Identify realistic cross-promo opportunities for this show.

Show: ${showName || 'n/a'}
Niche: ${niche}
Audience size (monthly listeners): ${audienceSize || 'unknown'}
Audience profile: ${audienceProfile || 'n/a'}
Goals: ${goals || 'grow listenership'}

Return ONLY valid JSON:
{
  "candidate_shows": [{"name": "string", "niche": "string", "audience_overlap": "low|medium|high", "fit_score": 0, "outreach_angle": "string"}],
  "swap_formats": [{"format": "host_swap|trailer_swap|guest_swap|joint_episode|newsletter_mention", "description": "string", "effort": "low|medium|high"}],
  "outreach_email_template": "string",
  "kpis_to_track": ["kpi"],
  "risks": ["risk"],
  "summary": "string"
}`;

    const result = await callOpenRouter(prompt, 'You are a podcast growth strategist focused on cross-promotion. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);

    await saveAiResult(req.user.id, 'cross-promo-finder', null, null, content);
    res.json({ content, parsed });
  } catch (err) {
    if (send503IfNoKey(err, res)) return;
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/listener-growth-strategy - structured 90-day growth plan
router.post('/listener-growth-strategy', auth, aiRateLimiter, async (req, res) => {
  try {
    const { showName, niche, currentDownloads, currentSubscribers, channels, budget, constraints } = req.body || {};
    if (!niche) return res.status(400).json({ error: 'niche is required' });

    const prompt = `You are a podcast growth coach. Build a 90-day listener-growth plan.

Show: ${showName || 'n/a'}
Niche: ${niche}
Current avg downloads/episode: ${currentDownloads || 'unknown'}
Current subscribers: ${currentSubscribers || 'unknown'}
Active channels: ${channels || 'unknown'}
Budget (USD/mo): ${budget || 'low'}
Constraints: ${constraints || 'n/a'}

Return ONLY valid JSON:
{
  "phases": [{"week_range": "1-2", "focus": "string", "tactics": [{"tactic": "string", "effort": "low|medium|high", "expected_impact": "low|medium|high", "owner": "host|producer|editor", "channel": "string"}]}],
  "kpis": [{"metric": "string", "baseline": "string", "target": "string"}],
  "experiments": [{"hypothesis": "string", "method": "string", "success_metric": "string"}],
  "anti_patterns": ["string"],
  "weekly_checklist": ["string"],
  "summary": "string"
}`;

    const result = await callOpenRouter(prompt, 'You are a podcast growth strategist. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);

    await saveAiResult(req.user.id, 'listener-growth-strategy', null, null, content);
    res.json({ content, parsed });
  } catch (err) {
    if (send503IfNoKey(err, res)) return;
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/multiplatform-publishing-prep - convert episode -> per-platform packages
router.post('/multiplatform-publishing-prep', auth, aiRateLimiter, async (req, res) => {
  try {
    const { episode_id, episodeTitle, summary, transcript, platforms } = req.body || {};
    let txt = transcript;
    if (!txt && episode_id) {
      try {
        const t = await pool.query('SELECT content FROM transcripts WHERE episode_id = $1 ORDER BY created_at DESC LIMIT 1', [episode_id]);
        txt = t.rows[0]?.content || '';
      } catch (_) {}
    }
    if (!episodeTitle && !txt && !summary) {
      return res.status(400).json({ error: 'Provide episodeTitle plus summary, transcript, or episode_id' });
    }
    const truncated = (txt || '').slice(0, 6000);
    const targetPlatforms = Array.isArray(platforms) && platforms.length ? platforms : ['youtube', 'blog', 'twitter', 'linkedin', 'instagram', 'newsletter'];

    const prompt = `Repurpose this podcast episode into platform-ready publishing packages.

Title: ${episodeTitle || 'Untitled'}
Summary: ${summary || 'n/a'}
Transcript (first 6k chars):
"""
${truncated}
"""

Target platforms: ${targetPlatforms.join(', ')}

Return ONLY valid JSON:
{
  "platforms": [{
    "platform": "youtube|blog|twitter|linkedin|instagram|newsletter|tiktok",
    "title": "string",
    "body": "string",
    "hashtags": ["string"],
    "thumbnail_brief": "string",
    "cta": "string",
    "best_post_time": "string",
    "compliance_notes": ["string"]
  }],
  "video_clip_briefs": [{"clip_title": "string", "approx_start": "mm:ss", "approx_end": "mm:ss", "hook": "string"}],
  "email_subject_lines": ["string"],
  "summary": "string"
}`;

    const result = await callOpenRouter(prompt, 'You are a multi-platform content repurposing specialist for podcasts. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);

    await saveAiResult(req.user.id, 'multiplatform-publishing-prep', 'episodes', episode_id || null, content);
    res.json({ content, parsed, platforms: targetPlatforms });
  } catch (err) {
    if (send503IfNoKey(err, res)) return;
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Apply pass 5 — additive AI endpoints (NEEDS-CREDS: OPENROUTER_API_KEY)
// All 503 via callOpenRouter -> AIKeyMissingError -> send503IfNoKey.
// ────────────────────────────────────────────────────────────────────────────

// POST /api/ai/sponsorship-pitch
// Drafts a sponsor pitch deck outline + ad-read script tailored to a sponsor brief.
router.post('/sponsorship-pitch', auth, aiRateLimiter, async (req, res) => {
  try {
    const { episode_id, podcastName, audienceProfile, sponsorBrief, adFormat } = req.body || {};
    if (!podcastName) return res.status(400).json({ error: 'podcastName required' });
    const prompt = `Draft a podcast sponsorship pitch and ad-read package.

Podcast: ${podcastName}
Audience profile: ${audienceProfile || 'unspecified'}
Sponsor brief: ${sponsorBrief || 'unspecified'}
Ad format: ${adFormat || 'mid-roll host-read 60s'}

Return ONLY valid JSON:
{
  "elevator_pitch": "string",
  "audience_value_props": ["string"],
  "package_tiers": [{ "tier": "string", "price_band": "string", "deliverables": ["string"] }],
  "ad_read_script_60s": "string",
  "cta_options": ["string"],
  "performance_metrics_promised": ["string"],
  "objection_handlers": [{ "objection": "string", "response": "string" }]
}`;
    const result = await callOpenRouter(prompt, 'You are a podcast monetization strategist. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);
    await saveAiResult(req.user.id, 'sponsorship-pitch', 'episodes', episode_id || null, content);
    res.json({ content, parsed });
  } catch (err) {
    if (send503IfNoKey(err, res)) return;
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/episode-pacing-review
// Reviews transcript / outline for pacing issues (cold open length, segment balance, hook density).
router.post('/episode-pacing-review', auth, aiRateLimiter, async (req, res) => {
  try {
    const { episode_id, transcript, outline } = req.body || {};
    let txt = transcript;
    if (!txt && episode_id) {
      try {
        const t = await pool.query('SELECT content FROM transcripts WHERE episode_id = $1 ORDER BY created_at DESC LIMIT 1', [episode_id]);
        txt = t.rows[0]?.content || '';
      } catch (_) {}
    }
    if (!txt && !outline) {
      return res.status(400).json({ error: 'Provide transcript, outline, or episode_id' });
    }
    const truncated = (txt || outline || '').slice(0, 7000);
    const prompt = `Review podcast episode pacing.

Source (first 7k chars):
"""
${truncated}
"""

Return ONLY valid JSON:
{
  "overall_pacing_score": 0,
  "cold_open_assessment": "string",
  "segment_balance": [{ "segment": "string", "duration_estimate_min": 0, "energy_rating": "low|medium|high" }],
  "drag_points": [{ "where": "string", "issue": "string", "fix": "string" }],
  "hook_density_per_10min": 0,
  "recommended_cuts": ["string"],
  "recommended_additions": ["string"]
}`;
    const result = await callOpenRouter(prompt, 'You are a podcast editor and pacing coach. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);
    await saveAiResult(req.user.id, 'episode-pacing-review', 'episodes', episode_id || null, content);
    res.json({ content, parsed });
  } catch (err) {
    if (send503IfNoKey(err, res)) return;
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/competitor-analysis
// Compares your show against competitor shows on key dimensions.
router.post('/competitor-analysis', auth, aiRateLimiter, async (req, res) => {
  try {
    const { yourShow, competitorShows, dimensions } = req.body || {};
    if (!yourShow || !Array.isArray(competitorShows) || competitorShows.length < 1) {
      return res.status(400).json({ error: 'yourShow and at least 1 competitorShows entry required' });
    }
    const dims = Array.isArray(dimensions) && dimensions.length ? dimensions : ['format', 'audience', 'frequency', 'production_quality', 'monetization', 'differentiation'];
    const prompt = `Compare these podcast shows.

Your show: ${typeof yourShow === 'string' ? yourShow : JSON.stringify(yourShow)}
Competitors: ${competitorShows.map((c, i) => `${i + 1}. ${typeof c === 'string' ? c : JSON.stringify(c)}`).join('\n')}
Dimensions: ${dims.join(', ')}

Return ONLY valid JSON:
{
  "comparison_matrix": [{ "dimension": "string", "your_show": "string", "competitor_summaries": [{ "name": "string", "summary": "string" }] }],
  "your_strengths": ["string"],
  "your_gaps": ["string"],
  "white_space_opportunities": ["string"],
  "differentiation_play": "string",
  "next_quarter_actions": ["string"]
}`;
    const result = await callOpenRouter(prompt, 'You are a podcast market analyst. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);
    await saveAiResult(req.user.id, 'competitor-analysis', null, null, content);
    res.json({ content, parsed });
  } catch (err) {
    if (send503IfNoKey(err, res)) return;
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/episode-followup-email
// Drafts a follow-up email to the guest after the episode airs.
router.post('/episode-followup-email', auth, aiRateLimiter, async (req, res) => {
  try {
    const { episode_id, guestName, episodeTitle, airDate, listenerCount, highlights, tone } = req.body || {};
    if (!guestName || !episodeTitle) {
      return res.status(400).json({ error: 'guestName and episodeTitle required' });
    }
    const prompt = `Draft a guest follow-up email for a published podcast episode.

Guest: ${guestName}
Episode title: ${episodeTitle}
Air date: ${airDate || 'recently'}
Listener count: ${listenerCount || 'unspecified'}
Highlights: ${Array.isArray(highlights) ? highlights.join('; ') : (highlights || 'unspecified')}
Tone: ${tone || 'warm and professional'}

Return ONLY valid JSON:
{
  "subject_options": ["string"],
  "email_body": "string",
  "ask_for": ["string"],
  "share_assets_attached": ["string"],
  "social_share_blurbs": [{ "platform": "string", "blurb": "string" }],
  "follow_up_ladder": [{ "delay_days": 0, "purpose": "string", "summary": "string" }]
}`;
    const result = await callOpenRouter(prompt, 'You are a podcast guest-relations specialist. Always respond with valid JSON only.');
    const content = result.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(content);
    await saveAiResult(req.user.id, 'episode-followup-email', 'episodes', episode_id || null, content);
    res.json({ content, parsed });
  } catch (err) {
    if (send503IfNoKey(err, res)) return;
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/history - paginated AI history for logged-in user
router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM ai_results WHERE user_id = $1`,
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM ai_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.json({
      results: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
