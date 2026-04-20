import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../Context/AuthContext';
import api from '../../Utils/api';
import './Users.css';

// ── Constants ─────────────────────────────────────────────────
const ROLE_BADGE = {
  user:       'badge-blue',
  admin:      'badge-amber',
  superadmin: 'badge-gold',
};
const ROLE_AVATAR_BG = {
  user:       'linear-gradient(135deg,#3B82F6,#93C5FD)',
  admin:      'linear-gradient(135deg,#F59E0B,#FCD34D)',
  superadmin: 'linear-gradient(135deg,var(--gold),var(--gold-lt))',
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
        style={{ background:'none', border:'none', color:'inherit', fontSize:16, cursor:'pointer', marginLeft:8 }}>✕
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Users() {
  const { admin }    = useAuth();
  const isSuperAdmin = admin?.role === 'superadmin';
  // Both admin and superadmin can view/edit; only superadmin can delete
  const canEdit      = admin?.role === 'admin' || admin?.role === 'superadmin';

  // ── Data state
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  // ── Filter state
  const [fRole,   setFRole]   = useState('');
  const [fActive, setFActive] = useState('');
  const [search,  setSearch]  = useState('');
  const [sort,    setSort]    = useState('-createdAt');
  const [page,    setPage]    = useState(1);
  const PER = 15;

  // ── Modal state
  const [modal, setModal] = useState(null);   // 'view'|'edit'|'add'|'delete'
  const [sel,   setSel]   = useState(null);
  const [form,  setForm]  = useState({
    name:'', email:'', phone:'', role:'user',
    isActive:true, isVerified:false, password:'',
  });

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [fRole, fActive, search, sort]);

  // ── Fetch users ───────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (fRole)          p.set('role',     fRole);
      if (fActive !== '')  p.set('isActive', fActive);
      if (search.trim())  p.set('search',   search.trim());
      p.set('sort',  sort);
      p.set('page',  page);
      p.set('limit', PER);

      // ✅ Correct path: /api/admin/users
      const data = await api.get(`/api/admin/users?${p.toString()}`);
      if (data.success) {
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setPages(Math.ceil((data.total || 0) / PER) || 1);
      } else {
        showToast(data.message || 'Failed to load users', 'error');
      }
    } catch {
      showToast('Network error — is backend running on port 5000?', 'error');
    }
    setLoading(false);
  }, [fRole, fActive, search, sort, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const showToast  = (msg, type = 'success') => setToast({ msg, type });
  const closeModal = () => { setModal(null); setSel(null); };

  // ── Open modals ───────────────────────────────────────────
  const openView = (u) => { setSel(u); setModal('view'); };

  const openEdit = (u) => {
    setSel(u);
    setForm({
      name:       u.name       || '',
      email:      u.email      || '',
      phone:      u.phone      || '',
      role:       u.role       || 'user',
      isActive:   u.isActive   !== undefined ? u.isActive   : true,
      isVerified: u.isVerified !== undefined ? u.isVerified : false,
      password:   '',
    });
    setModal('edit');
  };

  const openAdd = () => {
    setSel(null);
    setForm({ name:'', email:'', phone:'', role:'user', isActive:true, isVerified:false, password:'' });
    setModal('add');
  };

  const openDelete = (u) => { setSel(u); setModal('delete'); };

  // ── Create new user ───────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name.trim())     return showToast('Name is required',     'error');
    if (!form.email.trim())    return showToast('Email is required',    'error');
    if (!form.phone.trim())    return showToast('Phone is required',    'error');
    if (!form.password.trim()) return showToast('Password is required', 'error');

    setSaving(true);
    try {
      // ✅ Correct path: /api/auth/register
      const data = await api.post('/api/auth/register', {
        name:     form.name.trim(),
        email:    form.email.trim(),
        phone:    form.phone.trim(),
        password: form.password.trim(),
      });

      if (data.success) {
        // Assign non-user role if needed
        if (form.role !== 'user' && data.user?._id) {
          // ✅ Correct path: /api/admin/users/:id
          await api.put(`/api/admin/users/${data.user._id}`, { role: form.role });
        }
        showToast('User created successfully!');
        closeModal();
        fetchUsers();
      } else {
        showToast(data.message || 'Create failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setSaving(false);
  };

  // ── Update user ───────────────────────────────────────────
  const handleUpdate = async () => {
    if (!sel) return;
    if (!form.name.trim())  return showToast('Name is required',  'error');
    if (!form.email.trim()) return showToast('Email is required', 'error');

    const payload = {
      name:       form.name.trim(),
      email:      form.email.trim(),
      phone:      form.phone.trim(),
      isActive:   form.isActive,
      isVerified: form.isVerified,
    };
    if (isSuperAdmin) payload.role = form.role;

    setSaving(true);
    try {
      // ✅ Correct path: /api/admin/users/:id
      const data = await api.put(`/api/admin/users/${sel._id}`, payload);
      if (data.success) {
        showToast('User updated!');
        closeModal();
        fetchUsers();
      } else {
        showToast(data.message || 'Update failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setSaving(false);
  };

  // ── Deactivate / delete ───────────────────────────────────
  const handleDelete = async () => {
    if (!sel) return;
    setSaving(true);
    try {
      // Both admin and superadmin can deactivate — backend DELETE now allows both roles
      const data = await api.delete(`/api/admin/users/${sel._id}`);

      if (data.success) {
        showToast('User deactivated');
        closeModal();
        fetchUsers();
      } else {
        showToast(data.message || 'Failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setSaving(false);
  };

  // ── Inline active toggle ──────────────────────────────────
  const toggleActive = async (u) => {
    if (u._id === admin?._id) return showToast("You can't deactivate yourself", 'error');
    try {
      // ✅ Correct path: /api/admin/users/:id
      const data = await api.put(`/api/admin/users/${u._id}`, { isActive: !u.isActive });
      if (data.success) {
        setUsers(prev => prev.map(x => x._id === u._id ? { ...x, isActive: !x.isActive } : x));
        showToast(u.isActive ? 'User deactivated' : 'User activated');
      } else {
        showToast(data.message || 'Failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // ── Inline role toggle (superadmin only) ──────────────────
  const toggleRole = async (u) => {
    if (!isSuperAdmin || u._id === admin?._id) return;
    const newRole = u.role === 'user' ? 'admin' : 'user';
    try {
      // ✅ Correct path: /api/admin/users/:id
      const data = await api.put(`/api/admin/users/${u._id}`, { role: newRole });
      if (data.success) {
        setUsers(prev => prev.map(x => x._id === u._id ? { ...x, role: newRole } : x));
        showToast(`Role changed to ${newRole}`);
      } else {
        showToast(data.message || 'Failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const clearFilters = () => { setFRole(''); setFActive(''); setSearch(''); setSort('-createdAt'); setPage(1); };
  const hasFilters   = fRole || fActive || search;

  // Derived stats from current page
  const statCards = [
    { label:'Total Users',   val: total,                                                          icon:'👥', color:'var(--blue)'  },
    { label:'Regular Users', val: users.filter(u => u.role === 'user').length,                    icon:'👤', color:'var(--green)' },
    { label:'Admins',        val: users.filter(u => ['admin','superadmin'].includes(u.role)).length, icon:'🛡️', color:'var(--amber)' },
    { label:'Active Now',    val: users.filter(u => u.isActive).length,                           icon:'✅', color:'var(--gold)'  },
  ];

  return (
    <div className="page a-up">

      {/* ── Stat cards ────────────────────────────────── */}
      <div className="users-stat-grid">
        {statCards.map((s, i) => (
          <div key={s.label} className={`user-stat-card card a-up d${i+1}`}>
            <span className="user-stat-card__icon">{s.icon}</span>
            <span className="user-stat-card__val" style={{ color: s.color }}>{s.val}</span>
            <span className="user-stat-card__lbl">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Header ────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-sub">
            {loading ? 'Loading…' : `${total} total`}
            {hasFilters && <span className="filter-count"> · filters active</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          {hasFilters && <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear</button>}
          {canEdit && <button className="btn btn-primary" onClick={openAdd}>+ Add User</button>}
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────── */}
      <div className="card" style={{ padding:'14px 18px' }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>

          <div className="search-bar" style={{ flex:'1 1 200px', minWidth:180 }}>
            <span className="search-bar__icon">🔍</span>
            <input placeholder="Search name, email, phone…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t3)', fontSize:14 }}>✕</button>
            )}
          </div>

          <select className="form-input form-select" style={{ width:155 }}
            value={fRole} onChange={e => setFRole(e.target.value)}>
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>

          <select className="form-input form-select" style={{ width:160 }}
            value={fActive} onChange={e => setFActive(e.target.value)}>
            <option value="">Active + Inactive</option>
            <option value="true">✅ Active Only</option>
            <option value="false">🔴 Inactive Only</option>
          </select>

          <select className="form-input form-select" style={{ width:165 }}
            value={sort} onChange={e => setSort(e.target.value)}>
            <option value="-createdAt">Newest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="name">Name A–Z</option>
            <option value="-name">Name Z–A</option>
            <option value="-lastLogin">Last Login</option>
          </select>

          <span className="filter-count" style={{ marginLeft:'auto' }}>
            {loading ? '…' : `${total} user${total !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────── */}
      {loading ? (
        <div className="card" style={{ padding:'48px 0', textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:12, color:'var(--t2)' }}>
            <div className="spinner spinner-gold" style={{ width:26, height:26, borderWidth:3 }} />
            <span style={{ fontSize:15 }}>Loading users…</span>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state__icon">👥</div>
          <div className="empty-state__title">No users found</div>
          <div className="empty-state__sub">
            {hasFilters ? 'Try adjusting your filters.' : 'No users registered yet.'}
          </div>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop:10 }} onClick={clearFilters}>
              ✕ Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={!u.isActive ? { opacity:.55 } : {}}>

                  {/* Name + ID */}
                  <td>
                    <div className="user-cell">
                      <div className="user-cell__av"
                        style={{ background: ROLE_AVATAR_BG[u.role] || ROLE_AVATAR_BG.user }}>
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="user-cell__name">
                          {u.name}
                          {u._id === admin?._id && (
                            <span className="badge badge-gold"
                              style={{ fontSize:9, padding:'1px 6px', marginLeft:5 }}>You</span>
                          )}
                        </div>
                        <div style={{ fontFamily:'monospace', fontSize:10, color:'var(--t3)', marginTop:2 }}>
                          #{u._id?.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email + phone */}
                  <td>
                    <div style={{ fontSize:12, color:'var(--t2)' }}>{u.email}</div>
                    <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>{u.phone}</div>
                  </td>

                  {/* Role badge — superadmin can click to toggle user↔admin */}
                  <td>
                    <span
                      className={`badge ${ROLE_BADGE[u.role] || 'badge-blue'}`}
                      style={{
                        cursor: isSuperAdmin && u._id !== admin?._id && u.role !== 'superadmin'
                          ? 'pointer' : 'default',
                        textTransform: 'capitalize',
                      }}
                      title={isSuperAdmin && u.role !== 'superadmin' ? 'Click to toggle user ↔ admin' : u.role}
                      onClick={() => {
                        if (isSuperAdmin && u._id !== admin?._id && u.role !== 'superadmin') toggleRole(u);
                      }}
                    >
                      {u.role === 'superadmin' ? '👑 Superadmin' : u.role}
                    </span>
                  </td>

                  {/* Verified */}
                  <td>
                    <span className={`badge ${u.isVerified ? 'badge-green' : 'badge-red'}`}>
                      {u.isVerified ? '✓ Yes' : '✗ No'}
                    </span>
                  </td>

                  {/* Joined */}
                  <td style={{ color:'var(--t3)', fontSize:12, whiteSpace:'nowrap' }}>
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' })
                      : '—'}
                  </td>

                  {/* Last login */}
                  <td style={{ color:'var(--t3)', fontSize:12, whiteSpace:'nowrap' }}>
                    {u.lastLogin
                      ? new Date(u.lastLogin).toLocaleDateString('en-IN', { day:'numeric', month:'short' })
                      : 'Never'}
                  </td>

                  {/* Active toggle */}
                  <td>
                    <button
                      className={`status-btn ${u.isActive ? 'on' : 'off'}`}
                      onClick={() => toggleActive(u)}
                      disabled={u._id === admin?._id || !canEdit}
                      style={{ minWidth:74 }}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="action-btns">
                      {/* View — everyone */}
                      <button className="act-btn act-btn--view" title="View details"
                        onClick={() => openView(u)}>👁
                      </button>

                      {/* Edit — admin + superadmin */}
                      {canEdit && (
                        <button className="act-btn act-btn--edit" title="Edit user"
                          onClick={() => openEdit(u)}>✏️
                        </button>
                      )}

                      {/* Delete — admin + superadmin, not themselves */}
                      {canEdit && u._id !== admin?._id && (
                        <button className="act-btn act-btn--del" title="Deactivate user"
                          onClick={() => openDelete(u)}>🗑
                        </button>
                      )}
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
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <span style={{ fontSize:13, color:'var(--t2)' }}>
            Showing {((page-1)*PER)+1}–{Math.min(page*PER, total)} of {total}
          </span>
          <div className="pagination">
            <button className="page-btn" disabled={page===1}     onClick={() => setPage(1)}>«</button>
            <button className="page-btn" disabled={page===1}     onClick={() => setPage(p => p-1)}>‹</button>
            {Array.from({ length: Math.min(pages,7) }, (_,i) => {
              const pg = pages<=7 ? i+1 : page<=4 ? i+1 : page+i-3;
              if (pg<1||pg>pages) return null;
              return (
                <button key={pg} className={`page-btn${page===pg?' active':''}`}
                  onClick={() => setPage(pg)}>{pg}</button>
              );
            })}
            <button className="page-btn" disabled={page===pages} onClick={() => setPage(p => p+1)}>›</button>
            <button className="page-btn" disabled={page===pages} onClick={() => setPage(pages)}>»</button>
          </div>
        </div>
      )}

      {/* ══ VIEW MODAL ════════════════════════════════════ */}
      {modal === 'view' && sel && (
        <Modal title="👤 User Details" onClose={closeModal} style={{paddingTop:80}}>
          <div className="modal__body" >
            <div className="user-view">
              <div className="user-view__av"
                style={{ background: ROLE_AVATAR_BG[sel.role] || ROLE_AVATAR_BG.user }}>
                {sel.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="user-view__name">{sel.name}</div>
              <span className={`badge ${ROLE_BADGE[sel.role] || 'badge-blue'}`}
                style={{ textTransform:'capitalize' }}>{sel.role}</span>
              <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap', justifyContent:'center' }}>
                <span className={`badge ${sel.isActive ? 'badge-green' : 'badge-red'}`}>
                  {sel.isActive ? '✅ Active' : '🔴 Inactive'}
                </span>
                <span className={`badge ${sel.isVerified ? 'badge-green' : 'badge-amber'}`}>
                  {sel.isVerified ? '✓ Verified' : '⚠ Unverified'}
                </span>
              </div>
            </div>

            <div className="view-grid" style={{ marginTop:16 }}>
              {[
                ['Email',      sel.email],
                ['Phone',      sel.phone],
                ['User ID',    `#${sel._id?.slice(-12)}`],
                ['Role',       sel.role],
                ['Joined',     sel.createdAt ? new Date(sel.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : '—'],
                ['Last Login', sel.lastLogin ? new Date(sel.lastLogin).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' }) : 'Never'],
                ['Wishlist',   `${sel.wishlist?.length || 0} saved properties`],
              ].map(([k, v]) => (
                <div key={k} className="view-row">
                  <span className="view-row__key">{k}</span>
                  <span className="view-row__val" style={{ textAlign:'right', wordBreak:'break-all', textTransform:'capitalize' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <a href={`mailto:${sel.email}`}
                className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:'center' }}>
                ✉️ Email
              </a>
              <a href={`https://wa.me/91${sel.phone}`} target="_blank" rel="noopener noreferrer"
                className="btn btn-success btn-sm" style={{ flex:1, justifyContent:'center' }}>
                💬 WhatsApp
              </a>
            </div>
          </div>
          <div className="modal__footer">
            <button className="btn btn-ghost" onClick={closeModal}>Close</button>
            {canEdit && (
              <button className="btn btn-primary"
                onClick={() => { closeModal(); setTimeout(() => openEdit(sel), 50); }}>
                ✏️ Edit User
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* ══ ADD / EDIT MODAL ═════════════════════════════ */}
      {(modal === 'edit' || modal === 'add') && (
        <Modal title={modal === 'add' ? '➕ Add New User' : `✏️ Edit — ${sel?.name}`} onClose={closeModal}>
          <div className="modal__body" style={{ display:'flex', flexDirection:'column', gap:14 }}>

            <div className="form-grid">
              <div className="form-group form-full">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Arjun Mehta"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" placeholder="arjun@example.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email:e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input type="tel" className="form-input" placeholder="9876543210" maxLength={10}
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/,'').slice(0,10) }))} />
              </div>

              {modal === 'add' && (
                <div className="form-group form-full">
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-input" placeholder="Min 6 characters"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password:e.target.value }))} />
                </div>
              )}

              <div className="form-group form-full">
                <label className="form-label">
                  Role
                  {!isSuperAdmin && (
                    <span style={{ color:'var(--t3)', fontWeight:400, marginLeft:8, fontSize:11 }}>
                      (superadmin only)
                    </span>
                  )}
                </label>
                <select className="form-input form-select"
                  value={form.role}
                  disabled={!isSuperAdmin}
                  onChange={e => setForm(f => ({ ...f, role:e.target.value }))}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  {isSuperAdmin && <option value="superadmin">Super Admin</option>}
                </select>
              </div>
            </div>

            <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
              <label className="check-label">
                <input type="checkbox" checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive:e.target.checked }))} />
                ✅ Active Account
              </label>
              <label className="check-label">
                <input type="checkbox" checked={form.isVerified}
                  onChange={e => setForm(f => ({ ...f, isVerified:e.target.checked }))} />
                ✓ Mark as Verified
              </label>
            </div>

            {/* Show current role note for non-superadmin editing */}
            {modal === 'edit' && sel && !isSuperAdmin && (
              <div style={{
                padding:'10px 14px', background:'var(--bg2)', borderRadius:8,
                border:'1px solid var(--bdr)', fontSize:12, color:'var(--t2)',
              }}>
                ℹ️ Current role: <strong style={{ textTransform:'capitalize', color:'var(--t1)' }}>{sel.role}</strong>.
                Only a superadmin can change roles.
              </div>
            )}
          </div>

          <div className="modal__footer">
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary"
              onClick={modal === 'add' ? handleCreate : handleUpdate}
              disabled={saving}>
              {saving
                ? <><span className="spinner" /> Saving…</>
                : modal === 'add' ? '➕ Create User' : '💾 Save Changes'
              }
            </button>
          </div>
        </Modal>
      )}

      {/* ══ DELETE / DEACTIVATE CONFIRM ══════════════════ */}
      {modal === 'delete' && sel && (
        <Modal title="⚠️ Deactivate User" onClose={closeModal}>
          <div className="modal__body">
            <div className="confirm-icon">
              <div style={{
                width:64, height:64, borderRadius:16, margin:'0 auto 14px',
                background: ROLE_AVATAR_BG[sel.role] || ROLE_AVATAR_BG.user,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:28, fontWeight:800, color:'var(--navy)',
              }}>
                {sel.name?.charAt(0)?.toUpperCase()}
              </div>
            </div>
            <div className="confirm-title">Deactivate "{sel.name}"?</div>
            <div className="confirm-sub">
              <strong>{sel.email}</strong> · <strong>{sel.role}</strong>
              <br /><br />
              This sets their account to inactive — they cannot login until reactivated.
              Use the Active toggle in the table to restore access anytime.
            </div>
          </div>
          <div className="modal__footer">
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              {saving ? <><span className="spinner" /> Working…</> : '⚠️ Yes, Deactivate'}
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}