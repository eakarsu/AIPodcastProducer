require('dotenv').config({ path: '../../.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ai_podcast_producer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  console.log('🎙️ Seeding AI Podcast Producer database...');

  // Create tables
  await pool.query(`
    DROP TABLE IF EXISTS seo_optimizations CASCADE;
    DROP TABLE IF EXISTS social_posts CASCADE;
    DROP TABLE IF EXISTS transcripts CASCADE;
    DROP TABLE IF EXISTS episode_templates CASCADE;
    DROP TABLE IF EXISTS distribution_channels CASCADE;
    DROP TABLE IF EXISTS analytics CASCADE;
    DROP TABLE IF EXISTS content_calendar CASCADE;
    DROP TABLE IF EXISTS interview_questions CASCADE;
    DROP TABLE IF EXISTS intros_outros CASCADE;
    DROP TABLE IF EXISTS show_notes CASCADE;
    DROP TABLE IF EXISTS topics CASCADE;
    DROP TABLE IF EXISTS scripts CASCADE;
    DROP TABLE IF EXISTS guests CASCADE;
    DROP TABLE IF EXISTS episodes CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE episodes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'draft',
      duration VARCHAR(50),
      publish_date DATE,
      guest_name VARCHAR(255),
      category VARCHAR(100),
      tags TEXT,
      audio_url VARCHAR(500),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE guests (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      bio TEXT,
      expertise VARCHAR(255),
      company VARCHAR(255),
      social_links TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      notes TEXT,
      episode_count INTEGER DEFAULT 0,
      rating DECIMAL(3,1),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE scripts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      content TEXT,
      episode_id INTEGER,
      type VARCHAR(50) DEFAULT 'full',
      status VARCHAR(50) DEFAULT 'draft',
      word_count INTEGER,
      duration_estimate VARCHAR(50),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE topics (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      trending_score DECIMAL(3,1),
      source VARCHAR(255),
      status VARCHAR(50) DEFAULT 'suggested',
      target_audience VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE show_notes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      content TEXT,
      episode_id INTEGER,
      key_points TEXT,
      resources TEXT,
      timestamps TEXT,
      status VARCHAR(50) DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE intros_outros (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      content TEXT,
      type VARCHAR(50) DEFAULT 'intro',
      tone VARCHAR(100),
      duration_estimate VARCHAR(50),
      episode_id INTEGER,
      status VARCHAR(50) DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE interview_questions (
      id SERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      category VARCHAR(100),
      difficulty VARCHAR(50),
      guest_id INTEGER,
      episode_id INTEGER,
      follow_up TEXT,
      notes TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE content_calendar (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      scheduled_date DATE,
      episode_id INTEGER,
      status VARCHAR(50) DEFAULT 'scheduled',
      type VARCHAR(100),
      assignee VARCHAR(255),
      priority VARCHAR(50) DEFAULT 'medium',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE analytics (
      id SERIAL PRIMARY KEY,
      episode_id INTEGER,
      metric_name VARCHAR(255) NOT NULL,
      metric_value DECIMAL(15,2),
      period VARCHAR(50),
      platform VARCHAR(100),
      notes TEXT,
      category VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE distribution_channels (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      platform VARCHAR(100),
      url VARCHAR(500),
      api_key VARCHAR(500),
      status VARCHAR(50) DEFAULT 'active',
      subscriber_count INTEGER DEFAULT 0,
      notes TEXT,
      category VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE episode_templates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      structure TEXT,
      duration VARCHAR(50),
      category VARCHAR(100),
      tags TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE transcripts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      content TEXT,
      episode_id INTEGER,
      word_count INTEGER,
      language VARCHAR(50) DEFAULT 'English',
      status VARCHAR(50) DEFAULT 'draft',
      accuracy DECIMAL(5,2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE social_posts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      content TEXT,
      platform VARCHAR(100),
      episode_id INTEGER,
      scheduled_date TIMESTAMP,
      status VARCHAR(50) DEFAULT 'draft',
      engagement_score DECIMAL(5,2),
      hashtags TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE seo_optimizations (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      keywords TEXT,
      meta_description TEXT,
      episode_id INTEGER,
      score DECIMAL(5,2),
      suggestions TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Seed user
  const hashedPassword = await bcrypt.hash('password123', 10);
  await pool.query(
    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3)',
    ['admin@podcastpro.com', hashedPassword, 'Admin User']
  );

  // Seed Episodes (15+)
  const episodes = [
    ['The Future of AI in Creative Industries', 'Exploring how AI is transforming creative work', 'published', '45 min', '2024-01-15', 'Dr. Sarah Chen', 'Technology', 'AI, creativity, future'],
    ['Building a Million-Dollar Podcast', 'Secrets from top podcasters on monetization', 'published', '38 min', '2024-01-22', 'Mike Johnson', 'Business', 'monetization, growth'],
    ['Mental Health in the Digital Age', 'Understanding digital wellness and mental health', 'published', '52 min', '2024-02-01', 'Dr. Emily Roberts', 'Health', 'mental health, wellness'],
    ['Startup Funding Decoded', 'A guide to raising capital for your startup', 'published', '41 min', '2024-02-08', 'Alex Rivera', 'Business', 'startup, funding, VC'],
    ['The Science of Sleep', 'Latest research on sleep and productivity', 'published', '35 min', '2024-02-15', 'Dr. James Miller', 'Science', 'sleep, health, productivity'],
    ['Web3 and the Creator Economy', 'How blockchain is empowering creators', 'draft', '44 min', '2024-03-01', 'Priya Sharma', 'Technology', 'web3, blockchain, creator'],
    ['Sustainable Living Guide', 'Practical tips for eco-friendly living', 'recording', '33 min', '2024-03-08', 'Green Team Panel', 'Lifestyle', 'sustainability, environment'],
    ['The Art of Storytelling', 'Master the craft of compelling narratives', 'editing', '47 min', '2024-03-15', 'Maya Angelou Jr.', 'Arts', 'storytelling, writing'],
    ['Cryptocurrency Deep Dive', 'Understanding crypto markets in 2024', 'draft', '50 min', '2024-03-22', 'Bitcoin Bob', 'Finance', 'crypto, bitcoin, investing'],
    ['Remote Work Revolution', 'The future of distributed teams', 'published', '36 min', '2024-04-01', 'Lisa Park', 'Business', 'remote work, culture'],
    ['Quantum Computing Explained', 'Breaking down quantum for everyone', 'scheduled', '42 min', '2024-04-08', 'Dr. Quantum', 'Science', 'quantum, computing'],
    ['The Podcast Growth Playbook', 'Strategies to grow your audience', 'draft', '39 min', '2024-04-15', 'Growth Guru', 'Marketing', 'growth, audience'],
    ['AI Ethics and Society', 'Navigating ethical AI development', 'editing', '48 min', '2024-04-22', 'Prof. Ethics', 'Technology', 'AI, ethics'],
    ['Music Production with AI', 'AI tools for music creators', 'draft', '34 min', '2024-05-01', 'DJ Neural', 'Music', 'AI, music, production'],
    ['Leadership in Crisis', 'Leading teams through uncertainty', 'published', '43 min', '2024-05-08', 'General Manager', 'Leadership', 'leadership, crisis'],
    ['The Nutrition Myth Busters', 'Debunking popular diet myths', 'scheduled', '37 min', '2024-05-15', 'Dr. Nutrition', 'Health', 'nutrition, diet, health'],
  ];
  for (const ep of episodes) {
    await pool.query(
      'INSERT INTO episodes (title, description, status, duration, publish_date, guest_name, category, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      ep
    );
  }

  // Seed Guests (15+)
  const guests = [
    ['Dr. Sarah Chen', 'sarah@ai-lab.com', 'AI researcher and author of "Creative Machines"', 'Artificial Intelligence', 'AI Labs Inc.', '@sarahchen', 'confirmed', 'Excellent speaker', 3, 4.8],
    ['Mike Johnson', 'mike@podcastmasters.com', 'Founder of PodcastMasters, 10M+ downloads', 'Podcast Growth', 'PodcastMasters', '@mikepod', 'confirmed', 'High energy', 5, 4.9],
    ['Dr. Emily Roberts', 'emily@mindwell.org', 'Clinical psychologist specializing in digital wellness', 'Mental Health', 'MindWell Clinic', '@dremily', 'confirmed', 'Very insightful', 2, 4.7],
    ['Alex Rivera', 'alex@venturefund.com', 'Managing Partner at Venture Fund Capital', 'Venture Capital', 'Venture Fund Capital', '@alexvc', 'pending', 'Great network', 1, 4.5],
    ['Dr. James Miller', 'james@sleeplab.edu', 'Sleep researcher at Stanford', 'Sleep Science', 'Stanford University', '@drjames', 'confirmed', 'Data-driven', 2, 4.6],
    ['Priya Sharma', 'priya@web3studio.io', 'Web3 developer and creator economy advocate', 'Blockchain', 'Web3 Studio', '@priyaweb3', 'pending', 'Innovative thinker', 1, 4.4],
    ['Lisa Park', 'lisa@remotefirst.co', 'CEO of RemoteFirst, remote work evangelist', 'Remote Work', 'RemoteFirst', '@lisaremote', 'confirmed', 'Great insights', 3, 4.8],
    ['DJ Neural', 'dj@neuralbeats.com', 'AI music producer with 5 albums', 'AI Music', 'Neural Beats Records', '@djneural', 'pending', 'Creative genius', 0, 4.3],
    ['Prof. Ethics', 'ethics@mit.edu', 'MIT professor of AI Ethics', 'AI Ethics', 'MIT', '@profethics', 'confirmed', 'Thought leader', 2, 4.9],
    ['Green Team', 'team@greenearth.org', 'Environmental advocacy group', 'Sustainability', 'Green Earth Foundation', '@greenteam', 'confirmed', 'Panel format', 1, 4.5],
    ['Maya Angelou Jr.', 'maya@storycraft.com', 'Author and storytelling coach', 'Storytelling', 'StoryCraft Academy', '@mayastory', 'pending', 'Compelling speaker', 1, 4.7],
    ['Bitcoin Bob', 'bob@cryptoinsights.com', 'Crypto analyst and investor', 'Cryptocurrency', 'Crypto Insights', '@bitcoinbob', 'declined', 'Controversial', 0, 3.8],
    ['Dr. Quantum', 'quantum@caltech.edu', 'Quantum physicist at Caltech', 'Quantum Computing', 'Caltech', '@drquantum', 'confirmed', 'Brilliant mind', 1, 4.9],
    ['Growth Guru', 'guru@growthlab.io', 'Digital marketing strategist', 'Marketing', 'Growth Lab', '@growthguru', 'pending', 'Results-oriented', 0, 4.2],
    ['General Manager', 'gm@leadright.com', 'Fortune 500 executive and leadership coach', 'Leadership', 'LeadRight Consulting', '@gmlead', 'confirmed', 'Inspiring', 2, 4.6],
    ['Dr. Nutrition', 'dr@nutritionscience.com', 'Registered dietitian and researcher', 'Nutrition', 'NutritionScience Lab', '@drnutrition', 'confirmed', 'Evidence-based', 1, 4.5],
  ];
  for (const g of guests) {
    await pool.query(
      'INSERT INTO guests (name, email, bio, expertise, company, social_links, status, notes, episode_count, rating) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      g
    );
  }

  // Seed Scripts (15+)
  const scripts = [
    ['AI Creative Industries Script', 'Welcome to the show! Today we explore how AI is revolutionizing creative industries...', 1, 'full', 'completed', 4500, '45 min', 'Final version'],
    ['Podcast Monetization Script', 'Hey everyone! Ready to learn how to make money from your podcast?...', 2, 'full', 'completed', 3800, '38 min', 'Includes ad reads'],
    ['Mental Health Digital Age Outline', 'Topic: Digital wellness\n1. Introduction to digital fatigue\n2. Signs of digital overload...', 3, 'outline', 'completed', 1200, '52 min', 'Outline format'],
    ['Startup Funding Script', 'Welcome back listeners! Today we are decoding the world of startup funding...', 4, 'full', 'draft', 4100, '41 min', 'Need review'],
    ['Sleep Science Talking Points', 'Key points:\n- Circadian rhythm basics\n- Sleep hygiene tips\n- Latest research findings...', 5, 'talking_points', 'completed', 800, '35 min', 'Bullet points'],
    ['Web3 Creator Script', 'Introduction to Web3 and why creators should care...', 6, 'full', 'draft', 4400, '44 min', 'Draft v1'],
    ['Sustainable Living Script', 'Going green doesn t have to be hard. Let s talk practical sustainability...', 7, 'full', 'draft', 3300, '33 min', 'Needs more examples'],
    ['Storytelling Masterclass', 'The art of storytelling goes back thousands of years...', 8, 'full', 'editing', 4700, '47 min', 'Rich content'],
    ['Crypto Deep Dive Notes', 'Market analysis, key trends, regulation updates...', 9, 'outline', 'draft', 2000, '50 min', 'Needs fact-checking'],
    ['Remote Work Script', 'The office is dead, long live the home office! Or is it?...', 10, 'full', 'completed', 3600, '36 min', 'Published version'],
    ['Quantum Computing Intro', 'Imagine a computer that can solve in seconds what takes years...', 11, 'full', 'draft', 4200, '42 min', 'Simplify jargon'],
    ['Growth Playbook Script', 'Want to grow your podcast? Here are proven strategies...', 12, 'full', 'draft', 3900, '39 min', 'Add case studies'],
    ['AI Ethics Discussion', 'As AI becomes more powerful, who decides what is right?...', 13, 'full', 'editing', 4800, '48 min', 'Sensitive topic'],
    ['AI Music Production', 'Can AI create music that moves the soul?...', 14, 'full', 'draft', 3400, '34 min', 'Include demos'],
    ['Leadership Crisis Guide', 'When everything falls apart, true leaders emerge...', 15, 'full', 'completed', 4300, '43 min', 'Strong narrative'],
  ];
  for (const s of scripts) {
    await pool.query(
      'INSERT INTO scripts (title, content, episode_id, type, status, word_count, duration_estimate, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      s
    );
  }

  // Seed Topics (15+)
  const topics = [
    ['The Rise of AI Agents', 'How autonomous AI agents are changing work', 'Technology', 9.5, 'TechCrunch', 'approved', 'Tech enthusiasts', 'Hot topic'],
    ['Solo Entrepreneurship', 'Building a business of one with AI tools', 'Business', 8.8, 'Forbes', 'approved', 'Entrepreneurs', 'Growing trend'],
    ['Climate Tech Innovation', 'Startups solving climate change', 'Science', 9.2, 'Nature', 'approved', 'Eco-conscious', 'Urgent topic'],
    ['Gen Z Work Culture', 'How Gen Z is reshaping the workplace', 'Culture', 8.5, 'HBR', 'suggested', 'Young professionals', 'Relatable'],
    ['Longevity Science', 'Can we live to 150?', 'Health', 9.0, 'Wired', 'approved', 'Health-conscious', 'Fascinating'],
    ['Space Commercialization', 'The business of going to space', 'Science', 8.7, 'SpaceNews', 'suggested', 'Space enthusiasts', 'Exciting'],
    ['Digital Nomad Economy', 'Working from anywhere in the world', 'Lifestyle', 8.3, 'Nomad List', 'approved', 'Remote workers', 'Popular'],
    ['Cybersecurity for Everyone', 'Protecting yourself online in 2024', 'Technology', 9.1, 'SecurityWeek', 'approved', 'General audience', 'Essential'],
    ['The Attention Economy', 'Fighting for focus in a distracted world', 'Psychology', 8.6, 'Psychology Today', 'suggested', 'Everyone', 'Thought-provoking'],
    ['Plant-Based Revolution', 'The future of food technology', 'Health', 8.4, 'Food Tech News', 'approved', 'Health-conscious', 'Growing market'],
    ['Creator Economy 2.0', 'Beyond influencers: building real businesses', 'Business', 9.3, 'Creator Economy', 'approved', 'Creators', 'Evolving space'],
    ['Neuroscience of Habits', 'Why we do what we do', 'Science', 8.9, 'Scientific American', 'suggested', 'Self-improvement', 'Practical'],
    ['The Future of Education', 'AI tutors and personalized learning', 'Education', 9.0, 'EdTech Magazine', 'approved', 'Parents, educators', 'Transformative'],
    ['Emotional Intelligence at Work', 'The soft skill that makes hard differences', 'Business', 8.2, 'HBR', 'suggested', 'Professionals', 'Evergreen'],
    ['The Metaverse Reality Check', 'Where are we really with VR/AR?', 'Technology', 7.8, 'The Verge', 'approved', 'Tech fans', 'Reality vs hype'],
    ['Financial Freedom Blueprint', 'Steps to achieve financial independence', 'Finance', 9.1, 'FIRE Community', 'approved', 'Young adults', 'High demand'],
  ];
  for (const t of topics) {
    await pool.query(
      'INSERT INTO topics (title, description, category, trending_score, source, status, target_audience, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      t
    );
  }

  // Seed Show Notes (15+)
  const showNotes = [
    ['EP001 - AI Creative Industries', 'Comprehensive notes on AI in creative work', 1, 'AI art tools, generative music, automated design', 'OpenAI.com, Midjourney.com', '00:00 Intro, 05:00 AI Art, 20:00 Music AI', 'published'],
    ['EP002 - Podcast Monetization', 'Notes on making money from podcasting', 2, 'Sponsorships, courses, merchandise', 'Patreon.com, Gumroad.com', '00:00 Intro, 10:00 Sponsors, 25:00 Products', 'published'],
    ['EP003 - Digital Mental Health', 'Notes on mental wellness in tech', 3, 'Screen time limits, digital detox, mindfulness apps', 'Headspace.com, Calm.com', '00:00 Intro, 08:00 Screen Time, 30:00 Tips', 'published'],
    ['EP004 - Startup Funding', 'Notes on raising capital', 4, 'Pitch deck tips, VC meetings, term sheets', 'YCombinator.com, AngelList.com', '00:00 Intro, 05:00 Pitch Deck, 20:00 VC Tips', 'draft'],
    ['EP005 - Sleep Science', 'Notes on sleep research', 5, 'Sleep cycles, melatonin, sleep hygiene', 'SleepFoundation.org', '00:00 Intro, 05:00 Cycles, 15:00 Tips', 'published'],
    ['EP006 - Web3 Creators', 'Notes on blockchain for creators', 6, 'NFTs, DAOs, creator tokens', 'Ethereum.org, Mirror.xyz', '00:00 Intro, 10:00 NFTs, 25:00 DAOs', 'draft'],
    ['EP007 - Sustainable Living', 'Notes on eco-friendly lifestyle', 7, 'Zero waste, renewable energy, composting', 'EPA.gov, GreenLiving.com', '00:00 Intro, 05:00 Zero Waste, 20:00 Energy', 'draft'],
    ['EP008 - Storytelling Craft', 'Notes on narrative techniques', 8, 'Story structure, character development, hooks', 'MasterClass.com', '00:00 Intro, 08:00 Structure, 30:00 Practice', 'draft'],
    ['EP009 - Crypto Markets', 'Notes on cryptocurrency', 9, 'Bitcoin trends, altcoins, DeFi', 'CoinMarketCap.com', '00:00 Intro, 05:00 Bitcoin, 25:00 DeFi', 'draft'],
    ['EP010 - Remote Work', 'Notes on distributed teams', 10, 'Communication tools, culture building, async work', 'RemoteFirst.co, Notion.so', '00:00 Intro, 10:00 Tools, 20:00 Culture', 'published'],
    ['EP011 - Quantum Computing', 'Notes on quantum technology', 11, 'Qubits, quantum supremacy, applications', 'IBM Quantum, Google AI', '00:00 Intro, 05:00 Basics, 25:00 Future', 'draft'],
    ['EP012 - Podcast Growth', 'Notes on audience building', 12, 'SEO, cross-promotion, social media', 'Chartable.com, Podchaser.com', '00:00 Intro, 05:00 SEO, 20:00 Social', 'draft'],
    ['EP013 - AI Ethics', 'Notes on ethical AI', 13, 'Bias, transparency, regulation', 'AI Ethics Board, IEEE', '00:00 Intro, 10:00 Bias, 30:00 Policy', 'draft'],
    ['EP014 - AI Music', 'Notes on AI in music production', 14, 'AI composition, vocal synthesis, mastering', 'AIVA.ai, Amper.com', '00:00 Intro, 05:00 Composition, 20:00 Tools', 'draft'],
    ['EP015 - Crisis Leadership', 'Notes on leading through difficulty', 15, 'Communication, decision-making, resilience', 'HBR.org, LeadRight.com', '00:00 Intro, 08:00 Communication, 25:00 Resilience', 'published'],
  ];
  for (const sn of showNotes) {
    await pool.query(
      'INSERT INTO show_notes (title, content, episode_id, key_points, resources, timestamps, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      sn
    );
  }

  // Seed Intros/Outros (15+)
  const intros = [
    ['AI Episode Intro', 'Welcome to TechTalk Podcast! I am your host and today we are diving deep into the world of AI...', 'intro', 'energetic', '30 sec', 1, 'active'],
    ['AI Episode Outro', 'Thank you for listening! Don t forget to subscribe, rate, and review...', 'outro', 'warm', '25 sec', 1, 'active'],
    ['Business Episode Intro', 'Money talks! And today on the Business Hour, we are talking big money...', 'intro', 'professional', '35 sec', 2, 'active'],
    ['Business Episode Outro', 'That s a wrap on another episode of Business Hour. Share this with someone who needs it...', 'outro', 'motivational', '20 sec', 2, 'active'],
    ['Health Episode Intro', 'Your health is your wealth. Welcome to WellBeing Podcast...', 'intro', 'calm', '30 sec', 3, 'active'],
    ['Health Episode Outro', 'Remember, take care of your mind and body. See you next week...', 'outro', 'soothing', '20 sec', 3, 'active'],
    ['Startup Intro', 'From garage to greatness - this is the Startup Stories podcast...', 'intro', 'inspiring', '25 sec', 4, 'active'],
    ['Science Intro', 'Curiosity killed the cat? Not here! Welcome to Science Unplugged...', 'intro', 'curious', '30 sec', 5, 'active'],
    ['Web3 Intro', 'The future is decentralized. Welcome to the Web3 Wave...', 'intro', 'futuristic', '25 sec', 6, 'draft'],
    ['Sustainability Intro', 'One planet. One chance. Welcome to Green Future Podcast...', 'intro', 'passionate', '30 sec', 7, 'draft'],
    ['Arts Intro', 'Where creativity meets conversation. Welcome to The Canvas...', 'intro', 'artistic', '25 sec', 8, 'draft'],
    ['Finance Intro', 'Let s talk money, markets, and making it work. This is Money Matters...', 'intro', 'confident', '30 sec', 9, 'draft'],
    ['Remote Work Intro', 'Home is where the work is! Welcome to Distributed...', 'intro', 'casual', '25 sec', 10, 'active'],
    ['Leadership Intro', 'Leaders aren t born, they re made. Welcome to Lead Forward...', 'intro', 'authoritative', '30 sec', 15, 'active'],
    ['General Outro Template', 'Thanks for tuning in! Follow us everywhere at @PodcastPro...', 'outro', 'friendly', '20 sec', null, 'active'],
    ['Sponsor Read Template', 'This episode is brought to you by [SPONSOR]. Use code PODCAST for 20% off...', 'intro', 'professional', '15 sec', null, 'active'],
  ];
  for (const i of intros) {
    await pool.query(
      'INSERT INTO intros_outros (title, content, type, tone, duration_estimate, episode_id, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      i
    );
  }

  // Seed Interview Questions (15+)
  const questions = [
    ['What inspired you to start working in AI?', 'Background', 'Easy', 1, 1, 'How did your early experiences shape your perspective?', 'Great opener', 'active'],
    ['How do you see AI impacting creative jobs in the next 5 years?', 'Future', 'Medium', 1, 1, 'Are there any jobs that AI cannot replace?', 'Key question', 'active'],
    ['What is your biggest failure and what did you learn from it?', 'Personal', 'Hard', null, null, 'How did that change your approach?', 'Emotional depth', 'active'],
    ['How did you grow your podcast to 10M downloads?', 'Growth', 'Medium', 2, 2, 'What was the turning point?', 'Data-driven', 'active'],
    ['What is your daily routine for podcast production?', 'Process', 'Easy', 2, 2, 'How has it evolved over time?', 'Practical tips', 'active'],
    ['How does social media affect mental health?', 'Core Topic', 'Medium', 3, 3, 'What strategies do you recommend?', 'Sensitive topic', 'active'],
    ['What metrics should startups track before raising funds?', 'Business', 'Medium', 4, 4, 'How do you build a compelling narrative?', 'Data focus', 'active'],
    ['What is the most surprising sleep fact you have discovered?', 'Science', 'Easy', 5, 5, 'How can listeners apply this tonight?', 'Actionable', 'active'],
    ['Is Web3 really the future or just hype?', 'Debate', 'Hard', 6, 6, 'What would change your mind?', 'Provocative', 'active'],
    ['What is one thing every household can do to be more sustainable?', 'Practical', 'Easy', null, 7, 'What are the barriers to adoption?', 'Accessible', 'active'],
    ['What makes a story truly unforgettable?', 'Craft', 'Medium', null, 8, 'Can you give us an example?', 'Creative', 'active'],
    ['Where do you see Bitcoin in 2030?', 'Prediction', 'Hard', null, 9, 'What are the biggest risks?', 'Controversial', 'active'],
    ['How do you maintain team culture remotely?', 'Culture', 'Medium', null, 10, 'What tools do you use?', 'Practical', 'active'],
    ['Can quantum computing break encryption?', 'Security', 'Hard', null, 11, 'What are we doing to prepare?', 'Technical', 'active'],
    ['What is your number one tip for new podcasters?', 'Advice', 'Easy', null, 12, 'What mistake should they avoid?', 'Encouraging', 'active'],
    ['Should AI have rights?', 'Philosophy', 'Hard', null, 13, 'Where do you draw the line?', 'Deep thinking', 'active'],
  ];
  for (const q of questions) {
    await pool.query(
      'INSERT INTO interview_questions (question, category, difficulty, guest_id, episode_id, follow_up, notes, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      q
    );
  }

  // Seed Content Calendar (15+)
  const calendar = [
    ['Record AI Episode', '2024-01-10', 1, 'completed', 'Recording', 'Host', 'high', 'Studio A booked'],
    ['Edit AI Episode', '2024-01-12', 1, 'completed', 'Editing', 'Editor', 'high', 'Add music bed'],
    ['Publish AI Episode', '2024-01-15', 1, 'completed', 'Publishing', 'Producer', 'high', 'Distribute to all platforms'],
    ['Guest Outreach - Priya', '2024-02-20', null, 'completed', 'Outreach', 'Host', 'medium', 'Web3 episode'],
    ['Record Business Episode', '2024-01-18', 2, 'completed', 'Recording', 'Host', 'high', 'Remote recording'],
    ['Social Media Campaign EP001', '2024-01-14', 1, 'completed', 'Marketing', 'Marketing', 'medium', 'All platforms'],
    ['Record Health Episode', '2024-01-28', 3, 'completed', 'Recording', 'Host', 'high', 'In-person'],
    ['SEO Optimization Sprint', '2024-02-01', null, 'in_progress', 'SEO', 'Marketing', 'medium', 'All episodes'],
    ['Guest Research - Dr. Quantum', '2024-03-01', 11, 'in_progress', 'Research', 'Producer', 'medium', 'Prepare questions'],
    ['Record Quantum Episode', '2024-04-05', 11, 'scheduled', 'Recording', 'Host', 'high', 'Remote via Riverside'],
    ['Newsletter Draft March', '2024-03-10', null, 'scheduled', 'Content', 'Writer', 'low', 'Monthly roundup'],
    ['Sponsor Meeting - TechCo', '2024-03-15', null, 'scheduled', 'Business', 'Host', 'high', 'Q2 sponsorship'],
    ['Record Sustainable Living', '2024-03-05', 7, 'scheduled', 'Recording', 'Host', 'medium', 'Panel format'],
    ['Launch YouTube Channel', '2024-04-01', null, 'planned', 'Marketing', 'Producer', 'high', 'Video podcast'],
    ['Q2 Content Planning', '2024-03-25', null, 'planned', 'Planning', 'Team', 'high', 'Strategy session'],
    ['Listener Survey', '2024-04-10', null, 'planned', 'Research', 'Marketing', 'medium', 'Google Forms'],
  ];
  for (const c of calendar) {
    await pool.query(
      'INSERT INTO content_calendar (title, scheduled_date, episode_id, status, type, assignee, priority, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      c
    );
  }

  // Seed Analytics (15+)
  const analytics = [
    [1, 'Downloads', 45000, 'monthly', 'All Platforms', 'Strong performance', 'Engagement'],
    [1, 'Unique Listeners', 32000, 'monthly', 'All Platforms', 'Growing audience', 'Audience'],
    [2, 'Downloads', 38000, 'monthly', 'All Platforms', 'Good numbers', 'Engagement'],
    [3, 'Downloads', 52000, 'monthly', 'All Platforms', 'Viral episode', 'Engagement'],
    [3, 'Social Shares', 8500, 'monthly', 'Twitter', 'High engagement', 'Social'],
    [1, 'Apple Ratings', 4.8, 'all_time', 'Apple Podcasts', '200+ reviews', 'Rating'],
    [2, 'Spotify Streams', 28000, 'monthly', 'Spotify', 'Trending', 'Engagement'],
    [null, 'Total Subscribers', 125000, 'all_time', 'All Platforms', 'Growing 10% MoM', 'Audience'],
    [null, 'Newsletter Subscribers', 15000, 'all_time', 'Email', 'High open rate', 'Audience'],
    [5, 'Downloads', 35000, 'monthly', 'All Platforms', 'Steady performer', 'Engagement'],
    [10, 'Downloads', 36000, 'monthly', 'All Platforms', 'Good engagement', 'Engagement'],
    [null, 'Revenue', 12500, 'monthly', 'Sponsorships', 'Q1 average', 'Revenue'],
    [null, 'Revenue', 3200, 'monthly', 'Merchandise', 'New merch line', 'Revenue'],
    [15, 'Downloads', 43000, 'monthly', 'All Platforms', 'Leadership resonates', 'Engagement'],
    [null, 'YouTube Views', 85000, 'monthly', 'YouTube', 'Video clips', 'Engagement'],
    [null, 'Completion Rate', 72.5, 'monthly', 'All Platforms', 'Above average', 'Engagement'],
  ];
  for (const a of analytics) {
    await pool.query(
      'INSERT INTO analytics (episode_id, metric_name, metric_value, period, platform, notes, category) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      a
    );
  }

  // Seed Distribution Channels (15+)
  const channels = [
    ['Apple Podcasts', 'Apple', 'https://podcasts.apple.com/podcast/123', null, 'active', 45000, 'Primary platform', 'Audio'],
    ['Spotify', 'Spotify', 'https://open.spotify.com/show/123', null, 'active', 38000, 'Fast growing', 'Audio'],
    ['Google Podcasts', 'Google', 'https://podcasts.google.com/feed/123', null, 'active', 22000, 'Good reach', 'Audio'],
    ['YouTube', 'YouTube', 'https://youtube.com/@podcastpro', null, 'active', 15000, 'Video episodes', 'Video'],
    ['Amazon Music', 'Amazon', 'https://music.amazon.com/podcasts/123', null, 'active', 8000, 'Growing platform', 'Audio'],
    ['Overcast', 'Overcast', 'https://overcast.fm/+abc', null, 'active', 12000, 'Power listeners', 'Audio'],
    ['Pocket Casts', 'PocketCasts', 'https://pca.st/podcast/123', null, 'active', 9500, 'Loyal audience', 'Audio'],
    ['RSS Feed', 'RSS', 'https://feed.podcastpro.com/rss', null, 'active', 5000, 'Direct subscribers', 'Feed'],
    ['Website', 'Web', 'https://podcastpro.com', null, 'active', 20000, 'Blog + player', 'Web'],
    ['Twitter/X', 'Twitter', 'https://twitter.com/podcastpro', null, 'active', 35000, 'Clips and promos', 'Social'],
    ['Instagram', 'Instagram', 'https://instagram.com/podcastpro', null, 'active', 28000, 'Audiograms', 'Social'],
    ['TikTok', 'TikTok', 'https://tiktok.com/@podcastpro', null, 'active', 50000, 'Short clips', 'Social'],
    ['LinkedIn', 'LinkedIn', 'https://linkedin.com/company/podcastpro', null, 'active', 12000, 'B2B content', 'Social'],
    ['Newsletter', 'Email', 'https://podcastpro.com/newsletter', null, 'active', 15000, 'Weekly digest', 'Email'],
    ['Patreon', 'Patreon', 'https://patreon.com/podcastpro', null, 'active', 2500, 'Premium content', 'Monetization'],
    ['Discord', 'Discord', 'https://discord.gg/podcastpro', null, 'active', 8000, 'Community', 'Community'],
  ];
  for (const ch of channels) {
    await pool.query(
      'INSERT INTO distribution_channels (name, platform, url, api_key, status, subscriber_count, notes, category) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      ch
    );
  }

  // Seed Episode Templates (15+)
  const templates = [
    ['Solo Deep Dive', 'Single host exploring a topic in depth', 'Intro (2min) > Context (5min) > Deep Dive (20min) > Takeaways (5min) > Outro (2min)', '35 min', 'Educational', 'solo, deep-dive, educational', 'active'],
    ['Interview Standard', 'One-on-one guest interview format', 'Intro (2min) > Guest Intro (3min) > Interview (30min) > Rapid Fire (5min) > Outro (2min)', '42 min', 'Interview', 'interview, guest, conversation', 'active'],
    ['Panel Discussion', 'Multiple guests discussing a topic', 'Intro (2min) > Panelist Intros (5min) > Discussion (35min) > Audience Q&A (10min) > Outro (2min)', '55 min', 'Discussion', 'panel, debate, multi-guest', 'active'],
    ['News Roundup', 'Weekly news and commentary', 'Intro (1min) > Headlines (5min) > Deep Stories (15min) > Hot Takes (5min) > Outro (1min)', '27 min', 'News', 'news, weekly, current-events', 'active'],
    ['Tutorial Episode', 'Step-by-step instructional content', 'Intro (2min) > Overview (3min) > Steps (25min) > Common Mistakes (5min) > Outro (2min)', '37 min', 'Tutorial', 'how-to, tutorial, learning', 'active'],
    ['Storytelling', 'Narrative-driven episode format', 'Hook (1min) > Setup (5min) > Rising Action (15min) > Climax (5min) > Resolution (5min) > Outro (2min)', '33 min', 'Narrative', 'story, narrative, compelling', 'active'],
    ['Q&A Episode', 'Answering listener questions', 'Intro (2min) > Question Selection (1min) > Answers (30min) > Shoutouts (3min) > Outro (2min)', '38 min', 'Community', 'q&a, audience, community', 'active'],
    ['Debate Format', 'Two opposing viewpoints on a topic', 'Intro (2min) > Position A (10min) > Position B (10min) > Rebuttal (10min) > Verdict (5min) > Outro (2min)', '39 min', 'Debate', 'debate, opposing-views, critical-thinking', 'active'],
    ['Case Study', 'In-depth analysis of a real case', 'Intro (2min) > Background (5min) > Analysis (20min) > Lessons (5min) > Application (5min) > Outro (2min)', '39 min', 'Analysis', 'case-study, analysis, real-world', 'active'],
    ['Mini Episode', 'Short-form content for busy listeners', 'Intro (30sec) > Key Point (5min) > Takeaway (1min) > Outro (30sec)', '7 min', 'Short', 'mini, quick, bite-sized', 'active'],
    ['Seasonal Premiere', 'Season opening episode template', 'Teaser (1min) > Season Intro (3min) > Preview (10min) > Special Segment (10min) > Call to Action (2min) > Outro (2min)', '28 min', 'Special', 'premiere, season, special', 'active'],
    ['Book Review', 'Discussing a book relevant to the podcast', 'Intro (2min) > Book Summary (5min) > Key Ideas (15min) > Personal Takes (5min) > Recommendation (2min) > Outro (2min)', '31 min', 'Review', 'book, review, learning', 'active'],
    ['Crossover Episode', 'Collaboration with another podcast', 'Joint Intro (3min) > Cross-Promotion (2min) > Joint Discussion (30min) > Audience Swap (5min) > Outro (2min)', '42 min', 'Collaboration', 'crossover, collab, networking', 'active'],
    ['Behind the Scenes', 'Showing the podcast creation process', 'Intro (2min) > Process Tour (10min) > Tech Setup (5min) > Tips & Tricks (10min) > Bloopers (3min) > Outro (2min)', '32 min', 'BTS', 'behind-the-scenes, process, authentic', 'active'],
    ['Year in Review', 'Annual recap and highlights', 'Intro (2min) > Top Episodes (5min) > Milestones (5min) > Lessons Learned (10min) > Next Year Preview (5min) > Outro (2min)', '29 min', 'Special', 'recap, annual, highlights', 'active'],
  ];
  for (const t of templates) {
    await pool.query(
      'INSERT INTO episode_templates (name, description, structure, duration, category, tags, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      t
    );
  }

  // Seed Transcripts (15+)
  const transcripts = [
    ['EP001 Transcript - AI Creative Industries', '[00:00] HOST: Welcome to TechTalk! Today we explore AI in creative industries with Dr. Sarah Chen...\n[02:00] SARAH: Thank you for having me! AI is truly revolutionizing how we create...', 1, 4500, 'English', 'completed', 98.5, 'Reviewed and corrected'],
    ['EP002 Transcript - Podcast Monetization', '[00:00] HOST: Hey everyone! Today Mike Johnson shares his secrets to podcast monetization...\n[03:00] MIKE: The key is diversifying your revenue streams...', 2, 3800, 'English', 'completed', 97.8, 'Final version'],
    ['EP003 Transcript - Mental Health', '[00:00] HOST: Your mental health matters. Dr. Emily Roberts joins us today...\n[02:30] EMILY: Digital wellness is not about avoiding technology...', 3, 5200, 'English', 'completed', 99.1, 'Sensitive content reviewed'],
    ['EP004 Transcript - Startup Funding', '[00:00] HOST: Ready to raise capital? Alex Rivera tells us how...\n[01:30] ALEX: The funding landscape has changed dramatically...', 4, 4100, 'English', 'draft', 95.2, 'Needs review'],
    ['EP005 Transcript - Sleep Science', '[00:00] HOST: Let us unlock the secrets of sleep with Dr. James Miller...\n[02:00] JAMES: Most people do not realize how crucial sleep architecture is...', 5, 3500, 'English', 'completed', 98.0, 'Good quality'],
    ['EP006 Transcript - Web3 Creators', '[00:00] HOST: The decentralized future awaits. Priya Sharma joins us...\n[02:00] PRIYA: Web3 is more than just crypto speculation...', 6, 4400, 'English', 'draft', 93.5, 'Auto-generated'],
    ['EP007 Transcript - Sustainable Living', '[00:00] HOST: Going green with the Green Team panel...\n[03:00] PANEL: Sustainability starts at home...', 7, 3300, 'English', 'draft', 92.0, 'Panel format challenging'],
    ['EP008 Transcript - Storytelling', '[00:00] HOST: The art of narrative with Maya Angelou Jr...\n[02:00] MAYA: Every story has a heartbeat...', 8, 4700, 'English', 'in_progress', 94.5, 'Editing in progress'],
    ['EP009 Transcript - Crypto Deep Dive', '[00:00] HOST: Crypto markets 2024 with Bitcoin Bob...\n[01:00] BOB: The halving cycle changes everything...', 9, 5000, 'English', 'draft', 91.0, 'Technical terms need check'],
    ['EP010 Transcript - Remote Work', '[00:00] HOST: Home office life with Lisa Park...\n[02:00] LISA: Remote work is not just WFH...', 10, 3600, 'English', 'completed', 97.5, 'Clean transcript'],
    ['EP011 Transcript - Quantum Computing', '[00:00] HOST: Quantum demystified with Dr. Quantum...\n[02:30] QUANTUM: Imagine flipping a coin that lands on both sides...', 11, 4200, 'English', 'draft', 90.0, 'Complex terminology'],
    ['EP012 Transcript - Podcast Growth', '[00:00] HOST: Growing your audience with the Growth Guru...\n[01:30] GURU: Growth is a system, not a hack...', 12, 3900, 'English', 'draft', 93.0, 'Auto-generated'],
    ['EP013 Transcript - AI Ethics', '[00:00] HOST: The ethics of AI with Prof. Ethics...\n[03:00] PROF: We must ask not just can we, but should we...', 13, 4800, 'English', 'in_progress', 96.0, 'Philosophical content'],
    ['EP014 Transcript - AI Music', '[00:00] HOST: Music meets machine with DJ Neural...\n[02:00] DJ: AI does not replace creativity, it amplifies it...', 14, 3400, 'English', 'draft', 89.5, 'Music segments noted'],
    ['EP015 Transcript - Leadership', '[00:00] HOST: Leading through storms with the General Manager...\n[02:00] GM: Crisis reveals character...', 15, 4300, 'English', 'completed', 98.2, 'Powerful episode'],
  ];
  for (const t of transcripts) {
    await pool.query(
      'INSERT INTO transcripts (title, content, episode_id, word_count, language, status, accuracy, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      t
    );
  }

  // Seed Social Posts (15+)
  const socialPosts = [
    ['AI is Changing Everything', 'Mind-blowing conversation with @DrSarahChen about AI in creative industries! Listen now 🎧', 'Twitter', 1, '2024-01-15 10:00:00', 'published', 85.5, '#AI #Creativity #Podcast'],
    ['New Episode Alert!', 'How to build a million-dollar podcast 💰 @MikePod shares his secrets in our latest episode!', 'Twitter', 2, '2024-01-22 10:00:00', 'published', 92.3, '#Podcasting #Business #Growth'],
    ['Mental Health Matters', '5 ways to protect your mental health in the digital age. Full episode with Dr. Emily Roberts now live.', 'Instagram', 3, '2024-02-01 12:00:00', 'published', 88.7, '#MentalHealth #Wellness #DigitalDetox'],
    ['Startup Founders Listen Up', 'Everything you need to know about raising your first round of funding. New episode drops today!', 'LinkedIn', 4, '2024-02-08 09:00:00', 'published', 78.2, '#Startup #Funding #Entrepreneurship'],
    ['Sleep Better Tonight', 'Dr. James Miller reveals the science behind better sleep. Episode link in bio! 😴', 'Instagram', 5, '2024-02-15 11:00:00', 'published', 91.0, '#Sleep #Science #Health'],
    ['Web3 for Creators', 'Is Web3 the future of the creator economy? Find out in our latest episode with @PriyaWeb3', 'Twitter', 6, '2024-03-01 10:00:00', 'scheduled', 0, '#Web3 #CreatorEconomy #Blockchain'],
    ['Go Green Today', 'Simple steps to live more sustainably. Our panel of experts shares practical tips! 🌱', 'Instagram', 7, '2024-03-08 12:00:00', 'scheduled', 0, '#Sustainability #GreenLiving #EcoFriendly'],
    ['The Power of Story', 'Learn storytelling techniques from a master. New episode with Maya Angelou Jr. 📖', 'LinkedIn', 8, '2024-03-15 09:00:00', 'draft', 0, '#Storytelling #Writing #Creativity'],
    ['Crypto Reality Check', 'Bitcoin Bob breaks down the crypto market. No hype, just facts. 📊', 'Twitter', 9, '2024-03-22 10:00:00', 'draft', 0, '#Crypto #Bitcoin #Investing'],
    ['Remote Work Tips', '10 tips for thriving in a remote work environment from @LisaRemote 🏠💻', 'LinkedIn', 10, '2024-04-01 09:00:00', 'published', 86.5, '#RemoteWork #WFH #Productivity'],
    ['Quantum Simplified', 'We made quantum computing understandable! Yes, really. Listen to find out how. ⚛️', 'Twitter', 11, '2024-04-08 10:00:00', 'scheduled', 0, '#Quantum #Science #Technology'],
    ['Grow Your Podcast', 'From 0 to 100K listeners: the complete podcast growth playbook 📈', 'Instagram', 12, '2024-04-15 12:00:00', 'draft', 0, '#PodcastGrowth #Marketing #ContentCreator'],
    ['AI Ethics Debate', 'Should AI have rights? The conversation we all need to have. New episode now live.', 'Twitter', 13, '2024-04-22 10:00:00', 'draft', 0, '#AIEthics #Technology #Philosophy'],
    ['AI Meets Music', 'Can AI create music that moves your soul? DJ Neural shows us how 🎵🤖', 'TikTok', 14, '2024-05-01 15:00:00', 'draft', 0, '#AIMusic #MusicProduction #Innovation'],
    ['Leadership Lessons', 'Crisis reveals true leaders. Powerful conversation about leadership in uncertain times 💪', 'LinkedIn', 15, '2024-05-08 09:00:00', 'published', 82.0, '#Leadership #Management #Crisis'],
    ['Weekly Podcast Recap', 'This week on PodcastPro: AI, Leadership, and the future of work. Catch up on all episodes!', 'Twitter', null, '2024-05-10 10:00:00', 'scheduled', 0, '#Podcast #WeeklyRecap #MustListen'],
  ];
  for (const sp of socialPosts) {
    await pool.query(
      'INSERT INTO social_posts (title, content, platform, episode_id, scheduled_date, status, engagement_score, hashtags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      sp
    );
  }

  // Seed SEO Optimizations (15+)
  const seoItems = [
    ['AI Creative Industries SEO', 'artificial intelligence, creative AI, AI art, generative AI', 'Explore how AI is transforming creative industries with expert insights', 1, 92.5, 'Add more long-tail keywords, optimize title length', 'optimized', 'Strong performance'],
    ['Podcast Monetization SEO', 'podcast monetization, make money podcasting, podcast revenue', 'Learn proven strategies to monetize your podcast from industry experts', 2, 88.0, 'Add FAQ schema, include pricing keywords', 'optimized', 'Good rankings'],
    ['Mental Health Digital SEO', 'digital mental health, screen time effects, digital wellness tips', 'Understanding mental health in the digital age with clinical insights', 3, 95.0, 'Excellent keyword coverage, maintain freshness', 'optimized', 'Top performer'],
    ['Startup Funding SEO', 'startup funding guide, how to raise capital, VC funding tips', 'Complete guide to raising capital for your startup', 4, 78.5, 'Need more backlinks, add structured data', 'in_progress', 'Improving'],
    ['Sleep Science SEO', 'sleep science tips, better sleep guide, sleep research findings', 'Latest sleep science research and practical tips for better rest', 5, 85.0, 'Add video content, optimize for featured snippets', 'optimized', 'Stable'],
    ['Web3 Creators SEO', 'web3 creator economy, blockchain for creators, NFT creators', 'How blockchain and Web3 are empowering content creators', 6, 72.0, 'Emerging keywords, build topical authority', 'pending', 'New topic'],
    ['Sustainable Living SEO', 'sustainable living tips, eco-friendly lifestyle, green living guide', 'Practical tips for eco-friendly sustainable living', 7, 80.0, 'Add local SEO, seasonal content updates', 'in_progress', 'Good potential'],
    ['Storytelling SEO', 'storytelling techniques, narrative craft, how to tell stories', 'Master the art of compelling storytelling', 8, 76.0, 'Competitive niche, need unique angle', 'pending', 'Needs work'],
    ['Cryptocurrency SEO', 'cryptocurrency guide 2024, bitcoin analysis, crypto investing', 'Deep dive into cryptocurrency markets and investing strategies', 9, 70.0, 'High competition, focus on long-tail', 'pending', 'Challenging'],
    ['Remote Work SEO', 'remote work tips, distributed teams, work from home guide', 'The ultimate guide to thriving in remote work environments', 10, 87.5, 'Strong category, maintain rankings', 'optimized', 'Well positioned'],
    ['Quantum Computing SEO', 'quantum computing explained, quantum technology, quantum basics', 'Quantum computing explained in simple terms for everyone', 11, 82.0, 'Niche audience, focus on educational intent', 'in_progress', 'Growing topic'],
    ['Podcast Growth SEO', 'podcast growth strategies, grow podcast audience, podcast marketing', 'Proven strategies to grow your podcast audience', 12, 84.0, 'Add case studies, update stats', 'in_progress', 'Competitive'],
    ['AI Ethics SEO', 'AI ethics debate, ethical AI development, AI regulation', 'Exploring the ethical implications of AI development', 13, 90.0, 'Trending topic, capitalize on news cycle', 'optimized', 'High interest'],
    ['AI Music SEO', 'AI music production, AI music generator, music AI tools', 'How AI is revolutionizing music production and creation', 14, 75.0, 'Include tool comparisons, add demos', 'pending', 'Emerging'],
    ['Leadership SEO', 'crisis leadership, leadership skills, leading through change', 'Leadership strategies for navigating crisis and uncertainty', 15, 86.0, 'Add leadership frameworks, expert quotes', 'optimized', 'Evergreen topic'],
    ['Podcast Brand SEO', 'podcast producer, AI podcast tools, podcast production', 'AI Podcast Producer - Your complete podcast production toolkit', null, 91.0, 'Brand terms performing well, protect rankings', 'optimized', 'Brand search'],
  ];
  for (const s of seoItems) {
    await pool.query(
      'INSERT INTO seo_optimizations (title, keywords, meta_description, episode_id, score, suggestions, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      s
    );
  }

  console.log('✅ Database seeded successfully!');
  console.log('📊 Seeded: 1 user, 16 episodes, 16 guests, 15 scripts, 16 topics,');
  console.log('   15 show notes, 16 intros/outros, 16 questions, 16 calendar items,');
  console.log('   16 analytics, 16 channels, 15 templates, 15 transcripts,');
  console.log('   16 social posts, 16 SEO optimizations');
  console.log('\n🔐 Login: admin@podcastpro.com / password123');

  await pool.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
