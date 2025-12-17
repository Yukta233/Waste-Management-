import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { Sidebar, SidebarBody, SidebarLink } from '../components/sidebar';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-center gap-3 shadow-sm">
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500">{title}</div>
        <div className="text-xl font-semibold text-gray-800">{value}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // view state
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // admin data
  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);
  const [serviceFilter, setServiceFilter] = useState({ status: 'pending', category: '', city: '', page: 1, limit: 20 });
  const [selectedService, setSelectedService] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    const t = localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token') || sessionStorage.getItem('accessToken');
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
    if (t) setToken(t);
  }, []);

  async function api(path, { method = 'GET', body, token: tk } = {}) {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(tk || token ? { Authorization: `Bearer ${tk || token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
    if (!res.ok) {
      let text = '';
      try { text = await res.text(); } catch {}
      try {
        const parsed = JSON.parse(text || '{}');
        const msg = parsed?.message || parsed?.error || text;
        if (res.status === 401 || String(msg).toLowerCase().includes('jwt expired') || String(msg).toLowerCase().includes('token')) {
          try { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('token'); localStorage.removeItem('user'); sessionStorage.removeItem('accessToken'); sessionStorage.removeItem('token'); sessionStorage.removeItem('user'); } catch {}
          throw new Error('Session expired. Please sign in again.');
        }
        throw new Error(msg || `Request failed ${res.status}`);
      } catch (err) {
        throw new Error(text || `Request failed ${res.status}`);
      }
    }
    return res.json();
  }

  // fetch dashboard stats
  async function loadStats() {
    try {
      const resp = await api('/admin/dashboard/stats');
      setStats(resp?.data || resp?.data?.stats || resp);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }

  // fetch services for admin
  async function loadServices() {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams();
      if (serviceFilter.status) qs.set('status', serviceFilter.status);
      if (serviceFilter.category) qs.set('category', serviceFilter.category);
      if (serviceFilter.city) qs.set('city', serviceFilter.city);
      qs.set('page', String(serviceFilter.page)); qs.set('limit', String(serviceFilter.limit));
      const resp = await api(`/admin/services?${qs.toString()}`);
      const arr = resp?.data?.services || resp?.data || resp?.services || [];
      setServices(Array.isArray(arr) ? arr : []);
    } catch (err) {
      console.error('Failed to load services for admin', err);
      setError(err.message || 'Failed to load');
    } finally { setLoading(false); }
  }

  // fetch users for admin
  const [usersList, setUsersList] = useState([]);
  const [userFilter, setUserFilter] = useState({ role: '', verificationStatus: '', page: 1, limit: 20 });

  async function loadUsers() {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams();
      if (userFilter.role) qs.set('role', userFilter.role);
      if (userFilter.verificationStatus) qs.set('verificationStatus', userFilter.verificationStatus);
      qs.set('page', String(userFilter.page)); qs.set('limit', String(userFilter.limit));
      const resp = await api(`/admin/users?${qs.toString()}`);
      const arr = resp?.data?.users || resp?.data || resp?.users || [];
      setUsersList(Array.isArray(arr) ? arr : []);
    } catch (err) {
      console.error('Failed to load users for admin', err);
      setError(err.message || 'Failed to load users');
    } finally { setLoading(false); }
  }

  useEffect(() => { if (user) { loadStats(); loadServices(); } }, [user, serviceFilter.status, serviceFilter.category, serviceFilter.city, serviceFilter.page]);
  useEffect(() => { if (user) { loadUsers(); } }, [user, userFilter.role, userFilter.verificationStatus, userFilter.page]);

  // Approve or reject service (admin)
  async function updateServiceStatus(serviceId, status, rejectionReason) {
    if (!confirm(`Are you sure you want to ${status} this service?`)) return;
    try {
      const body = { status };
      if (rejectionReason) body.rejectionReason = rejectionReason;
      await api(`/services/${serviceId}/status`, { method: 'PATCH', body });
      await loadServices();
      await loadStats();
      alert('Service updated');
    } catch (err) {
      console.error('Failed to update service status', err);
      alert('Failed to update service: ' + (err.message || ''));
      if (String(err.message).toLowerCase().includes('session expired')) {
        window.location.href = '/login';
      }
    }
  }

  // User actions
  async function handleVerifyUser(userId, status) {
    if (!confirm(`Set verification status to ${status}?`)) return;
    try {
      const body = { status };
      await api(`/admin/users/${userId}/verify`, { method: 'PATCH', body });
      await loadUsers();
      alert('User verification updated');
    } catch (err) {
      console.error('Failed to verify user', err);
      alert('Failed to verify user: ' + (err.message || ''));
    }
  }

  async function handleChangeRole(userId, role) {
    if (!confirm(`Change role to ${role}?`)) return;
    try {
      await api(`/admin/users/${userId}/role`, { method: 'PATCH', body: { role } });
      await loadUsers();
      alert('User role updated');
    } catch (err) {
      console.error('Failed to change role', err);
      alert('Failed to change role: ' + (err.message || ''));
    }
  }

  function handleOpenUser(u) {
    // restore simple alert popup with user info
    alert(`User: ${u.fullName}\nEmail: ${u.email}\nRole: ${u.role}\nVerified: ${u.isVerified || u.verificationStatus}\nCreated: ${u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}`);
  }

  const topStats = useMemo(() => ({
    totalServices: stats?.services?.total || 0,
    activeServices: stats?.services?.active || 0,
    pendingServices: stats?.services?.pending || 0,
    rejectedServices: stats?.services?.rejected || 0
  }), [stats]);

  const STATUS_COLORS = ['#16a34a', '#f59e0b', '#ef4444', '#6b7280'];

  function getStatusData(s) {
    const active = s?.services?.active || 0;
    const pending = s?.services?.pending || 0;
    const rejected = s?.services?.rejected || 0;
    const others = Math.max((s?.services?.total || 0) - (active + pending + rejected), 0);
    return [
      { name: 'Active', value: active },
      { name: 'Pending', value: pending },
      { name: 'Rejected', value: rejected },
      { name: 'Other', value: others }
    ];
  }

  function getCategoryData(s) {
    const recent = s?.recentActivities?.services || [];
    const counts = {};
    for (const r of recent) {
      const cat = r.category || 'others';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.keys(counts).map(k => ({ category: k, count: counts[k] }));
  }

  function getTimeSeriesData(s) {
    const recent = s?.recentActivities?.services || [];
    if (!recent || recent.length === 0) {
      // return last 7 days zeros
      const arr = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        arr.push({ date: d.toISOString().slice(0,10), count: 0 });
      }
      return arr;
    }
    const counts = {};
    for (const r of recent) {
      const date = (r.createdAt || r.created_at || r.date) ? new Date(r.createdAt || r.created_at || r.date).toISOString().slice(0,10) : null;
      if (!date) continue;
      counts[date] = (counts[date] || 0) + 1;
    }
    // create sorted array for last 14 days
    const arr = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      arr.push({ date: key, count: counts[key] || 0 });
    }
    return arr;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1 w-full">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
          <SidebarBody>
            <div className="flex flex-col gap-2">
              <SidebarLink open={sidebarOpen} label="Dashboard Home" onClick={() => setActiveTab('overview')} active={activeTab === 'overview'} icon={<span>🏠</span>} />
              <SidebarLink open={sidebarOpen} label="Service Approval" onClick={() => setActiveTab('approval')} active={activeTab === 'approval'} icon={<span>✅</span>} />
              <SidebarLink open={sidebarOpen} label="All Services" onClick={() => setActiveTab('services')} active={activeTab === 'services'} icon={<span>📋</span>} />
              <SidebarLink open={sidebarOpen} label="Users & Providers" onClick={() => setActiveTab('users')} active={activeTab === 'users'} icon={<span>👥</span>} />
              <SidebarLink open={sidebarOpen} label="Reports & Complaints" onClick={() => setActiveTab('reports')} active={activeTab === 'reports'} icon={<span>🚨</span>} />
              <SidebarLink open={sidebarOpen} label="Analytics" onClick={() => setActiveTab('analytics')} active={activeTab === 'analytics'} icon={<span>📊</span>} />
              <SidebarLink open={sidebarOpen} label="Content Moderation" onClick={() => setActiveTab('moderation')} active={activeTab === 'moderation'} icon={<span>🖼️</span>} />
            </div>
          </SidebarBody>
        </Sidebar>

        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
              <div className="text-sm text-gray-800">Signed in as {user?.fullName || user?.name} — {user?.email}</div>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard title="Total Services" value={topStats.totalServices} icon="📦" />
                <StatCard title="Active Services" value={topStats.activeServices} icon="✅" />
                <StatCard title="Pending" value={topStats.pendingServices} icon="⏳" />
                <StatCard title="Rejected" value={topStats.rejectedServices} icon="🚫" />
                <StatCard title="Admins" value={stats?.users?.admins || 0} icon="🛡️" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border p4">
                  <h2 className="font-semibold mb-2 text-gray-800">Quick Actions</h2>
                  <div className="flex gap-2">
                    <button type="button" className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={() => setActiveTab('approval')}>Open Approval Panel</button>
                    <button type="button" className="px-3 py-2 rounded border text-black" onClick={() => { setServiceFilter(prev => ({ ...prev, status: 'pending' })); setActiveTab('approval'); }}>Show Pending</button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-4">
                  <h2 className="font-semibold mb-2 text-gray-800">Recent Activities</h2>
                  <div className="text-sm text-gray-600">Recent users, services and bookings are shown here in the backend stats panel.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'approval' && (
            <div className="space-y-4">
              <SectionApproval services={services} loading={loading} error={error} onApprove={(id) => updateServiceStatus(id, 'active')} onReject={(id, reason) => updateServiceStatus(id, 'rejected', reason)} refresh={loadServices} onOpen={(s) => setSelectedService(s)} />
            </div>
          )}

          {activeTab === 'services' && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-800">All Services</h2>
              <div className="bg-white rounded-xl border p-4">
                <div className="flex gap-2 mb-3">
                  <select value={serviceFilter.status} onChange={e => setServiceFilter(prev => ({ ...prev, status: e.target.value }))} className="rounded border px-3 py-2">
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <input placeholder="Category" value={serviceFilter.category} onChange={e => setServiceFilter(prev => ({ ...prev, category: e.target.value }))} className="rounded border px-3 py-2" />
                  <input placeholder="City" value={serviceFilter.city} onChange={e => setServiceFilter(prev => ({ ...prev, city: e.target.value }))} className="rounded border px-3 py-2" />
                  <button type="button" className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={loadServices}>Filter</button>
                </div>
                <div>
                  {loading && <div>Loading...</div>}
                  {error && <div className="text-red-600">{error}</div>}
                  {!loading && !error && services.length === 0 && <div className="text-sm text-gray-500">No services found.</div>}
                  <div className="grid gap-3">
                    {services.map(s => (
                      <div key={s._id} className="p-3 border rounded flex items-center justify-between">
                        <div>
                          <div className="font-medium text-black">{s.title}</div>
                          <div className="text-xs text-gray-500 ">{s.provider?.fullName || s.provider} • {s.category} • ₹{s.price}</div>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" className="px-3 py-1 rounded border text-green-500" onClick={() => { setSelectedService(s); }}>Open</button>
                          <button type="button" className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={() => updateServiceStatus(s._id, 'active')}>Approve</button>
                          <button type="button" className="px-3 py-1 rounded border text-red-600" onClick={() => updateServiceStatus(s._id, 'rejected')}>Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Users & Providers</h2>
              <div className="bg-white rounded-xl border p-4">
                <div className="flex gap-2 mb-3">
                  <select value={userFilter.role} onChange={e => setUserFilter(prev => ({ ...prev, role: e.target.value }))} className="rounded border px-3 py-2">
                    <option value="">All roles</option>
                    <option value="user">Users</option>
                    <option value="expert">Experts</option>
                    <option value="provider">Providers</option>
                    <option value="admin">Admins</option>
                  </select>
                  <select value={userFilter.verificationStatus} onChange={e => setUserFilter(prev => ({ ...prev, verificationStatus: e.target.value }))} className="rounded border px-3 py-2">
                    <option value="">Any verification</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button type="button" className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={loadUsers}>Filter</button>
                </div>

                {loading && <div>Loading...</div>}
                {error && <div className="text-red-600">{error}</div>}
                <div className="grid gap-3">
                  {usersList.map(u => (
                    <div key={u._id} className="p-3 border rounded flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={u.profilePhoto || '/placeholder-avatar.png'} alt={u.fullName} className="h-12 w-12 rounded-full object-cover" />
                        <div>
                          <div className="font-medium text-black">{u.fullName}</div>
                          <div className="text-xs text-gray-500">{u.email} • {u.role}</div>
                          <div className="text-sm text-gray-600">{u.companyName || u.expertise?.join(', ') || ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        { (u.role === 'expert' || u.role === 'provider') && (
                          <div className="text-sm">
                            <div className={`inline-block px-2 py-1 rounded text-xs ${u.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{u.isVerified ? 'Verified' : u.verificationStatus || 'Not verified'}</div>
                          </div>
                        )}
                        <button
                          type="button"
                          title="View details"
                          className="px-2 py-1 text-sm rounded border text-gray-700 hover:bg-gray-50"
                          onClick={() => handleOpenUser(u)}
                        >
                          View details
                        </button>
                        { (u.role === 'expert' || u.role === 'provider') && u.verificationStatus === 'pending' && (
                          <>
                            <button type="button" className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={() => handleVerifyUser(u._id, 'approved')}>Approve</button>
                            <button type="button" className="px-3 py-1 rounded border text-red-600" onClick={() => handleVerifyUser(u._id, 'rejected')}>Reject</button>
                          </>
                        )}
                        <select value={u.role} onChange={e => handleChangeRole(u._id, e.target.value)} className="rounded border px-2 py-1">
                          <option value="user">user</option>
                          <option value="expert">expert</option>
                          <option value="provider">provider</option>
                          <option value="admin">admin</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Reports & Complaints</h2>
              <div className="bg-white rounded-xl border p-4 text-black">Report handling UI will be added here.</div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Platform Analytics</h2>
              <div className="bg-white rounded-xl border p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded">
                    <h3 className="font-semibold mb-2 text-gray-800">Services Status</h3>
                    <div style={{ width: '100%', height: 240 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie dataKey="value" data={getStatusData(stats)} outerRadius={80} label>
                            {getStatusData(stats).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded">
                    <h3 className="font-semibold mb-2 text-gray-800">Services by Category (recent)</h3>
                    <div style={{ width: '100%', height: 240 }}>
                      <ResponsiveContainer>
                        <BarChart data={getCategoryData(stats)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#16a34a" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white rounded">
                  <h3 className="font-semibold mb-2 text-gray-800">Services Created Over Time (recent)</h3>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <LineChart data={getTimeSeriesData(stats)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Content Moderation</h2>
              <div className="bg-white rounded-xl border p-4 text-black">Tools to remove images / edit descriptions will be here.</div>
            </div>
          )}

          {/* Service/User detail modals */}
          {selectedService && (
            <ServiceDetailModal service={selectedService} onClose={() => setSelectedService(null)} onApprove={updateServiceStatus} onReject={updateServiceStatus} />
          )}
          {selectedUser && (
            <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
          )}
        </main>
      </div>
    </div>
  );
}

function SectionApproval({ services, loading, error, onApprove, onReject, refresh, onOpen }) {
  const [rejectReason, setRejectReason] = useState('');
  return (
    <div>
      <h2 className="text-lg font-semibold text-black">Service Approval Panel</h2>
      <div className="mt-3 bg-white rounded-xl border p-4">
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && services.length === 0 && <div className="text-sm text-gray-500">No pending services.</div>}
        <div className="space-y-3">
          {services.map(s => (
            <div key={s._id} className="border rounded p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-black">{s.title}</div>
                  <div className="text-xs text-gray-500 text-black">{s.provider?.fullName || s.provider} • {s.category} • ₹{s.price}</div>
                  <div className="mt-2 text-gray-700">{s.description}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button type="button" className="px-3 py-1 rounded border text-green-500" onClick={() => { if (typeof onOpen === 'function') onOpen(s); }}>Open</button>
                    <button type="button" className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={() => onApprove(s._id)}>Approve</button>
                    <button type="button" className="px-3 py-1 rounded border text-red-600" onClick={() => {
                      const reason = prompt('Rejection reason (optional):');
                      onReject(s._id, 'rejected', reason || '');
                    }}>Reject</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServiceDetailModal({ service, onClose, onApprove, onReject }) {
  if (!service) return null;
  const images = service.images || service.photos || service.imagesUrls || [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50 z-40" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-lg z-50 max-w-4xl w-full mx-4 overflow-auto" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-black">{service.title}</h3>
            <div className="flex items-center gap-2">
            <button type="button" className="px-3 py-1 rounded border text-black" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Provider</div>
              <div className="font-medium text-black">{service.provider?.fullName || service.provider || '—'}</div>
              <div className="text-xs text-gray-500">{service.provider?.email}</div>
              <div className="mt-3 text-sm text-gray-600">Category</div>
              <div className="font-medium text-black">{service.category}</div>
              <div className="mt-3 text-sm text-gray-600">Price</div>
              <div className="font-medium text-black">₹{service.price}</div>
              <div className="mt-3 text-sm text-gray-600">Status</div>
              <div className="font-medium text-black">{service.status || service.approvalStatus || '—'}</div>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="mb-3">
              <div className="text-sm text-gray-600">Description</div>
              <div className="text-gray-800 text-black">{service.description}</div>
            </div>

            <div className="mb-3">
              <div className="text-sm text-gray-600">Location</div>
              <div className="text-gray-800 text-black">{service.location?.address || ''} {service.location?.city ? '• ' + service.location.city : ''} {service.location?.state ? '• ' + service.location.state : ''} {service.location?.pincode ? '• ' + service.location.pincode : ''}</div>
            </div>

            {images && images.length > 0 && (
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-2">Images</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((src, i) => (
                    <img key={i} src={src} alt={service.title + ' ' + i} className="h-36 w-36 object-cover rounded" />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button type="button" className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={() => { if (onApprove) onApprove(service._id, 'active'); }}>Approve</button>
              <button type="button" className="px-3 py-2 rounded border text-red-600" onClick={() => {
                const reason = prompt('Rejection reason (optional):');
                if (onReject) onReject(service._id, 'rejected', reason || '');
              }}>Reject</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserDetailModal({ user, onClose }) {
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50 z-40" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-lg z-50 max-w-2xl w-full mx-4 overflow-auto" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{user.fullName}</h3>
          <button type="button" className="px-3 py-1 rounded border" onClick={onClose}>Close</button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 flex flex-col items-center">
            <img src={user.profilePhoto || '/placeholder-avatar.png'} alt={user.fullName} className="h-24 w-24 rounded-full object-cover mb-2" />
            <div className="font-medium">{user.fullName}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
            <div className="mt-2 text-sm text-gray-600">Role: {user.role}</div>
            <div className="mt-1 text-sm text-gray-600">Verified: {String(user.isVerified || user.verificationStatus)}</div>
          </div>
          <div className="md:col-span-2">
            <div className="mb-2">
              <div className="text-sm text-gray-600">Company / Expertise</div>
              <div className="font-medium">{user.companyName || (user.expertise ? user.expertise.join(', ') : '')}</div>
            </div>
            <div className="mb-2">
              <div className="text-sm text-gray-600">Joined</div>
              <div className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleString() : ''}</div>
            </div>
            <div className="mb-2">
              <div className="text-sm text-gray-600">Contact</div>
              <div className="font-medium">{user.phone || user.contact || '—'}</div>
            </div>
            <div className="mb-2">
              <div className="text-sm text-gray-600">Address</div>
              <div className="font-medium">{user.address || user.location?.address || '-'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
