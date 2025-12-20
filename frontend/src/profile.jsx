import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';

function ProviderCard({ u, onClick }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm hover:shadow transition cursor-pointer" onClick={() => onClick?.(u)}>
      <div className="flex items-center gap-3">
        <img src={u.profilePhoto || '/placeholder-avatar.png'} alt={u.fullName} className="h-14 w-14 rounded-full object-cover" />
        <div>
          <div className="font-semibold text-gray-900">{u.fullName}</div>
          <div className="text-xs text-gray-600">{u.email}</div>
          <div className="text-xs mt-1 text-gray-500">{u.role}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div className="rounded bg-gray-50 p-2">
          <div className="text-xs text-gray-500">Services</div>
          <div className="font-semibold text-gray-800">{typeof u._stats?.services === 'number' ? u._stats.services : '—'}</div>
        </div>
        <div className="rounded bg-gray-50 p-2">
          <div className="text-xs text-gray-500">Bookings</div>
          <div className="font-semibold text-gray-800">{typeof u._stats?.bookings === 'number' ? u._stats.bookings : '—'}</div>
        </div>
        <div className="rounded bg-gray-50 p-2">
          <div className="text-xs text-gray-500">Reviews</div>
          <div className="font-semibold text-gray-800">{u.averageRating ? `${u.averageRating.toFixed ? u.averageRating.toFixed(1) : u.averageRating}/5` : '—'}</div>
        </div>
      </div>
      {Array.isArray(u.expertise) && u.expertise.length > 0 && (
        <div className="mt-3 text-xs text-gray-600">Expertise: {u.expertise.slice(0,3).join(', ')}{u.expertise.length > 3 ? '…' : ''}</div>
      )}
      {u.companyName && (
        <div className="mt-1 text-xs text-gray-600">Company: {u.companyName}</div>
      )}
      <div className="mt-3">
        {u.isVerified ? (
          <span className="inline-block text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Verified</span>
        ) : (
          <span className="inline-block text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">{u.verificationStatus || 'Not verified'}</span>
        )}
      </div>
    </div>
  );
}

export default function ProfilesDirectory() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [filter, setFilter] = useState({ role: 'all', q: '' });

  useEffect(() => {
    const t = localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token') || sessionStorage.getItem('accessToken') || '';
    setToken(t);
  }, []);

  async function api(path, { method = 'GET', body, token: tk } = {}) {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
    const res = await fetch(`${base}${path}` + (method === 'GET' && body ? `?${new URLSearchParams(body).toString()}` : ''), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(tk || token ? { Authorization: `Bearer ${tk || token}` } : {}),
      },
      body: method !== 'GET' && body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let msg = text;
      try { const j = JSON.parse(text || '{}'); msg = j.message || j.error || text; } catch {}
      throw new Error(msg || `Request failed ${res.status}`);
    }
    return res.json();
  }

  async function loadDirectory() {
    setLoading(true); setError('');
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
      // Public providers list, available to everyone
      const res = await fetch(`${base}/users/providers/list`);
      const data = await res.json();
      const providers = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

      // Enrich with counts using admin endpoints if token present, otherwise use public services listing for services count
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const enriched = await Promise.all(providers.map(async (u) => {
        let servicesCount = null;
        let bookingsCount = null;
        if (token) {
          try {
            const svcResp = await fetch(`${base}/admin/services?provider=${u._id}&limit=1`, { headers, credentials: 'include' });
            const svcJson = await svcResp.json().catch(() => ({}));
            const total = svcJson?.data?.pagination?.total;
            if (typeof total === 'number') servicesCount = total;
          } catch {}
          try {
            const bkResp = await fetch(`${base}/admin/bookings?provider=${u._id}&limit=1`, { headers, credentials: 'include' });
            const bkJson = await bkResp.json().catch(() => ({}));
            const totalB = bkJson?.data?.pagination?.total;
            if (typeof totalB === 'number') bookingsCount = totalB;
          } catch {}
        }
        if (servicesCount == null) {
          try {
            const svcListResp = await fetch(`${base}/services/provider/${u._id}`);
            const svcListJson = await svcListResp.json().catch(() => ({}));
            const arr = svcListJson?.data || svcListJson?.services || svcListJson?.data?.services || [];
            servicesCount = Array.isArray(arr) ? arr.length : 0;
          } catch { servicesCount = 0; }
        }
        return { ...u, _stats: { services: servicesCount, bookings: bookingsCount } };
      }));

      setList(enriched);
    } catch (err) {
      console.error('Failed to load directory', err);
      setError(err.message || 'Failed to load');
    } finally { setLoading(false); }
  }

  useEffect(() => { loadDirectory(); }, []);
  useEffect(() => { if (token) loadDirectory(); }, [token]);

  const filtered = useMemo(() => {
    let arr = list;
    if (filter.role !== 'all') arr = arr.filter(u => u.role === filter.role);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      arr = arr.filter(u => (u.fullName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.companyName || '').toLowerCase().includes(q));
    }
    return arr;
  }, [list, filter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900"> Our Experts & Providers</h1>
          <div className="flex gap-2">
            <input placeholder="Search name/email/company" value={filter.q} onChange={e => setFilter(prev => ({ ...prev, q: e.target.value }))} className="rounded border px-3 py-2 bg-white" />
            <select value={filter.role} onChange={e => setFilter(prev => ({ ...prev, role: e.target.value }))} className="rounded border px-3 py-2 bg-white text-black">
              <option value="all">All</option>
              <option value="expert">Experts</option>
              <option value="provider">Providers</option>
            </select>
            <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={loadDirectory}>Refresh</button>
          </div>
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(u => (
            <ProviderCard key={u._id} u={u} onClick={() => { /* could open detailed modal later */ }} />
          ))}
        </div>

        {!loading && filtered.length === 0 && !error && (
          <div className="text-sm text-gray-500 mt-8">No experts/providers found.</div>
        )}
      </div>
      </div>
    </div>
  );
}
