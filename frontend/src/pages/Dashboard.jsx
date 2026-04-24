import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const features = [
  { key: 'episodes', path: '/episodes', icon: '🎙️', title: 'Episodes', desc: 'Manage your podcast episodes, track status, and organize content', color: '#6366f1' },
  { key: 'guests', path: '/guests', icon: '👥', title: 'Guest Management', desc: 'Track guests, manage bookings, and maintain relationships', color: '#ec4899' },
  { key: 'scripts', path: '/scripts', icon: '📝', title: 'Script Generator', desc: 'AI-powered script creation for engaging podcast episodes', color: '#8b5cf6', ai: true },
  { key: 'topics', path: '/topics', icon: '💡', title: 'Topic Suggestions', desc: 'AI-curated trending topics tailored to your audience', color: '#f59e0b', ai: true },
  { key: 'show-notes', path: '/show-notes', icon: '📑', title: 'Show Notes', desc: 'Generate comprehensive show notes with AI assistance', color: '#10b981', ai: true },
  { key: 'intros', path: '/intros', icon: '🎬', title: 'Intros & Outros', desc: 'Create compelling openings and closings with AI', color: '#06b6d4', ai: true },
  { key: 'questions', path: '/questions', icon: '❓', title: 'Interview Questions', desc: 'AI-generated interview questions for engaging conversations', color: '#f43f5e', ai: true },
  { key: 'calendar', path: '/calendar', icon: '📅', title: 'Content Calendar', desc: 'Plan and schedule your content production pipeline', color: '#14b8a6' },
  { key: 'analytics', path: '/analytics', icon: '📈', title: 'Audience Analytics', desc: 'Track downloads, engagement, and audience growth metrics', color: '#a855f7' },
  { key: 'channels', path: '/channels', icon: '📡', title: 'Distribution', desc: 'Manage distribution channels and reach across platforms', color: '#3b82f6' },
  { key: 'templates', path: '/templates', icon: '📋', title: 'Episode Templates', desc: 'Reusable episode structures for consistent quality', color: '#22c55e' },
  { key: 'transcripts', path: '/transcripts', icon: '📄', title: 'Transcripts', desc: 'AI-powered transcript generation and management', color: '#eab308', ai: true },
  { key: 'social-posts', path: '/social-posts', icon: '📱', title: 'Social Posts', desc: 'Generate platform-specific social media content with AI', color: '#ef4444', ai: true },
  { key: 'seo', path: '/seo', icon: '🔍', title: 'SEO Optimizer', desc: 'AI-driven SEO optimization for podcast discoverability', color: '#64748b', ai: true },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const endpoints = ['episodes', 'guests', 'scripts', 'topics', 'show-notes', 'intros', 'questions', 'calendar', 'analytics', 'channels', 'templates', 'transcripts', 'social-posts', 'seo'];
    endpoints.forEach(ep => {
      api.get(`/${ep}`).then(res => {
        setCounts(prev => ({ ...prev, [ep]: res.data.length }));
      }).catch(() => {});
    });
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Production Dashboard</h2>
          <p className="subtitle">Your AI-powered podcast production command center</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Episodes</div>
          <div className="stat-value">{counts.episodes || 0}</div>
          <div className="stat-change">+12% this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Guests</div>
          <div className="stat-value">{counts.guests || 0}</div>
          <div className="stat-change">+3 new guests</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">AI Generated</div>
          <div className="stat-value">{(counts.scripts || 0) + (counts['show-notes'] || 0)}</div>
          <div className="stat-change">Scripts & notes</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Channels</div>
          <div className="stat-value">{counts.channels || 0}</div>
          <div className="stat-change">All platforms</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {features.map(f => (
          <div key={f.key} className="feature-card" onClick={() => navigate(f.path)}>
            <div className="card-icon" style={{ background: `${f.color}15` }}>
              {f.icon}
            </div>
            <h3>{f.title} {f.ai && <span className="status-badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: '10px', padding: '2px 8px' }}>AI</span>}</h3>
            <p>{f.desc}</p>
            <div className="card-count">
              {counts[f.key] !== undefined ? `${counts[f.key]} items` : 'Loading...'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
