import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import api from '../../Utils/api';
import './CMS.css';

// ── Constants ─────────────────────────────────────────────────
const TABS = [
  { id: 'hero',    label: 'Hero Section',   icon: '🌟' },
  { id: 'about',   label: 'About Section',  icon: '🏢' },
  { id: 'seo',     label: 'SEO / Meta',     icon: '🔍' },
  { id: 'banners', label: 'Banners',        icon: '🎨' },
];

const DEFAULTS = {
  hero: {
    title: 'Find Your Dream Property in Hyderabad',
    subtitle: 'Discover 1,200+ verified listings. Zero brokerage. RERA compliant.',
    ctaText: 'Browse Properties',
    backgroundImage: '',
    backgroundImages: [], // multiple images for slideshow
  },
  about: {
    heading: "Hyderabad's Most Trusted Real Estate Platform",
    body: 'PrimePro was founded in 2012 with a simple belief — buying or renting a home should be an exciting experience.',
    yearsExperience: 12,
    email: 'info@primepro.in',
    phone: '1800 500 600',
  },
  seo: {
    metaTitle: 'PrimePro — Premium Real Estate in Hyderabad',
    metaDescription: 'Find verified residential, commercial and agricultural properties. No brokerage. RERA certified.',
    keywords: 'real estate hyderabad, buy flat hyderabad, villa for sale, commercial property',
  },
  banners: [],
};

// ── Modal ─────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
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

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`cms-toast cms-toast--${type}`}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose}
        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}>✕
      </button>
    </div>
  );
}

// ── Single Image URL Input ────────────────────────────────────
function SingleImageUpload({ value, onChange, label = 'Image', inputId: _inputId }) {
  const [draft, setDraft] = useState(value || '');

  useEffect(() => { if (!value) setDraft(''); }, [value]);

  const commit = () => {
    onChange(draft.trim());
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <label className="form-label">{label}</label>
      {value && (
        <div style={{ position:'relative', borderRadius:10, overflow:'hidden', border:'1px solid var(--bdr2)', marginBottom:4 }}>
          <img src={value} alt="preview" style={{ width:'100%', height:160, objectFit:'cover', display:'block' }} />
          <div className="img-overlay"
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}>
            <button onClick={() => { onChange(''); setDraft(''); }} className="img-overlay__btn img-overlay__btn--red">✕ Remove</button>
          </div>
        </div>
      )}
      <div style={{ display:'flex', gap:8 }}>
        <input
          className="form-input"
          placeholder="Paste image URL (https://…)"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
          style={{ flex:1 }}
        />
        <button type="button" className="btn btn-ghost btn-sm" onClick={commit}>Apply</button>
      </div>
      <span style={{ fontSize:11, color:'var(--t3)' }}>Paste a direct image URL and press Enter or click Apply</span>
    </div>
  );
}

