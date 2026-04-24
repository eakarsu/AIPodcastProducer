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
