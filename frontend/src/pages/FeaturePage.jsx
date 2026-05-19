import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCpu } from 'react-icons/fi';

const featureConfig = {
  episodes: {
    columns: ['title', 'status', 'duration', 'guest_name', 'category', 'publish_date'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'recording', 'editing', 'scheduled', 'published'] },
      { name: 'duration', label: 'Duration', type: 'text' },
      { name: 'publish_date', label: 'Publish Date', type: 'date' },
      { name: 'guest_name', label: 'Guest Name', type: 'text' },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'tags', label: 'Tags', type: 'text' },
      { name: 'audio_url', label: 'Audio URL', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  guests: {
    columns: ['name', 'expertise', 'company', 'status', 'rating', 'episode_count'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'bio', label: 'Bio', type: 'textarea' },
      { name: 'expertise', label: 'Expertise', type: 'text' },
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'social_links', label: 'Social Links', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['pending', 'confirmed', 'declined'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'episode_count', label: 'Episode Count', type: 'number' },
      { name: 'rating', label: 'Rating', type: 'number' },
    ],
  },
  scripts: {
    columns: ['title', 'type', 'status', 'word_count', 'duration_estimate'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'episode_id', label: 'Episode ID', type: 'number' },
      { name: 'type', label: 'Type', type: 'select', options: ['full', 'outline', 'talking_points'] },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'editing', 'completed'] },
      { name: 'word_count', label: 'Word Count', type: 'number' },
      { name: 'duration_estimate', label: 'Duration Estimate', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  topics: {
    columns: ['title', 'category', 'trending_score', 'status', 'target_audience'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'trending_score', label: 'Trending Score', type: 'number' },
      { name: 'source', label: 'Source', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['suggested', 'approved', 'rejected', 'used'] },
      { name: 'target_audience', label: 'Target Audience', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  'show-notes': {
    columns: ['title', 'episode_id', 'status'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'episode_id', label: 'Episode ID', type: 'number' },
      { name: 'key_points', label: 'Key Points', type: 'textarea' },
      { name: 'resources', label: 'Resources', type: 'textarea' },
      { name: 'timestamps', label: 'Timestamps', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
    ],
  },
  intros: {
    columns: ['title', 'type', 'tone', 'duration_estimate', 'status'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'type', label: 'Type', type: 'select', options: ['intro', 'outro'] },
      { name: 'tone', label: 'Tone', type: 'text' },
      { name: 'duration_estimate', label: 'Duration', type: 'text' },
      { name: 'episode_id', label: 'Episode ID', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'active'] },
    ],
  },
  questions: {
    columns: ['question', 'category', 'difficulty', 'status'],
    fields: [
      { name: 'question', label: 'Question', type: 'textarea', required: true },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'difficulty', label: 'Difficulty', type: 'select', options: ['Easy', 'Medium', 'Hard'] },
      { name: 'guest_id', label: 'Guest ID', type: 'number' },
      { name: 'episode_id', label: 'Episode ID', type: 'number' },
      { name: 'follow_up', label: 'Follow Up', type: 'textarea' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'used', 'archived'] },
    ],
  },
  calendar: {
    columns: ['title', 'scheduled_date', 'type', 'assignee', 'priority', 'status'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'scheduled_date', label: 'Scheduled Date', type: 'date' },
      { name: 'episode_id', label: 'Episode ID', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['planned', 'scheduled', 'in_progress', 'completed'] },
      { name: 'type', label: 'Type', type: 'text' },
      { name: 'assignee', label: 'Assignee', type: 'text' },
      { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  analytics: {
    columns: ['metric_name', 'metric_value', 'period', 'platform', 'category'],
    fields: [
      { name: 'episode_id', label: 'Episode ID', type: 'number' },
      { name: 'metric_name', label: 'Metric Name', type: 'text', required: true },
      { name: 'metric_value', label: 'Value', type: 'number' },
      { name: 'period', label: 'Period', type: 'text' },
      { name: 'platform', label: 'Platform', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'category', label: 'Category', type: 'text' },
    ],
  },
  channels: {
    columns: ['name', 'platform', 'status', 'subscriber_count', 'category'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'platform', label: 'Platform', type: 'text' },
      { name: 'url', label: 'URL', type: 'text' },
      { name: 'api_key', label: 'API Key', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'pending'] },
      { name: 'subscriber_count', label: 'Subscribers', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'category', label: 'Category', type: 'text' },
    ],
  },
  templates: {
    columns: ['name', 'category', 'duration', 'status'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'structure', label: 'Structure', type: 'textarea' },
      { name: 'duration', label: 'Duration', type: 'text' },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'tags', label: 'Tags', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
  },
  transcripts: {
    columns: ['title', 'language', 'status', 'word_count', 'accuracy'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'episode_id', label: 'Episode ID', type: 'number' },
      { name: 'word_count', label: 'Word Count', type: 'number' },
      { name: 'language', label: 'Language', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'in_progress', 'completed'] },
      { name: 'accuracy', label: 'Accuracy %', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  'social-posts': {
    columns: ['title', 'platform', 'status', 'engagement_score', 'scheduled_date'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'platform', label: 'Platform', type: 'select', options: ['Twitter', 'Instagram', 'LinkedIn', 'TikTok', 'Facebook'] },
      { name: 'episode_id', label: 'Episode ID', type: 'number' },
      { name: 'scheduled_date', label: 'Scheduled Date', type: 'datetime-local' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'scheduled', 'published'] },
      { name: 'engagement_score', label: 'Engagement', type: 'number' },
      { name: 'hashtags', label: 'Hashtags', type: 'text' },
    ],
  },
  seo: {
    columns: ['title', 'score', 'status', 'episode_id'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'keywords', label: 'Keywords', type: 'textarea' },
      { name: 'meta_description', label: 'Meta Description', type: 'textarea' },
      { name: 'episode_id', label: 'Episode ID', type: 'number' },
      { name: 'score', label: 'SEO Score', type: 'number' },
      { name: 'suggestions', label: 'Suggestions', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['pending', 'in_progress', 'optimized'] },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
};