// ── Multi Image URL Input (Hero slideshow) ────────────────────
function MultiImageUpload({ images = [], onChange, label = 'Images', maxFiles = 10 }) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const addUrl = () => {
    const url = draft.trim();
    if (!url) return;
    if (images.length >= maxFiles) {
      setError(`Max ${maxFiles} images allowed`);
      return;
    }
    setError('');
    const newImg = { url, publicId: null, isPrimary: images.length === 0 };
    onChange([...images, newImg]);
    setDraft('');
  };

  const remove = (idx) => {
    const next = images.filter((_, i) => i !== idx);
    if (next.length > 0 && !next.some(x => x.isPrimary)) next[0] = { ...next[0], isPrimary: true };
    onChange(next);
  };

  const setPrimary = (idx) => {
    onChange(images.map((img, i) => ({ ...img, isPrimary: i === idx })));
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <label className="form-label">
          {label} {images.length > 0 && <span style={{ color:'var(--t3)', fontWeight:400 }}>({images.length}/{maxFiles})</span>}
        </label>
      </div>

      {/* URL input row */}
      {images.length < maxFiles && (
        <div style={{ display:'flex', gap:8 }}>
          <input
            className="form-input"
            placeholder="Paste image URL (https://…) and click Add"
            value={draft}
            onChange={e => { setDraft(e.target.value); setError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
            style={{ flex:1 }}
          />
          <button type="button" className="btn btn-ghost btn-sm" onClick={addUrl} disabled={!draft.trim()}>
            + Add
          </button>
        </div>
      )}
      {error && <span style={{ fontSize:12, color:'var(--red)' }}>❌ {error}</span>}
      <span style={{ fontSize:11, color:'var(--t3)', marginTop:-4 }}>
        Paste a direct image URL and press Enter or click Add
      </span>

      {/* Thumbnails grid */}
      {images.length > 0 && (
        <div className="cms-img-grid">
          {images.map((img, i) => (
            <div key={i} className={`cms-img-thumb${img.isPrimary ? ' cms-img-thumb--primary' : ''}`}>
              <img src={img.url} alt={`hero-${i+1}`} />
              {img.isPrimary && <span className="cms-img-thumb__badge">★ Primary</span>}
              <div className="cms-img-thumb__actions">
                {!img.isPrimary && (
                  <button title="Set as primary" onClick={() => setPrimary(i)}>★</button>
                )}
                <button title="Remove" onClick={() => remove(i)} style={{ background:'rgba(220,38,38,.85)' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p style={{ fontSize:11, color:'var(--t3)', margin:0 }}>
          Click ★ on any image to set it as the primary (first shown).
        </p>
      )}
    </div>
  );
}

// ── Hero Tab ──────────────────────────────────────────────────
function HeroTab({ cmsHero, saveSection, showToast }) {
  const [form,    setForm]    = useState({
    ...cmsHero,
    backgroundImages: Array.isArray(cmsHero.backgroundImages) ? cmsHero.backgroundImages : [],
  });
  const [saving,  setSaving]  = useState(false);
  const [changed, setChanged] = useState(false);
  const [preview, setPreview] = useState(0);

  const handleChange = (key, val) => { setForm(f => ({ ...f, [key]: val })); setChanged(true); };

  const handleImagesChange = (imgs) => {
    setForm(f => ({ ...f, backgroundImages: imgs }));
    setChanged(true);
    setPreview(p => Math.min(p, Math.max(0, imgs.length - 1)));
  };

  const handleSave = async () => {
    if (!form.title?.trim()) return showToast('Heading is required', 'error');
    setSaving(true);
    const primaryImg = form.backgroundImages.find(x => x.isPrimary) || form.backgroundImages[0];
    const payload = {
      ...form,
      backgroundImage:  primaryImg?.url || '',
      backgroundImages: form.backgroundImages,
    };
    await saveSection('hero', payload, 'Hero Section');
    setSaving(false);
    setChanged(false);
  };

  const previewUrl = form.backgroundImages[preview]?.url || '';

  return (
    <div>
      <div className="cms-sec-header">
        <div>
          <div className="cms-sec-title">Hero Section</div>
          <div className="cms-sec-sub">Manage the homepage banner — add multiple background images for a slideshow.</div>
        </div>
        {changed && <span className="badge badge-amber">Unsaved changes</span>}
      </div>

      <div className="cms-preview-wrap">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div className="cms-preview-lbl" style={{ margin:0 }}>Live Preview</div>
          {form.backgroundImages.length > 1 && (
            <div style={{ display:'flex', gap:5 }}>
              {form.backgroundImages.map((_, i) => (
                <button key={i} onClick={() => setPreview(i)}
                  style={{ width:8, height:8, borderRadius:'50%', border:'none', cursor:'pointer', padding:0,
                    background: i === preview ? 'var(--gold)' : 'var(--bdr2)', transition:'background 0.2s' }} />
              ))}
            </div>
          )}
        </div>
        <div className="cms-hero-preview">
          {previewUrl && <img src={previewUrl} alt="bg" className="cms-hero-bg" />}
          <div className="cms-hero-overlay" />
          <div className="cms-hero-content">
            <h3>{form.title || 'Your Headline Here'}</h3>
            <p>{form.subtitle || 'Subtitle / tagline text'}</p>
            <div className="cms-hero-cta">{form.ctaText || 'Get Started'}</div>
          </div>
          {form.backgroundImages.length > 1 && (
            <div style={{ position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)', display:'flex', gap:5 }}>
              {form.backgroundImages.map((_, i) => (
                <span key={i} style={{ width:6, height:6, borderRadius:'50%', display:'inline-block',
                  background: i === preview ? '#fff' : 'rgba(255,255,255,.4)' }} />
              ))}
            </div>
          )}
        </div>
        {form.backgroundImages.length > 1 && (
          <p style={{ fontSize:11, color:'var(--t3)', marginTop:6, textAlign:'center' }}>
            Click the dots above to preview each image · {form.backgroundImages.length} images total
          </p>
        )}
      </div>

      <div className="cms-form-grid">
        <div className="form-group cms-form-full">
          <label className="form-label">Main Heading *</label>
          <input className="form-input" placeholder="Find Your Dream Property in Hyderabad"
            value={form.title || ''} onChange={e => handleChange('title', e.target.value)} />
        </div>
        <div className="form-group cms-form-full">
          <label className="form-label">Subtitle / Tagline</label>
          <textarea className="form-input form-textarea" rows={3} placeholder="Discover 1,200+ verified listings…"
            value={form.subtitle || ''} onChange={e => handleChange('subtitle', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">CTA Button Text</label>
          <input className="form-input" placeholder="Browse Properties"
            value={form.ctaText || ''} onChange={e => handleChange('ctaText', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Slideshow Interval (seconds)</label>
          <input type="number" min={2} max={30} className="form-input" placeholder="5"
            value={form.slideshowInterval || ''}
            onChange={e => handleChange('slideshowInterval', parseInt(e.target.value) || 5)} />
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <MultiImageUpload
          label="Background Images (Slideshow)"
          images={form.backgroundImages}
          onChange={handleImagesChange}
          maxFiles={10}
        />
      </div>

      <div className="cms-actions">
        <button className="btn btn-ghost"
          onClick={() => {
            setForm({ ...cmsHero, backgroundImages: Array.isArray(cmsHero.backgroundImages) ? cmsHero.backgroundImages : [] });
            setChanged(false);
          }}
          disabled={!changed}>Reset</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><span className="spinner" /> Saving…</> : '💾 Save Hero'}
        </button>
      </div>
    </div>
  );
}

// ── About Tab ─────────────────────────────────────────────────
function AboutTab({ cmsAbout, saveSection, showToast }) {
  const [form,    setForm]    = useState({ ...cmsAbout });
  const [saving,  setSaving]  = useState(false);
  const [changed, setChanged] = useState(false);

  const handleChange = (key, val) => { setForm(f => ({ ...f, [key]: val })); setChanged(true); };

  const handleSave = async () => {
    setSaving(true);
    await saveSection('about', form, 'About Section');
    setSaving(false);
    setChanged(false);
  };

  return (
    <div>
      <div className="cms-sec-header">
        <div>
          <div className="cms-sec-title">About Section</div>
          <div className="cms-sec-sub">Update company info, contact details and stats.</div>
        </div>
        {changed && <span className="badge badge-amber">Unsaved changes</span>}
      </div>

      <div className="cms-form-grid">
        <div className="form-group cms-form-full">
          <label className="form-label">Section Heading</label>
          <input className="form-input" placeholder="Hyderabad's Most Trusted Real Estate Platform"
            value={form.heading || ''} onChange={e => handleChange('heading', e.target.value)} />
        </div>
        <div className="form-group cms-form-full">
          <label className="form-label">Body Text</label>
          <textarea className="form-input form-textarea" rows={5} placeholder="Company description…"
            value={form.body || ''} onChange={e => handleChange('body', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Years of Experience</label>
          <input type="number" min={0} className="form-input"
            value={form.yearsExperience ?? ''}
            onChange={e => handleChange('yearsExperience', parseInt(e.target.value) || 0)} />
        </div>
        <div className="form-group">
          <label className="form-label">Contact Email</label>
          <input type="email" className="form-input" placeholder="info@primepro.in"
            value={form.email || ''} onChange={e => handleChange('email', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Phone / Toll-Free</label>
          <input className="form-input" placeholder="1800 500 600"
            value={form.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <input className="form-input" placeholder="PrimePro HQ, Banjara Hills, Hyderabad"
            value={form.address || ''} onChange={e => handleChange('address', e.target.value)} />
        </div>
        <div className="form-group cms-form-full">
          <SingleImageUpload inputId="about-img-upload" label="About Section Image"
            value={form.image || ''} onChange={val => handleChange('image', val)} />
        </div>
      </div>

      <div className="cms-actions">
        <button className="btn btn-ghost"
          onClick={() => { setForm({ ...cmsAbout }); setChanged(false); }}
          disabled={!changed}>Reset</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><span className="spinner" /> Saving…</> : '💾 Save About'}
        </button>
      </div>
    </div>
  );
}

// ── SEO Tab ───────────────────────────────────────────────────
function SeoTab({ cmsSeo, saveSection }) {
  const [form,    setForm]    = useState({ ...cmsSeo });
  const [saving,  setSaving]  = useState(false);
  const [changed, setChanged] = useState(false);
  const [cc,      setCC]      = useState({
    t: (cmsSeo.metaTitle || '').length,
    d: (cmsSeo.metaDescription || '').length,
  });

  const handleChange = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setChanged(true);
    if (key === 'metaTitle')       setCC(c => ({ ...c, t: val.length }));
    if (key === 'metaDescription') setCC(c => ({ ...c, d: val.length }));
  };

  const handleSave = async () => {
    setSaving(true);
    await saveSection('seo', form, 'SEO Settings');
    setSaving(false);
    setChanged(false);
  };

  return (
    <div>
      <div className="cms-sec-header">
        <div>
          <div className="cms-sec-title">SEO &amp; Meta Tags</div>
          <div className="cms-sec-sub">Control how PrimePro appears in Google search results.</div>
        </div>
        {changed && <span className="badge badge-amber">Unsaved changes</span>}
      </div>

      <div className="seo-preview">
        <div className="seo-preview__lbl">Google Search Preview</div>
        <div className="seo-preview__url">https://primepro.in/</div>
        <div className="seo-preview__title">{form.metaTitle || 'Page Title Here'}</div>
        <div className="seo-preview__desc">{form.metaDescription || 'Meta description appears here…'}</div>
      </div>

      <div className="cms-form-grid">
        <div className="form-group cms-form-full">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <label className="form-label">Meta Title</label>
            <span className={`cms-char-cnt${cc.t > 60 ? ' over' : ''}`}>{cc.t}/60</span>
          </div>
          <input className="form-input" placeholder="PrimePro — Premium Real Estate in Hyderabad"
            value={form.metaTitle || ''} onChange={e => handleChange('metaTitle', e.target.value)} />
          {cc.t > 60 && <span className="form-error">Title is too long — Google may truncate it</span>}
        </div>
        <div className="form-group cms-form-full">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <label className="form-label">Meta Description</label>
            <span className={`cms-char-cnt${cc.d > 160 ? ' over' : ''}`}>{cc.d}/160</span>
          </div>
          <textarea className="form-input form-textarea" rows={3}
            placeholder="Find verified residential, commercial and agricultural properties…"
            value={form.metaDescription || ''} onChange={e => handleChange('metaDescription', e.target.value)} />
          {cc.d > 160 && <span className="form-error">Description is too long — Google may truncate it</span>}
        </div>
        <div className="form-group cms-form-full">
          <label className="form-label">Keywords (comma separated)</label>
          <input className="form-input" placeholder="real estate hyderabad, buy flat, villa for sale"
            value={form.keywords || ''} onChange={e => handleChange('keywords', e.target.value)} />
        </div>
        <div className="form-group">
          <SingleImageUpload inputId="seo-og-upload" label="OG Image (social share)"
            value={form.ogImage || ''} onChange={val => handleChange('ogImage', val)} />
        </div>
        <div className="form-group">
          <label className="form-label">Canonical URL</label>
          <input className="form-input" placeholder="https://primepro.in"
            value={form.canonical || ''} onChange={e => handleChange('canonical', e.target.value)} />
        </div>
      </div>

      <div className="cms-actions">
        <button className="btn btn-ghost"
          onClick={() => {
            setForm({ ...cmsSeo }); setChanged(false);
            setCC({ t: (cmsSeo.metaTitle||'').length, d: (cmsSeo.metaDescription||'').length });
          }}
          disabled={!changed}>Reset</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><span className="spinner" /> Saving…</> : '💾 Save SEO'}
        </button>
      </div>
    </div>
  );
}

// ── Banners Tab ───────────────────────────────────────────────
function BannersTab({ cmsBanners, saveSection, showToast }) {
  const [banners,     setBanners]     = useState(Array.isArray(cmsBanners) ? [...cmsBanners] : []);
  const [saving,      setSaving]      = useState(false);
  const [bannerModal, setBannerModal] = useState(false);
  const [editBanner,  setEditBanner]  = useState(null);
  const [bForm,       setBForm]       = useState({ title:'', subtitle:'', image:'', isActive:true });

  const persistBanners = async (updatedBanners) => {
    setSaving(true);
    const ok = await saveSection('banners', updatedBanners, 'Banners');
    if (ok) setBanners(updatedBanners);
    setSaving(false);
    return ok;
  };

  const toggleBannerActive = (id) => {
    const updated = banners.map(b => b._id === id ? { ...b, isActive: !b.isActive } : b);
    persistBanners(updated);
  };

  const deleteBanner = (id) => {
    const updated = banners.filter(b => b._id !== id);
    persistBanners(updated);
  };

  const handleBannerSave = async () => {
    if (!bForm.title?.trim()) return showToast('Banner title is required', 'error');
    setSaving(true);
    let updated;
    if (editBanner) {
      updated = banners.map(b => b._id === editBanner._id ? { ...b, ...bForm } : b);
    } else {
      updated = [...banners, { ...bForm, _id: `b${Date.now()}` }];
    }
    const ok = await saveSection('banners', updated, 'Banners');
    if (ok) {
      setBanners(updated);
      setBannerModal(false);
      setEditBanner(null);
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="cms-sec-header">
        <div>
          <div className="cms-sec-title">Promotional Banners</div>
          <div className="cms-sec-sub">
            {banners.length} banner{banners.length !== 1 ? 's' : ''} — {banners.filter(b => b.isActive).length} active
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditBanner(null);
          setBForm({ title:'', subtitle:'', image:'', isActive:true });
          setBannerModal(true);
        }}>+ Add Banner</button>
      </div>

      <div className="cms-banners-grid">
        {banners.map(b => (
          <div key={b._id} className="banner-card">
            <div className="banner-card__img">
              {b.image
                ? <img src={b.image} alt={b.title} />
                : <div className="banner-card__placeholder">🎨</div>
              }
              <span className={`badge ${b.isActive ? 'badge-green' : 'badge-red'} banner-card__badge`}>
                {b.isActive ? 'Active' : 'Off'}
              </span>
            </div>
            <div className="banner-card__body">
              <div className="banner-card__title">{b.title}</div>
              <div className="banner-card__sub">{b.subtitle}</div>
              <div className="banner-card__actions">
                <button className="btn btn-ghost btn-sm" style={{ flex:1 }}
                  onClick={() => toggleBannerActive(b._id)} disabled={saving}>
                  {b.isActive ? '⏸ Deactivate' : '▶ Activate'}
                </button>
                <button className="act-btn act-btn--edit" onClick={() => {
                  setEditBanner(b);
                  setBForm({ title:b.title, subtitle:b.subtitle, image:b.image, isActive:b.isActive });
                  setBannerModal(true);
                }}>✏️</button>
                <button className="act-btn act-btn--del"
                  onClick={() => deleteBanner(b._id)} disabled={saving}>🗑</button>
              </div>
            </div>
          </div>
        ))}
        <button className="banner-add" onClick={() => {
          setEditBanner(null);
          setBForm({ title:'', subtitle:'', image:'', isActive:true });
          setBannerModal(true);
        }}>
          <span style={{ fontSize:32 }}>+</span>
          <span>Add New Banner</span>
        </button>
      </div>

      {bannerModal && (
        <Modal
          title={editBanner ? '✏️ Edit Banner' : '🎨 Add Banner'}
          onClose={() => { setBannerModal(false); setEditBanner(null); }}>
          <div className="modal__body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" placeholder="e.g. Summer Offer"
                value={bForm.title}
                onChange={e => setBForm(f => ({ ...f, title:e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Subtitle / CTA Text</label>
              <input className="form-input" placeholder="Short promotional text"
                value={bForm.subtitle}
                onChange={e => setBForm(f => ({ ...f, subtitle:e.target.value }))} />
            </div>
            <SingleImageUpload inputId="banner-img-upload" label="Banner Image"
              value={bForm.image || ''}
              onChange={val => setBForm(f => ({ ...f, image:val }))} />
            <label className="check-label">
              <input type="checkbox" checked={bForm.isActive}
                onChange={e => setBForm(f => ({ ...f, isActive:e.target.checked }))} />
              Active Banner (shown on website)
            </label>
          </div>
          <div className="modal__footer">
            <button className="btn btn-ghost"
              onClick={() => { setBannerModal(false); setEditBanner(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleBannerSave} disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : editBanner ? '💾 Save Changes' : '+ Add Banner'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Main CMS component ────────────────────────────────────────
export default function CMS() {
  const [tab,     setTab]     = useState('hero');
  const [cms,     setCms]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const loadCMS = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/cms');
      if (data.success) {
        const heroRaw = data.cms?.hero || {};
        // Normalise backgroundImages — support both old single string and new array
        let bgImages = [];
        if (Array.isArray(heroRaw.backgroundImages) && heroRaw.backgroundImages.length > 0) {
          bgImages = heroRaw.backgroundImages;
        } else if (heroRaw.backgroundImage) {
          bgImages = [{ url: heroRaw.backgroundImage, publicId: null, isPrimary: true }];
        }
        const merged = {
          hero:    { ...DEFAULTS.hero, ...heroRaw, backgroundImages: bgImages },
          about:   { ...DEFAULTS.about,   ...(data.cms?.about   || {}) },
          seo:     { ...DEFAULTS.seo,     ...(data.cms?.seo     || {}) },
          banners: Array.isArray(data.cms?.banners) ? data.cms.banners : DEFAULTS.banners,
        };
        setCms(merged);
      } else {
        setCms({ ...DEFAULTS });
        showToast('Could not load CMS data — showing defaults', 'error');
      }
    } catch {
      setCms({ ...DEFAULTS });
      showToast('Network error — backend not reachable', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadCMS(); }, [loadCMS]);

  const saveSection = async (key, value, label) => {
    try {
      const data = await api.post('/api/cms', { key, value, label });
      if (data.success) {
        setCms(prev => ({ ...prev, [key]: value }));
        showToast(`${label || key} saved successfully!`);
        return true;
      } else {
        showToast(data.message || 'Save failed', 'error');
        return false;
      }
    } catch {
      showToast('Network error — could not save', 'error');
      return false;
    }
  };

  if (loading || !cms) {
    return (
      <div className="page a-up">
        <div className="page-header">
          <div><h1 className="page-title">CMS</h1><p className="page-sub">Loading…</p></div>
        </div>
        <div className="card" style={{ padding: '48px 0', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: 'var(--t2)' }}>
            <div className="spinner spinner-gold" style={{ width: 26, height: 26, borderWidth: 3 }} />
            <span style={{ fontSize: 15 }}>Loading CMS content…</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="page a-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">CMS</h1>
          <p className="page-sub">Manage website content — changes save directly to the backend</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadCMS} title="Refresh from backend">
          🔄 Refresh
        </button>
      </div>

      <div className="cms-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`cms-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="cms-body">
          {tab === 'hero'    && <HeroTab    cmsHero={cms.hero}       saveSection={saveSection} showToast={showToast} />}
          {tab === 'about'   && <AboutTab   cmsAbout={cms.about}     saveSection={saveSection} showToast={showToast} />}
          {tab === 'seo'     && <SeoTab     cmsSeo={cms.seo}         saveSection={saveSection} showToast={showToast} />}
          {tab === 'banners' && <BannersTab cmsBanners={cms.banners} saveSection={saveSection} showToast={showToast} />}
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
