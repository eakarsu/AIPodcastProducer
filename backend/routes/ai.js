const router = require('express').Router();
const https = require('https');
const auth = require('../middleware/auth');

function callOpenRouter(prompt, systemPrompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
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

// Generate podcast script
router.post('/generate-script', auth, async (req, res) => {
  try {
    const { topic, duration, tone, guestName } = req.body;
    const prompt = `Create a detailed podcast script about "${topic}". Duration: ${duration || '30 minutes'}. Tone: ${tone || 'conversational'}. ${guestName ? `Guest: ${guestName}` : 'Solo episode'}. Include an engaging intro, main talking points with transitions, audience engagement moments, and a compelling outro.`;
    const result = await callOpenRouter(prompt, 'You are an expert podcast script writer. Create engaging, well-structured podcast scripts that captivate listeners.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';
    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Research guest
router.post('/research-guest', auth, async (req, res) => {
  try {
    const { guestName, expertise, company } = req.body;
    const prompt = `Research and compile a comprehensive guest profile for podcast preparation:
    Guest: ${guestName}
    Expertise: ${expertise || 'Not specified'}
    Company: ${company || 'Not specified'}

    Include: background summary, key achievements, interesting talking points, potential controversial topics to avoid, suggested conversation starters, and fun facts.`;
    const result = await callOpenRouter(prompt, 'You are a podcast research assistant. Compile detailed guest profiles to help podcast hosts prepare for engaging interviews.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';
    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Suggest topics
router.post('/suggest-topics', auth, async (req, res) => {
  try {
    const { category, audience, count } = req.body;
    const prompt = `Suggest ${count || 10} trending and engaging podcast topics for the category: "${category || 'Technology'}". Target audience: ${audience || 'general'}. For each topic include: title, brief description, why it's trending, potential guest types, and estimated listener appeal (1-10).`;
    const result = await callOpenRouter(prompt, 'You are a podcast content strategist. Suggest trending, engaging topics that will attract and retain listeners.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';
    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate show notes
router.post('/generate-show-notes', auth, async (req, res) => {
  try {
    const { episodeTitle, description, guestName, keyTopics } = req.body;
    const prompt = `Generate comprehensive show notes for the podcast episode:
    Title: "${episodeTitle}"
    Description: ${description || 'N/A'}
    Guest: ${guestName || 'Solo episode'}
    Key Topics: ${keyTopics || 'N/A'}

    Include: episode summary, timestamps/chapters, key takeaways, mentioned resources/links, guest bio, related episodes suggestions, and call-to-action.`;
    const result = await callOpenRouter(prompt, 'You are a podcast show notes expert. Create detailed, SEO-friendly show notes that help listeners and boost discoverability.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';
    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate intro/outro
router.post('/generate-intro-outro', auth, async (req, res) => {
  try {
    const { episodeTitle, type, tone, podcastName } = req.body;
    const prompt = `Generate a ${type || 'both intro and outro'} for the podcast episode:
    Podcast: "${podcastName || 'The Podcast'}"
    Episode: "${episodeTitle}"
    Tone: ${tone || 'professional and engaging'}

    The ${type || 'intro'} should hook listeners immediately. Include sponsor mention placeholder, social media call-to-action, and make it memorable.`;
    const result = await callOpenRouter(prompt, 'You are a podcast intro/outro specialist. Create compelling openings and closings that brand the podcast and engage listeners.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';
    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate interview questions
router.post('/generate-questions', auth, async (req, res) => {
  try {
    const { guestName, expertise, topic, questionCount } = req.body;
    const prompt = `Generate ${questionCount || 15} interview questions for a podcast episode:
    Guest: ${guestName || 'General'}
    Expertise: ${expertise || 'N/A'}
    Topic: ${topic || 'General discussion'}

    Mix of: icebreakers, deep-dive questions, audience-submitted style questions, rapid-fire questions, and closing questions. Include follow-up prompts for each question.`;
    const result = await callOpenRouter(prompt, 'You are a podcast interview coach. Create thought-provoking questions that lead to authentic, engaging conversations.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';
    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate transcript
router.post('/generate-transcript', auth, async (req, res) => {
  try {
    const { episodeTitle, script, notes } = req.body;
    const prompt = `Based on the following podcast episode details, generate a polished transcript:
    Episode: "${episodeTitle}"
    ${script ? `Script outline: ${script}` : ''}
    ${notes ? `Notes: ${notes}` : ''}

    Format as a professional transcript with speaker labels, timestamps, and proper formatting. Include [MUSIC], [PAUSE], and other audio cues.`;
    const result = await callOpenRouter(prompt, 'You are a podcast transcription expert. Create clean, well-formatted transcripts that are accessible and SEO-friendly.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';
    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate social media posts
router.post('/generate-social-post', auth, async (req, res) => {
  try {
    const { episodeTitle, platform, keyPoints, tone } = req.body;
    const prompt = `Create engaging social media content for the podcast episode:
    Episode: "${episodeTitle}"
    Platform: ${platform || 'Twitter, LinkedIn, Instagram'}
    Key Points: ${keyPoints || 'N/A'}
    Tone: ${tone || 'engaging and shareable'}

    Generate platform-specific posts with relevant hashtags, emojis, and calls-to-action. Include a thread/carousel option for longer content.`;
    const result = await callOpenRouter(prompt, 'You are a social media marketing expert for podcasts. Create viral, engaging content that drives listeners to episodes.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';
    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEO optimization
router.post('/optimize-seo', auth, async (req, res) => {
  try {
    const { episodeTitle, description, currentKeywords } = req.body;
    const prompt = `Optimize the SEO for this podcast episode:
    Title: "${episodeTitle}"
    Description: ${description || 'N/A'}
    Current Keywords: ${currentKeywords || 'None'}

    Provide: optimized title suggestions, meta description, primary and secondary keywords, tag suggestions, SEO score analysis, and actionable improvement tips for podcast discoverability.`;
    const result = await callOpenRouter(prompt, 'You are a podcast SEO specialist. Optimize podcast content for maximum discoverability across platforms.');
    const content = result.choices?.[0]?.message?.content || 'No content generated';
    res.json({ content, model: result.model, usage: result.usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
