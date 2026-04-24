import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const aiFeatures = {
  'generate-script': {
    title: 'AI Script Generator',
    description: 'Generate professional podcast scripts with AI',
    icon: '📝',
    fields: [
      { name: 'topic', label: 'Topic', type: 'text', required: true, placeholder: 'e.g., The Future of AI' },
      { name: 'duration', label: 'Duration', type: 'text', placeholder: '30 minutes' },
      { name: 'tone', label: 'Tone', type: 'text', placeholder: 'conversational, professional, humorous' },
      { name: 'guestName', label: 'Guest Name', type: 'text', placeholder: 'Optional - leave blank for solo' },
    ],
  },
  'research-guest': {
    title: 'AI Guest Research',
    description: 'Research and prepare guest profiles for interviews',
    icon: '🔬',
    fields: [
      { name: 'guestName', label: 'Guest Name', type: 'text', required: true },
      { name: 'expertise', label: 'Area of Expertise', type: 'text' },
      { name: 'company', label: 'Company/Organization', type: 'text' },
    ],
  },
  'suggest-topics': {
    title: 'AI Topic Suggestions',
    description: 'Get trending topic ideas for your podcast',
    icon: '💡',
    fields: [
      { name: 'category', label: 'Category', type: 'text', required: true, placeholder: 'Technology, Business, Health...' },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'general, professionals, students...' },
      { name: 'count', label: 'Number of Topics', type: 'number', placeholder: '10' },
    ],
  },
};

export default function AIFeaturePage() {
  const { action } = useParams();
  const feature = aiFeatures[action];
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!feature) return <div className="empty-state"><h3>AI Feature not found</h3></div>;

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post(`/ai/${action}`, formData);
      setResult(res.data);
      toast.success('Generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    }
    setLoading(false);
  };

  return (
    <div className="ai-feature-container">
      <div className="page-header">
        <div>
          <h2>{feature.icon} {feature.title}</h2>
          <p className="subtitle">{feature.description}</p>
        </div>
      </div>

      <div className="ai-form">
        <form onSubmit={handleGenerate}>
          <div className="ai-form-row">
            {feature.fields.map(f => (
              <div key={f.name} className="form-group">
                <label>{f.label}</label>
                <input
                  type={f.type}
                  value={formData[f.name] || ''}
                  onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                  placeholder={f.placeholder}
                  required={f.required}
                />
              </div>
            ))}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? '⏳ Generating...' : '✨ Generate with AI'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>AI is working its magic...</span>
        </div>
      )}

      {result && (
        <div className="ai-output">
          <div className="ai-output-header">
            <div className="ai-icon">✨</div>
            <h4>AI Generated Content</h4>
            <span className="model-tag">{result.model || 'AI Model'}</span>
          </div>
          <div className="ai-output-content">
            <ReactMarkdown>{result.content}</ReactMarkdown>
          </div>
          {result.usage && (
            <div className="ai-output-meta">
              <span>Prompt tokens: {result.usage.prompt_tokens}</span>
              <span>Completion tokens: {result.usage.completion_tokens}</span>
              <span>Total tokens: {result.usage.total_tokens}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
