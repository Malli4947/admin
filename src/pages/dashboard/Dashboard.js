import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { useAuth }  from '../../Context/AuthContext';
import { useTheme } from '../../Context/ThemeContext';
import api          from '../../Utils/api';
import './Dashboard.css';

// ── Constants ──────────────────────────────────────────────────────────────
const PIE_COLORS   = ['#3B82F6','#22C55E','#F59E0B','#8B5CF6','#EF4444','#C9A84C'];
const STATUS_BADGE = { new:'badge-red', read:'badge-amber', replied:'badge-blue', closed:'badge-gold' };

const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * API returns monthlyEnquiryTrend as:
 *   [{ _id: { year: 2026, month: 3 }, count: 3 }]
 *
 * Recharts needs:
 *   [{ month: 'Mar 2026', count: 3 }]
 */
function normaliseMonthlyTrend(raw = []) {
  return [...raw]
    .sort((a, b) => {
      const ay = a._id?.year ?? 0, am = a._id?.month ?? 0;
      const by = b._id?.year ?? 0, bm = b._id?.month ?? 0;
      return ay !== by ? ay - by : am - bm;
    })
    .map(d => ({
      month: `${MONTH_NAMES[d._id?.month ?? 0]} ${d._id?.year ?? ''}`.trim(),
      count: d.count ?? 0,
    }));
}

/**
 * Format price nicely: 315000 → ₹3.15 L, 4200000 → ₹42 L, 65000000 → ₹6.5 Cr
 */
function fmtPrice(price) {
  if (!price) return '—';
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(1)} Cr`;
  if (price >= 100_000)    return `₹${(price / 100_000).toFixed(0)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'var(--card)', border:'1px solid var(--bdr2)',
      borderRadius:8, padding:'8px 14px',
    }}>
      <p style={{ fontSize:11, color:'var(--t2)', marginBottom:3 }}>{label}</p>
      <p style={{ fontSize:15, fontWeight:700, color:'var(--gold)' }}>{payload[0].value}</p>
    </div>
  );
}

function Skeleton({ h = 100, r = 16 }) {
  return <div className="skeleton" style={{ height:h, borderRadius:r }} />;
}

