import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AIFeaturePage from './pages/AIFeaturePage';
import EpisodesPage from './pages/EpisodesPage';
import GuestOutreachPage from './pages/GuestOutreachPage';
import TitleVariantsPage from './pages/TitleVariantsPage';
import ContentCalendarPage from './pages/ContentCalendarPage';
import SEOOptimizerPage from './pages/SEOOptimizerPage';
import GuestFitScorePage from './pages/GuestFitScorePage';
import EpisodeQualityPage from './pages/EpisodeQualityPage';
import AudienceSentimentPage from './pages/AudienceSentimentPage';
import EpisodeTopicClusterPage from './pages/EpisodeTopicClusterPage';
import CrossPromoFinderPage from './pages/CrossPromoFinderPage';
import ListenerGrowthStrategyPage from './pages/ListenerGrowthStrategyPage';
import MultiPlatformPublishingPage from './pages/MultiPlatformPublishingPage';
import AdvancedAIToolsPage from './pages/AdvancedAIToolsPage';
import Layout from './components/Layout';

// // === Batch 06 Gaps & Frontend Mounts ===
import CFAgenticEpisodeOrchestrationPage from './pages/CFAgenticEpisodeOrchestrationPage';
import CFRealTimeTranscriptionEditingPage from './pages/CFRealTimeTranscriptionEditingPage';
import CFAudienceIntelligencePage from './pages/CFAudienceIntelligencePage';
import CFGuestMatchingPage from './pages/CFGuestMatchingPage';
import CFMultiPlatformPublishingOrchestrationPage from './pages/CFMultiPlatformPublishingOrchestrationPage';
import GapGuestsWithoutGuestPage from './pages/GapGuestsWithoutGuestPage';
import GapEpisodesWithoutEpisodePage from './pages/GapEpisodesWithoutEpisodePage';
import GapAnalyticsWithoutAudiencePage from './pages/GapAnalyticsWithoutAudiencePage';
import GapNoIntegrationWithPodcastHostsBuzzsproutAnchoPage from './pages/GapNoIntegrationWithPodcastHostsBuzzsproutAnchoPage';
import GapNoAudienceManagementEmailListsCommunityPage from './pages/GapNoAudienceManagementEmailListsCommunityPage';
import GapNoMonetizationFeaturesSponsorshipTrackingAffiPage from './pages/GapNoMonetizationFeaturesSponsorshipTrackingAffiPage';
import GapLimitedAnalyticsListenerGrowthRetentionPage from './pages/GapLimitedAnalyticsListenerGrowthRetentionPage';
import GapNoIntegrationWithVideoPlatformsYoutubePage from './pages/GapNoIntegrationWithVideoPlatformsYoutubePage';
import GapNoNotificationsModuleGrep0Page from './pages/GapNoNotificationsModuleGrep0Page';
import GapNoAuditLoggingGrep0Page from './pages/GapNoAuditLoggingGrep0Page';
import GapNoWebhooksForEpisodePublishEventsPage from './pages/GapNoWebhooksForEpisodePublishEventsPage';
import GapNoFileUploadForAudioMastersPage from './pages/GapNoFileUploadForAudioMastersPage';
import CustomViewsPage from './pages/CustomViewsPage';
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
          <Route path="episodes" element={<EpisodesPage />} />
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
          <Route path="ai-guest-outreach" element={<GuestOutreachPage />} />
          <Route path="ai-title-variants" element={<TitleVariantsPage />} />
          <Route path="ai-content-calendar" element={<ContentCalendarPage />} />
          <Route path="ai-seo-optimizer" element={<SEOOptimizerPage />} />
          <Route path="ai-guest-fit-score" element={<GuestFitScorePage />} />
          <Route path="ai-episode-quality" element={<EpisodeQualityPage />} />
          <Route path="ai-audience-sentiment" element={<AudienceSentimentPage />} />
          <Route path="ai-episode-topic-cluster" element={<EpisodeTopicClusterPage />} />
          <Route path="ai-cross-promo-finder" element={<CrossPromoFinderPage />} />
          <Route path="ai-listener-growth-strategy" element={<ListenerGrowthStrategyPage />} />
          <Route path="ai-multiplatform-publishing" element={<MultiPlatformPublishingPage />} />
          <Route path="ai-advanced-tools" element={<AdvancedAIToolsPage />} />
          <Route path="custom-views" element={<CustomViewsPage />} />
        </Route>
      
          {/* // === Batch 06 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-episode-orchestration" element={<CFAgenticEpisodeOrchestrationPage />} />
          <Route path="/cf-real-time-transcription-editing" element={<CFRealTimeTranscriptionEditingPage />} />
          <Route path="/cf-audience-intelligence" element={<CFAudienceIntelligencePage />} />
          <Route path="/cf-guest-matching" element={<CFGuestMatchingPage />} />
          <Route path="/cf-multi-platform-publishing-orchestration" element={<CFMultiPlatformPublishingOrchestrationPage />} />
          <Route path="/gap-guests-without-guest" element={<GapGuestsWithoutGuestPage />} />
          <Route path="/gap-episodes-without-episode" element={<GapEpisodesWithoutEpisodePage />} />
          <Route path="/gap-analytics-without-audience" element={<GapAnalyticsWithoutAudiencePage />} />
          <Route path="/gap-no-integration-with-podcast-hosts-buzzsprout-ancho" element={<GapNoIntegrationWithPodcastHostsBuzzsproutAnchoPage />} />
          <Route path="/gap-no-audience-management-email-lists-community" element={<GapNoAudienceManagementEmailListsCommunityPage />} />
          <Route path="/gap-no-monetization-features-sponsorship-tracking-affi" element={<GapNoMonetizationFeaturesSponsorshipTrackingAffiPage />} />
          <Route path="/gap-limited-analytics-listener-growth-retention" element={<GapLimitedAnalyticsListenerGrowthRetentionPage />} />
          <Route path="/gap-no-integration-with-video-platforms-youtube" element={<GapNoIntegrationWithVideoPlatformsYoutubePage />} />
          <Route path="/gap-no-notifications-module-grep-0" element={<GapNoNotificationsModuleGrep0Page />} />
          <Route path="/gap-no-audit-logging-grep-0" element={<GapNoAuditLoggingGrep0Page />} />
          <Route path="/gap-no-webhooks-for-episode-publish-events" element={<GapNoWebhooksForEpisodePublishEventsPage />} />
          <Route path="/gap-no-file-upload-for-audio-masters" element={<GapNoFileUploadForAudioMastersPage />} />
        </Routes>
    </BrowserRouter>
  );
}
