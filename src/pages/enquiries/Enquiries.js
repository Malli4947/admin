import React, { useState, useEffect, useCallback } from 'react';
import api from '../../Utils/api';
import './Enquiries.css';

// ── Constants ─────────────────────────────────────────────────
const STATUS_BADGE = {
  new:     'badge-red',
  read:    'badge-amber',
  replied: 'badge-blue',
  closed:  'badge-gold',
};
const STATUS_OPTIONS = ['new', 'read', 'replied', 'closed'];
const TYPE_OPTIONS   = [
  'All',
  'General Enquiry',
  'Buy Property',
  'Rent / Lease',
  'Sell Property',
  'NRI Enquiry',
  'Site Visit',
];
const STATUS_ICONS  = { new: '🔴', read: '🟡', replied: '🔵', closed: '⭐' };
const STATUS_COLORS = {
  new: 'var(--red)', read: 'var(--amber)',
  replied: 'var(--blue)', closed: 'var(--gold)',
};

// ── Modal ─────────────────────────────────────────────────────
function Modal({ title, onClose, children, size = '' }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
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

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast toast--${type}`}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose}
        style={{ background: 'none', border: 'none', color: 'inherit', fontSize: 16, cursor: 'pointer', marginLeft: 8 }}>✕
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Enquiries() {

  // Data
  const [enquiries, setEnquiries] = useState([]);
  const [stats,     setStats]     = useState({ total: 0, byStatus: [], byType: [], todayCount: 0 });
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);

  // Filters
  const [fStatus, setFStatus] = useState('');
  const [fType,   setFType]   = useState('');
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const PER = 10;

  // Modal
  const [modal, setModal] = useState(null);
  const [sel,   setSel]   = useState(null);
  const [notes, setNotes] = useState('');

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [fStatus, fType, search]);

  // ── Fetch enquiries from backend
  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (fStatus)                  p.set('status', fStatus);
      if (fType && fType !== 'All') p.set('type',   fType);
      if (search.trim())            p.set('search', search.trim());
      p.set('page',  page);
      p.set('limit', PER);

      const data = await api.get(`/api/enquiries?${p.toString()}`);
      if (data.success) {
        setEnquiries(data.enquiries || []);
        setTotal(data.total || 0);
        setPages(Math.ceil((data.total || 0) / PER) || 1);
      } else {
        showToast(data.message || 'Failed to load enquiries', 'error');
      }
    } catch {
      showToast('Network error — is backend running on port 5000?', 'error');
    }
    setLoading(false);
  }, [fStatus, fType, search, page]);

  // ── Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get('/api/enquiries/stats');
      if (data.success) setStats(data.stats);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);
  useEffect(() => { fetchStats();     }, [fetchStats]);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const countFor = (status) => {
    const found = stats.byStatus?.find(s => s._id === status);
    return found?.count || 0;
  };

  // ── Open detail modal — auto-mark as read
  const openView = async (enq) => {
    setSel(enq);
    setNotes(enq.notes || '');
    setModal('view');
    if (enq.status === 'new') {
      try {
        const data = await api.put(`/api/enquiries/${enq._id}`, { status: 'read' });
        if (data.success) {
          setEnquiries(prev => prev.map(e => e._id === enq._id ? { ...e, status: 'read' } : e));
          setSel(s => ({ ...s, status: 'read' }));
          fetchStats();
        }
      } catch { /* silent */ }
    }
  };

  // ── Update status (inline dropdown OR modal buttons)
  const updateStatus = async (id, status) => {
    try {
      const data = await api.put(`/api/enquiries/${id}`, { status });
      if (data.success) {
        setEnquiries(prev => prev.map(e => e._id === id ? { ...e, status } : e));
        if (sel?._id === id) setSel(s => ({ ...s, status }));
        fetchStats();
      } else {
        showToast(data.message || 'Status update failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // ── Mark all new → read
  const markAllRead = async () => {
    const newOnes = enquiries.filter(e => e.status === 'new');
    if (!newOnes.length) return showToast('No new enquiries to mark', 'error');
    setSaving(true);
    try {
      await Promise.all(newOnes.map(e => api.put(`/api/enquiries/${e._id}`, { status: 'read' })));
      showToast(`${newOnes.length} marked as read`);
      fetchEnquiries();
      fetchStats();
    } catch {
      showToast('Failed to update some enquiries', 'error');
    }
    setSaving(false);
  };

  // ── Save notes
  const saveNotes = async () => {
    if (!sel) return;
    setSaving(true);
    try {
      const data = await api.put(`/api/enquiries/${sel._id}`, { notes });
      if (data.success) {
        setEnquiries(prev => prev.map(e => e._id === sel._id ? { ...e, notes } : e));
        showToast('Notes saved successfully');
        setModal(null);
      } else {
        showToast(data.message || 'Save failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setSaving(false);
  };

  // ── Delete enquiry
  const handleDelete = async () => {
    if (!sel) return;
    setSaving(true);
    try {
      const data = await api.delete(`/api/enquiries/${sel._id}`);
      if (data.success) {
        showToast('Enquiry deleted');
        setModal(null);
        setSel(null);
        fetchEnquiries();
        fetchStats();
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setSaving(false);
  };

  const toggleStatusFilter = (status) => {
    setFStatus(prev => prev === status ? '' : status);
    setPage(1);
  };

  const clearFilters = () => {
    setFStatus(''); setFType(''); setSearch(''); setPage(1);
  };

  const hasFilters = fStatus || fType || search;

  return (
    <div className="page a-up">

      {/* ── Header ────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Enquiries</h1>
          <p className="page-sub">
            {loading ? 'Loading…' : `${stats.total || 0} total`}
            {stats.todayCount > 0 && (
              <span className="filter-count"> · {stats.todayCount} received today</span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear Filters</button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={markAllRead} disabled={saving}>
            {saving ? <><span className="spinner" /> Working…</> : '✓ Mark All Read'}
          </button>
        </div>
      </div>

      {/* ── Status summary cards ───────────────────────── */}
      <div className="enq-summary">
        {STATUS_OPTIONS.map((status, i) => (
          <button
            key={status}
            className={`enq-sum-card a-up d${i + 1}${fStatus === status ? ' active' : ''}`}
            onClick={() => toggleStatusFilter(status)}
          >
            <span className="enq-sum-card__icon">{STATUS_ICONS[status]}</span>
            <span className="enq-sum-card__count" style={{ color: STATUS_COLORS[status] }}>
              {countFor(status)}
            </span>
            <span className="enq-sum-card__lbl" style={{ textTransform: 'capitalize' }}>{status}</span>
          </button>
        ))}
      </div>

      {/* ── Filter bar ────────────────────────────────── */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: '1 1 200px', minWidth: 180 }}>
            <span className="search-bar__icon">🔍</span>
            <input
              placeholder="Search name, email, phone, message…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 14 }}>✕
              </button>
            )}
          </div>

          <select className="form-input form-select" style={{ width: 190 }}
            value={fType} onChange={e => setFType(e.target.value)}>
            {TYPE_OPTIONS.map(t => (
              <option key={t} value={t === 'All' ? '' : t}>{t}</option>
            ))}
          </select>

          <select className="form-input form-select" style={{ width: 150 }}
            value={fStatus} onChange={e => setFStatus(e.target.value)}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>
            ))}
          </select>

          <span className="filter-count" style={{ marginLeft: 'auto' }}>
            {loading ? '…' : `${total} result${total !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────── */}
      {loading ? (
        <div className="card" style={{ padding: '48px 0', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: 'var(--t2)' }}>
            <div className="spinner spinner-gold" style={{ width: 26, height: 26, borderWidth: 3 }} />
            <span style={{ fontSize: 15 }}>Loading enquiries…</span>
          </div>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state__icon">📭</div>
          <div className="empty-state__title">No enquiries found</div>
          <div className="empty-state__sub">
            {hasFilters
              ? 'Try removing some filters to see more results.'
              : 'Enquiries from the website will appear here.'}
          </div>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={clearFilters}>
              ✕ Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Contact</th>
                <th>Type</th>
                <th>Property</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map(enq => (
                <tr key={enq._id}>

                  {/* Contact info */}
                  <td>
                    <div className="enq-con">
                      <div className="enq-con__av">
                        {enq.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="enq-con__name">
                          {enq.status === 'new' && <span className="enq-dot" />}
                          {enq.name}
                        </div>
                        <div className="enq-con__sub">{enq.phone}</div>
                        <div className="enq-con__sub">{enq.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td>
                    <span className="badge badge-purple" style={{ fontSize: 10 }}>{enq.type}</span>
                  </td>

                  {/* Property */}
                  <td style={{ color: 'var(--t2)', fontSize: 12, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {enq.property?.title || '—'}
                  </td>

                  {/* Message preview */}
                  <td>
                    <div className="enq-msg">
                      {enq.message?.slice(0, 55)}{enq.message?.length > 55 ? '…' : ''}
                    </div>
                  </td>

                  {/* Status — inline dropdown calls API */}
                  <td>
                    <select
                      className={`enq-status-sel badge ${STATUS_BADGE[enq.status] || 'badge-gold'}`}
                      value={enq.status}
                      onChange={e => updateStatus(enq._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}
                          style={{ textTransform: 'capitalize', background: 'var(--card)', color: 'var(--t1)' }}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Date */}
                  <td style={{ color: 'var(--t3)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {new Date(enq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="action-btns">
                      <button className="act-btn act-btn--view" title="View details"
                        onClick={() => openView(enq)}>👁
                      </button>
                      <a href={`mailto:${enq.email}`}
                        className="act-btn act-btn--edit"
                        title="Email"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        ✉️
                      </a>
                      <a href={`tel:${enq.phone}`}
                        className="act-btn"
                        title="Call"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        📞
                      </a>
                      <button className="act-btn act-btn--del" title="Delete"
                        onClick={() => { setSel(enq); setModal('delete'); }}>🗑
                      </button>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--t2)' }}>
            Showing {((page - 1) * PER) + 1}–{Math.min(page * PER, total)} of {total}
          </span>
          <div className="pagination">
            <button className="page-btn" disabled={page === 1}     onClick={() => setPage(1)}>«</button>
            <button className="page-btn" disabled={page === 1}     onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const pg = pages <= 7 ? i + 1 : page <= 4 ? i + 1 : page + i - 3;
              if (pg < 1 || pg > pages) return null;
              return (
                <button key={pg} className={`page-btn${page === pg ? ' active' : ''}`}
                  onClick={() => setPage(pg)}>{pg}
                </button>
              );
            })}
            <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>›</button>
            <button className="page-btn" disabled={page === pages} onClick={() => setPage(pages)}>»</button>
          </div>
        </div>
      )}

      {/* ══ VIEW / DETAIL MODAL ═════════════════════════ */}
      {modal === 'view' && sel && (
        <Modal title="📬 Enquiry Details" onClose={() => setModal(null)} size="lg">
          <div className="modal__body">
            <div className="enq-detail">

              {/* Left column */}
              <div className="enq-detail__left">
                <div className="enq-detail__av">
                  {sel.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="enq-detail__name">{sel.name}</div>

                <div className="enq-detail__contact">
                  <a href={`mailto:${sel.email}`} className="enq-detail__link">
                    ✉️ {sel.email}
                  </a>
                  <a href={`tel:${sel.phone}`} className="enq-detail__link">
                    📞 {sel.phone}
                  </a>
                </div>

                <div className="enq-detail__meta">
                  <div className="enq-meta-row">
                    <span>Type</span>
                    <span className="badge badge-purple">{sel.type}</span>
                  </div>
                  <div className="enq-meta-row">
                    <span>Status</span>
                    <span className={`badge ${STATUS_BADGE[sel.status] || 'badge-gold'}`}
                      style={{ textTransform: 'capitalize' }}>
                      {sel.status}
                    </span>
                  </div>
                  <div className="enq-meta-row">
                    <span>Property</span>
                    <span>{sel.property?.title || '—'}</span>
                  </div>
                  {sel.scheduleDate && (
                    <div className="enq-meta-row">
                      <span>Visit Date</span>
                      <span>{new Date(sel.scheduleDate).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}
                  <div className="enq-meta-row">
                    <span>Received</span>
                    <span>{new Date(sel.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}</span>
                  </div>
                </div>

                {/* Status buttons */}
                <div style={{ width: '100%' }}>
                  <div className="enq-qa__lbl" style={{ marginBottom: 8 }}>Update Status</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {STATUS_OPTIONS.map(s => (
                      <button key={s}
                        className={`btn btn-sm ${sel.status === s ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ textTransform: 'capitalize' }}
                        onClick={() => updateStatus(sel._id, s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="enq-detail__msgbox">
                  <div className="enq-detail__msglbl">Message</div>
                  <div className="enq-detail__msg">{sel.message}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Internal Notes</label>
                  <textarea
                    className="form-input form-textarea"
                    rows={3}
                    placeholder="Add internal notes — saved to backend…"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                  href={`mailto:${sel.email}?subject=${encodeURIComponent('Re: Your Property Enquiry — PrimePro')}&body=${encodeURIComponent(
      `Hi ${sel.name},\n\nThank you for your enquiry about "${sel.property?.title || 'our property'}".\n\nWe received your message:\n"${sel.message}"\n\nWe will get back to you shortly.\n\nBest regards,\nPrimePro Team`
    )}`}
    className="btn btn-ghost btn-sm"
    style={{ flex: 1, justifyContent: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
    onClick={() => {
      if (sel.status === 'new' || sel.status === 'read') {
        updateStatus(sel._id, 'replied');
      }
    }}
                  >
                    ✉️ Reply Email
                  </a>
                  <a
                    href={`https://wa.me/${sel.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hi ${sel.name}, thank you for contacting PrimePro regarding "${sel.property?.title || 'your property enquiry'}". How can we help you?`
  )}`}
  target="_blank"
  rel="noopener noreferrer"
  className="btn btn-success btn-sm"
  style={{ flex: 1, justifyContent: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
  onClick={() => {
    if (sel.status === 'new' || sel.status === 'read') {
      updateStatus(sel._id, 'replied');
    }
  }}
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="modal__footer">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Close</button>
            <button className="btn btn-primary" onClick={saveNotes} disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : '💾 Save Notes'}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ DELETE CONFIRM ═══════════════════════════════ */}
      {modal === 'delete' && sel && (
        <Modal title="🗑️ Delete Enquiry" onClose={() => setModal(null)}>
          <div className="modal__body">
            <div className="confirm-icon">📭</div>
            <div className="confirm-title">Delete this enquiry?</div>
            <div className="confirm-sub">
              From <strong>{sel.name}</strong> ({sel.email}).
              This is permanent and cannot be undone.
            </div>
          </div>
          <div className="modal__footer">
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              {saving ? <><span className="spinner" /> Deleting…</> : '🗑 Yes, Delete'}
            </button>
          </div>
        </Modal>
      )}

      {/* Toast notification */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}