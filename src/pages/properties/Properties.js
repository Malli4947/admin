import React, { useState, useEffect, useCallback } from 'react';
import api from '../../Utils/api';
import './Properties.css';

// ── Constants ──────────────────────────────────────────────────
const TYPES    = ['Residential','Commercial','Agriculture','Industrial','Luxury'];
const STATUSES = ['For Sale','For Rent','For Lease','Sold','Rented'];
const BADGES   = ['','Premium','Featured','Hot','New Launch','Commercial','Lease'];
const SUBTYPES = {
  Residential: ['Apartment','Villa','Row House','Duplex','Penthouse'],
  Commercial:  ['Office Space','Retail Shop','Showroom'],
  Agriculture: ['Farmhouse','Agricultural Land'],
  Industrial:  ['Warehouse','Factory'],
  Luxury:      ['Penthouse','Villa','Estate'],
};
const PRICE_RANGES = [
  { label:'Any Price',       min:'',         max:''          },
  { label:'Under ₹50 Lakh',  min:'',         max:'5000000'   },
  { label:'₹50L – ₹1 Cr',    min:'5000000',  max:'10000000'  },
  { label:'₹1 Cr – ₹2 Cr',   min:'10000000', max:'20000000'  },
  { label:'₹2 Cr – ₹5 Cr',   min:'20000000', max:'50000000'  },
  { label:'Above ₹5 Cr',     min:'50000000', max:''          },
];
const STATUS_BADGE = {
  'For Sale':'badge-green','For Rent':'badge-amber',
  'For Lease':'badge-purple','Sold':'badge-red','Rented':'badge-red',
};
const EMPTY_FORM = {
  title:'',description:'',price:'',priceLabel:'',priceType:'negotiable',
  type:'Residential',subtype:'Apartment',status:'For Sale',
  beds:'',baths:'',area:'',
  'location.address':'','location.locality':'','location.city':'Hyderabad',
  'location.state':'Telangana','location.pincode':'',
  developer:'',possession:'',rera:'',badge:'',
  featured:false,isActive:true,amenities:'',images:[],
};

