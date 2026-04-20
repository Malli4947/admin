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

// ── Image Gallery (for view modal) ────────────────────────────
function ImageGallery({ images, fallback }) {
  const [active, setActive] = useState(0);

  const imgs = (images || []).map(img => typeof img === 'string' ? img : img.url).filter(Boolean);

  if (!imgs.length && !fallback) return null;
  if (!imgs.length && fallback) return (
    <img src={fallback} alt="property"
      style={{width:'100%',height:320,objectFit:'cover',borderRadius:14,marginBottom:16}} />
  );

  return (
    <div style={{marginBottom:18}}>

      {/* ── Main image ── */}
      <div style={{
        position:'relative',
        borderRadius:14,
        overflow:'hidden',
        height:340,                         
        background:'var(--bg3)',
        marginBottom:10,
        boxShadow:'0 4px 24px rgba(0,0,0,0.10)',
      }}>
        <img
          src={imgs[active]}
          alt={`property-${active+1}`}
          style={{
            width:'100%',
            height:'100%',                 
            objectFit:'cover',
            transition:'opacity 0.25s',
          }}
        />

        {/* Counter badge */}
        <span style={{
          position:'absolute',bottom:12,right:12,
          background:'rgba(0,0,0,0.60)',color:'#fff',
          fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:20,
          letterSpacing:0.5,
        }}>
          {active+1} / {imgs.length}
        </span>

        {/* ✅ Bigger arrows */}
        {imgs.length > 1 && (
          <>
            <button
              onClick={() => setActive(a => (a - 1 + imgs.length) % imgs.length)}
              style={{
                position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',
                background:'rgba(0,0,0,0.50)',color:'#fff',border:'none',
                borderRadius:'50%',
                width:44,height:44,         // ✅ bigger
                fontSize:22,               // ✅ bigger arrow icon
                cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',
                backdropFilter:'blur(4px)',
                transition:'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.75)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(0,0,0,0.50)'}
            >‹</button>
            <button
              onClick={() => setActive(a => (a + 1) % imgs.length)}
              style={{
                position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
                background:'rgba(0,0,0,0.50)',color:'#fff',border:'none',
                borderRadius:'50%',
                width:44,height:44,         // ✅ bigger
                fontSize:22,               // ✅ bigger arrow icon
                cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',
                backdropFilter:'blur(4px)',
                transition:'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.75)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(0,0,0,0.50)'}
            >›</button>
          </>
        )}
      </div>

      {/* ── Thumbnails ── */}
      {imgs.length > 1 && (
        <div style={{
          display:'flex',gap:8,
          overflowX:'auto',paddingBottom:4,
          scrollbarWidth:'none',           // hide scrollbar Firefox
        }}>
          {imgs.map((url, i) => (
            <div
              key={i}
              onClick={() => setActive(i)}
              style={{
                flexShrink:0,
                width:72,height:54,        // ✅ bigger thumbnails
                borderRadius:9,
                overflow:'hidden',
                cursor:'pointer',
                border: i===active ? '2.5px solid var(--gold)' : '2.5px solid transparent',
                opacity: i===active ? 1 : 0.6,
                transition:'all 0.15s',
                boxShadow: i===active ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
              }}
            >
              <img
                src={url}
                alt={`thumb-${i+1}`}
                style={{width:'100%',height:'100%',objectFit:'cover'}}
              />
            </div>
          ))}
        </div>
      )}
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
  const [fActive,   setFActive]   = useState('');
  const [fPrice,    setFPrice]    = useState({ min:'', max:'' });
  const [sort,      setSort]      = useState('-createdAt');
  const [page,      setPage]      = useState(1);
  const PER = 10;

  // ── State: modal
  const [modal,    setModal]    = useState(null);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [imgInput, setImgInput] = useState('');
  console.log('imageinput',imgInput);

  // ── Upload state
  const [uploading,       setUploading]       = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState([]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setUploadProgress(files.map(f => ({ name: f.name, status: 'uploading' })));
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      const res = await fetch('http://localhost:3000/api/upload/images', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('pp_admin_token')}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUploadProgress(files.map(f => ({ name: f.name, status: 'done' })));
        setForm(x => {
          const newImgs = data.images.map((img, i) => ({
            url:      img.url,
            publicId: img.publicId,
            isPrimary: x.images.length === 0 && i === 0,
            caption:  '',
          }));
          return { ...x, images: [...x.images, ...newImgs] };
        });
        showToast(`${data.images.length} image${data.images.length > 1 ? 's' : ''} uploaded!`);
      } else {
        setUploadProgress(files.map(f => ({ name: f.name, status: 'error' })));
        showToast(data.message || 'Upload failed', 'error');
      }
    } catch {
      setUploadProgress(files.map(f => ({ name: f.name, status: 'error' })));
      showToast('Upload failed — check network', 'error');
    }
    setUploading(false);
    setTimeout(() => setUploadProgress([]), 2000);
    e.target.value = '';
  };

  // ── Reset page on filter change
  useEffect(() => { setPage(1); }, [search, fType, fStatus, fBadge, fFeatured, fActive, fPrice, sort]);

  // ── Fetch
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      p.set('showAll', 'true');
      if (fType.trim())     p.set('type',     fType);
      if (fStatus.trim())   p.set('status',   fStatus);
      if (fBadge.trim())    p.set('badge',    fBadge);
      if (fFeatured !== '') p.set('featured', fFeatured);
      if (fActive   !== '') p.set('isActive', fActive);
      if (fPrice.min)       p.set('minPrice', fPrice.min);
      if (fPrice.max)       p.set('maxPrice', fPrice.max);
      if (search.trim())    p.set('search',   search.trim());
      p.set('sort',  sort);
      p.set('page',  page);
      p.set('limit', PER);
      const data = await api.get(`/api/properties?${p.toString()}`);
      if (data.success) {
        setProperties(data.properties || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } else {
        showToast(data.message || 'Failed to load properties', 'error');
      }
    } catch {
      showToast('Network error — is the backend running?', 'error');
    }
    setLoading(false);
  }, [fType, fStatus, fBadge, fFeatured, fActive, fPrice, search, sort, page]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get('/api/properties/stats');
      if (data.success) setStats(data.stats);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);
  useEffect(() => { fetchStats();      }, [fetchStats]);

  const showToast = (msg, type='success') => setToast({ msg, type });

  const activeFilterCount = [fType, fStatus, fBadge, fFeatured, fActive, fPrice.min, fPrice.max, search.trim()]
    .filter(Boolean).length;

  const clearFilters = () => {
    setSearch(''); setFType(''); setFStatus(''); setFBadge('');
    setFeatured(''); setFActive('');
    setFPrice({ min:'', max:'' }); setPage(1);
  };

  const openAdd  = () => { setForm(EMPTY_FORM); setEditing(null); setImgInput(''); setModal('form'); };
  const openEdit = (p) => {
    setForm({
      title:               p.title || '',
      description:         p.description || '',
      price:               p.price != null ? String(p.price) : '',
      priceLabel:          p.priceLabel || '',
      priceType:           p.priceType || 'negotiable',
      type:                p.type || 'Residential',
      subtype:             p.subtype || '',
      status:              p.status || 'For Sale',
      beds:                p.beds  != null ? String(p.beds)  : '',
      baths:               p.baths != null ? String(p.baths) : '',
      area:                p.area || '',
      'location.address':  p.location?.address  || '',
      'location.locality': p.location?.locality || '',
      'location.city':     p.location?.city     || 'Hyderabad',
      'location.state':    p.location?.state    || 'Telangana',
      'location.pincode':  p.location?.pincode  || '',
      developer:   p.developer  || '',
      possession:  p.possession || '',
      rera:        p.rera       || '',
      badge:       p.badge      || '',
      featured:    !!p.featured,
      isActive:    p.isActive !== undefined ? p.isActive : true,
      amenities:   Array.isArray(p.amenities) ? p.amenities.join(', ') : '',
      images:      Array.isArray(p.images) ? p.images : [],
    });
    setEditing(p); setImgInput(''); setModal('form');
  };
  const openView   = (p) => { setEditing(p); setModal('view'); };
  const openDel    = (p) => { setEditing(p); setModal('delete'); };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async () => {
    if (!form.title.trim())                return showToast('Title is required', 'error');
    if (!form.price)                       return showToast('Price is required', 'error');
    if (!form['location.address'].trim())  return showToast('Address is required', 'error');
    if (!form['location.locality'].trim()) return showToast('Locality is required', 'error');
    if (!form.area.trim())                 return showToast('Area is required', 'error');

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
        ? await api.put(`/api/properties/${editing._id}`, payload)
        : await api.post('/api/properties', payload);
      if (data.success) {
        showToast(editing ? 'Property updated!' : 'Property created!');
        closeModal(); fetchProperties(); fetchStats();
      } else {
        showToast(data.message || 'Save failed', 'error');
      }
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
      } else { showToast(data.message || 'Delete failed', 'error'); }
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

      {/* ── Stat cards ── */}
      {stats && (
        <div className="prop-stats">
          {[
            { label:'Total',    val: stats.totalAll,  icon:'🏘️', color:'var(--blue)'  },
            { label:'Active',   val: stats.total,     icon:'✅', color:'var(--green)' },
            { label:'Inactive', val: stats.inactive,  icon:'🔴', color:'var(--red)'   },
            { label:'Featured', val: properties.filter(p=>p.featured).length, icon:'⭐', color:'var(--gold)' },
          ].map((s,i) => (
            <div key={s.label} className={`prop-stat card a-up d${i+1}`}>
              <span className="prop-stat__icon">{s.icon}</span>
              <span className="prop-stat__val" style={{color:s.color}}>{s.val}</span>
              <span className="prop-stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Header ── */}
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
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          {activeFilterCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear Filters</button>
          )}
          <button className="btn btn-primary" onClick={openAdd}>+ Add Property</button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="card" style={{padding:'16px 20px'}}>
        <div style={{display:'flex',flexWrap:'wrap',gap:10,alignItems:'center'}}>
          <div className="search-bar" style={{flex:'1 1 200px',minWidth:180}}>
            <span className="search-bar__icon">🔍</span>
            <input placeholder="Search title, locality, developer…" value={search}
              onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')}
              style={{background:'none',border:'none',cursor:'pointer',color:'var(--t3)',fontSize:14}}>✕</button>}
          </div>
          <select className="form-input form-select" style={{width:150}} value={fType} onChange={e=>setFType(e.target.value)}>
            <option value="">All Types</option>
            {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <select className="form-input form-select" style={{width:150}} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
            <option value="">All Status</option>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-input form-select" style={{width:140}} value={fBadge} onChange={e=>setFBadge(e.target.value)}>
            <option value="">All Badges</option>
            {BADGES.filter(Boolean).map(b=><option key={b} value={b}>{b}</option>)}
          </select>
          <select className="form-input form-select" style={{width:160}}
            value={`${fPrice.min}|${fPrice.max}`}
            onChange={e=>{const[min,max]=e.target.value.split('|');setFPrice({min,max});}}>
            {PRICE_RANGES.map(r=><option key={r.label} value={`${r.min}|${r.max}`}>{r.label}</option>)}
          </select>
          <select className="form-input form-select" style={{width:145}} value={fFeatured} onChange={e=>setFeatured(e.target.value)}>
            <option value="">All: Featured</option>
            <option value="true">⭐ Featured Only</option>
            <option value="false">Not Featured</option>
          </select>
          <select className="form-input form-select" style={{width:145}} value={fActive} onChange={e=>setFActive(e.target.value)}>
            <option value="">Active + Inactive</option>
            <option value="true">✅ Active Only</option>
            <option value="false">🔴 Inactive Only</option>
          </select>
          <select className="form-input form-select" style={{width:170}} value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="-createdAt">Newest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="-price">Price: High → Low</option>
            <option value="price">Price: Low → High</option>
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
            {activeFilterCount > 0 ? 'No results match the current filters.' : 'Add your first property to get started.'}
          </div>
          {activeFilterCount > 0 && (
            <button className="btn btn-ghost btn-sm" style={{marginTop:10}} onClick={clearFilters}>✕ Clear All Filters</button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Property</th><th>Type</th><th>Status</th><th>Price</th>
                <th>Location</th><th>Views</th><th>Featured</th><th>Active</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(p => (
                <tr key={p._id} style={!p.isActive?{opacity:0.55}:{}}>
                  <td>
                    <div className="prop-cell">
                      {/* ✅ Show first image from images array, fallback to p.image */}
                      {(p.images?.[0]?.url || p.image)
                        ? <img src={p.images?.[0]?.url || p.image} alt={p.title} className="prop-cell__img" />
                        : <div className="prop-cell__img" style={{background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🏠</div>
                      }
                      <div>
                        <div className="prop-cell__title">{p.title}</div>
                        <div className="prop-cell__sub">
                          {p.subtype}
                          {p.badge && <span className="badge badge-gold" style={{marginLeft:5,fontSize:9,padding:'2px 6px'}}>{p.badge}</span>}
                          {/* ✅ Show image count */}
                          {p.images?.length > 0 && (
                            <span style={{marginLeft:5,fontSize:9,color:'var(--t3)'}}>
                              📷 {p.images.length}
                            </span>
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
                  <td style={{color:'var(--t2)',fontSize:12}}>{p.location?.locality||'—'}</td>
                  <td style={{color:'var(--t3)',fontSize:13}}>👁 {p.views||0}</td>
                  <td>
                    <button className={`status-btn ${p.featured?'on':'off'}`}
                      onClick={()=>toggleField(p,'featured')} style={{minWidth:56}}>
                      {p.featured?'⭐ Yes':'No'}
                    </button>
                  </td>
                  <td>
                    <button className={`status-btn ${p.isActive?'on':'off'}`}
                      onClick={()=>p.isActive?toggleField(p,'isActive'):handleRestore(p)} style={{minWidth:68}}>
                      {p.isActive?'Active':'↩ Restore'}
                    </button>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="act-btn act-btn--view" onClick={()=>openView(p)}>👁</button>
                      <button className="act-btn act-btn--edit" onClick={()=>openEdit(p)}>✏️</button>
                      <button className="act-btn act-btn--del"  onClick={()=>openDel(p)}>🗑</button>
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
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
          <span style={{fontSize:13,color:'var(--t2)'}}>
            Showing {((page-1)*PER)+1}–{Math.min(page*PER,total)} of {total}
          </span>
          <div className="pagination">
            <button className="page-btn" disabled={page===1}     onClick={()=>setPage(1)}>«</button>
            <button className="page-btn" disabled={page===1}     onClick={()=>setPage(p=>p-1)}>‹</button>
            {Array.from({length:Math.min(pages,7)},(_,i)=>{
              const pg=pages<=7?i+1:page<=4?i+1:page+i-3;
              if(pg<1||pg>pages) return null;
              return <button key={pg} className={`page-btn${page===pg?' active':''}`} onClick={()=>setPage(pg)}>{pg}</button>;
            })}
            <button className="page-btn" disabled={page===pages} onClick={()=>setPage(p=>p+1)}>›</button>
            <button className="page-btn" disabled={page===pages} onClick={()=>setPage(pages)}>»</button>
          </div>
        </div>
      )}

      {/* ══ ADD / EDIT MODAL ════════════════════════════ */}
      {modal==='form' && (
        <Modal title={editing?'✏️ Edit Property':'🏘️ Add New Property'} onClose={closeModal} size="lg" style={{paddingTop:60}}>
          <div className="modal__body" style={{paddingTop:40}}>
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

              {/* ── Images upload ── */}
              <div className="form-group form-full">
                <label className="form-label">
                  Property Images
                  {f.images.length > 0 && (
                    <span style={{marginLeft:8,fontSize:11,color:'var(--t3)',fontWeight:400}}>
                      {f.images.length} uploaded
                    </span>
                  )}
                </label>

                {/* Drop zone */}
                <label htmlFor="img-upload" style={{
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                  gap:8,border:'2px dashed var(--bdr2)',borderRadius:12,padding:'24px 16px',
                  cursor:uploading?'not-allowed':'pointer',
                  background:uploading?'var(--bg2)':'var(--bg3)',
                  transition:'background 0.2s',opacity:uploading?0.7:1,
                }}
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>{e.preventDefault();if(!uploading)handleImageUpload({target:{files:e.dataTransfer.files,value:''}});}}>
                  <span style={{fontSize:32}}>{uploading?'⏳':'📁'}</span>
                  <span style={{fontSize:14,fontWeight:600,color:'var(--t1)'}}>
                    {uploading?'Uploading…':'Click to select or drag & drop images'}
                  </span>
                  <span style={{fontSize:12,color:'var(--t3)'}}>
                    JPEG, PNG, WEBP · Max 5 MB each · Multiple allowed
                  </span>
                  <input id="img-upload" type="file" accept="image/*" multiple
                    style={{display:'none'}} disabled={uploading} onChange={handleImageUpload} />
                </label>

                {/* Per-file progress */}
                {uploadProgress.length > 0 && (
                  <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:4}}>
                    {uploadProgress.map((fp,i) => (
                      <div key={i} style={{
                        display:'flex',alignItems:'center',gap:8,fontSize:12,color:'var(--t2)',
                        background:'var(--bg3)',borderRadius:8,padding:'6px 10px',
                      }}>
                        <span>
                          {fp.status==='uploading'&&<span className="spinner" style={{width:12,height:12,borderWidth:2}}/>}
                          {fp.status==='done'&&'✅'}
                          {fp.status==='error'&&'❌'}
                        </span>
                        <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{fp.name}</span>
                        <span style={{color:fp.status==='error'?'var(--red)':'var(--green)',fontWeight:600}}>
                          {fp.status==='uploading'?'Uploading…':fp.status==='done'?'Done':'Failed'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ✅ Thumbnails grid — all uploaded images */}
                {f.images.length > 0 && (
                  <div style={{marginTop:12,display:'flex',flexWrap:'wrap',gap:8}}>
                    {f.images.map((img,i) => (
                      <div key={i} style={{position:'relative',width:90,height:68}}>
                        <img src={img.url} alt="" style={{
                          width:90,height:68,objectFit:'cover',borderRadius:10,
                          border:img.isPrimary?'2px solid var(--gold)':'1px solid var(--bdr2)',
                        }}/>
                        {img.isPrimary && (
                          <span style={{
                            position:'absolute',top:3,left:3,
                            background:'var(--gold)',color:'var(--navy)',
                            fontSize:8,fontWeight:700,padding:'1px 5px',borderRadius:4,
                          }}>PRIMARY</span>
                        )}
                        {!img.isPrimary && (
                          <button title="Set as primary"
                            onClick={()=>setForm(x=>({...x,images:x.images.map((im,j)=>({...im,isPrimary:j===i}))}))}
                            style={{
                              position:'absolute',bottom:3,left:3,
                              background:'rgba(0,0,0,0.55)',color:'#fff',
                              border:'none',borderRadius:4,fontSize:9,padding:'2px 5px',cursor:'pointer',
                            }}>★ Set primary</button>
                        )}
                        <button onClick={()=>removeImage(i)} style={{
                          position:'absolute',top:3,right:3,
                          background:'rgba(220,38,38,.85)',color:'#fff',
                          border:'none',borderRadius:'50%',
                          width:18,height:18,fontSize:9,cursor:'pointer',
                          display:'flex',alignItems:'center',justifyContent:'center',
                        }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {f.images.length > 0 && (
                  <div style={{fontSize:11,color:'var(--t3)',marginTop:6}}>
                    {f.images.length} image{f.images.length>1?'s':''} · Click ★ on any image to set it as primary
                  </div>
                )}
              </div>

              {/* Checkboxes */}
              <div className="form-group form-full" style={{flexDirection:'row',gap:24,flexWrap:'wrap'}}>
                <label className="check-label">
                  <input type="checkbox" checked={f.featured} onChange={e=>setForm(x=>({...x,featured:e.target.checked}))}/>
                  ⭐ Mark as Featured
                </label>
                <label className="check-label">
                  <input type="checkbox" checked={f.isActive} onChange={e=>setForm(x=>({...x,isActive:e.target.checked}))}/>
                  ✅ Active Listing
                </label>
              </div>
            </div>
          </div>
          <div className="modal__footer">
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving?<><span className="spinner"/> Saving…</>:editing?'💾 Save Changes':'🏘️ Add Property'}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ VIEW MODAL — with full image gallery ════════════════════════ */}
      {modal==='view' && editing && (
        <Modal title="👁 Property Details" onClose={closeModal} size="lg">
          <div className="modal__body" style={{paddingTop:80,paddingBottom:20}}>

            {/* ✅ Image gallery — shows ALL images with prev/next + thumbnails */}
            <ImageGallery
              images={editing.images}
              fallback={editing.image}
            />

            <div style={{marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <h3 style={{fontSize:17,fontWeight:800,color:'var(--t1)'}}>{editing.title}</h3>
                {editing.badge && <span className="badge badge-gold">{editing.badge}</span>}
                {!editing.isActive && <span className="badge badge-red">Inactive</span>}
                {editing.images?.length > 0 && (
                  <span style={{fontSize:11,color:'white',marginLeft:'auto'}}>
                    📷 {editing.images.length} photo{editing.images.length>1?'s':''}
                  </span>
                )}
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

      {/* ══ DELETE CONFIRM ══ */}
      {modal==='delete' && editing && (
        <Modal title="🗑️ Delete Property" onClose={closeModal}>
          <div className="modal__body" style={{paddingTop:40}}>
            <div className="confirm-icon">🏚️</div>
            <div className="confirm-title">Delete "{editing.title}"?</div>
            <div className="confirm-sub">
              This will soft-delete the property (mark as inactive). You can restore it later.
            </div>
          </div>
          <div className="modal__footer">
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              {saving?<><span className="spinner"/> Deleting…</>:'🗑 Yes, Delete'}
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}