const aiActionConfig = {
  'generate-script': { label: 'Generate Script with AI', fields: [
    { name: 'topic', label: 'Topic', type: 'text', required: true },
    { name: 'duration', label: 'Duration', type: 'text', placeholder: '30 minutes' },
    { name: 'tone', label: 'Tone', type: 'text', placeholder: 'conversational' },
    { name: 'guestName', label: 'Guest Name', type: 'text', placeholder: 'Optional' },
  ]},
  'suggest-topics': { label: 'Suggest Topics with AI', fields: [
    { name: 'category', label: 'Category', type: 'text', required: true, placeholder: 'Technology' },
    { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'general' },
    { name: 'count', label: 'Number of Topics', type: 'number', placeholder: '10' },
  ]},
  'generate-show-notes': { label: 'Generate Show Notes with AI', fields: [
    { name: 'episodeTitle', label: 'Episode Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'guestName', label: 'Guest Name', type: 'text' },
    { name: 'keyTopics', label: 'Key Topics', type: 'text' },
  ]},
  'generate-intro-outro': { label: 'Generate Intro/Outro with AI', fields: [
    { name: 'episodeTitle', label: 'Episode Title', type: 'text', required: true },
    { name: 'type', label: 'Type', type: 'select', options: ['intro', 'outro', 'both intro and outro'] },
    { name: 'tone', label: 'Tone', type: 'text', placeholder: 'professional and engaging' },
    { name: 'podcastName', label: 'Podcast Name', type: 'text', placeholder: 'The Podcast' },
  ]},
  'generate-questions': { label: 'Generate Questions with AI', fields: [
    { name: 'guestName', label: 'Guest Name', type: 'text' },
    { name: 'expertise', label: 'Guest Expertise', type: 'text' },
    { name: 'topic', label: 'Topic', type: 'text', required: true },
    { name: 'questionCount', label: 'Number of Questions', type: 'number', placeholder: '15' },
  ]},
  'generate-transcript': { label: 'Generate Transcript with AI', fields: [
    { name: 'episodeTitle', label: 'Episode Title', type: 'text', required: true },
    { name: 'script', label: 'Script Outline', type: 'textarea' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ]},
  'generate-social-post': { label: 'Generate Social Post with AI', fields: [
    { name: 'episodeTitle', label: 'Episode Title', type: 'text', required: true },
    { name: 'platform', label: 'Platform', type: 'select', options: ['Twitter', 'LinkedIn', 'Instagram', 'TikTok', 'All'] },
    { name: 'keyPoints', label: 'Key Points', type: 'textarea' },
    { name: 'tone', label: 'Tone', type: 'text', placeholder: 'engaging and shareable' },
  ]},
  'optimize-seo': { label: 'Optimize SEO with AI', fields: [
    { name: 'episodeTitle', label: 'Episode Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'currentKeywords', label: 'Current Keywords', type: 'text' },
  ]},
};

export default function FeaturePage({ feature, title, aiAction }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showAI, setShowAI] = useState(false);
  const [aiFormData, setAiFormData] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const config = featureConfig[feature];
  const aiConfig = aiAction ? aiActionConfig[aiAction] : null;

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchItems = useCallback(async (p = 1) => {
    try {
      const res = await api.get(`/${feature}?page=${p}&limit=20`);
      // Handle both paginated { data, pagination } and legacy array responses
      if (res.data && res.data.data) {
        setItems(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalItems(res.data.pagination?.total || res.data.data.length);
      } else if (Array.isArray(res.data)) {
        setItems(res.data);
        setTotalItems(res.data.length);
      }
    } catch (err) {
      toast.error('Failed to load data');
    }
    setLoading(false);
  }, [feature]);

  useEffect(() => {
    setLoading(true);
    setSelectedItem(null);
    setShowForm(false);
    setEditItem(null);
    setShowAI(false);
    setAiResult(null);
    setPage(1);
    fetchItems(1);
  }, [feature, fetchItems]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/${feature}/${id}`);
      toast.success('Deleted successfully');
      setSelectedItem(null);
      fetchItems(page);
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/${feature}/${editItem.id}`, formData);
        toast.success('Updated successfully');
      } else {
        await api.post(`/${feature}`, formData);
        toast.success('Created successfully');
      }
      setShowForm(false);
      setEditItem(null);
      setFormData({});
      fetchItems(page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    const data = {};
    config.fields.forEach(f => {
      let val = item[f.name];
      if (f.type === 'date' && val) val = val.split('T')[0];
      if (f.type === 'datetime-local' && val) val = val.slice(0, 16);
      data[f.name] = val || '';
    });
    setFormData(data);
    setShowForm(true);
    setSelectedItem(null);
  };

  const openNew = () => {
    setEditItem(null);
    const data = {};
    config.fields.forEach(f => { data[f.name] = ''; });
    setFormData(data);
    setShowForm(true);
  };

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.post(`/ai/${aiAction}`, aiFormData);
      setAiResult(res.data);
      toast.success('AI content generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI generation failed');
    }
    setAiLoading(false);
  };

  const formatValue = (val) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'string' && val.includes('T')) {
      const d = new Date(val);
      if (!isNaN(d)) return d.toLocaleDateString();
    }
    return String(val);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          <p className="subtitle">{totalItems} items</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {aiAction && (
            <button className="btn btn-secondary" onClick={() => { setShowAI(!showAI); setAiResult(null); }}>
              <FiCpu /> {showAI ? 'Hide AI' : 'AI Generate'}
            </button>
          )}
          <button className="btn btn-primary" onClick={openNew}>
            <FiPlus /> New Item
          </button>
        </div>
      </div>

      {/* AI Generation Panel */}
      {showAI && aiConfig && (
        <div className="ai-form" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>{aiConfig.label}</h3>
          <form onSubmit={handleAIGenerate}>
            <div className="ai-form-row">
              {aiConfig.fields.map(f => (
                <div key={f.name} className="form-group" style={f.type === 'textarea' ? { gridColumn: '1 / -1' } : {}}>
                  <label>{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      value={aiFormData[f.name] || ''}
                      onChange={e => setAiFormData({ ...aiFormData, [f.name]: e.target.value })}
                      placeholder={f.placeholder}
                      required={f.required}
                    />
                  ) : f.type === 'select' ? (
                    <select
                      value={aiFormData[f.name] || ''}
                      onChange={e => setAiFormData({ ...aiFormData, [f.name]: e.target.value })}
                    >
                      <option value="">Select...</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type}
                      value={aiFormData[f.name] || ''}
                      onChange={e => setAiFormData({ ...aiFormData, [f.name]: e.target.value })}
                      placeholder={f.placeholder}
                      required={f.required}
                    />
                  )}
                </div>
              ))}
            </div>
            <button type="submit" className="btn btn-primary" disabled={aiLoading} style={{ marginTop: 12 }}>
              {aiLoading ? '⏳ Generating...' : '✨ Generate with AI'}
            </button>
          </form>

          {aiLoading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <span>AI is generating content...</span>
            </div>
          )}

          {aiResult && (
            <div className="ai-output">
              <div className="ai-output-header">
                <div className="ai-icon">✨</div>
                <h4>AI Generated Content</h4>
                <span className="model-tag">{aiResult.model || 'AI Model'}</span>
              </div>
              <div className="ai-output-content">
                <ReactMarkdown>{aiResult.content}</ReactMarkdown>
              </div>
              {aiResult.usage && (
                <div className="ai-output-meta">
                  <span>Prompt tokens: {aiResult.usage.prompt_tokens}</span>
                  <span>Completion tokens: {aiResult.usage.completion_tokens}</span>
                  <span>Total tokens: {aiResult.usage.total_tokens}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Data Table */}
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>No items yet</h3>
          <p>Click "New Item" to get started</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                {config.columns.map(col => (
                  <th key={col}>{col.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} onClick={() => setSelectedItem(item)}>
                  <td>{idx + 1}</td>
                  {config.columns.map(col => (
                    <td key={col}>
                      {['status', 'difficulty', 'priority', 'type'].includes(col) ? (
                        <span className={`status-badge ${(item[col] || '').toLowerCase().replace(/ /g, '_')}`}>
                          {item[col] || '-'}
                        </span>
                      ) : col === 'question' ? (
                        (item[col] || '').substring(0, 60) + ((item[col] || '').length > 60 ? '...' : '')
                      ) : (
                        formatValue(item[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '16px 0' }}>
              <button className="btn btn-secondary" onClick={() => { const np = Math.max(1, page - 1); setPage(np); fetchItems(np); }} disabled={page === 1}>Previous</button>
              <span style={{ fontSize: 14, color: '#6b7280' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-secondary" onClick={() => { const np = Math.min(totalPages, page + 1); setPage(np); fetchItems(np); }} disabled={page === totalPages}>Next</button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedItem.title || selectedItem.name || selectedItem.question?.substring(0, 40) || selectedItem.metric_name || `Item #${selectedItem.id}`}</h3>
              <button className="modal-close" onClick={() => setSelectedItem(null)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {config.fields.map(f => (
                  <div key={f.name} className={`detail-item ${f.type === 'textarea' ? 'full' : ''}`}>
                    <span className="detail-label">{f.label}</span>
                    <span className="detail-value">
                      {f.name.includes('status') || f.name === 'difficulty' || f.name === 'priority' ? (
                        <span className={`status-badge ${(selectedItem[f.name] || '').toLowerCase().replace(/ /g, '_')}`}>
                          {selectedItem[f.name] || '-'}
                        </span>
                      ) : (
                        formatValue(selectedItem[f.name])
                      )}
                    </span>
                  </div>
                ))}
                <div className="detail-item">
                  <span className="detail-label">Created</span>
                  <span className="detail-value">{selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Updated</span>
                  <span className="detail-value">{selectedItem.updated_at ? new Date(selectedItem.updated_at).toLocaleString() : '-'}</span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedItem.id)}>
                <FiTrash2 /> Delete
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => openEdit(selectedItem)}>
                <FiEdit2 /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditItem(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Item' : 'New Item'}</h3>
              <button className="modal-close" onClick={() => { setShowForm(false); setEditItem(null); }}><FiX /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                {config.fields.map(f => (
                  <div key={f.name} className="form-group">
                    <label>{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea
                        value={formData[f.name] || ''}
                        onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                        required={f.required}
                      />
                    ) : f.type === 'select' ? (
                      <select
                        value={formData[f.name] || ''}
                        onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                      >
                        <option value="">Select...</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={f.type === 'email' ? 'email' : f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'datetime-local' ? 'datetime-local' : 'text'}
                        value={formData[f.name] || ''}
                        onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                        required={f.required}
                        step={f.type === 'number' ? 'any' : undefined}
                      />
                    )}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
