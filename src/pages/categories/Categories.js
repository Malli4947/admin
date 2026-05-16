import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import './Categories.css';

// ── API base ──────────────────────────────────────────────────────────────────
const BASE  = (process.env.REACT_APP_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const TOKEN = () => localStorage.getItem('pp_admin_token') || '';

// ── Helpers ───────────────────────────────────────────────────────────────────
const COLORS = ['#3B82F6','#22C55E','#F59E0B','#8B5CF6','#EF4444','#C9A84C','#EC4899','#14B8A6','#6366F1','#F97316'];
const EMPTY  = { name:'', slug:'', description:'', icon:'', image:'', color:'#3B82F6', sortOrder:1, isActive:true };
const toSlug = n => n.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');

// ── Reusable modal wrapper ────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  const wrapRef = useRef(null);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    if (wrapRef.current) {
      const body = wrapRef.current.querySelector('.modal__body');
      if (body) body.scrollTop = 0;
    }
    return () => { document.body.style.overflow = ''; };
  }, []);
  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" ref={wrapRef}>
        <div className="modal__header">
          <span className="modal__title">{title}</span>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  const bg = type === 'error' ? '#ef4444' : type === 'warn' ? '#f59e0b' : '#22c55e';
  return (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:9999,
      background:bg, color:'#fff', padding:'12px 20px',
      borderRadius:10, fontSize:14, fontWeight:600,
      boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
      animation:'slideUp 0.3s ease',
    }}>
      {msg}
    </div>
  );
}

