import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiUpload, FiFileText } from 'react-icons/fi';

const COLUMNS = ['title', 'status', 'duration', 'guest_name', 'category', 'publish_date'];
const FIELDS = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'status', label: 'Status', type: 'select', options: ['draft', 'recording', 'editing', 'scheduled', 'published'] },
  { name: 'duration', label: 'Duration', type: 'text' },
  { name: 'publish_date', label: 'Publish Date', type: 'date' },
  { name: 'guest_name', label: 'Guest Name', type: 'text' },
  { name: 'category', label: 'Category', type: 'text' },
  { name: 'tags', label: 'Tags', type: 'text' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

function formatValue(val) {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'string' && val.includes('T')) {
    const d = new Date(val);
    if (!isNaN(d)) return d.toLocaleDateString();
  }
  return String(val);
}

export default function EpisodesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Audio upload state
  const [audioUploading, setAudioUploading] = useState(false);
  const [showNotesLoading, setShowNotesLoading] = useState(false);
  const [showNotesResult, setShowNotesResult] = useState(null);
  const [transcribeLoading, setTranscribeLoading] = useState(false);
  const [transcribeResult, setTranscribeResult] = useState(null);
  const [activePanel, setActivePanel] = useState(null); // 'show-notes' | 'transcribe'

  const fetchItems = useCallback(async (p = 1) => {
    try {
      const res = await api.get(`/episodes?page=${p}&limit=20`);
      if (res.data && res.data.data) {
        setItems(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalItems(res.data.pagination?.total || res.data.data.length);
      } else if (Array.isArray(res.data)) {
        setItems(res.data);
        setTotalItems(res.data.length);
      }
    } catch (err) { toast.error('Failed to load episodes'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(page); }, [page, fetchItems]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this episode?')) return;
    try {
      await api.delete(`/episodes/${id}`);
      toast.success('Deleted successfully');
      setSelectedItem(null);
      setActivePanel(null);
      fetchItems(page);
    } catch (err) { toast.error('Delete failed'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/episodes/${editItem.id}`, formData);
        toast.success('Updated successfully');
      } else {
        await api.post('/episodes', formData);
        toast.success('Created successfully');
      }
      setShowForm(false);
      setEditItem(null);
      setFormData({});
      fetchItems(page);
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
  };

  const openEdit = (item) => {
    setEditItem(item);
    const data = {};
    FIELDS.forEach(f => {
      let val = item[f.name];
      if (f.type === 'date' && val) val = val.split('T')[0];
      data[f.name] = val || '';
    });
    setFormData(data);
    setShowForm(true);
    setSelectedItem(null);
  };

  const openNew = () => {
    setEditItem(null);
    const data = {};
    FIELDS.forEach(f => { data[f.name] = ''; });
    setFormData(data);
    setShowForm(true);
  };

  const handleAudioUpload = async (episodeId, file) => {
    if (!file) return;
    setAudioUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      await api.post(`/episodes/${episodeId}/upload-audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Audio uploaded successfully!');
      fetchItems(page);
      // Refresh selected item
      const res = await api.get(`/episodes/${episodeId}`);
      setSelectedItem(res.data);
    } catch (err) { toast.error(err.response?.data?.error || 'Audio upload failed'); }
    setAudioUploading(false);
  };

  const handleGenerateShowNotes = async (episodeId) => {
    setShowNotesLoading(true);
    setShowNotesResult(null);
    setActivePanel('show-notes');
    try {
      const res = await api.post(`/episodes/${episodeId}/generate-show-notes`);
      setShowNotesResult(res.data.content);
      toast.success('Show notes generated!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to generate show notes'); }
    setShowNotesLoading(false);
  };

  const handleTranscribe = async (episodeId) => {
    setTranscribeLoading(true);
    setTranscribeResult(null);
    setActivePanel('transcribe');
    try {
      const res = await api.post(`/episodes/${episodeId}/transcribe`);
      setTranscribeResult(res.data.content);
      toast.success('Transcript generated!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to generate transcript'); }
    setTranscribeLoading(false);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div><span>Loading...</span></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Episodes</h2>
          <p className="subtitle">{totalItems} episodes</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={openNew}><FiPlus /> New Episode</button>
        </div>
      </div>

      {/* Episode Detail Panel */}
      {selectedItem && (
        <div style={{ marginBottom: 24 }}>
          <button className="btn btn-secondary" style={{ marginBottom: 12 }} onClick={() => { setSelectedItem(null); setActivePanel(null); setShowNotesResult(null); setTranscribeResult(null); }}>
            ← Back to list
          </button>
          <div className="data-table-container" style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{selectedItem.title}</h3>
                <span className={`status-badge ${(selectedItem.status || '').toLowerCase()}`}>{selectedItem.status || 'draft'}</span>
                {selectedItem.category && <span style={{ marginLeft: 8, fontSize: 13, color: '#6b7280' }}>{selectedItem.category}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selectedItem)}><FiEdit2 /> Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedItem.id)}><FiTrash2 /> Delete</button>
              </div>
            </div>

            <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
              {selectedItem.guest_name && <div><span style={{ fontSize: 12, color: '#6b7280', display: 'block' }}>Guest</span><span style={{ fontWeight: 600 }}>{selectedItem.guest_name}</span></div>}
              {selectedItem.duration && <div><span style={{ fontSize: 12, color: '#6b7280', display: 'block' }}>Duration</span><span style={{ fontWeight: 600 }}>{selectedItem.duration}</span></div>}
              {selectedItem.publish_date && <div><span style={{ fontSize: 12, color: '#6b7280', display: 'block' }}>Publish Date</span><span style={{ fontWeight: 600 }}>{new Date(selectedItem.publish_date).toLocaleDateString()}</span></div>}
            </div>

            {selectedItem.description && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Description</div>
                <div style={{ lineHeight: 1.6 }}>{selectedItem.description}</div>
              </div>
            )}

            {/* Audio status */}
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>Audio File</div>
              {selectedItem.audio_url ? (
                <div style={{ color: '#059669', fontWeight: 600 }}>✅ Audio uploaded</div>
              ) : (
                <div style={{ color: '#6b7280' }}>No audio file yet</div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* Audio Upload */}
              <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FiUpload /> {audioUploading ? 'Uploading...' : 'Upload Audio'}
                <input
                  type="file"
                  accept="audio/*"
                  style={{ display: 'none' }}
                  disabled={audioUploading}
                  onChange={e => { if (e.target.files[0]) handleAudioUpload(selectedItem.id, e.target.files[0]); }}
                />
              </label>

              {/* Generate Show Notes */}
              <button
                className="btn btn-secondary"
                onClick={() => handleGenerateShowNotes(selectedItem.id)}
                disabled={showNotesLoading}
              >
                <FiFileText /> {showNotesLoading ? 'Generating...' : 'Generate Show Notes'}
              </button>

              {/* Transcribe */}
              <button
                className="btn btn-secondary"
                onClick={() => handleTranscribe(selectedItem.id)}
                disabled={transcribeLoading}
              >
                📝 {transcribeLoading ? 'Generating...' : 'Generate Transcript'}
              </button>
            </div>
          </div>

          {/* Show Notes Result */}
          {activePanel === 'show-notes' && (showNotesLoading || showNotesResult) && (
            <div className="data-table-container" style={{ padding: 24, marginBottom: 16 }}>
              <h4 style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}>AI-Generated Show Notes</h4>
              {showNotesLoading ? (
                <div className="loading-spinner"><div className="spinner"></div><span>Generating show notes...</span></div>
              ) : (
                <div style={{ lineHeight: 1.7 }}><ReactMarkdown>{showNotesResult}</ReactMarkdown></div>
              )}
            </div>
          )}

          {/* Transcript Result */}
          {activePanel === 'transcribe' && (transcribeLoading || transcribeResult) && (
            <div className="data-table-container" style={{ padding: 24, marginBottom: 16 }}>
              <h4 style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}>AI-Generated Transcript</h4>
              {transcribeLoading ? (
                <div className="loading-spinner"><div className="spinner"></div><span>Generating transcript...</span></div>
              ) : (
                <div style={{ lineHeight: 1.7, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap' }}>{transcribeResult}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Episodes List */}
      {!selectedItem && (
        <>
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🎙️</div>
              <h3>No episodes yet</h3>
              <p>Click "New Episode" to get started</p>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {COLUMNS.map(col => <th key={col}>{col.replace(/_/g, ' ')}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} onClick={() => { setSelectedItem(item); setActivePanel(null); setShowNotesResult(null); setTranscribeResult(null); }}>
                      <td>{(page - 1) * 20 + idx + 1}</td>
                      {COLUMNS.map(col => (
                        <td key={col}>
                          {col === 'status' ? (
                            <span className={`status-badge ${(item[col] || '').toLowerCase()}`}>{item[col] || '-'}</span>
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
                  <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
                  <span style={{ fontSize: 14, color: '#6b7280' }}>Page {page} of {totalPages}</span>
                  <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditItem(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Episode' : 'New Episode'}</h3>
              <button className="modal-close" onClick={() => { setShowForm(false); setEditItem(null); }}><FiX /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                {FIELDS.map(f => (
                  <div key={f.name} className="form-group">
                    <label>{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea value={formData[f.name] || ''} onChange={e => setFormData({ ...formData, [f.name]: e.target.value })} required={f.required} />
                    ) : f.type === 'select' ? (
                      <select value={formData[f.name] || ''} onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}>
                        <option value="">Select...</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type === 'date' ? 'date' : 'text'} value={formData[f.name] || ''} onChange={e => setFormData({ ...formData, [f.name]: e.target.value })} required={f.required} />
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
