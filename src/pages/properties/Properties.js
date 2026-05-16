import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import api from '../../Utils/api';
import './Properties.css';

// ── Constants ──────────────────────────────────────────────────
const TYPES    = ['Residential','Commercial','Agriculture','Open Plots'];
const STATUSES = ['For Sale','For Rent','For Lease','Sold','Rented'];
const BADGES   = ['','Premium','Ultra Premium','Luxury','Ultra Luxury','Featured','Hot'];
const PROJECT_STATUSES = ['','Ready to Move','Pre-Launch','Under Construction','OC Received'];
const FACING_OPTIONS = [
  { label:'None',       value:'' },
  { label:'East',       value:'East'      },
  { label:'West',       value:'West'      },
  { label:'North',      value:'North'     },
  { label:'South',      value:'South'     },
  { label:'E, W, N & S',value:'E, W, N & S'},
  { label:'E & W',      value:'E & W'     },
  { label:'E, W & N',   value:'E, W & N'  },
];
const PLOT_TYPES = ['','Commercial','Residential','Lease'];
const SUBTYPES = {
  Residential:  ['Apartment','Villa','Open Plots'],
  Commercial:   ['Office Space','Retail Shop','Showroom'],
  Agriculture:  ['Farmhouse','Agricultural Land'],
  'Open Plots': ['Residential Plot','Commercial Plot','Farm Plot'],
};
const PRICE_RANGES = [
  { label:'Any Price',      min:'',        max:''         },
  { label:'Under ₹50 Lakh', min:'',        max:'5000000'  },
  { label:'₹50L – ₹1 Cr',   min:'5000000', max:'10000000' },
  { label:'₹1 Cr – ₹2 Cr',  min:'10000000',max:'20000000' },
  { label:'₹2 Cr – ₹5 Cr',  min:'20000000',max:'50000000' },
  { label:'Above ₹5 Cr',    min:'50000000',max:''         },
];
const STATUS_BADGE = {
  'For Sale':'badge-green','For Rent':'badge-amber',
  'For Lease':'badge-purple','Sold':'badge-red','Rented':'badge-red',
};
const EMPTY_FORM = {
  title:'', description:'',
  type:'Residential', subtype:'Apartment', status:'For Sale',
  projectStatus:'',
  'location.address':'', 'location.locality':'', 'location.city':'Hyderabad',
  'location.state':'Telangana', 'location.pincode':'',
  developer:'', possession:'', rera:'', badge:'',
  featured: false, isActive: true,
  amenities:'', images:[], brochureLink:'',
  // Project / plot details
  facing:'', acres:'', floors:'', totalUnits:'',
  minSft:'', maxSft:'', unitType:'', pricePerSft:'',
  totalPrice:'',
  // Open Plots specific
  totalPlots:'', plotType:'', minSqy:'', maxSqy:'',
  pricePerSqy:'', plotPossession:'',
};

// ── Modal ──────────────────────────────────────────────────────
function Modal({ title, onClose, children, size='' }) {
  const wrapRef = React.useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (wrapRef.current) {
      const body = wrapRef.current.querySelector('.modal__body');
      if (body) body.scrollTop = 0;
    }
  }, []);

  return ReactDOM.createPortal(
    <div className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal${size ? ` modal-${size}` : ''}`} ref={wrapRef}>
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

// ── Toast ──────────────────────────────────────────────────────
function Toast({ msg, type='success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast toast--${type}`}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      <span style={{flex:1}}>{msg}</span>
      <button onClick={onClose}
        style={{background:'none',border:'none',color:'inherit',fontSize:16,cursor:'pointer',marginLeft:8}}>
        ✕
      </button>
    </div>
  );
}