function EmptyChart({ label = 'No data yet', h = 210 }) {
  return (
    <div style={{ height:h, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
      <span style={{ fontSize:28, opacity:.25 }}>📊</span>
      <span style={{ fontSize:13, color:'var(--t3)' }}>{label}</span>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const { admin }  = useAuth();
  const { isDark } = useTheme();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const tickColor = isDark ? 'rgba(255,255,255,.4)' : '#6b80a0';
  const gridColor = isDark ? 'rgba(255,255,255,.05)' : 'rgba(26,43,74,.06)';

  // ── GET /api/admin/dashboard ──────────────────────────────────────────────
  // API response shape:
  // {
  //   success: true,
  //   stats:   { totalUsers, totalProperties, totalEnquiries, newUsersToday,
  //              activeListings, featuredCount },
  //   recentEnquiries:  [...],
  //   recentProperties: [...],
  //   charts: {
  //     monthlyEnquiryTrend: [{ _id: { year, month }, count }],
  //     enquiriesByType:     [{ _id: string, count }],
  //     propertiesByType:    [{ _id: string, count }],
  //   }
  // }
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/dashboard');

      if (res.success) {
        // ── Normalise the response into a consistent shape ────────────────
        // The API puts everything at the root level, not nested under "dashboard"
        setData({
          stats:            res.stats            || {},
          recentEnquiries:  res.recentEnquiries  || [],
          recentProperties: res.recentProperties || [],
          charts: {
            // ✅ API key is "monthlyEnquiryTrend" (not "monthlyEnquiries")
            // ✅ Each item is { _id: { year, month }, count } — normalise to { month, count }
            monthlyEnquiries:  normaliseMonthlyTrend(res.charts?.monthlyEnquiryTrend),
            enquiriesByType:   res.charts?.enquiriesByType  || [],
            propertiesByType:  res.charts?.propertiesByType || [],
          },
        });
      } else {
        setError(res.message || 'Failed to load dashboard');
      }
    } catch {
      setError('Network error — make sure backend is running');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="dashboard a-up">
      <div className="dash-header">
        <div><h1 className="dash-title">Dashboard</h1><p className="dash-sub">Loading live data…</p></div>
      </div>
      <div className="stat-grid">{[1,2,3,4].map(i => <Skeleton key={i} h={120} />)}</div>
      <div className="chart-row">{[1,2,3].map(i => <Skeleton key={i} h={280} />)}</div>
    </div>
  );

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) return (
    <div className="dashboard a-up">
      <div className="dash-header">
        <div><h1 className="dash-title">Dashboard</h1></div>
        <button className="btn btn-primary btn-sm" onClick={load}>🔄 Retry</button>
      </div>
      <div className="card" style={{ padding:'48px 24px', textAlign:'center' }}>
        <div style={{ fontSize:48, opacity:.35, marginBottom:12 }}>📊</div>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--t1)', marginBottom:8 }}>
          Could not load dashboard
        </div>
        <div style={{ fontSize:13, color:'var(--t2)', marginBottom:20 }}>{error}</div>
        <button className="btn btn-primary" onClick={load}>🔄 Try Again</button>
      </div>
    </div>
  );

  // ── Destructure normalised data ───────────────────────────────────────────
  const s          = data?.stats           || {};
  const recentEnq  = data?.recentEnquiries  || [];
  const recentProp = data?.recentProperties || [];
  const charts     = data?.charts           || {};

  // Top properties sorted by views descending
  const topProps = [...recentProp]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  // ── Stat cards
  // ✅ API uses "newUsersToday" not "newEnquiriesToday"
  // ✅ API uses "totalUsers" not "registeredUsers"
  const STAT_CARDS = [
    {
      label: 'Total Properties',
      val:   s.totalProperties ?? 0,
      sub:   `${s.activeListings ?? 0} active listings`,
      icon:  '🏘️', cls:'blue',  bg:'var(--blue-bg)',
    },
    {
      label: 'Registered Users',
      val:   s.totalUsers ?? 0,
      sub:   `${s.newUsersToday ?? 0} new today`,
      icon:  '👥', cls:'green', bg:'var(--green-bg)',
    },
    {
      label: 'Total Enquiries',
      val:   s.totalEnquiries ?? 0,
      // API doesn't return newEnquiriesToday separately — count from recentEnquiries
      sub:   `${recentEnq.filter(e => e.status === 'new').length} unread`,
      icon:  '📬', cls:'gold',  bg:'var(--gold-glow)',
    },
    {
      label: 'Featured Listings',
      val:   s.featuredCount ?? 0,
      sub:   'currently live',
      icon:  '⭐', cls:'purp',  bg:'var(--purp-bg)',
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard a-up">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-sub">
            Welcome back, <strong>{admin?.name || 'Admin'}</strong> 👋
          </p>
        </div>
        <div className="dash-hdr-right">
          <span className="dash-date">
            {new Date().toLocaleDateString('en-IN', {
              weekday:'long', day:'numeric', month:'long', year:'numeric',
            })}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={load} title="Refresh data">🔄</button>
          <Link to="/properties" className="btn btn-primary btn-sm">+ Add Property</Link>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="stat-grid">
        {STAT_CARDS.map((c, i) => (
          <div key={c.label} className={`stat-card card stat-card--${c.cls} a-up d${i + 1}`}>
            <div className="stat-card__top">
              <div className="stat-card__icon" style={{ background:c.bg }}>{c.icon}</div>
              <span className="stat-card__chg">{c.sub}</span>
            </div>
            <div className={`stat-card__val stat-val--${c.cls}`}>{c.val}</div>
            <div className="stat-card__label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────── */}
      <div className="chart-row">
        <div className="chart-card card a-up d2">
          <div className="chart-card__top">
            <h3 className="chart-card__title">Monthly Enquiries</h3>
            <span className="badge badge-green">Live</span>
          </div>
          {charts.monthlyEnquiries?.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={charts.monthlyEnquiries}>
                <CartesianGrid stroke={gridColor} />
                <XAxis
                  dataKey="month"
                  tick={{ fill:tickColor, fontSize:11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill:tickColor, fontSize:11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--gold)"
                  strokeWidth={2.5}
                  dot={{ fill:'var(--gold)', r:4 }}
                  activeDot={{ r:6, fill:'var(--gold-lt)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No enquiry trend data yet" />
          )}
        </div>

        {/* Properties by type — bar chart */}
        {/* ✅ Data source: charts.propertiesByType [{ _id: 'Residential', count: 1 }] */}
        <div className="chart-card card a-up d3">
          <div className="chart-card__top">
            <h3 className="chart-card__title">Properties by Type</h3>
          </div>
          {charts.propertiesByType?.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={charts.propertiesByType} barSize={36}>
                <CartesianGrid stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="_id"
                  tick={{ fill:tickColor, fontSize:10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill:tickColor, fontSize:11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[7,7,0,0]}>
                  {charts.propertiesByType.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No property data yet" />
          )}
        </div>

        {/* Enquiry types — donut pie */}
        {/* ✅ Data source: charts.enquiriesByType [{ _id: 'Site Visit', count: 2 }] */}
        <div className="chart-card card a-up d4">
          <div className="chart-card__top">
            <h3 className="chart-card__title">Enquiry Types</h3>
          </div>
          {charts.enquiriesByType?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={charts.enquiriesByType}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}>
                    {charts.enquiriesByType.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background:'var(--card)',
                      border:'1px solid var(--bdr2)',
                      borderRadius:8,
                      fontSize:12,
                    }}
                    formatter={(val, name) => [val, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {charts.enquiriesByType.map((d, i) => (
                  <div key={i} className="pie-legend__item">
                    <span className="pie-legend__dot"
                      style={{ background:PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="pie-legend__lbl">{d._id}</span>
                    <span className="pie-legend__val">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart label="No enquiry types yet" h={150} />
          )}
        </div>
      </div>

      {/* ── Bottom panels ──────────────────────────────────────────────── */}
      <div className="bottom-row">

        {/* Recent enquiries table */}
        {/* ✅ Fields: e.name, e.phone, e.type, e.status, e.createdAt, e.property.title */}
        <div className="panel card a-up d3">
          <div className="panel__head">
            <span className="panel__title">
              Recent Enquiries
              {recentEnq.filter(e => e.status === 'new').length > 0 && (
                <span className="badge badge-red" style={{ marginLeft:8, fontSize:10 }}>
                  {recentEnq.filter(e => e.status === 'new').length} new
                </span>
              )}
            </span>
            <Link to="/enquiries" className="btn btn-ghost btn-sm">View All →</Link>
          </div>

          {recentEnq.length === 0 ? (
            <div style={{ padding:'32px 0', textAlign:'center' }}>
              <div style={{ fontSize:32, opacity:.35 }}>📭</div>
              <div style={{ fontSize:13, color:'var(--t2)', marginTop:8 }}>No enquiries yet</div>
            </div>
          ) : (
            <div className="table-wrap" style={{ borderRadius:0, border:'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Property</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEnq.map(e => (
                    <tr key={e._id}>
                      <td>
                        <div className="enq-name">{e.name}</div>
                        <div className="enq-phone">{e.phone}</div>
                      </td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize:10 }}>
                          {e.type || '—'}
                        </span>
                      </td>
                      <td style={{
                        color:'var(--t2)', fontSize:12,
                        maxWidth:130, overflow:'hidden',
                        textOverflow:'ellipsis', whiteSpace:'nowrap',
                      }}>
                        {/* ✅ property can be null when no property linked */}
                        {e.property?.title || <span style={{ color:'var(--t3)', fontStyle:'italic' }}>General</span>}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[e.status] || 'badge-gold'}`}
                          style={{ textTransform:'capitalize' }}>
                          {e.status || '—'}
                        </span>
                      </td>
                      <td style={{ color:'var(--t3)', fontSize:11, whiteSpace:'nowrap' }}>
                        {e.createdAt
                          ? new Date(e.createdAt).toLocaleDateString('en-IN', {
                              day:'numeric', month:'short', year:'2-digit',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top / recent properties */}
        {/* ✅ API returns: { _id, title, price, type, status, image, location: { locality, city } } */}
        <div className="panel card a-up d4">
          <div className="panel__head">
            <span className="panel__title">Recent Properties</span>
            <Link to="/properties" className="btn btn-ghost btn-sm">View All →</Link>
          </div>

          {recentProp.length === 0 ? (
            <div style={{ padding:'32px 0', textAlign:'center' }}>
              <div style={{ fontSize:32, opacity:.35 }}>🏚️</div>
              <div style={{ fontSize:13, color:'var(--t2)', marginTop:8 }}>No properties yet</div>
            </div>
          ) : (
            <div className="top-props">
              {recentProp.slice(0, 5).map((p, i) => (
                <div key={p._id} className="top-prop">
                  <div className="top-prop__rank">{i + 1}</div>

                  {/* ✅ API returns image as null for unset images — handle gracefully */}
                  {p.image
                    ? <img src={p.image} alt={p.title} className="top-prop__img" />
                    : (
                      <div className="top-prop__img" style={{
                        background:'var(--bg3)', display:'flex',
                        alignItems:'center', justifyContent:'center', fontSize:16,
                      }}>
                        🏠
                      </div>
                    )
                  }

                  <div className="top-prop__info">
                    <div className="top-prop__name">{p.title}</div>
                    {/* ✅ location is an object: { address, locality, city, state, pincode } */}
                    <div className="top-prop__loc">
                      {p.location?.locality
                        ? `${p.location.locality}, ${p.location.city || 'Hyderabad'}`
                        : p.location?.city || '—'}
                    </div>
                  </div>

                  <div className="top-prop__meta">
                    {/* ✅ API returns price as number, priceLabel may be absent */}
                    <div className="top-prop__price">
                      {p.priceLabel || fmtPrice(p.price)}
                    </div>
                    <div className="top-prop__views">
                      <span className={`badge ${p.status === 'For Sale' ? 'badge-green' : 'badge-blue'}`}
                        style={{ fontSize:10 }}>
                        {p.status || p.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}