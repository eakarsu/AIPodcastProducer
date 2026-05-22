import React, { useEffect, useState } from 'react';
import api from '../services/api';

// NON-VIZ — Production workflow rules CRUD editor
export default function WorkflowRulesEditor() {
  const [rules, setRules] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [actions, setActions] = useState([]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '', trigger: '', action: '', condition: '', priority: 5, enabled: true,
  });
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    setBusy(true);
    api.get('/custom-views/workflow-rules')
      .then(r => {
        setRules(r.data.rules || []);
        setTriggers(r.data.triggers || []);
        setActions(r.data.actions || []);
        if (!form.trigger && r.data.triggers?.length) {
          setForm(f => ({ ...f, trigger: r.data.triggers[0], action: r.data.actions[0] || '' }));
        }
      })
      .catch(e => setErr(e.response?.data?.error || e.message))
      .finally(() => setBusy(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const reset = () => {
    setEditingId(null);
    setForm({
      name: '', trigger: triggers[0] || '', action: actions[0] || '',
      condition: '', priority: rules.length + 1, enabled: true,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      if (editingId) {
        await api.put(`/custom-views/workflow-rules/${editingId}`, form);
      } else {
        await api.post('/custom-views/workflow-rules', form);
      }
      reset();
      load();
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    }
  };

  const edit = (r) => {
    setEditingId(r.id);
    setForm({
      name: r.name, trigger: r.trigger, action: r.action,
      condition: r.condition || '', priority: r.priority, enabled: r.enabled,
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try { await api.delete(`/custom-views/workflow-rules/${id}`); load(); }
    catch (ex) { setErr(ex.response?.data?.error || ex.message); }
  };

  const toggle = async (r) => {
    try { await api.put(`/custom-views/workflow-rules/${r.id}`, { enabled: !r.enabled }); load(); }
    catch (ex) { setErr(ex.response?.data?.error || ex.message); }
  };

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 10, border: '1px solid #e5e7eb' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Production Workflow Rules</h3>
      {err && <div style={{ color: '#ef4444', marginBottom: 8 }}>Error: {err}</div>}

      <form onSubmit={submit} style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 80px auto auto',
        gap: 8, alignItems: 'center', marginBottom: 12,
      }}>
        <input placeholder="Rule name" value={form.name}
               onChange={e => setForm({ ...form, name: e.target.value })} required
               style={inp()} />
        <select value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })} style={inp()}>
          {triggers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} style={inp()}>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input placeholder="condition (e.g. duration>10min)" value={form.condition}
               onChange={e => setForm({ ...form, condition: e.target.value })} style={inp()} />
        <input type="number" min="1" value={form.priority}
               onChange={e => setForm({ ...form, priority: Number(e.target.value) || 1 })} style={inp()} />
        <label style={{ fontSize: 12 }}>
          <input type="checkbox" checked={!!form.enabled}
                 onChange={e => setForm({ ...form, enabled: e.target.checked })} /> on
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="submit" style={btn('#3b82f6', '#fff')}>
            {editingId ? 'Update' : 'Add'}
          </button>
          {editingId && <button type="button" onClick={reset} style={btn()}>Cancel</button>}
        </div>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={th()}>#</th>
            <th style={th()}>Name</th>
            <th style={th()}>Trigger</th>
            <th style={th()}>Action</th>
            <th style={th()}>Condition</th>
            <th style={th()}>Prio</th>
            <th style={th()}>Enabled</th>
            <th style={th()}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={td()}>{r.id}</td>
              <td style={td()}>{r.name}</td>
              <td style={td()}><code>{r.trigger}</code></td>
              <td style={td()}><code>{r.action}</code></td>
              <td style={td()}>{r.condition || <span style={{ color: '#94a3b8' }}>—</span>}</td>
              <td style={td()}>{r.priority}</td>
              <td style={td()}>
                <button onClick={() => toggle(r)} style={btn(r.enabled ? '#10b981' : '#e5e7eb',
                                                            r.enabled ? '#fff' : '#0f172a')}>
                  {r.enabled ? 'On' : 'Off'}
                </button>
              </td>
              <td style={td()}>
                <button onClick={() => edit(r)} style={btn()}>Edit</button>{' '}
                <button onClick={() => remove(r.id)} style={btn('#ef4444', '#fff')}>Delete</button>
              </td>
            </tr>
          ))}
          {!rules.length && !busy && (
            <tr><td colSpan="8" style={{ textAlign: 'center', padding: 16, color: '#64748b' }}>No rules yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function inp() { return { padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }; }
function th() { return { textAlign: 'left', padding: '8px 10px', fontSize: 12, color: '#475569' }; }
function td() { return { padding: '8px 10px', verticalAlign: 'top' }; }
function btn(bg = '#e5e7eb', color = '#0f172a') {
  return { background: bg, color, border: 'none', padding: '5px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 12 };
}