// ── Image URL input ───────────────────────────────────────────────────────────
function ImageUrlInput({ value, onChange }) {
  const [draft, setDraft] = useState(value || '');

  // Keep draft in sync when value is cleared externally
  useEffect(() => { if (!value) setDraft(''); }, [value]);

  const commit = () => {
    const url = draft.trim();
    onChange(url);
  };

  return (
    <div className="cat-img-zone">
      {value ? (
        <div className="cat-img-preview">
          <img src={value} alt="category" className="cat-img-preview__img" />
          <button
            type="button"
            className="cat-img-preview__remove"
            onClick={() => { onChange(''); setDraft(''); }}
            title="Remove image">
            ✕
          </button>
        </div>
      ) : null}
      <div style={{ display:'flex', gap:8, marginTop: value ? 8 : 0 }}>
        <input
          className="form-input"
          placeholder="Paste image URL (https://…)"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
          style={{ flex:1 }}
        />
        <button type="button" className="btn btn-ghost btn-sm" onClick={commit}>
          Apply
        </button>
      </div>
      <span style={{ fontSize:11, color:'var(--t3)', marginTop:4, display:'block' }}>
        Paste a direct image URL and press Enter or click Apply
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Categories() {
  const [data,      setData]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [modal,     setModal]     = useState(null);   // 'form' | 'delete' | null
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [search,    setSearch]    = useState('');
  const [toast,     setToast]     = useState({ msg:'', type:'success' });

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'success' }), 3000);
  };

  // ── GET /api/categories ─────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/api/categories`);
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        setData([...data.categories].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)));
      } else {
        showToast('Failed to load categories', 'error');
      }
    } catch {
      showToast('Network error — could not load categories', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = data.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Image upload ─────────────────────────────────────────────────────────────
  // (replaced with URL input — no upload needed)

  // ── Open modals ─────────────────────────────────────────────────────────────
  const openAdd  = () => { setForm(EMPTY); setEditing(null); setModal('form'); };
  const openEdit = (c) => {
    setForm({
      name:        c.name        || '',
      slug:        c.slug        || '',
      description: c.description || '',
      icon:        c.icon        || '',
      image:       c.image       || '',
      color:       c.color       || '#3B82F6',
      sortOrder:   c.sortOrder   ?? 1,
      isActive:    c.isActive    !== false,
    });
    setEditing(c);
    setModal('form');
  };
  const openDel  = (c) => { setEditing(c); setModal('delete'); };

  // ── Save (create or update) ─────────────────────────────────────────────────
  const save = async () => {
    if (!form.name.trim()) { showToast('Name is required', 'warn'); return; }
    setSaving(true);
    try {
      const body = {
        name:        form.name.trim(),
        description: form.description.trim(),
        icon:        form.image || form.icon || '',   // send image URL as icon if present
        image:       form.image || '',
        color:       form.color,
        sortOrder:   form.sortOrder,
        isActive:    form.isActive,
        ...(form.slug.trim() && { slug: form.slug.trim() }),
      };
      const url    = editing ? `${BASE}/api/categories/${editing._id}` : `${BASE}/api/categories`;
      const method = editing ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${TOKEN()}` },
        body:    JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success || result.category) {
        showToast(editing ? 'Category updated!' : 'Category created!');
        setModal(null);
        fetchCategories();
      } else {
        showToast(result.message || 'Save failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setSaving(false);
  };

  // ── DELETE ──────────────────────────────────────────────────────────────────
  const deleteCategory = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res  = await fetch(`${BASE}/api/categories/${editing._id}`, {
        method:  'DELETE',
        headers: { Authorization:`Bearer ${TOKEN()}` },
      });
      const data = await res.json();
      if (data.success || res.ok) {
        showToast(`"${editing.name}" deleted`);
        setModal(null);
        fetchCategories();
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setSaving(false);
  };

  // ── Quick toggle isActive ───────────────────────────────────────────────────
  const toggleActive = async (cat) => {
    setData(prev => prev.map(c => c._id === cat._id ? { ...c, isActive: !c.isActive } : c));
    try {
      const res  = await fetch(`${BASE}/api/categories/${cat._id}`, {
        method:  'PUT',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${TOKEN()}` },
        body:    JSON.stringify({ isActive: !cat.isActive }),
      });
      const data = await res.json();
      if (!data.success && !res.ok) {
        setData(prev => prev.map(c => c._id === cat._id ? { ...c, isActive: cat.isActive } : c));
        showToast('Toggle failed', 'error');
      } else {
        showToast(`${cat.name} is now ${!cat.isActive ? 'Active' : 'Off'}`);
      }
    } catch {
      setData(prev => prev.map(c => c._id === cat._id ? { ...c, isActive: cat.isActive } : c));
      showToast('Network error', 'error');
    }
  };

  const f = form;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page a-up">
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── PAGE HEADER ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-sub">
            {loading ? 'Loading…' : `${data.length} categories · ${data.filter(c => c.isActive).length} active`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Category</button>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="filters-bar">
        <div className="search-bar" style={{ maxWidth:300 }}>
          <span className="search-bar__icon">🔍</span>
          <input
            placeholder="Search categories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="filter-count">
          {loading ? '…' : `${filtered.length} results`}
        </span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={fetchCategories}
          style={{ marginLeft:'auto' }}>
          ↻ Refresh
        </button>
      </div>

      {/* ── LOADING ── */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ width:36, height:36, border:'3px solid #f0e6c8', borderTopColor:'#C9A84C', borderRadius:'50%', animation:'rotateSlow .7s linear infinite', margin:'0 auto 14px' }} />
          <div style={{ color:'#94a3b8', fontSize:14 }}>Loading categories…</div>
        </div>
      ) : (
        <>
          {/* ── CARD GRID ── */}
          <div className="cat-grid">
            {filtered.map((cat, i) => (
              <div key={cat._id} className={`cat-card card a-up d${Math.min(i+1,6)}`}>
                {/* Top image banner */}
                {cat.image ? (
                  <div className="cat-card__img-wrap">
                    <img src={cat.image} alt={cat.name} className="cat-card__img" />
                    <div className="cat-card__img-overlay" style={{ background:`${cat.color}55` }} />
                  </div>
                ) : (
                  <div className="cat-card__bar" style={{ background:cat.color }} />
                )}

                <div className="cat-card__body">
                  <div className="cat-card__top">
                    {/* Icon circle — show image thumbnail or emoji fallback */}
                    <div
                      className="cat-card__icon"
                      style={{ background:`${cat.color}22`, border:`1px solid ${cat.color}44` }}>
                      {cat.image
                        ? <img src={cat.image} alt={cat.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10 }} />
                        : (cat.icon || '🗂️')
                      }
                    </div>
                    <div>
                      <div className="cat-card__name">{cat.name}</div>
                      <div className="cat-card__slug">/{cat.slug}</div>
                    </div>
                    <button
                      className={`status-btn${cat.isActive ? ' on' : ' off'}`}
                      style={{ marginLeft:'auto' }}
                      onClick={() => toggleActive(cat)}>
                      {cat.isActive ? 'Active' : 'Off'}
                    </button>
                  </div>
                  <p className="cat-card__desc">{cat.description}</p>
                  <div className="cat-card__stats">
                    <div className="cat-stat">
                      <span className="cat-stat__val">{cat.propertyCount ?? 0}</span>
                      <span className="cat-stat__lbl">Properties</span>
                    </div>
                    <div className="cat-stat">
                      <span className="cat-stat__val">#{cat.sortOrder}</span>
                      <span className="cat-stat__lbl">Order</span>
                    </div>
                    <div className="cat-stat">
                      <span className="cat-stat__val">
                        {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('en-GB') : '—'}
                      </span>
                      <span className="cat-stat__lbl">Created</span>
                    </div>
                  </div>
                  <div className="cat-card__actions">
                    <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => openEdit(cat)}>
                      ✏️ Edit
                    </button>
                    <button className="act-btn act-btn--del" onClick={() => openDel(cat)}>🗑</button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add new card */}
            <button className="cat-add" onClick={openAdd}>
              <div className="cat-add__plus">+</div>
              <span>Add Category</span>
            </button>
          </div>

          {/* ── TABLE VIEW ── */}
          <div>
            <div className="cat-tbl-title">All Categories</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Properties</th>
                    <th>Sort</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign:'center', padding:'40px 0', color:'#94a3b8' }}>
                        No categories found
                      </td>
                    </tr>
                  ) : filtered.map(cat => (
                    <tr key={cat._id}>
                      <td>
                        {cat.image
                          ? <img src={cat.image} alt={cat.name} style={{ width:44, height:36, objectFit:'cover', borderRadius:8, border:'1px solid var(--bdr)' }} />
                          : <span style={{ fontSize:22 }}>{cat.icon || '🗂️'}</span>
                        }
                      </td>
                      <td>
                        <div style={{ fontWeight:700, color:'var(--t1)', fontSize:13 }}>{cat.name}</div>
                        <div style={{ fontSize:11, color:'var(--t3)' }}>
                          {(cat.description || '').slice(0, 40)}{cat.description?.length > 40 ? '…' : ''}
                        </div>
                      </td>
                      <td style={{ color:'var(--t3)', fontSize:12, fontFamily:'monospace' }}>/{cat.slug}</td>
                      <td><span className="badge badge-blue">{cat.propertyCount ?? 0}</span></td>
                      <td style={{ color:'var(--t2)', fontSize:13 }}>#{cat.sortOrder}</td>
                      <td>
                        <span className={`badge ${cat.isActive ? 'badge-green' : 'badge-red'}`}>
                          {cat.isActive ? 'Active' : 'Off'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="act-btn act-btn--edit" onClick={() => openEdit(cat)}>✏️</button>
                          <button className="act-btn act-btn--del"  onClick={() => openDel(cat)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {modal === 'form' && (
        <Modal
          title={editing ? '✏️ Edit Category' : '🗂️ Add Category'}
          onClose={() => setModal(null)}>
          <div className="modal__body">
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* ── Image URL — shown at top ── */}
              <div className="form-group">
                <label className="form-label">Category Image</label>
                <ImageUrlInput
                  value={f.image}
                  onChange={img => setForm(x => ({ ...x, image: img }))}
                />
              </div>

              {/* Name */}
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Residential"
                  value={f.name}
                  onChange={e => setForm(x => ({ ...x, name:e.target.value, slug:toSlug(e.target.value) }))}
                />
              </div>

              {/* Slug */}
              <div className="form-group">
                <label className="form-label">
                  Slug <span style={{ color:'var(--t3)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(auto-generated)</span>
                </label>
                <input
                  className="form-input"
                  placeholder="auto-generated"
                  value={f.slug}
                  onChange={e => setForm(x => ({ ...x, slug:e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  className="form-input"
                  placeholder="Brief description"
                  value={f.description}
                  onChange={e => setForm(x => ({ ...x, description:e.target.value }))}
                />
              </div>

              {/* Accent Color */}
              <div className="form-group">
                <label className="form-label">Accent Color</label>
                <div className="color-picker">
                  {COLORS.map(col => (
                    <button
                      key={col}
                      type="button"
                      className={`color-picker__btn${f.color === col ? ' active' : ''}`}
                      style={{ background:col }}
                      onClick={() => setForm(x => ({ ...x, color:col }))}
                    />
                  ))}
                  <input
                    type="color"
                    value={f.color}
                    onChange={e => setForm(x => ({ ...x, color:e.target.value }))}
                    className="color-picker__custom"
                  />
                </div>
                <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:f.color, border:'1px solid var(--bdr2)', flexShrink:0 }} />
                  <span style={{ fontSize:12, color:'var(--t3)', fontFamily:'monospace' }}>{f.color}</span>
                </div>
              </div>

              {/* Sort order */}
              <div className="form-group">
                <label className="form-label">Sort Order</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  value={f.sortOrder}
                  onChange={e => setForm(x => ({ ...x, sortOrder:parseInt(e.target.value) || 1 }))}
                />
              </div>

              {/* Active */}
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={f.isActive}
                  onChange={e => setForm(x => ({ ...x, isActive:e.target.checked }))}
                />
                Active
              </label>
            </div>
          </div>

          <div className="modal__footer">
            <button className="btn btn-ghost" onClick={() => setModal(null)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving
                ? <><span className="spinner" /> Saving…</>
                : editing ? 'Save Changes' : 'Add Category'
              }
            </button>
          </div>
        </Modal>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {modal === 'delete' && editing && (
        <Modal title="🗑️ Delete Category" onClose={() => setModal(null)}>
          <div className="modal__body" style={{ textAlign:'center', paddingTop:24 }}>
            <div className="confirm-icon">🗂️</div>
            <div className="confirm-title">Delete "{editing.name}"?</div>
            <div className="confirm-sub">
              Properties under this category will not be deleted but may become uncategorised.
            </div>
          </div>
          <div className="modal__footer">
            <button className="btn btn-ghost" onClick={() => setModal(null)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={deleteCategory} disabled={saving}>
              {saving ? <><span className="spinner" /> Deleting…</> : 'Yes, Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