// ── Modal ──────────────────────────────────────────────────────
function Modal({ title, onClose, children, size='' }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  return (
    <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div className={`modal${size ? ` modal-${size}` : ''}`}>
        <div className="modal__header">
          <span className="modal__title">{title}</span>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────
function Toast({ msg, type='success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast toast--${type}`}>
      <span>{type==='success' ? '✅' : '❌'}</span>
      <span style={{flex:1}}>{msg}</span>
      <button onClick={onClose} style={{background:'none',border:'none',color:'inherit',fontSize:16,cursor:'pointer',marginLeft:8}}>✕</button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function Properties() {

  // ── State: data
  const [properties, setProperties] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);

  // ── State: filters
  const [search,    setSearch]    = useState('');
  const [fType,     setFType]     = useState('');
  const [fStatus,   setFStatus]   = useState('');
  const [fBadge,    setFBadge]    = useState('');
  const [fFeatured, setFeatured]  = useState('');
  const [fActive,   setFActive]   = useState('');   // '' | 'true' | 'false'
  const [fPrice,    setFPrice]    = useState({ min:'', max:'' });
  const [sort,      setSort]      = useState('-createdAt');
  const [page,      setPage]      = useState(1);
  const PER = 10;

  // ── State: modal
  const [modal,    setModal]    = useState(null);  // 'form'|'view'|'delete'
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [imgInput, setImgInput] = useState('');

  // ── Reset page on filter change
  useEffect(() => { setPage(1); }, [search, fType, fStatus, fBadge, fFeatured, fActive, fPrice, sort]);

  // ── Fetch from API ─────────────────────────────────────────
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();

      // Always pass showAll=true so admin sees ALL properties
      p.set('showAll', 'true');

      // Only add filters that have real values
      if (fType.trim())     p.set('type',    fType);
      if (fStatus.trim())   p.set('status',  fStatus);
      if (fBadge.trim())    p.set('badge',   fBadge);
      if (fFeatured !== '') p.set('featured', fFeatured);
      if (fActive   !== '') p.set('isActive', fActive);
      if (fPrice.min)       p.set('minPrice', fPrice.min);
      if (fPrice.max)       p.set('maxPrice', fPrice.max);
      if (search.trim())    p.set('search',  search.trim());
      p.set('sort',  sort);
      p.set('page',  page);
      p.set('limit', PER);

      const data = await api.get(`/properties?${p.toString()}`);

      if (data.success) {
        setProperties(data.properties || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } else {
        showToast(data.message || 'Failed to load properties', 'error');
      }
    } catch (err) {
      showToast('Network error — is the backend running on port 5000?', 'error');
    }
    setLoading(false);
  }, [fType, fStatus, fBadge, fFeatured, fActive, fPrice, search, sort, page]);

  // ── Fetch stats ────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get('/properties/stats');
      if (data.success) setStats(data.stats);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Helpers ────────────────────────────────────────────────
  const showToast = (msg, type='success') => setToast({ msg, type });

  const activeFilterCount = [fType, fStatus, fBadge, fFeatured, fActive, fPrice.min, fPrice.max, search.trim()]
    .filter(Boolean).length;

  const clearFilters = () => {
    setSearch(''); setFType(''); setFStatus(''); setFBadge('');
    setFeatured(''); setFActive('');
    setFPrice({ min:'', max:'' }); setPage(1);
  };

  // ── Modal open helpers ─────────────────────────────────────
  const openAdd = () => { setForm(EMPTY_FORM); setEditing(null); setImgInput(''); setModal('form'); };

  const openEdit = (p) => {
    setForm({
      title:              p.title || '',
      description:        p.description || '',
      price:              p.price != null ? String(p.price) : '',
      priceLabel:         p.priceLabel || '',
      priceType:          p.priceType || 'negotiable',
      type:               p.type || 'Residential',
      subtype:            p.subtype || '',
      status:             p.status || 'For Sale',
      beds:               p.beds  != null ? String(p.beds)  : '',
      baths:              p.baths != null ? String(p.baths) : '',
      area:               p.area || '',
      'location.address':  p.location?.address  || '',
      'location.locality': p.location?.locality || '',
      'location.city':     p.location?.city     || 'Hyderabad',
      'location.state':    p.location?.state    || 'Telangana',
      'location.pincode':  p.location?.pincode  || '',
      developer:  p.developer  || '',
      possession: p.possession || '',
      rera:       p.rera       || '',
      badge:      p.badge      || '',
      featured:   !!p.featured,
      isActive:   p.isActive !== undefined ? p.isActive : true,
      amenities:  Array.isArray(p.amenities) ? p.amenities.join(', ') : '',
      images:     Array.isArray(p.images) ? p.images : [],
    });
    setEditing(p); setImgInput(''); setModal('form');
  };

  const openView  = (p) => { setEditing(p); setModal('view'); };
  const openDel   = (p) => { setEditing(p); setModal('delete'); };
  const closeModal = () => { setModal(null); setEditing(null); };

  // ── Save (create or update) ────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim())               return showToast('Title is required', 'error');
    if (!form.price)                      return showToast('Price is required', 'error');
    if (!form['location.address'].trim()) return showToast('Address is required', 'error');
    if (!form['location.locality'].trim())return showToast('Locality is required', 'error');
    if (!form.area.trim())                return showToast('Area is required', 'error');

    const payload = {
      title:       form.title.trim(),
      description: form.description.trim(),
      price:       parseFloat(form.price) || 0,
      priceLabel:  form.priceLabel.trim(),
      priceType:   form.priceType,
      type:        form.type,
      subtype:     form.subtype,
      status:      form.status,
      beds:        form.beds  ? parseInt(form.beds)  : null,
      baths:       form.baths ? parseInt(form.baths) : null,
      area:        form.area.trim(),
      location: {
        address:  form['location.address'].trim(),
        locality: form['location.locality'].trim(),
        city:     form['location.city'].trim(),
        state:    form['location.state'].trim(),
        pincode:  form['location.pincode'].trim(),
      },
      amenities:  form.amenities.split(',').map(a => a.trim()).filter(Boolean),
      developer:  form.developer.trim(),
      possession: form.possession.trim(),
      rera:       form.rera.trim(),
      badge:      form.badge || null,
      featured:   form.featured,
      isActive:   form.isActive,
      images:     form.images,
    };

    setSaving(true);
    try {
      const data = editing
        ? await api.put(`/properties/${editing._id}`, payload)
        : await api.post('/properties', payload);

      if (data.success) {
        showToast(editing ? 'Property updated!' : 'Property created!');
        closeModal();
        fetchProperties();
        fetchStats();
      } else {
        showToast(data.message || 'Save failed', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    setSaving(false);
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async () => {
    setSaving(true);
    try {
      const data = await api.delete(`/properties/${editing._id}`);
      if (data.success) {
        showToast('Property removed');
        closeModal();
        fetchProperties();
        fetchStats();
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    setSaving(false);
  };

  // ── Restore deleted property ───────────────────────────────
  const handleRestore = async (p) => {
    try {
      const data = await api.put(`/properties/${p._id}`, { isActive: true });
      if (data.success) {
        showToast('Property restored ✅');
        fetchProperties();
        fetchStats();
      }
    } catch { showToast('Restore failed', 'error'); }
  };

  // ── Inline toggles ─────────────────────────────────────────
  const toggleField = async (p, field) => {
    const update = { [field]: !p[field] };
    try {
      const data = await api.put(`/properties/${p._id}`, update);
      if (data.success) {
        setProperties(prev => prev.map(x => x._id === p._id ? { ...x, [field]: !x[field] } : x));
        if (field === 'featured') fetchStats();
      }
    } catch { showToast('Update failed', 'error'); }
  };

  // ── Image helpers ──────────────────────────────────────────
  const addImage = () => {
    if (!imgInput.trim()) return;
    const isFirst = form.images.length === 0;
    setForm(f => ({ ...f, images: [...f.images, { url: imgInput.trim(), isPrimary: isFirst, caption: '' }] }));
    setImgInput('');
  };
  const removeImage = (idx) => {
    setForm(f => {
      const imgs = f.images.filter((_,i) => i !== idx);
      if (imgs.length > 0) imgs[0] = { ...imgs[0], isPrimary: true };
      return { ...f, images: imgs };
    });
  };

  const f = form;

  return (
    <div className="page a-up">

      {/* ── Stat cards ────────────────────────────────── */}
      {stats && (
        <div className="prop-stats">
          {[
            { label:'Total',    val: stats.totalAll,  icon:'🏘️',  color:'var(--blue)'  },
            { label:'Active',   val: stats.total,     icon:'✅',  color:'var(--green)' },
            { label:'Inactive', val: stats.inactive,  icon:'🔴',  color:'var(--red)'   },
            { label:'Featured', val: properties.filter(p=>p.featured).length, icon:'⭐', color:'var(--gold)' },
          ].map((s,i) => (
            <div key={s.label} className={`prop-stat card a-up d${i+1}`}>
              <span className="prop-stat__icon">{s.icon}</span>
              <span className="prop-stat__val" style={{color: s.color}}>{s.val}</span>
              <span className="prop-stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Header ────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Properties</h1>
          <p className="page-sub">
            {loading ? 'Loading…' : `${total} total`}
            {activeFilterCount > 0 && (
              <span className="filter-count"> · {activeFilterCount} filter{activeFilterCount>1?'s':''} active</span>
            )}
          </p>
        </div>
        <div style={{display:'flex', gap:10, flexWrap:'wrap', alignItems:'center'}}>
          {activeFilterCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear Filters</button>
          )}
          <button className="btn btn-primary" onClick={openAdd}>+ Add Property</button>
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────── */}
      <div className="card" style={{padding:'16px 20px'}}>
        <div style={{display:'flex', flexWrap:'wrap', gap:10, alignItems:'center'}}>

          {/* Search */}
          <div className="search-bar" style={{flex:'1 1 200px', minWidth:180}}>
            <span className="search-bar__icon">🔍</span>
            <input
              placeholder="Search title, locality, developer…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{background:'none',border:'none',cursor:'pointer',color:'var(--t3)',fontSize:14}}>✕</button>
            )}
          </div>

          {/* Type */}
          <select className="form-input form-select" style={{width:150}} value={fType}
            onChange={e => setFType(e.target.value)}>
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Status */}
          <select className="form-input form-select" style={{width:150}} value={fStatus}
            onChange={e => setFStatus(e.target.value)}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Badge */}
          <select className="form-input form-select" style={{width:140}} value={fBadge}
            onChange={e => setFBadge(e.target.value)}>
            <option value="">All Badges</option>
            {BADGES.filter(Boolean).map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          {/* Price range */}
          <select className="form-input form-select" style={{width:160}}
            value={`${fPrice.min}|${fPrice.max}`}
            onChange={e => { const [min,max]=e.target.value.split('|'); setFPrice({min,max}); }}>
            {PRICE_RANGES.map(r => (
              <option key={r.label} value={`${r.min}|${r.max}`}>{r.label}</option>
            ))}
          </select>

          {/* Featured */}
          <select className="form-input form-select" style={{width:145}} value={fFeatured}
            onChange={e => setFeatured(e.target.value)}>
            <option value="">All: Featured</option>
            <option value="true">⭐ Featured Only</option>
            <option value="false">Not Featured</option>
          </select>

          {/* Active / Inactive */}
          <select className="form-input form-select" style={{width:145}} value={fActive}
            onChange={e => setFActive(e.target.value)}>
            <option value="">Active + Inactive</option>
            <option value="true">✅ Active Only</option>
            <option value="false">🔴 Inactive Only</option>
          </select>

          {/* Sort */}
          <select className="form-input form-select" style={{width:170}} value={sort}
            onChange={e => setSort(e.target.value)}>
            <option value="-createdAt">Newest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="-price">Price: High → Low</option>
            <option value="price">Price: Low → High</option>
            <option value="-views">Most Viewed</option>
            <option value="-enquiries">Most Enquiries</option>
          </select>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────── */}
      {loading ? (
        <div className="card" style={{padding:'48px 0', textAlign:'center'}}>
          <div style={{display:'inline-flex', alignItems:'center', gap:12, color:'var(--t2)'}}>
            <div className="spinner spinner-gold" style={{width:26,height:26,borderWidth:3}} />
            <span style={{fontSize:15}}>Loading properties…</span>
          </div>
        </div>
      ) : properties.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state__icon">🏚️</div>
          <div className="empty-state__title">No properties found</div>
          <div className="empty-state__sub">
            {activeFilterCount > 0
              ? 'No results match the current filters. Try removing some.'
              : 'Add your first property to get started.'}
          </div>
          {activeFilterCount > 0 && (
            <button className="btn btn-ghost btn-sm" style={{marginTop:10}} onClick={clearFilters}>
              ✕ Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Property</th>
                <th>Type</th>
                <th>Status</th>
                <th>Price</th>
                <th>Location</th>
                <th>Views</th>
                <th>Featured</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(p => (
                <tr key={p._id} style={!p.isActive ? {opacity:0.55} : {}}>

                  {/* Property */}
                  <td>
                    <div className="prop-cell">
                      {p.image
                        ? <img src={p.image} alt={p.title} className="prop-cell__img" />
                        : <div className="prop-cell__img" style={{background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🏠</div>
                      }
                      <div>
                        <div className="prop-cell__title">{p.title}</div>
                        <div className="prop-cell__sub">
                          {p.subtype}
                          {p.badge && (
                            <span className="badge badge-gold" style={{marginLeft:5,fontSize:9,padding:'2px 6px'}}>{p.badge}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td><span className="badge badge-blue">{p.type}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[p.status]||'badge-gold'}`}>{p.status}</span></td>
                  <td style={{fontWeight:700,color:'var(--gold)',fontSize:13,whiteSpace:'nowrap'}}>
                    {p.priceLabel || `₹${(p.price||0).toLocaleString('en-IN')}`}
                  </td>
                  <td style={{color:'var(--t2)',fontSize:12}}>{p.location?.locality || '—'}</td>
                  <td style={{color:'var(--t3)',fontSize:13}}>👁 {p.views || 0}</td>

                  {/* Featured toggle */}
                  <td>
                    <button
                      className={`status-btn ${p.featured ? 'on' : 'off'}`}
                      onClick={() => toggleField(p, 'featured')}
                      title={p.featured ? 'Remove from featured' : 'Mark as featured'}
                      style={{minWidth:56}}
                    >
                      {p.featured ? '⭐ Yes' : 'No'}
                    </button>
                  </td>

                  {/* Active toggle */}
                  <td>
                    <button
                      className={`status-btn ${p.isActive ? 'on' : 'off'}`}
                      onClick={() => p.isActive ? toggleField(p,'isActive') : handleRestore(p)}
                      style={{minWidth:68}}
                    >
                      {p.isActive ? 'Active' : '↩ Restore'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="action-btns">
                      <button className="act-btn act-btn--view" title="View details" onClick={() => openView(p)}>👁</button>
                      <button className="act-btn act-btn--edit" title="Edit"         onClick={() => openEdit(p)}>✏️</button>
                      <button className="act-btn act-btn--del"  title="Delete"       onClick={() => openDel(p)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ────────────────────────────────── */}
      {!loading && pages > 1 && (
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
          <span style={{fontSize:13,color:'var(--t2)'}}>
            Showing {((page-1)*PER)+1}–{Math.min(page*PER, total)} of {total}
          </span>
          <div className="pagination">
            <button className="page-btn" disabled={page===1}     onClick={() => setPage(1)}>«</button>
            <button className="page-btn" disabled={page===1}     onClick={() => setPage(p=>p-1)}>‹</button>
            {Array.from({length: Math.min(pages,7)}, (_,i) => {
              const pg = pages<=7 ? i+1 : page<=4 ? i+1 : page+i-3;
              if (pg<1||pg>pages) return null;
              return <button key={pg} className={`page-btn${page===pg?' active':''}`} onClick={()=>setPage(pg)}>{pg}</button>;
            })}
            <button className="page-btn" disabled={page===pages} onClick={() => setPage(p=>p+1)}>›</button>
            <button className="page-btn" disabled={page===pages} onClick={() => setPage(pages)}>»</button>
          </div>
        </div>
      )}

      {/* ══ ADD / EDIT MODAL ════════════════════════════ */}
      {modal==='form' && (
        <Modal title={editing ? '✏️ Edit Property' : '🏘️ Add New Property'} onClose={closeModal} size="lg">
          <div className="modal__body">
            <div className="form-grid">

              <div className="form-group form-full">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="e.g. Casa Luxura Penthouse"
                  value={f.title} onChange={e=>setForm(x=>({...x,title:e.target.value}))} />
              </div>

              <div className="form-group">
                <label className="form-label">Property Type *</label>
                <select className="form-input form-select" value={f.type}
                  onChange={e=>setForm(x=>({...x,type:e.target.value,subtype:''}))}>
                  {TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sub-type *</label>
                <select className="form-input form-select" value={f.subtype}
                  onChange={e=>setForm(x=>({...x,subtype:e.target.value}))}>
                  <option value="">Select sub-type</option>
                  {(SUBTYPES[f.type]||[]).map(s=><option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Listing Status</label>
                <select className="form-input form-select" value={f.status}
                  onChange={e=>setForm(x=>({...x,status:e.target.value}))}>
                  {STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Badge</label>
                <select className="form-input form-select" value={f.badge}
                  onChange={e=>setForm(x=>({...x,badge:e.target.value}))}>
                  {BADGES.map(b=><option key={b} value={b}>{b||'None'}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
                <input type="number" className="form-input" placeholder="42000000"
                  value={f.price} onChange={e=>setForm(x=>({...x,price:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Price Label</label>
                <input className="form-input" placeholder="₹4.2 Cr"
                  value={f.priceLabel} onChange={e=>setForm(x=>({...x,priceLabel:e.target.value}))} />
              </div>

              <div className="form-group">
                <label className="form-label">Bedrooms</label>
                <input type="number" className="form-input" placeholder="4"
                  value={f.beds} onChange={e=>setForm(x=>({...x,beds:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Bathrooms</label>
                <input type="number" className="form-input" placeholder="3"
                  value={f.baths} onChange={e=>setForm(x=>({...x,baths:e.target.value}))} />
              </div>
              <div className="form-group form-full">
                <label className="form-label">Area *</label>
                <input className="form-input" placeholder="4,200 sq.ft"
                  value={f.area} onChange={e=>setForm(x=>({...x,area:e.target.value}))} />
              </div>

              {/* Location section */}
              <div className="form-group form-full">
                <div style={{fontSize:12,fontWeight:700,color:'var(--gold)',textTransform:'uppercase',letterSpacing:1,marginBottom:2}}>📍 Location</div>
              </div>
              <div className="form-group form-full">
                <label className="form-label">Full Address *</label>
                <input className="form-input" placeholder="Road No. 10, Banjara Hills"
                  value={f['location.address']} onChange={e=>setForm(x=>({...x,'location.address':e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Locality *</label>
                <input className="form-input" placeholder="Banjara Hills"
                  value={f['location.locality']} onChange={e=>setForm(x=>({...x,'location.locality':e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" placeholder="Hyderabad"
                  value={f['location.city']} onChange={e=>setForm(x=>({...x,'location.city':e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" placeholder="Telangana"
                  value={f['location.state']} onChange={e=>setForm(x=>({...x,'location.state':e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input className="form-input" placeholder="500034"
                  value={f['location.pincode']} onChange={e=>setForm(x=>({...x,'location.pincode':e.target.value}))} />
              </div>

              <div className="form-group">
                <label className="form-label">Developer</label>
                <input className="form-input" placeholder="Rajapushpa Group"
                  value={f.developer} onChange={e=>setForm(x=>({...x,developer:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Possession</label>
                <input className="form-input" placeholder="Ready to Move"
                  value={f.possession} onChange={e=>setForm(x=>({...x,possession:e.target.value}))} />
              </div>
              <div className="form-group form-full">
                <label className="form-label">RERA No.</label>
                <input className="form-input" placeholder="P02400003987"
                  value={f.rera} onChange={e=>setForm(x=>({...x,rera:e.target.value}))} />
              </div>

              <div className="form-group form-full">
                <label className="form-label">Amenities (comma separated)</label>
                <input className="form-input" placeholder="Swimming Pool, Gym, Clubhouse"
                  value={f.amenities} onChange={e=>setForm(x=>({...x,amenities:e.target.value}))} />
              </div>

              <div className="form-group form-full">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" rows={4} placeholder="Describe the property…"
                  value={f.description} onChange={e=>setForm(x=>({...x,description:e.target.value}))} />
              </div>

              {/* Images */}
              <div className="form-group form-full">
                <label className="form-label">Images — add URL then press Enter or + Add</label>
                <div style={{display:'flex',gap:8}}>
                  <input className="form-input" placeholder="https://images.unsplash.com/…"
                    value={imgInput} onChange={e=>setImgInput(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addImage())} />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addImage} style={{whiteSpace:'nowrap'}}>+ Add</button>
                </div>
                {f.images.length > 0 && (
                  <div style={{marginTop:10,display:'flex',flexWrap:'wrap',gap:8}}>
                    {f.images.map((img,i)=>(
                      <div key={i} style={{position:'relative',width:80,height:60}}>
                        <img src={img.url} alt="" style={{width:80,height:60,objectFit:'cover',borderRadius:8,border:'1px solid var(--bdr2)'}} />
                        {img.isPrimary&&<span style={{position:'absolute',top:2,left:2,background:'var(--gold)',color:'var(--navy)',fontSize:8,fontWeight:700,padding:'1px 5px',borderRadius:4}}>PRIMARY</span>}
                        <button onClick={()=>removeImage(i)} style={{position:'absolute',top:2,right:2,background:'rgba(220,38,38,.85)',color:'#fff',border:'none',borderRadius:'50%',width:16,height:16,fontSize:9,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkboxes */}
              <div className="form-group form-full" style={{flexDirection:'row',gap:24,flexWrap:'wrap'}}>
                <label className="check-label">
                  <input type="checkbox" checked={f.featured} onChange={e=>setForm(x=>({...x,featured:e.target.checked}))} />
                  ⭐ Mark as Featured
                </label>
                <label className="check-label">
                  <input type="checkbox" checked={f.isActive} onChange={e=>setForm(x=>({...x,isActive:e.target.checked}))} />
                  ✅ Active Listing
                </label>
              </div>

            </div>
          </div>
          <div className="modal__footer">
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : editing ? '💾 Save Changes' : '🏘️ Add Property'}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ VIEW MODAL ════════════════════════════════════ */}
      {modal==='view' && editing && (
        <Modal title="👁 Property Details" onClose={closeModal} size="lg">
          <div className="modal__body">
            {editing.image && (
              <img src={editing.image} alt={editing.title}
                style={{width:'100%',height:190,objectFit:'cover',borderRadius:12,marginBottom:14}} />
            )}
            <div style={{marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <h3 style={{fontSize:17,fontWeight:800,color:'var(--t1)'}}>{editing.title}</h3>
                {editing.badge && <span className="badge badge-gold">{editing.badge}</span>}
                {!editing.isActive && <span className="badge badge-red">Inactive</span>}
              </div>
              <p style={{fontSize:13,color:'var(--t2)',lineHeight:1.6}}>{editing.description}</p>
            </div>
            <div className="view-grid">
              {[
                ['Type',       editing.type],
                ['Sub-type',   editing.subtype],
                ['Status',     editing.status],
                ['Price',      editing.priceLabel || `₹${(editing.price||0).toLocaleString('en-IN')}`],
                ['Area',       editing.area],
                ['Beds',       editing.beds ?? '—'],
                ['Baths',      editing.baths ?? '—'],
                ['Address',    editing.location?.address || '—'],
                ['Locality',   editing.location?.locality || '—'],
                ['City',       editing.location?.city || '—'],
                ['Developer',  editing.developer || '—'],
                ['Possession', editing.possession || '—'],
                ['RERA',       editing.rera || '—'],
                ['Views',      editing.views || 0],
                ['Enquiries',  editing.enquiries || 0],
                ['Featured',   editing.featured ? 'Yes ⭐' : 'No'],
                ['Active',     editing.isActive ? 'Yes ✅' : 'No ❌'],
              ].map(([k,v]) => (
                <div key={k} className="view-row">
                  <span className="view-row__key">{k}</span>
                  <span className="view-row__val">{String(v)}</span>
                </div>
              ))}
            </div>
            {editing.amenities?.length > 0 && (
              <div style={{marginTop:14}}>
                <div className="form-label" style={{marginBottom:8}}>Amenities</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {editing.amenities.map(a=><span key={a} className="badge badge-blue">{a}</span>)}
                </div>
              </div>
            )}
          </div>
          <div className="modal__footer">
            <button className="btn btn-ghost" onClick={closeModal}>Close</button>
            <button className="btn btn-primary" onClick={()=>{closeModal();setTimeout(()=>openEdit(editing),50);}}>✏️ Edit</button>
          </div>
        </Modal>
      )}

      {/* ══ DELETE CONFIRM ═══════════════════════════════ */}
      {modal==='delete' && editing && (
        <Modal title="🗑️ Delete Property" onClose={closeModal}>
          <div className="modal__body">
            <div className="confirm-icon">🏚️</div>
            <div className="confirm-title">Delete "{editing.title}"?</div>
            <div className="confirm-sub">
              This will soft-delete the property (mark as inactive). You can restore it later using the Restore button in the table.
            </div>
          </div>
          <div className="modal__footer">
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              {saving ? <><span className="spinner" /> Deleting…</> : '🗑 Yes, Delete'}
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}