import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

const navItems = [
  { section: 'Content', items: [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/episodes', label: 'Episodes', icon: '🎙️' },
    { path: '/guests', label: 'Guest Management', icon: '👥' },
    { path: '/calendar', label: 'Content Calendar', icon: '📅' },
    { path: '/templates', label: 'Episode Templates', icon: '📋' },
    { path: '/custom-views', label: 'Podcast Views', icon: '🎧' },
  // === Batch 06 Gaps & Frontend Mounts ===
  { path: '/cf-agentic-episode-orchestration', label: 'Agentic episode orchestration', icon: '✨' },
  { path: '/cf-real-time-transcription-editing', label: 'Real-time transcription + editing', icon: '✨' },
  { path: '/cf-audience-intelligence', label: 'Audience intelligence', icon: '✨' },
  { path: '/cf-guest-matching', label: 'Guest matching', icon: '✨' },
  { path: '/cf-multi-platform-publishing-orchestration', label: 'Multi-platform publishing orchestration', icon: '✨' },
  { path: '/gap-guests-without-guest', label: 'Guests without `/guest', icon: '✨' },
  { path: '/gap-episodes-without-episode', label: 'Episodes without `/episode', icon: '✨' },
  { path: '/gap-analytics-without-audience', label: 'Analytics without `/audience', icon: '✨' },
  { path: '/gap-no-integration-with-podcast-hosts-buzzsprout-ancho', label: 'No integration with podcast hosts (Buzzsprout, Anchor)', icon: '✨' },
  { path: '/gap-no-audience-management-email-lists-community', label: 'No audience management (email lists, community)', icon: '✨' },
  { path: '/gap-no-monetization-features-sponsorship-tracking-affi', label: 'No monetization features (sponsorship tracking, affiliate links)', icon: '✨' },
  { path: '/gap-limited-analytics-listener-growth-retention', label: 'Limited analytics (listener growth, retention)', icon: '✨' },
  { path: '/gap-no-integration-with-video-platforms-youtube', label: 'No integration with video platforms (YouTube)', icon: '✨' },
  { path: '/gap-no-notifications-module-grep-0', label: 'No notifications module (grep 0)', icon: '✨' },
  { path: '/gap-no-audit-logging-grep-0', label: 'No audit logging (grep 0)', icon: '✨' },
  { path: '/gap-no-webhooks-for-episode-publish-events', label: 'No webhooks for episode publish events', icon: '✨' },
  { path: '/gap-no-file-upload-for-audio-masters', label: 'No file upload for audio masters', icon: '✨' }
]},
  { section: 'AI Tools', items: [
    { path: '/scripts', label: 'Script Generator', icon: '📝', ai: true },
    { path: '/topics', label: 'Topic Suggestions', icon: '💡', ai: true },
    { path: '/show-notes', label: 'Show Notes', icon: '📑', ai: true },
    { path: '/intros', label: 'Intros & Outros', icon: '🎬', ai: true },
    { path: '/questions', label: 'Interview Questions', icon: '❓', ai: true },
    { path: '/transcripts', label: 'Transcripts', icon: '📄', ai: true },
    { path: '/social-posts', label: 'Social Posts', icon: '📱', ai: true },
    { path: '/seo', label: 'SEO Optimizer', icon: '🔍', ai: true },
    { path: '/ai-guest-outreach', label: 'Guest Outreach', icon: '📧', ai: true },
    { path: '/ai-title-variants', label: 'Title A/B Tester', icon: '🅰️', ai: true },
    { path: '/ai-content-calendar', label: 'AI Content Calendar', icon: '🗓️', ai: true },
    { path: '/ai-seo-optimizer', label: 'AI SEO Optimizer', icon: '🎯', ai: true },
    { path: '/ai-guest-fit-score', label: 'Guest Fit Score', icon: '🎯', ai: true },
    { path: '/ai-episode-quality', label: 'Episode Quality', icon: '📊', ai: true },
    { path: '/ai-audience-sentiment', label: 'Audience Sentiment', icon: '💬', ai: true },
    { path: '/ai-episode-topic-cluster', label: 'Topic Clustering', icon: '🧭', ai: true },
    { path: '/ai-cross-promo-finder', label: 'Cross-Promo Finder', icon: '🤝', ai: true },
    { path: '/ai-listener-growth-strategy', label: 'Growth Strategy', icon: '📈', ai: true },
    { path: '/ai-multiplatform-publishing', label: 'Multi-Platform Prep', icon: '📡', ai: true },
    { path: '/ai-advanced-tools', label: 'Advanced Tools', icon: '🛠️', ai: true },
  ]},
  { section: 'Analytics', items: [
    { path: '/analytics', label: 'Audience Analytics', icon: '📈' },
    { path: '/channels', label: 'Distribution', icon: '📡' },
  ]},
];

export default function Layout({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>🎙️ PodcastPro AI</h1>
          <p>Production Studio</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(section => (
            <div key={section.section} className="nav-section">
              <div className="nav-section-title">{section.section}</div>
              {section.items.map(item => (
                <button
                  key={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                  {item.ai && <span className="badge">AI</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user.name?.[0] || 'U'}</div>
            <div className="user-details">
              <div className="name">{user.name}</div>
              <div className="email">{user.email}</div>
            </div>
            <button className="logout-btn" onClick={onLogout} title="Logout">
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
