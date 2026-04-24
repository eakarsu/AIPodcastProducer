import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AIFeaturePage from './pages/AIFeaturePage';
import Layout from './components/Layout';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return null;

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ className: 'toast-custom', duration: 3000 }} />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
        <Route path="/" element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="episodes" element={<FeaturePage feature="episodes" title="Episodes" />} />
          <Route path="guests" element={<FeaturePage feature="guests" title="Guest Management" />} />
          <Route path="scripts" element={<FeaturePage feature="scripts" title="Scripts" aiAction="generate-script" />} />
          <Route path="topics" element={<FeaturePage feature="topics" title="Topic Suggestions" aiAction="suggest-topics" />} />
          <Route path="show-notes" element={<FeaturePage feature="show-notes" title="Show Notes" aiAction="generate-show-notes" />} />
          <Route path="intros" element={<FeaturePage feature="intros" title="Intros & Outros" aiAction="generate-intro-outro" />} />
          <Route path="questions" element={<FeaturePage feature="questions" title="Interview Questions" aiAction="generate-questions" />} />
          <Route path="calendar" element={<FeaturePage feature="calendar" title="Content Calendar" />} />
          <Route path="analytics" element={<FeaturePage feature="analytics" title="Audience Analytics" />} />
          <Route path="channels" element={<FeaturePage feature="channels" title="Distribution Channels" />} />
          <Route path="templates" element={<FeaturePage feature="templates" title="Episode Templates" />} />
          <Route path="transcripts" element={<FeaturePage feature="transcripts" title="Transcripts" aiAction="generate-transcript" />} />
          <Route path="social-posts" element={<FeaturePage feature="social-posts" title="Social Media Posts" aiAction="generate-social-post" />} />
          <Route path="seo" element={<FeaturePage feature="seo" title="SEO Optimization" aiAction="optimize-seo" />} />
          <Route path="ai/:action" element={<AIFeaturePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