// ── Image Gallery ─────────────────────────────────────────────
function ImageGallery({ images, fallback }) {
  const [active, setActive] = useState(0);
  const imgs = (images || []).map(img => typeof img === 'string' ? img : img.url).filter(Boolean);

  if (!imgs.length && fallback)
    return <img src={fallback} alt="property"
      style={{width:'100%',height:300,objectFit:'cover',borderRadius:12,marginBottom:14}} />;
  if (!imgs.length) return null;

  return (
    <div style={{marginBottom:16}}>
      {/* Main */}
      <div style={{position:'relative',borderRadius:12,overflow:'hidden',height:320,
        background:'var(--bg3)',marginBottom:8,boxShadow:'0 4px 20px rgba(0,0,0,0.10)'}}>
        <img src={imgs[active]} alt={`prop-${active+1}`}
          style={{width:'100%',height:'100%',objectFit:'cover',transition:'opacity 0.2s'}} />
        <span style={{position:'absolute',bottom:10,right:10,
          background:'rgba(0,0,0,0.60)',color:'#fff',fontSize:12,fontWeight:700,
          padding:'4px 10px',borderRadius:16,letterSpacing:0.5}}>
          {active+1} / {imgs.length}
        </span>
        {imgs.length > 1 && (<>
          <button onClick={() => setActive(a => (a-1+imgs.length) % imgs.length)}
            className="gallery-arrow gallery-arrow--prev">‹</button>
          <button onClick={() => setActive(a => (a+1) % imgs.length)}
            className="gallery-arrow gallery-arrow--next">›</button>
        </>)}
      </div>
      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:2,scrollbarWidth:'none'}}>
          {imgs.map((url,i) => (
            <div key={i} onClick={() => setActive(i)}
              style={{flexShrink:0,width:68,height:52,borderRadius:8,overflow:'hidden',
                cursor:'pointer',transition:'all 0.15s',
                border: i===active ? '2.5px solid var(--gold)' : '2px solid transparent',
                opacity: i===active ? 1 : 0.55}}>
              <img src={url} alt={`t-${i}`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────
function SectionTitle({ icon, label }) {
  return (
    <div className="form-group form-full">
      <div className="form-section-title">{icon} {label}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);

  // Filters
  const [search,    setSearch]   = useState('');
  const [fType,     setFType]    = useState('');
  const [fStatus,   setFStatus]  = useState('');
  const [fBadge,    setFBadge]   = useState('');
  const [fFeatured, setFeatured] = useState('');
  const [fActive,   setFActive]  = useState('');
  const [fPrice,    setFPrice]   = useState({ min:'', max:'' });
  const [sort,      setSort]     = useState('-createdAt');
  const [page,      setPage]     = useState(1);
  const PER = 10;

  // Modal
  const [modal,   setModal]   = useState(null);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY_FORM);

  // Upload — replaced with URL input
  const [urlDraft, setUrlDraft] = useState('');

  const addImageUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    setForm(x => {
      const newImg = { url, publicId: '', isPrimary: x.images.length === 0, caption: '' };
      return { ...x, images: [...x.images, newImg] };
    });
    setUrlDraft('');
  };

  useEffect(() => { setPage(1); },
    [search, fType, fStatus, fBadge, fFeatured, fActive, fPrice, sort]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      p.set('showAll','true');
      if (fType.trim())     p.set('type',     fType);
      if (fStatus.trim())   p.set('status',   fStatus);
      if (fBadge.trim())    p.set('badge',    fBadge);
      if (fFeatured !== '') p.set('featured', fFeatured);
      if (fActive   !== '') p.set('isActive', fActive);
      if (fPrice.min)       p.set('minPrice', fPrice.min);
      if (fPrice.max)       p.set('maxPrice', fPrice.max);
      if (search.trim())    p.set('search',   search.trim());
      p.set('sort', sort); p.set('page', page); p.set('limit', PER);
      const data = await api.get(`/api/properties?${p.toString()}`);
      if (data.success) {
        setProperties(data.properties || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } else showToast(data.message || 'Failed to load', 'error');
    } catch { showToast('Network error — is backend running?', 'error'); }
    setLoading(false);
  }, [fType, fStatus, fBadge, fFeatured, fActive, fPrice, search, sort, page]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get('/api/properties/stats');
      if (data.success) setStats(data.stats);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);
  useEffect(() => { fetchStats(); },      [fetchStats]);

  const showToast = (msg, type='success') => setToast({ msg, type });

  const activeFilterCount = [fType, fStatus, fBadge, fFeatured, fActive, fPrice.min, fPrice.max, search.trim()]
    .filter(Boolean).length;

  const clearFilters = () => {
    setSearch(''); setFType(''); setFStatus(''); setFBadge('');
    setFeatured(''); setFActive(''); setFPrice({ min:'', max:'' }); setPage(1);
  };

  const openAdd  = () => { setForm(EMPTY_FORM); setEditing(null); setUrlDraft(''); setModal('form'); };
  const openEdit = (p) => {
    setForm({
      title:               p.title || '',
      description:         p.description || '',
      type:                p.type || 'Residential',
      subtype:             p.subtype || '',
      status:              p.status || 'For Sale',
      projectStatus:       p.projectStatus || '',
      'location.address':  p.location?.address  || '',
      'location.locality': p.location?.locality || '',
      'location.city':     p.location?.city     || 'Hyderabad',
      'location.state':    p.location?.state    || 'Telangana',
      'location.pincode':  p.location?.pincode  || '',
      developer:    p.developer   || '',
      possession:   p.possession  || '',
      rera:         p.rera        || '',
      badge:        p.badge       || '',
      featured:     !!p.featured,
      isActive:     p.isActive !== undefined ? p.isActive : true,
      amenities:    Array.isArray(p.amenities) ? p.amenities.join(', ') : '',
      images:       Array.isArray(p.images) ? p.images : [],
      brochureLink: p.brochureLink || '',
      facing:       p.facing      || '',
      acres:        p.acres        != null ? String(p.acres)       : '',
      floors:       p.floors       != null ? String(p.floors)      : '',
      totalUnits:   p.totalUnits   != null ? String(p.totalUnits)  : '',
      minSft:       p.minSft       != null ? String(p.minSft)      : '',
      maxSft:       p.maxSft       != null ? String(p.maxSft)      : '',
      unitType:     p.unitType     || '',
      pricePerSft:  p.pricePerSft  != null ? String(p.pricePerSft) : '',
      totalPrice:   p.totalPrice   != null ? String(p.totalPrice)  : '',
      totalPlots:   p.totalPlots   != null ? String(p.totalPlots)  : '',
      plotType:     p.plotType     || '',
      minSqy:       p.minSqy       != null ? String(p.minSqy)      : '',
      maxSqy:       p.maxSqy       != null ? String(p.maxSqy)      : '',
      pricePerSqy:  p.pricePerSqy  != null ? String(p.pricePerSqy) : '',
      plotPossession: p.plotPossession || '',
    });
    setEditing(p); setUrlDraft(''); setModal('form');
  };
  const openView   = (p) => { setEditing(p); setModal('view'); };
  const openDel    = (p) => { setEditing(p); setModal('delete'); };
  const closeModal = ()  => { setModal(null); setEditing(null); };

  const removeImage = (idx) => {
    setForm(f => {
      const imgs = f.images.filter((_,i) => i !== idx);
      if (imgs.length > 0) imgs[0] = { ...imgs[0], isPrimary: true };
      return { ...f, images: imgs };
    });
  };

  const handleSave = async () => {
    if (!form.title.trim())                return showToast('Title is required', 'error');
    if (!form['location.address'].trim())  return showToast('Address is required', 'error');
    if (!form['location.locality'].trim()) return showToast('Locality is required', 'error');

    const payload = {
      title:         form.title.trim(),
      description:   form.description.trim(),
      type:          form.type,
      subtype:       form.subtype,
      status:        form.status,
      projectStatus: form.projectStatus || null,
      location: {
        address:  form['location.address'].trim(),
        locality: form['location.locality'].trim(),
        city:     form['location.city'].trim(),
        state:    form['location.state'].trim(),
        pincode:  form['location.pincode'].trim(),
      },
      amenities:   form.amenities.split(',').map(a => a.trim()).filter(Boolean),
      developer:   form.developer.trim(),
      possession:  form.possession.trim(),
      rera:        form.rera.trim(),
      badge:       form.badge || null,
      featured:    form.featured,
      isActive:    form.isActive,
      images:      form.images,
      brochureLink: form.brochureLink.trim() || null,
      facing:      form.facing      || null,
      acres:       form.acres       ? parseFloat(form.acres)       : null,
      floors:      form.floors      ? parseInt(form.floors)        : null,
      totalUnits:  form.totalUnits  ? parseInt(form.totalUnits)    : null,
      minSft:      form.minSft      ? parseFloat(form.minSft)      : null,
      maxSft:      form.maxSft      ? parseFloat(form.maxSft)      : null,
      unitType:    form.unitType.trim() || null,
      pricePerSft: form.pricePerSft ? parseFloat(form.pricePerSft) : null,
      totalPrice:  form.totalPrice  ? form.totalPrice.trim()       : null,
      totalPlots:  form.totalPlots  ? parseInt(form.totalPlots)    : null,
      plotType:    form.plotType    || null,
      minSqy:      form.minSqy      ? parseFloat(form.minSqy)      : null,
      maxSqy:      form.maxSqy      ? parseFloat(form.maxSqy)      : null,
      pricePerSqy: form.pricePerSqy ? parseFloat(form.pricePerSqy) : null,
      plotPossession: form.plotPossession || null,
    };

    setSaving(true);
    try {
      const data = editing
        ? await api.put(`/api/properties/${editing._id}`, payload)
        : await api.post('/api/properties', payload);
      if (data.success) {
        showToast(editing ? 'Property updated!' : 'Property created!');
        closeModal(); fetchProperties(); fetchStats();
      } else showToast(data.message || 'Save failed', 'error');
    } catch { showToast('Network error', 'error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const data = await api.delete(`/api/properties/${editing._id}`);
      if (data.success) {
        showToast('Property removed');
        closeModal(); fetchProperties(); fetchStats();
      } else showToast(data.message || 'Delete failed', 'error');
    } catch { showToast('Network error', 'error'); }
    setSaving(false);
  };

  const handleRestore = async (p) => {
    try {
      const data = await api.put(`/api/properties/${p._id}`, { isActive: true });
      if (data.success) { showToast('Property restored ✅'); fetchProperties(); fetchStats(); }
    } catch { showToast('Restore failed', 'error'); }
  };

  const toggleField = async (p, field) => {
    try {
      const data = await api.put(`/api/properties/${p._id}`, { [field]: !p[field] });
      if (data.success) {
        setProperties(prev => prev.map(x => x._id === p._id ? { ...x, [field]: !x[field] } : x));
        if (field === 'featured') fetchStats();
      }
    } catch { showToast('Update failed', 'error'); }
  };

  const f = form;

  // ── Helper: set form field
  const set = (key, val) => setForm(x => ({ ...x, [key]: val }));

  return (
    <div className="page a-up">

      {/* ── Stat cards ── */}
      {stats && (
        <div className="prop-stats">
          {[
            { label:'Total',    val: stats.totalAll, icon:'🏘️', col:'var(--blue)'  },
            { label:'Active',   val: stats.total,    icon:'✅', col:'var(--green)' },
            { label:'Inactive', val: stats.inactive, icon:'🔴', col:'var(--red)'   },
            { label:'Featured', val: properties.filter(p => p.featured).length,
                                                     icon:'⭐', col:'var(--gold)'  },
          ].map((s,i) => (
            <div key={s.label} className={`prop-stat card a-up d${i+1}`}>
              <span className="prop-stat__icon">{s.icon}</span>
              <span className="prop-stat__val" style={{color:s.col}}>{s.val}</span>
              <span className="prop-stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Properties</h1>
          <p className="page-sub">
            {loading ? 'Loading…' : `${total} total`}
            {activeFilterCount > 0 && (
              <span className="filter-count">
                &nbsp;· {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </span>
            )}
          </p>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          {activeFilterCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear</button>
          )}
          <button className="btn btn-primary" onClick={openAdd}>+ Add Property</button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="card prop-filters">
        <div className="prop-filters__row">
          <div className="search-bar prop-filters__search">
            <span className="search-bar__icon">🔍</span>
            <input placeholder="Search title, locality, developer…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch('')}
                style={{background:'none',border:'none',cursor:'pointer',color:'var(--t3)',fontSize:14}}>
                ✕
              </button>
            )}
          </div>
          <select className="form-input form-select prop-filters__sel"
            value={fType} onChange={e => setFType(e.target.value)}>
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="form-input form-select prop-filters__sel"
            value={fStatus} onChange={e => setFStatus(e.target.value)}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-input form-select prop-filters__sel"
            value={fBadge} onChange={e => setFBadge(e.target.value)}>
            <option value="">All Badges</option>
            {BADGES.filter(Boolean).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="form-input form-select prop-filters__sel"
            value={`${fPrice.min}|${fPrice.max}`}
            onChange={e => {
              const [min,max] = e.target.value.split('|');
              setFPrice({ min, max });
            }}>
            {PRICE_RANGES.map(r => (
              <option key={r.label} value={`${r.min}|${r.max}`}>{r.label}</option>
            ))}
          </select>
          <select className="form-input form-select prop-filters__sel"
            value={fFeatured} onChange={e => setFeatured(e.target.value)}>
            <option value="">All: Featured</option>
            <option value="true">⭐ Featured Only</option>
            <option value="false">Not Featured</option>
          </select>
          <select className="form-input form-select prop-filters__sel"
            value={fActive} onChange={e => setFActive(e.target.value)}>
            <option value="">Active + Inactive</option>
            <option value="true">✅ Active Only</option>
            <option value="false">🔴 Inactive Only</option>
          </select>
          <select className="form-input form-select prop-filters__sel"
            value={sort} onChange={e => setSort(e.target.value)}>
            <option value="-createdAt">Newest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="-views">Most Viewed</option>
            <option value="-enquiries">Most Enquiries</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="card" style={{padding:'48px 0',textAlign:'center'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:12,color:'var(--t2)'}}>
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
              ? 'No results match the current filters.'
              : 'Add your first property to get started.'}
          </div>
          {activeFilterCount > 0 && (
            <button className="btn btn-ghost btn-sm"
              style={{marginTop:10}} onClick={clearFilters}>
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
                <th>Total Price</th>
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
                  <td>
                    <div className="prop-cell">
                      {(p.images?.[0]?.url || p.image)
                        ? <img src={p.images?.[0]?.url || p.image} alt={p.title}
                            className="prop-cell__img" />
                        : <div className="prop-cell__img prop-cell__no-img">🏠</div>
                      }
                      <div>
                        <div className="prop-cell__title">{p.title}</div>
                        <div className="prop-cell__sub">
                          {p.subtype}
                          {p.badge && (
                            <span className="badge badge-gold"
                              style={{marginLeft:4,fontSize:9,padding:'1px 5px'}}>
                              {p.badge}
                            </span>
                          )}
                          {p.images?.length > 0 && (
                            <span style={{marginLeft:4,fontSize:9,color:'var(--t3)'}}>
                              📷{p.images.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{p.type}</span></td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[p.status] || 'badge-gold'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{fontWeight:700,color:'var(--gold)',fontSize:13,whiteSpace:'nowrap'}}>
                    {p.totalPrice || '—'}
                  </td>
                  <td style={{color:'var(--t2)',fontSize:12}}>
                    {p.location?.locality || '—'}
                  </td>
                  <td style={{color:'var(--t3)',fontSize:13}}>👁 {p.views || 0}</td>
                  <td>
                    <button className={`status-btn ${p.featured ? 'on' : 'off'}`}
                      onClick={() => toggleField(p,'featured')} style={{minWidth:56}}>
                      {p.featured ? '⭐ Yes' : 'No'}
                    </button>
                  </td>
                  <td>
                    <button
                      className={`status-btn ${p.isActive ? 'on' : 'off'}`}
                      onClick={() => p.isActive ? toggleField(p,'isActive') : handleRestore(p)}
                      style={{minWidth:72}}>
                      {p.isActive ? 'Active' : '↩ Restore'}
                    </button>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="act-btn act-btn--view" onClick={() => openView(p)}>👁</button>
                      <button className="act-btn act-btn--edit" onClick={() => openEdit(p)}>✏️</button>
                      <button className="act-btn act-btn--del"  onClick={() => openDel(p)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && pages > 1 && (
        <div className="prop-pagination">
          <span style={{fontSize:13,color:'var(--t2)'}}>
            Showing {((page-1)*PER)+1}–{Math.min(page*PER,total)} of {total}
          </span>
          <div className="pagination">
            <button className="page-btn" disabled={page===1}     onClick={() => setPage(1)}>«</button>
            <button className="page-btn" disabled={page===1}     onClick={() => setPage(p => p-1)}>‹</button>
            {Array.from({length: Math.min(pages,7)}, (_,i) => {
              const pg = pages <= 7 ? i+1 : page <= 4 ? i+1 : page+i-3;
              if (pg < 1 || pg > pages) return null;
              return (
                <button key={pg}
                  className={`page-btn${page === pg ? ' active' : ''}`}
                  onClick={() => setPage(pg)}>
                  {pg}
                </button>
              );
            })}
            <button className="page-btn" disabled={page===pages} onClick={() => setPage(p => p+1)}>›</button>
            <button className="page-btn" disabled={page===pages} onClick={() => setPage(pages)}>»</button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          ADD / EDIT MODAL
      ════════════════════════════════════════ */}
      {modal === 'form' && (
        <Modal
          title={editing ? '✏️ Edit Property' : '🏘️ Add New Property'}
          onClose={closeModal}
          size="lg">

          {/* Scrollable body */}
          <div className="modal__body">
            <div className="form-grid">

              {/* ── Basic Info ── */}
              <SectionTitle icon="📋" label="Basic Information" />

              <div className="form-group form-full">
                <label className="form-label">Title *</label>
                <input className="form-input"
                  placeholder="e.g. Casa Luxura Penthouse"
                  value={f.title}
                  onChange={e => set('title', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Property Type *</label>
                <select className="form-input form-select" value={f.type}
                  onChange={e => set('type', e.target.value) || set('subtype','')}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sub-type</label>
                <select className="form-input form-select" value={f.subtype}
                  onChange={e => set('subtype', e.target.value)}>
                  <option value="">Select sub-type</option>
                  {(SUBTYPES[f.type] || []).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Listing Status</label>
                <select className="form-input form-select" value={f.status}
                  onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Project Status</label>
                <select className="form-input form-select" value={f.projectStatus}
                  onChange={e => set('projectStatus', e.target.value)}>
                  {PROJECT_STATUSES.map(s => (
                    <option key={s} value={s}>{s || 'None'}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Badge</label>
                <select className="form-input form-select" value={f.badge}
                  onChange={e => set('badge', e.target.value)}>
                  {BADGES.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Total Price</label>
                <input className="form-input"
                  placeholder="e.g. 1.2 Cr / 45 Lakhs"
                  value={f.totalPrice}
                  onChange={e => set('totalPrice', e.target.value)} />
              </div>

              <div className="form-group form-full">
                <label className="form-label">Brochure Link / PDF URL</label>
                <input className="form-input"
                  placeholder="https://example.com/brochure.pdf"
                  value={f.brochureLink}
                  onChange={e => set('brochureLink', e.target.value)} />
              </div>

              {/* ── Project Details ── */}
              <SectionTitle icon="🏗️" label="Project Details" />

              <div className="form-group">
                <label className="form-label">Facing</label>
                <select className="form-input form-select" value={f.facing}
                  onChange={e => set('facing', e.target.value)}>
                  {FACING_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Acres</label>
                <input type="number" step="0.01" className="form-input"
                  placeholder="e.g. 5.5"
                  value={f.acres}
                  onChange={e => set('acres', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Total Plots</label>
                <input type="number" className="form-input"
                  placeholder="e.g. 120"
                  value={f.totalPlots}
                  onChange={e => set('totalPlots', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Plot Type</label>
                <select className="form-input form-select" value={f.plotType}
                  onChange={e => set('plotType', e.target.value)}>
                  {PLOT_TYPES.map(t => (
                    <option key={t} value={t}>{t || 'Select type'}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Min Sq. Yards (SQY)</label>
                <input type="number" step="0.01" className="form-input"
                  placeholder="e.g. 100"
                  value={f.minSqy}
                  onChange={e => set('minSqy', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Max Sq. Yards (SQY)</label>
                <input type="number" step="0.01" className="form-input"
                  placeholder="e.g. 500"
                  value={f.maxSqy}
                  onChange={e => set('maxSqy', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Price per SQY (₹)</label>
                <input type="number" className="form-input"
                  placeholder="e.g. 12000"
                  value={f.pricePerSqy}
                  onChange={e => set('pricePerSqy', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Possession</label>
                <select className="form-input form-select" value={f.plotPossession}
                  onChange={e => set('plotPossession', e.target.value)}>
                  <option value="">Select possession</option>
                  <option value="On Going">On Going</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Floors</label>
                <input type="number" className="form-input"
                  placeholder="e.g. 20"
                  value={f.floors}
                  onChange={e => set('floors', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Total Units</label>
                <input type="number" className="form-input"
                  placeholder="e.g. 240"
                  value={f.totalUnits}
                  onChange={e => set('totalUnits', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Unit Type</label>
                <select className="form-input form-select" value={f.unitType}
                  onChange={e => set('unitType', e.target.value)}>
                  <option value="">Select unit type</option>
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="2 & 3 BHK">2 &amp; 3 BHK</option>
                  <option value="4 BHK">4 BHK</option>
                  <option value="Studio">Studio</option>
                  <option value="Penthouse">Penthouse</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Min Sft</label>
                <input type="number" className="form-input"
                  placeholder="e.g. 1200"
                  value={f.minSft}
                  onChange={e => set('minSft', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Max Sft</label>
                <input type="number" className="form-input"
                  placeholder="e.g. 2400"
                  value={f.maxSft}
                  onChange={e => set('maxSft', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Price per Sft (₹)</label>
                <input type="number" className="form-input"
                  placeholder="e.g. 6500"
                  value={f.pricePerSft}
                  onChange={e => set('pricePerSft', e.target.value)} />
              </div>

              {/* ── Location ── */}
              <SectionTitle icon="📍" label="Location" />

              <div className="form-group form-full">
                <label className="form-label">Full Address *</label>
                <input className="form-input"
                  placeholder="Road No. 10, Banjara Hills"
                  value={f['location.address']}
                  onChange={e => set('location.address', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Locality *</label>
                <input className="form-input"
                  placeholder="Banjara Hills"
                  value={f['location.locality']}
                  onChange={e => set('location.locality', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input"
                  placeholder="Hyderabad"
                  value={f['location.city']}
                  onChange={e => set('location.city', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input"
                  placeholder="Telangana"
                  value={f['location.state']}
                  onChange={e => set('location.state', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input className="form-input"
                  placeholder="500034"
                  value={f['location.pincode']}
                  onChange={e => set('location.pincode', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Developer / Builder</label>
                <input className="form-input"
                  placeholder="Rajapushpa Group"
                  value={f.developer}
                  onChange={e => set('developer', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Possession Date</label>
                <input className="form-input"
                  placeholder="Ready to Move / Dec 2025"
                  value={f.possession}
                  onChange={e => set('possession', e.target.value)} />
              </div>

              <div className="form-group form-full">
                <label className="form-label">RERA No.</label>
                <input className="form-input"
                  placeholder="P02400003987"
                  value={f.rera}
                  onChange={e => set('rera', e.target.value)} />
              </div>

              <div className="form-group form-full">
                <label className="form-label">Amenities (comma separated)</label>
                <input className="form-input"
                  placeholder="Swimming Pool, Gym, Clubhouse, Park"
                  value={f.amenities}
                  onChange={e => set('amenities', e.target.value)} />
              </div>

              <div className="form-group form-full">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" rows={4}
                  placeholder="Describe the property…"
                  value={f.description}
                  onChange={e => set('description', e.target.value)} />
              </div>

              {/* ── Images ── */}
              <SectionTitle icon="🖼️" label="Property Images" />

              <div className="form-group form-full">
                {/* URL input row */}
                <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                  <input
                    className="form-input"
                    placeholder="Paste image URL (https://…) and click Add"
                    value={urlDraft}
                    onChange={e => setUrlDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl(); } }}
                    style={{ flex:1 }}
                  />
                  <button type="button" className="btn btn-ghost btn-sm"
                    onClick={addImageUrl} disabled={!urlDraft.trim()}>
                    + Add
                  </button>
                </div>
                <span style={{ fontSize:11, color:'var(--t3)', display:'block', marginBottom:10 }}>
                  Paste a direct image URL and press Enter or click Add · Multiple images allowed
                </span>

                {f.images.length > 0 && (
                  <>
                    <div className="img-thumb-grid">
                      {f.images.map((img,i) => (
                        <div key={i} className="img-thumb">
                          <img src={img.url} alt=""
                            onError={e => { e.target.style.display = 'none'; }} />
                          {img.isPrimary && (
                            <span className="img-thumb__primary">PRIMARY</span>
                          )}
                          {!img.isPrimary && (
                            <button type="button" className="img-thumb__set-primary"
                              onClick={() => setForm(x => ({
                                ...x,
                                images: x.images.map((im,j) => ({ ...im, isPrimary: j===i }))
                              }))}>
                              ★
                            </button>
                          )}
                          <button type="button" className="img-thumb__remove"
                            onClick={() => removeImage(i)}>✕</button>
                        </div>
                      ))}
                    </div>
                    <div className="img-thumb-hint">
                      {f.images.length} image{f.images.length > 1 ? 's' : ''} added
                      &nbsp;· Click ★ to set primary
                    </div>
                  </>
                )}
              </div>

              {/* ── Flags ── */}
              <div className="form-group form-full prop-flags">
                <label className="check-label">
                  <input type="checkbox" checked={f.featured}
                    onChange={e => set('featured', e.target.checked)} />
                  ⭐ Mark as Featured
                </label>
                <label className="check-label">
                  <input type="checkbox" checked={f.isActive}
                    onChange={e => set('isActive', e.target.checked)} />
                  ✅ Active Listing
                </label>
              </div>

            </div>
          </div>

          {/* ── Sticky footer — ALWAYS VISIBLE ── */}
          <div className="modal__footer">
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving
                ? <><span className="spinner" /> Saving…</>
                : editing ? '💾 Save Changes' : '🏘️ Add Property'
              }
            </button>
          </div>
        </Modal>
      )}

      {/* ════════════ VIEW MODAL ════════════ */}
      {modal === 'view' && editing && (
        <Modal title="👁 Property Details" onClose={closeModal} size="lg">
          <div className="modal__body">
            <ImageGallery images={editing.images} fallback={editing.image} />

            <div style={{marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                <h3 style={{fontSize:17,fontWeight:800,color:'var(--t1)',margin:0}}>
                  {editing.title}
                </h3>
                {editing.badge && <span className="badge badge-gold">{editing.badge}</span>}
                {!editing.isActive && <span className="badge badge-red">Inactive</span>}
              </div>
              <p style={{fontSize:13,color:'var(--t2)',lineHeight:1.65,margin:0}}>
                {editing.description}
              </p>
            </div>

            <div className="view-grid">
              {[
                ['Type',         editing.type],
                ['Sub-type',     editing.subtype],
                ['Status',       editing.status],
                ['Project Status',editing.projectStatus || '—'],
                ['Total Price',  editing.totalPrice || '—'],
                ['Facing',       editing.facing || '—'],
                ['Acres',        editing.acres ?? '—'],
                ['Total Plots',  editing.totalPlots ?? '—'],
                ['Plot Type',    editing.plotType || '—'],
                ['Min SQY',      editing.minSqy ? `${editing.minSqy} SQY` : '—'],
                ['Max SQY',      editing.maxSqy ? `${editing.maxSqy} SQY` : '—'],
                ['Price/SQY',    editing.pricePerSqy ? `₹${Number(editing.pricePerSqy).toLocaleString('en-IN')}` : '—'],
                ['Possession',   editing.plotPossession || editing.possession || '—'],
                ['Floors',       editing.floors ?? '—'],
                ['Total Units',  editing.totalUnits ?? '—'],
                ['Unit Type',    editing.unitType || '—'],
                ['Min Sft',      editing.minSft ? `${editing.minSft} sft` : '—'],
                ['Max Sft',      editing.maxSft ? `${editing.maxSft} sft` : '—'],
                ['Price/Sft',    editing.pricePerSft ? `₹${Number(editing.pricePerSft).toLocaleString('en-IN')}` : '—'],
                ['Address',      editing.location?.address || '—'],
                ['Locality',     editing.location?.locality || '—'],
                ['City',         editing.location?.city || '—'],
                ['Developer',    editing.developer || '—'],
                ['RERA',         editing.rera || '—'],
                ['Brochure',     editing.brochureLink || '—'],
                ['Views',        editing.views || 0],
                ['Enquiries',    editing.enquiries || 0],
                ['Featured',     editing.featured ? 'Yes ⭐' : 'No'],
                ['Active',       editing.isActive ? 'Yes ✅' : 'No ❌'],
              ].map(([k,v]) => (
                <div key={k} className="view-row">
                  <span className="view-row__key">{k}</span>
                  <span className="view-row__val">
                    {k === 'Brochure' && v !== '—'
                      ? <a href={v} target="_blank" rel="noreferrer"
                          style={{color:'var(--gold)'}}>📄 View Brochure</a>
                      : String(v)
                    }
                  </span>
                </div>
              ))}
            </div>

            {editing.amenities?.length > 0 && (
              <div style={{marginTop:14}}>
                <div className="form-label" style={{marginBottom:8}}>Amenities</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {editing.amenities.map(a => (
                    <span key={a} className="badge badge-blue">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="modal__footer">
            <button className="btn btn-ghost" onClick={closeModal}>Close</button>
            <button className="btn btn-primary"
              onClick={() => { closeModal(); setTimeout(() => openEdit(editing), 50); }}>
              ✏️ Edit
            </button>
          </div>
        </Modal>
      )}

      {/* ════════════ DELETE MODAL ════════════ */}
      {modal === 'delete' && editing && (
        <Modal title="🗑️ Delete Property" onClose={closeModal}>
          <div className="modal__body" style={{paddingTop:24,textAlign:'center'}}>
            <div className="confirm-icon">🏚️</div>
            <div className="confirm-title">Delete "{editing.title}"?</div>
            <div className="confirm-sub">
              This will soft-delete the property (mark as inactive).
              You can restore it later from the table.
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

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}