import React, { useState, useEffect, useCallback } from 'react';
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
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal__header">
          <span className="modal__title">{title}</span>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
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

// ── ✅ Single Image Upload component ──────────────────────────
// Props:
//   value      — current image URL string
//   onChange   — called with new URL after upload
//   label      — field label text
//   inputId    — unique id for the file input (required, must be unique per usage)
function SingleImageUpload({ value, onChange, label = 'Image', inputId }) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large — max 5 MB');
      e.target.value = '';
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);   // ✅ single field name: "image"

      const res = await fetch('http://localhost:3000/api/upload/image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('pp_admin_token')}`,
          // ✅ No Content-Type — browser sets it automatically for FormData
        },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        onChange(data.url);   // ✅ pass new S3 URL up to parent
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch {
      setError('Network error — upload failed');
    }

    setUploading(false);
    e.target.value = '';  // reset so same file can be re-selected
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label className="form-label">{label}</label>

      {/* ── Current image preview + change button ── */}
      {value ? (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--bdr2)' }}>
          <img
            src={value}
            alt="preview"
            style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
          />
          {/* Overlay with change/remove buttons */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: 0, transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}
          >
            {/* Change image */}
            <label htmlFor={inputId} style={{
              background: '#2563EB', color: '#fff', border: 'none',
              borderRadius: 8, padding: '7px 16px', fontSize: 13,
              fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {uploading ? '⏳ Uploading…' : '🔄 Change'}
            </label>
            {/* Remove */}
            <button
              onClick={() => onChange('')}
              style={{
                background: 'rgba(220,38,38,0.85)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '7px 14px', fontSize: 13,
                fontWeight: 600, cursor: 'pointer',
              }}
            >✕ Remove</button>
          </div>
        </div>
      ) : (
        /* ── Empty drop zone ── */
        <label htmlFor={inputId} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, border: '2px dashed var(--bdr2)', borderRadius: 10,
          padding: '28px 16px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: uploading ? 'var(--bg2)' : 'var(--bg3)',
          opacity: uploading ? 0.7 : 1,
          transition: 'background 0.2s',
        }}>
          <span style={{ fontSize: 30 }}>{uploading ? '⏳' : '📁'}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
            {uploading ? 'Uploading…' : 'Click to upload image'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>
            JPEG, PNG, WEBP · Max 5 MB
          </span>
        </label>
      )}

      {/* Hidden file input */}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        disabled={uploading}
        onChange={handleFile}
      />

      {/* Also allow pasting a URL manually */}
      {/* <input
        className="form-input"
        placeholder="…or paste image URL directly"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ fontSize: 12 }}
      /> */}

      {/* Error */}
      {error && (
        <span style={{ fontSize: 12, color: 'var(--red)' }}>❌ {error}</span>
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

  const [bannerModal, setBannerModal] = useState(false);
  const [editBanner,  setEditBanner]  = useState(null);
  const [bForm,       setBForm]       = useState({ title: '', subtitle: '', image: '', isActive: true });

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const loadCMS = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/cms');
      if (data.success) {
        const merged = {
          hero:    { ...DEFAULTS.hero,    ...(data.cms?.hero    || {}) },
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

  // ─────────────────────────────────────────────────────────
  // HERO TAB
  // ─────────────────────────────────────────────────────────
  function HeroTab() {
    const [form,    setForm]    = useState({ ...cms.hero });
    const [saving,  setSaving]  = useState(false);
    const [changed, setChanged] = useState(false);

    const handleChange = (key, val) => {
      setForm(f => ({ ...f, [key]: val }));
      setChanged(true);
    };

    const handleSave = async () => {
      if (!form.title?.trim()) return showToast('Heading is required', 'error');
      setSaving(true);
      await saveSection('hero', form, 'Hero Section');
      setSaving(false);
      setChanged(false);
    };

    return (
      <div>
        <div className="cms-sec-header">
          <div>
            <div className="cms-sec-title">Hero Section</div>
            <div className="cms-sec-sub">Manage the main homepage banner and call-to-action.</div>
          </div>
          {changed && <span className="badge badge-amber">Unsaved changes</span>}
        </div>

        {/* Live preview */}
        <div className="cms-preview-wrap">
          <div className="cms-preview-lbl">Live Preview</div>
          <div className="cms-hero-preview">
            {form.backgroundImage && (
              <img src={form.backgroundImage} alt="bg" className="cms-hero-bg" />
            )}
            <div className="cms-hero-overlay" />
            <div className="cms-hero-content">
              <h3>{form.title || 'Your Headline Here'}</h3>
              <p>{form.subtitle || 'Subtitle / tagline text'}</p>
              <div className="cms-hero-cta">{form.ctaText || 'Get Started'}</div>
            </div>
          </div>
        </div>

        <div className="cms-form-grid">
          <div className="form-group cms-form-full">
            <label className="form-label">Main Heading *</label>
            <input className="form-input"
              placeholder="Find Your Dream Property in Hyderabad"
              value={form.title || ''}
              onChange={e => handleChange('title', e.target.value)} />
          </div>
          <div className="form-group cms-form-full">
            <label className="form-label">Subtitle / Tagline</label>
            <textarea className="form-input form-textarea" rows={3}
              placeholder="Discover 1,200+ verified listings…"
              value={form.subtitle || ''}
              onChange={e => handleChange('subtitle', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">CTA Button Text</label>
            <input className="form-input" placeholder="Browse Properties"
              value={form.ctaText || ''}
              onChange={e => handleChange('ctaText', e.target.value)} />
          </div>

          {/* ✅ Background image — upload or paste URL */}
          <div className="form-group">
            <SingleImageUpload
              inputId="hero-bg-upload"
              label="Background Image"
              value={form.backgroundImage || ''}
              onChange={val => handleChange('backgroundImage', val)}
            />
          </div>
        </div>

        <div className="cms-actions">
          <button className="btn btn-ghost"
            onClick={() => { setForm({ ...cms.hero }); setChanged(false); }}
            disabled={!changed}>Reset</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" /> Saving…</> : '💾 Save Hero'}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // ABOUT TAB
  // ─────────────────────────────────────────────────────────
  function AboutTab() {
    const [form,    setForm]    = useState({ ...cms.about });
    const [saving,  setSaving]  = useState(false);
    const [changed, setChanged] = useState(false);

    const handleChange = (key, val) => {
      setForm(f => ({ ...f, [key]: val }));
      setChanged(true);
    };

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
            <input className="form-input"
              placeholder="Hyderabad's Most Trusted Real Estate Platform"
              value={form.heading || ''}
              onChange={e => handleChange('heading', e.target.value)} />
          </div>
          <div className="form-group cms-form-full">
            <label className="form-label">Body Text</label>
            <textarea className="form-input form-textarea" rows={5}
              placeholder="Company description…"
              value={form.body || ''}
              onChange={e => handleChange('body', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Years of Experience</label>
            <input type="number" min={0} className="form-input"
              value={form.yearsExperience ?? ''}
              onChange={e => handleChange('yearsExperience', parseInt(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Email</label>
            <input type="email" className="form-input"
              placeholder="info@primepro.in"
              value={form.email || ''}
              onChange={e => handleChange('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone / Toll-Free</label>
            <input className="form-input"
              placeholder="1800 500 600"
              value={form.phone || ''}
              onChange={e => handleChange('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input"
              placeholder="PrimePro HQ, Banjara Hills, Hyderabad"
              value={form.address || ''}
              onChange={e => handleChange('address', e.target.value)} />
          </div>

          <div className="form-group cms-form-full">
            <SingleImageUpload
              inputId="about-img-upload"
              label="About Section Image"
              value={form.image || ''}
              onChange={val => handleChange('image', val)}
            />
          </div>
        </div>

        <div className="cms-actions">
          <button className="btn btn-ghost"
            onClick={() => { setForm({ ...cms.about }); setChanged(false); }}
            disabled={!changed}>Reset</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" /> Saving…</> : '💾 Save About'}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // SEO TAB
  // ─────────────────────────────────────────────────────────
  function SeoTab() {
    const [form,    setForm]    = useState({ ...cms.seo });
    const [saving,  setSaving]  = useState(false);
    const [changed, setChanged] = useState(false);
    const [cc,      setCC]      = useState({
      t: (form.metaTitle || '').length,
      d: (form.metaDescription || '').length,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <label className="form-label">Meta Title</label>
              <span className={`cms-char-cnt${cc.t > 60 ? ' over' : ''}`}>{cc.t}/60</span>
            </div>
            <input className="form-input"
              placeholder="PrimePro — Premium Real Estate in Hyderabad"
              value={form.metaTitle || ''}
              onChange={e => handleChange('metaTitle', e.target.value)} />
            {cc.t > 60 && <span className="form-error">Title is too long — Google may truncate it</span>}
          </div>
          <div className="form-group cms-form-full">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <label className="form-label">Meta Description</label>
              <span className={`cms-char-cnt${cc.d > 160 ? ' over' : ''}`}>{cc.d}/160</span>
            </div>
            <textarea className="form-input form-textarea" rows={3}
              placeholder="Find verified residential, commercial and agricultural properties…"
              value={form.metaDescription || ''}
              onChange={e => handleChange('metaDescription', e.target.value)} />
            {cc.d > 160 && <span className="form-error">Description is too long — Google may truncate it</span>}
          </div>
          <div className="form-group cms-form-full">
            <label className="form-label">Keywords (comma separated)</label>
            <input className="form-input"
              placeholder="real estate hyderabad, buy flat, villa for sale"
              value={form.keywords || ''}
              onChange={e => handleChange('keywords', e.target.value)} />
          </div>
          <div className="form-group">
            {/* ✅ OG Image — upload or paste */}
            <SingleImageUpload
              inputId="seo-og-upload"
              label="OG Image (social share)"
              value={form.ogImage || ''}
              onChange={val => handleChange('ogImage', val)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Canonical URL</label>
            <input className="form-input"
              placeholder="https://primepro.in"
              value={form.canonical || ''}
              onChange={e => handleChange('canonical', e.target.value)} />
          </div>
        </div>

        <div className="cms-actions">
          <button className="btn btn-ghost"
            onClick={() => {
              setForm({ ...cms.seo }); setChanged(false);
              setCC({ t: (cms.seo.metaTitle||'').length, d: (cms.seo.metaDescription||'').length });
            }}
            disabled={!changed}>Reset</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" /> Saving…</> : '💾 Save SEO'}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // BANNERS TAB
  // ─────────────────────────────────────────────────────────
  function BannersTab() {
    const [banners, setBanners] = useState(Array.isArray(cms.banners) ? [...cms.banners] : []);
    const [saving,  setSaving]  = useState(false);

    const persistBanners = async (updatedBanners) => {
      setSaving(true);
      const ok = await saveSection('banners', updatedBanners, 'Banners');
      if (ok) {
        setBanners(updatedBanners);
        setCms(prev => ({ ...prev, banners: updatedBanners }));
      }
      setSaving(false);
      return ok;
    };

    const toggleBannerActive = async (id) => {
      const updated = banners.map(b => b._id === id ? { ...b, isActive: !b.isActive } : b);
      await persistBanners(updated);
    };

    const deleteBanner = async (id) => {
      const updated = banners.filter(b => b._id !== id);
      await persistBanners(updated);
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
        setCms(prev => ({ ...prev, banners: updated }));
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
              {banners.length} banner{banners.length !== 1 ? 's' : ''} —
              {banners.filter(b => b.isActive).length} active
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => {
            setEditBanner(null);
            setBForm({ title: '', subtitle: '', image: '', isActive: true });
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
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}
                    onClick={() => toggleBannerActive(b._id)} disabled={saving}>
                    {b.isActive ? '⏸ Deactivate' : '▶ Activate'}
                  </button>
                  <button className="act-btn act-btn--edit" onClick={() => {
                    setEditBanner(b);
                    setBForm({ title: b.title, subtitle: b.subtitle, image: b.image, isActive: b.isActive });
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
            setBForm({ title: '', subtitle: '', image: '', isActive: true });
            setBannerModal(true);
          }}>
            <span style={{ fontSize: 32 }}>+</span>
            <span>Add New Banner</span>
          </button>
        </div>

        {/* Banner form modal */}
        {bannerModal && (
          <Modal
            title={editBanner ? '✏️ Edit Banner' : '🎨 Add Banner'}
            onClose={() => { setBannerModal(false); setEditBanner(null); }}
          >
            <div className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="e.g. Summer Offer"
                  value={bForm.title}
                  onChange={e => setBForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Subtitle / CTA Text</label>
                <input className="form-input" placeholder="Short promotional text"
                  value={bForm.subtitle}
                  onChange={e => setBForm(f => ({ ...f, subtitle: e.target.value }))} />
              </div>

              <SingleImageUpload
                inputId="banner-img-upload"
                label="Banner Image"
                value={bForm.image || ''}
                onChange={val => setBForm(f => ({ ...f, image: val }))}
              />

              <label className="check-label">
                <input type="checkbox" checked={bForm.isActive}
                  onChange={e => setBForm(f => ({ ...f, isActive: e.target.checked }))} />
                Active Banner (shown on website)
              </label>
            </div>
            <div className="modal__footer">
              <button className="btn btn-ghost"
                onClick={() => { setBannerModal(false); setEditBanner(null); }}>Cancel
              </button>
              <button className="btn btn-primary" onClick={handleBannerSave} disabled={saving}>
                {saving ? <><span className="spinner" /> Saving…</> : editBanner ? '💾 Save Changes' : '+ Add Banner'}
              </button>
            </div>
          </Modal>
        )}
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
          {tab === 'hero'    && <HeroTab />}
          {tab === 'about'   && <AboutTab />}
          {tab === 'seo'     && <SeoTab />}
          {tab === 'banners' && <BannersTab />}
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}