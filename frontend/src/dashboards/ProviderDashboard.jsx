import React, { useEffect, useMemo, useState, useRef } from 'react';
import Header from '../components/Header';
import { Sidebar, SidebarBody, SidebarLink } from '../components/sidebar';

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

function Section({ title, children, actions }) {
  return (
    <section className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <div className="flex gap-2">{actions}</div>
      </div>
      {children}
    </section>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-700">{label}</span>
      <input className="mt-1 w-full rounded-lg border px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring focus:border-emerald-500" {...props} />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-700">{label}</span>
      <select className="mt-1 w-full rounded-lg border px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring focus:border-emerald-500" {...props}>{children}</select>
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-700">{label}</span>
      <textarea className="mt-1 w-full rounded-lg border px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring focus:border-emerald-500" rows={4} {...props} />
    </label>
  );
}

export default function ProviderDashboard() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // dashboard states
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // company profile
  const [company, setCompany] = useState({ name: '', serviceTypes: '', areas: '', vehicles: '', licenses: '', contact: '' });
  const [editingProfile, setEditingProfile] = useState(true);
  const [fieldEditing, setFieldEditing] = useState({ name: false, contact: false, serviceTypes: false, areas: false, vehicles: false, licenses: false });

  // services
  const [services, setServices] = useState([]);
  const [providerBookings, setProviderBookings] = useState([]);
  const [sellRequests, setSellRequests] = useState([]);
  const [assignedSellPickups, setAssignedSellPickups] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [serviceDetails, setServiceDetails] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    const savedCompany = localStorage.getItem('provider:company');
    const t = localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token') || sessionStorage.getItem('accessToken');
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
    if (t) setToken(t);
    if (savedCompany) { try { setCompany(JSON.parse(savedCompany)); setEditingProfile(false); } catch {} }
    // initial demo load: try to load cached services
    try { const s = JSON.parse(localStorage.getItem('provider:services') || '[]'); setServices(s); } catch {}
  }, []);


  useEffect(() => { try { localStorage.setItem('provider:services', JSON.stringify(services)); } catch {} }, [services]);

  // Load provider services from backend when user is available (persist across refresh)
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        if (token) {
          const resp = await api(`/services/provider/${user._id}`);
          const svcArr = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp?.services) ? resp.services : Array.isArray(resp?.data?.services) ? resp.data.services : [];
          if (mounted && Array.isArray(svcArr) && svcArr.length) setServices(svcArr);
        } else {
          // no token: keep local storage cached services
        }
      } catch (err) {
        console.error('Failed to load provider services on mount', err);
      }
    })();
    // load provider bookings
    (async () => {
      try {
        if (token) {
          const resp = await api('/bookings/provider/bookings');
          const arr = resp?.data?.bookings || resp?.bookings || resp?.data || resp || [];
          if (mounted) setProviderBookings(Array.isArray(arr) ? arr : []);
        }
      } catch (err) { console.error('Failed to load provider bookings', err); }
    })();
    return () => { mounted = false; };
  }, [user, token]);

  async function refreshProviderBookings() {
    try {
      const resp = await api('/bookings/provider/bookings');
      const arr = resp?.data?.bookings || resp?.bookings || resp?.data || resp || [];
      setProviderBookings(Array.isArray(arr) ? arr : []);
    } catch (err) { console.error('refreshProviderBookings', err); }
  }

  // Sell requests (open listings) for providers
  async function loadSellRequests() {
    try {
      const resp = await api('/sell-waste/open');
      const arr = resp?.data || resp || [];
      setSellRequests(Array.isArray(arr) ? arr : []);
    } catch (err) { console.error('Failed to load sell requests', err); }
  }

  async function loadAssignedSellPickups() {
    try {
      const resp = await api('/sell-waste/provider/assigned');
      const arr = resp?.data || resp || [];
      setAssignedSellPickups(Array.isArray(arr) ? arr : []);
    } catch (err) { console.error('Failed to load assigned sell pickups', err); }
  }

  async function makeOffer(listingId) {
    try {
      const price = prompt('Enter price per kg (numeric)');
      if (!price) return;
      const msg = prompt('Optional message to the user');
      await api(`/sell-waste/${listingId}/offer`, { method: 'POST', body: { pricePerKg: Number(price), message: msg } });
      alert('Offer sent');
      loadSellRequests();
    } catch (err) { console.error(err); alert('Failed to send offer'); }
  }

  // simple api helper
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
      // try to parse JSON body for message
      let bodyText = '';
      try { bodyText = await res.text(); } catch {}
      // detect expired jwt
      try {
        const parsed = JSON.parse(bodyText || '{}');
        const msg = parsed?.message || parsed?.error || bodyText;
        if (res.status === 401 || String(msg).toLowerCase().includes('jwt expired') || String(msg).toLowerCase().includes('token')) {
          try {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
          } catch {}
          throw new Error('Session expired. Please sign in again.');
        }
        throw new Error(msg || `Request failed ${res.status}`);
      } catch (err) {
        throw new Error(bodyText || `Request failed ${res.status}`);
      }
    }
    return res.json();
  }

  // normalize frontend category values to backend-accepted categories
  function normalizeCategory(cat) {
    if (!cat) return 'waste-collection';
    const key = String(cat).toLowerCase();
    switch (key) {
      // Direct supported categories
      case 'home_setup': case 'home-setup': case 'home setup': return 'home-setup';
      case 'kitchen_compost': case 'kitchen-compost': return 'kitchen-compost';
      case 'garden_compost': case 'garden-compost': return 'garden-compost';
      case 'community_compost': case 'community-compost': return 'community-compost';
      case 'workshop': case 'workshop-training': return 'workshop-training';
      case 'sell_compost': case 'sell-compost': case 'compost-product': return 'compost-product';

      // Collection-style categories collapse to waste-collection
      case 'waste_collection': case 'waste-collection': case 'collection':
      case 'recycling': case 'bulk': case 'green': case 'garden': case 'green/garden waste':
        return 'waste-collection';

      // E-waste variants map to ewaste-collection (backend supported)
      case 'e-waste': case 'ewaste': case 'e waste':
      case 'e-waste collection': case 'e waste collection': case 'electronics recycling': case 'electronic-waste':
        return 'ewaste-collection';

      // Map miscellaneous to others
      case 'segregation':
      case 'hazardous':
      case 'event': case 'zero-waste event': case 'zero waste':
        return 'others';

      default:
        return key;
    }
  }

  const stats = useMemo(() => ({
    todaysPickups: services.filter(s => s.nextPickup).length,
    activeSubscriptions: services.filter(s => s.subscription === true).length,
    bulkContracts: services.filter(s => s.contract === true).length,
    wasteCollectedKg: services.reduce((a,s) => a + (Number(s.collectedKg) || 0), 0),
    monthlyRevenue: services.reduce((a,s) => a + (Number(s.monthlyPrice) || 0), 0),
  }), [services]);

  // handlers
  function saveCompany(e) {
    e.preventDefault();
    try {
      localStorage.setItem('provider:company', JSON.stringify(company));
      setError('');
      setEditingProfile(false);
      alert('Company profile saved');
    } catch (err) { setError('Failed to save'); }
  }

  function startFieldEdit(field) {
    setFieldEditing(prev => ({ ...prev, [field]: true }));
  }

  function saveField(field) {
    try {
      localStorage.setItem('provider:company', JSON.stringify(company));
      setFieldEditing(prev => ({ ...prev, [field]: false }));
      setEditingProfile(false);
    } catch (err) { setError('Failed to save field'); }
  }

  function cancelField(field) {
    try {
      const saved = localStorage.getItem('provider:company');
      if (saved) setCompany(JSON.parse(saved));
    } catch (err) { /* ignore */ }
    setFieldEditing(prev => ({ ...prev, [field]: false }));
  }

  function openAddService() { setEditingService(null); setShowServiceModal(true); }
  function openEditService(s) { setEditingService(s); setShowServiceModal(true); }

  async function saveService(svc) {
    if (!svc) return;
    setLoading(true);
    try {
      // Ensure we have a token and user
      if (!token || !user?._id) {
        // fallback to local-only behaviour
        if (svc._id) {
          setServices(prev => prev.map(p => p._id === svc._id ? { ...p, ...svc } : p));
        } else {
          const id = `svc_${Date.now()}`;
          setServices(prev => [{ ...svc, _id: id }, ...prev]);
        }
        setShowServiceModal(false);
        return;
      }

      // prepare payload for backend - map frontend fields to backend names
      const fallbackAddress = svc.address || company?.name || company?.contact || (company?.areas && company.areas.split ? company.areas.split(',')[0] : '') || 'Address not provided';
      const payload = {
        title: svc.title || svc.name || 'Untitled service',
        description: svc.notes || svc.description || svc.title || 'No description',
        category: normalizeCategory(svc.category || 'waste-collection'),
        price: svc.price || svc.monthlyPrice || 0,
        address: fallbackAddress,
        city: (svc.city || (company?.areas && company.areas.split ? company.areas.split(',')[0] : '')) || 'Unknown',
        state: svc.state || company?.state || 'Unknown',
        pincode: svc.pincode || '000000',
        serviceArea: svc.serviceArea || (company.areas ? company.areas.split(',') : []),
        features: svc.features || [],
        tags: svc.tags || [],
        images: svc.images || [],
      };

      let res;
      if (svc._id && String(svc._id).startsWith('svc_') === false) {
        // existing saved on backend
        res = await api(`/services/${svc._id}`, { method: 'PUT', body: payload });
      } else if (svc._id && String(svc._id).startsWith('svc_')) {
        // local-only id -> treat as create
        res = await api('/services', { method: 'POST', body: payload });
      } else {
        res = await api('/services', { method: 'POST', body: payload });
      }

      // refresh provider services
      try {
        const svcResp = await api(`/services/provider/${user?._id}`);
        const svcArr = Array.isArray(svcResp?.data) ? svcResp.data : Array.isArray(svcResp?.services) ? svcResp.services : Array.isArray(svcResp?.data?.services) ? svcResp.data.services : [];
        setServices(svcArr);
      } catch (err) {
        // if refresh fails, keep local
      }

      setShowServiceModal(false);
    } catch (err) {
      console.error('Failed to save service', err);
      const msg = err?.message || String(err) || '';
      if (String(msg).toLowerCase().includes('session expired') || String(msg).toLowerCase().includes('jwt expired') || String(msg).toLowerCase().includes('unauthorized')) {
        alert('Session expired — please sign in again.');
        try { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('token'); localStorage.removeItem('user'); sessionStorage.removeItem('accessToken'); sessionStorage.removeItem('token'); sessionStorage.removeItem('user'); } catch {}
        window.location.href = '/login';
        return;
      }
      alert('Failed to save service: ' + msg);
    } finally {
      setLoading(false);
    }
  }

  async function deleteService(id) {
    if (!confirm('Delete this service?')) return;
    // if token present, call backend delete
    if (token) {
      try {
        await api(`/services/${id}`, { method: 'DELETE' });
        // refresh list
        try {
          const svcResp = await api(`/services/provider/${user?._id}`);
          const svcArr = Array.isArray(svcResp?.data) ? svcResp.data : Array.isArray(svcResp?.services) ? svcResp.services : Array.isArray(svcResp?.data?.services) ? svcResp.data.services : [];
          setServices(svcArr);
        } catch { /* ignore */ }
        return;
      } catch (err) {
        console.error('Failed to delete', err);
        const msg = err?.message || String(err) || '';
        if (String(msg).toLowerCase().includes('session expired') || String(msg).toLowerCase().includes('jwt expired') || String(msg).toLowerCase().includes('unauthorized')) {
          alert('Session expired — please sign in again.');
          try {
            localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('token'); localStorage.removeItem('user');
            sessionStorage.removeItem('accessToken'); sessionStorage.removeItem('token'); sessionStorage.removeItem('user');
          } catch {}
          window.location.href = '/login';
          return;
        }
        alert('Failed to delete service: ' + (err.message || ''));
        return;
      }
    }
    setServices(prev => prev.filter(s => s._id !== id));
  }

  // Simple service modal form (local only)
  function ServiceModal({ preset, onClose, onSave }) {
    const init = preset ? { ...preset } : { title: '', category: 'waste-collection', price: '', subscription: false, contract: false, collectedKg: 0, monthlyPrice: '' };
    const [form, setForm] = useState(init);
    useEffect(() => setForm(init), [preset?._id]);
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={onClose}>
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold">{preset ? 'Edit Service' : 'Add Service'}</div>
            <button className="text-xl" onClick={onClose}>×</button>
          </div>
          <div className="p-4 overflow-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Title" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} />
              <Select label="Category" value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}>
                <option value="waste-collection">Waste Collection & Pickup</option>
                <option value="segregation">Segregation Assistance</option>
                <option value="e-waste">E-Waste Collection</option>
                <option value="recycling">Recycling Pickup</option>
                <option value="bulk">Bulk Waste Management</option>
                <option value="hazardous">Hazardous Handling</option>
                <option value="green">Green/Garden Waste</option>
                <option value="event">Zero-Waste Event</option>
              </Select>
              <Input label="Price / Rate" value={form.price} onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))} />
              <Input label="Monthly Price" value={form.monthlyPrice} onChange={e => setForm(prev => ({ ...prev, monthlyPrice: e.target.value }))} />
              <Input label="Service Area" value={form.serviceArea || ''} onChange={e => setForm(prev => ({ ...prev, serviceArea: e.target.value }))} />
              <Input label="Collected Kg (sample)" value={form.collectedKg} onChange={e => setForm(prev => ({ ...prev, collectedKg: e.target.value }))} />
            </div>
            <div className="mt-3">
              <TextArea label="Notes / Details" value={form.notes || ''} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          <div className="border-t px-4 py-3 flex justify-end gap-2 bg-white">
            <button className="px-4 py-2 rounded-lg border text-black" onClick={onClose}>Cancel</button>
            <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white" onClick={() => onSave({ ...form, _id: preset?._id })}>Save</button>
          </div>
        </div>
      </div>
    );
  }

  // Service details modal (fetches full service by id)
  function ServiceDetailsModal({ serviceId, onClose }) {
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [errorDetails, setErrorDetails] = useState('');
    const [localDetails, setLocalDetails] = useState(null);

    useEffect(() => {
      if (!serviceId) return;
      let mounted = true;
      setLoadingDetails(true); setErrorDetails('');
      (async () => {
        try {
          // try backend first
          if (token) {
            const resp = await api(`/services/${serviceId}`);
            if (mounted) setLocalDetails(resp?.data || resp?.service || resp?.data?.service || resp?.data?.services || resp?.service || resp);
          } else {
            // fallback: search local storage
            try {
              const s = JSON.parse(localStorage.getItem('provider:services') || '[]').find(x => x._id === serviceId || x.id === serviceId);
              if (mounted) setLocalDetails(s || null);
            } catch { if (mounted) setLocalDetails(null); }
          }
        } catch (err) {
          if (mounted) setErrorDetails(err.message || 'Failed to load');
        } finally { if (mounted) setLoadingDetails(false); }
      })();
      return () => { mounted = false; };
    }, [serviceId]);

    if (!serviceId) return null;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={onClose}>
        <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-lg m-4 flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold text-black">Service details</div>
            <button className="text-xl text-black" onClick={onClose}>×</button>
          </div>
          <div className="p-4 overflow-auto flex-1">
            {loadingDetails && <div>Loading...</div>}
            {errorDetails && <div className="text-red-600">{errorDetails}</div>}
            {!loadingDetails && !errorDetails && localDetails && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700">{localDetails.title}</h3>
                <div className="text-sm text-gray-600">Category: {localDetails.category}</div>
                <div className="mt-2 text-gray-800">{localDetails.description}</div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><div className="text-sm text-gray-500">Price</div><div className="font-medium text-gray-600">₹{localDetails.price}</div></div>
                  <div><div className="text-sm text-gray-500">Area</div><div className="font-medium text-gray-600">{(localDetails.serviceArea || []).join(', ') || '-'}</div></div>
                </div>
                {Array.isArray(localDetails.images) && localDetails.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {localDetails.images.map((img, i) => (
                      <img key={i} src={img} alt={`${localDetails.title}-${i}`} className="w-full h-28 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>
            )}
            {!loadingDetails && !errorDetails && !localDetails && <div className="text-sm text-gray-500">No details available.</div>}
          </div>
          <div className="border-t px-4 py-3 flex justify-end gap-2 bg-white">
            <button className="px-4 py-2 rounded-lg border" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1 w-full">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
          <SidebarBody>
            <div className="flex flex-col gap-2">
              <SidebarLink open={sidebarOpen} label="Dashboard Home" onClick={() => setActiveTab('overview')} active={activeTab === 'overview'} icon={<span>🏠</span>} />
              <SidebarLink open={sidebarOpen} label="Company Profile" onClick={() => setActiveTab('profile')} active={activeTab === 'profile'} icon={<span>🏢</span>} />
              <SidebarLink open={sidebarOpen} label="Waste Services" onClick={() => setActiveTab('services')} active={activeTab === 'services'} icon={<span>♻️</span>} />
              <SidebarLink open={sidebarOpen} label="Pickup Schedule" onClick={() => { setActiveTab('pickup'); loadAssignedSellPickups(); }} active={activeTab === 'pickup'} icon={<span>📅</span>} />
              <SidebarLink open={sidebarOpen} label="Sell Requests" onClick={() => { setActiveTab('sell-requests'); loadSellRequests(); }} active={activeTab === 'sell-requests'} icon={<span>🗑️</span>} />
              <SidebarLink open={sidebarOpen} label="Contracts & Subs" onClick={() => setActiveTab('contracts')} active={activeTab === 'contracts'} icon={<span>📜</span>} />
              <SidebarLink open={sidebarOpen} label="Analytics & Reports" onClick={() => setActiveTab('analytics')} active={activeTab === 'analytics'} icon={<span>📊</span>} />
              <SidebarLink open={sidebarOpen} label="Earnings & Invoices" onClick={() => setActiveTab('earnings')} active={activeTab === 'earnings'} icon={<span>💰</span>} />
              <SidebarLink open={sidebarOpen} label="Reviews & Feedback" onClick={() => setActiveTab('reviews')} active={activeTab === 'reviews'} icon={<span>⭐</span>} />
              <SidebarLink open={sidebarOpen} label="Compliance & Docs" onClick={() => setActiveTab('compliance')} active={activeTab === 'compliance'} icon={<span>📁</span>} />
            </div>
          </SidebarBody>
        </Sidebar>

        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Waste Provider Dashboard</h1>
              <div className="text-sm text-gray-500">Signed in as {user?.fullName || user?.name} — {user?.email}</div>
              {company?.name && (
                <div className="text-sm text-gray-600 mt-1">{company.name}</div>
              )}
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard title="Today's Pickups" value={stats.todaysPickups} icon="🚚" />
                <StatCard title="Active Subscriptions" value={stats.activeSubscriptions} icon="🔁" />
                <StatCard title="Bulk Contracts" value={stats.bulkContracts} icon="🤝" />
                <StatCard title="Waste Collected (kg)" value={stats.wasteCollectedKg} icon="🗑️" />
                <StatCard title="Monthly Revenue" value={`₹${stats.monthlyRevenue}`} icon="💵" />
              </div>

              <Section title="Quick Actions">
                <div className="flex gap-3">
                  <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white" onClick={() => setActiveTab('services')}>Manage Services</button>
                  <button className="px-4 py-2 rounded-lg border text-black" onClick={() => setActiveTab('pickup')}>View Pickup Schedule</button>
                </div>
              </Section>
              <Section title="My Services">
                <div className="grid grid-cols-1 gap-3">
                  {services.slice(0,3).map(s => (
                    <div key={s._id} className="rounded-lg border p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800">{s.title}</div>
                        <div className="text-xs text-gray-500">{String(s.category).replace(/_/g,' ')}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-emerald-700 font-semibold">₹{s.price}</div>
                        <button className="px-3 py-1 rounded border text-black" onClick={() => { setServiceDetails(s); setShowServiceDetails(true); }}>View</button>
                        <button className="px-3 py-1 rounded border text-black" onClick={() => openEditService(s)}>Edit</button>
                      </div>
                    </div>
                  ))}
                  {services.length === 0 && <div className="text-sm text-gray-500">No services yet. Create one to see it here.</div>}
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'profile' && (
            <Section title="Company Profile">
              {editingProfile ? (
                <form onSubmit={saveCompany} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Company name" value={company.name} onChange={e => setCompany(prev => ({ ...prev, name: e.target.value }))} />
                  <Input label="Contact details" value={company.contact} onChange={e => setCompany(prev => ({ ...prev, contact: e.target.value }))} />
                  <Select label="Service types" value={company.serviceTypes} onChange={e => setCompany(prev => ({ ...prev, serviceTypes: e.target.value }))}>
                    <option value="">Select</option>
                    <option value="recycling">Recycling</option>
                    <option value="e-waste">E-Waste</option>
                    <option value="bulk">Bulk</option>
                  </Select>
                  <Input label="Operating areas" value={company.areas} onChange={e => setCompany(prev => ({ ...prev, areas: e.target.value }))} />
                  <Input label="Vehicles available" value={company.vehicles} onChange={e => setCompany(prev => ({ ...prev, vehicles: e.target.value }))} />
                  <Input label="Licenses / certificates" value={company.licenses} onChange={e => setCompany(prev => ({ ...prev, licenses: e.target.value }))} />
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <button type="button" className="px-4 py-2 rounded-lg border" onClick={() => {
                      try {
                        const saved = localStorage.getItem('provider:company');
                        if (saved) setCompany(JSON.parse(saved)); else setCompany({ name: '', serviceTypes: '', areas: '', vehicles: '', licenses: '', contact: '' });
                      } catch (err) { }
                      setEditingProfile(false);
                    }}>Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white">Save</button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">Company name</div>
                      {!fieldEditing.name && (
                        <button className="text-xs text-emerald-600" onClick={() => startFieldEdit('name')}>Edit</button>
                      )}
                    </div>
                    {fieldEditing.name ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          value={company.name}
                          onChange={e => setCompany(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Company name"
                          className="w-full rounded-lg border px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring focus:border-emerald-500"
                        />
                        <button className="px-3 py-1 rounded-lg bg-emerald-600 text-white" onClick={() => saveField('name')}>Save</button>
                        <button className="px-3 py-1 rounded-lg border text-black" onClick={() => cancelField('name')}>Cancel</button>
                      </div>
                    ) : (
                      <div className="font-medium text-gray-800">{company.name || '-'}</div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">Contact</div>
                      {!fieldEditing.contact && (
                        <button className="text-xs text-emerald-600" onClick={() => startFieldEdit('contact')}>Edit</button>
                      )}
                    </div>
                    {fieldEditing.contact ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          value={company.contact}
                          onChange={e => setCompany(prev => ({ ...prev, contact: e.target.value }))}
                          placeholder="Contact details"
                          className="w-full rounded-lg border px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring focus:border-emerald-500"
                        />
                        <button className="px-3 py-1 rounded-lg bg-emerald-600 text-white" onClick={() => saveField('contact')}>Save</button>
                        <button className="px-3 py-1 rounded-lg border text-black" onClick={() => cancelField('contact')}>Cancel</button>
                      </div>
                    ) : (
                      <div className="font-medium text-gray-800">{company.contact || '-'}</div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">Service types</div>
                      {!fieldEditing.serviceTypes && (
                        <button className="text-xs text-emerald-600" onClick={() => startFieldEdit('serviceTypes')}>Edit</button>
                      )}
                    </div>
                    {fieldEditing.serviceTypes ? (
                      <div className="flex gap-2 mt-1">
                        <select
                          value={company.serviceTypes}
                          onChange={e => setCompany(prev => ({ ...prev, serviceTypes: e.target.value }))}
                          className="w-full rounded-lg border px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring focus:border-emerald-500"
                        >
                          <option value="">Select</option>
                          <option value="recycling">Recycling</option>
                          <option value="e-waste">E-Waste</option>
                          <option value="bulk">Bulk</option>
                        </select>
                        <button className="px-3 py-1 rounded-lg bg-emerald-600 text-white" onClick={() => saveField('serviceTypes')}>Save</button>
                        <button className="px-3 py-1 rounded-lg border text-black" onClick={() => cancelField('serviceTypes')}>Cancel</button>
                      </div>
                    ) : (
                      <div className="font-medium text-gray-800">{company.serviceTypes || '-'}</div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">Operating areas</div>
                      {!fieldEditing.areas && (
                        <button className="text-xs text-emerald-600" onClick={() => startFieldEdit('areas')}>Edit</button>
                      )}
                    </div>
                    {fieldEditing.areas ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          value={company.areas}
                          onChange={e => setCompany(prev => ({ ...prev, areas: e.target.value }))}
                          placeholder="Operating areas"
                          className="w-full rounded-lg border px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring focus:border-emerald-500"
                        />
                        <button className="px-3 py-1 rounded-lg bg-emerald-600 text-white" onClick={() => saveField('areas')}>Save</button>
                        <button className="px-3 py-1 rounded-lg border text-black" onClick={() => cancelField('areas')}>Cancel</button>
                      </div>
                    ) : (
                      <div className="font-medium text-gray-800">{company.areas || '-'}</div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">Vehicles</div>
                      {!fieldEditing.vehicles && (
                        <button className="text-xs text-emerald-600" onClick={() => startFieldEdit('vehicles')}>Edit</button>
                      )}
                    </div>
                    {fieldEditing.vehicles ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          value={company.vehicles}
                          onChange={e => setCompany(prev => ({ ...prev, vehicles: e.target.value }))}
                          placeholder="Vehicles available"
                          className="w-full rounded-lg border px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring focus:border-emerald-500"
                        />
                        <button className="px-3 py-1 rounded-lg bg-emerald-600 text-white" onClick={() => saveField('vehicles')}>Save</button>
                        <button className="px-3 py-1 rounded-lg border text-black" onClick={() => cancelField('vehicles')}>Cancel</button>
                      </div>
                    ) : (
                      <div className="font-medium text-gray-800">{company.vehicles || '-'}</div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">Licenses</div>
                      {!fieldEditing.licenses && (
                        <button className="text-xs text-emerald-600" onClick={() => startFieldEdit('licenses')}>Edit</button>
                      )}
                    </div>
                    {fieldEditing.licenses ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          value={company.licenses}
                          onChange={e => setCompany(prev => ({ ...prev, licenses: e.target.value }))}
                          placeholder="Licenses / certificates"
                          className="w-full rounded-lg border px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring focus:border-emerald-500"
                        />
                        <button className="px-3 py-1 rounded-lg bg-emerald-600 text-white" onClick={() => saveField('licenses')}>Save</button>
                        <button className="px-3 py-1 rounded-lg border text-black" onClick={() => cancelField('licenses')}>Cancel</button>
                      </div>
                    ) : (
                      <div className="font-medium text-gray-800">{company.licenses || '-'}</div>
                    )}
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button className="px-4 py-2 rounded-lg border text-black" onClick={() => setEditingProfile(true)}>Edit</button>
                    <button className="ml-2 px-4 py-2 rounded-lg bg-emerald-600 text-white" onClick={(e) => saveCompany(e)}>Save</button>
                  </div>
                </div>
              )}
            </Section>
          )}

          {activeTab === 'services' && (
            <Section title="Waste Services" actions={<button className="px-3 py-2 rounded-lg bg-emerald-600 text-white" onClick={openAddService}>Add Service</button>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(s => (
                  <div key={s._id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">{s.title}</div>
                        <div className="text-xs text-gray-500">{String(s.category).replace(/_/g,' ')}</div>
                      </div>
                      <div className="text-emerald-700 font-semibold">₹{s.price}</div>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">{s.notes}</div>
                    <div className="mt-3 flex gap-2 justify-end">
                      <button className="px-3 py-1 rounded border text-black" onClick={() => { setServiceDetails(s); setShowServiceDetails(true); }}>View details</button>
                      <button className="px-3 py-1 rounded border text-black" onClick={() => openEditService(s)}>Edit</button>
                      <button className="px-3 py-1 rounded border text-red-600" onClick={() => deleteService(s._id)}>Delete</button>
                    </div>
                  </div>
                ))}
                {services.length === 0 && <div className="text-sm text-gray-500">No services yet. Click Add Service to create one.</div>}
              </div>
            </Section>
          )}

          {activeTab === 'pickup' && (
            <>
              <Section title="Pickup Requests & Bookings">
                <div className="text-sm text-gray-600">Incoming booking requests from users. Accept or reject bookings here.</div>
                <div className="mt-3">
                  {providerBookings.length === 0 && <div className="text-sm text-gray-500">No booking requests.</div>}
                  <div className="space-y-3">
                    {providerBookings.map(b => (
                      <div key={b._id} className="p-3 border rounded flex items-center justify-between">
                        <div>
                          <div className="font-medium text-black">{b.service?.title || b.service}</div>
                          <div className="text-xs text-gray-500">From: {b.user?.fullName || b.user?.email} • {new Date(b.bookingDate).toLocaleString()}</div>
                          <div className="text-sm text-gray-700">Qty/Req: {b.requirements?.quantity || '-' } • Instructions: {b.specialInstructions || '-'}</div>
                          <div className="text-xs text-gray-500">Status: {b.status}</div>
                        </div>
                        <div className="flex gap-2">
                          {b.status === 'pending' && (
                            <>
                              <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={async () => {
                                if (!confirm('Accept this booking?')) return;
                                try {
                                  await api(`/bookings/${b._id}/status`, { method: 'PATCH', body: { status: 'confirmed' } });
                                  alert('Booking accepted');
                                  refreshProviderBookings();
                                } catch (err) { console.error(err); alert('Failed to accept'); }
                              }}>Accept</button>
                              <button className="px-3 py-1 rounded border text-red-600" onClick={async () => {
                                if (!confirm('Reject this booking?')) return;
                                try {
                                  await api(`/bookings/${b._id}/status`, { method: 'PATCH', body: { status: 'rejected' } });
                                  alert('Booking rejected');
                                  refreshProviderBookings();
                                } catch (err) { console.error(err); alert('Failed to reject'); }
                              }}>Reject</button>
                            </>
                          )}
                          <button className="px-3 py-1 rounded border text-gray-900" onClick={() => setSelectedBooking(b)}>Details</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>

              <Section title="Sell Waste Pickups">
                <div className="text-sm text-gray-600">Accepted and scheduled sell-waste pickups assigned to you.</div>
                <div className="mt-3">
                  {assignedSellPickups.length === 0 && <div className="text-sm text-gray-500">No assigned sell-waste pickups.</div>}
                  <div className="space-y-3 mt-3">
                    {assignedSellPickups.map(l => (
                      <div key={l._id} className="p-3 border rounded flex items-center justify-between">
                        <div>
                          <div className="font-medium text-black">{String(l.wasteType).toUpperCase()} • {l.quantityKg} kg</div>
                          <div className="text-xs text-gray-500">Customer: {l.user?.fullName || l.user?.email} • {new Date(l.createdAt).toLocaleString()}</div>
                          <div className="text-sm text-gray-700">Address: {(l.address && (typeof l.address === 'string' ? l.address : (l.address.address || l.address.line1 || `${l.address.city || ''} ${l.address.pincode || ''}`))) || '-'}</div>
                          <div className="text-xs text-gray-500">Status: {l.status}</div>
                        </div>
                        <div className="flex gap-2">
                          {l.status === 'accepted' && (
                            <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={async () => {
                              try { await api(`/sell-waste/${l._id}/status`, { method: 'POST', body: { status: 'scheduled' } }); loadAssignedSellPickups(); alert('Marked scheduled'); } catch (e) { console.error(e); alert('Failed'); }
                            }}>Mark Scheduled</button>
                          )}
                          {l.status === 'scheduled' && (
                            <>
                              <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={async () => {
                                try { await api(`/sell-waste/${l._id}/status`, { method: 'POST', body: { status: 'completed' } }); loadAssignedSellPickups(); alert('Marked completed'); } catch (e) { console.error(e); alert('Failed'); }
                              }}>Mark Completed</button>
                              <button className="px-3 py-1 rounded border text-red-600" onClick={async () => {
                                if (!confirm('Cancel this pickup?')) return;
                                try { await api(`/sell-waste/${l._id}/status`, { method: 'POST', body: { status: 'cancelled' } }); loadAssignedSellPickups(); alert('Cancelled'); } catch (e) { console.error(e); alert('Failed'); }
                              }}>Cancel</button>
                            </>
                          )}
                          <button className="px-3 py-1 rounded border" onClick={() => setSelectedBooking(l)}>Details</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            </>
          )}

          {activeTab === 'sell-requests' && (
            <Section title="Sell Waste Requests">
              <div className="text-sm text-gray-600">Open sell requests from users. Make an offer to purchase their waste.</div>
              <div className="mt-3">
                {sellRequests.length === 0 && <div className="text-sm text-gray-500">No open sell requests.</div>}
                <div className="space-y-3 mt-3">
                  {sellRequests.map(l => (
                    <div key={l._id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium text-black">{String(l.wasteType).toUpperCase()} • {l.quantityKg} kg</div>
                        <div className="text-xs text-gray-500">{l.user?.fullName || l.user?.email} • {new Date(l.createdAt).toLocaleString()}</div>
                        <div className="text-sm text-gray-700">Address: {(l.address && (typeof l.address === 'string' ? l.address : (l.address.address || l.address.line1 || `${l.address.city || ''} ${l.address.pincode || ''}`))) || '-'}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={() => makeOffer(l._id)}>Make Offer</button>
                        <button className="px-3 py-1 rounded border" onClick={() => { setSelectedBooking(l); }}>Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {activeTab === 'contracts' && (
            <Section title="Contracts & Subscriptions">
              <div className="text-sm text-gray-600">Active society contracts, subscription users and renewal dates.</div>
            </Section>
          )}

          {activeTab === 'analytics' && (
            <Section title="Waste Analytics & Reports">
              <div className="text-sm text-gray-600">Graphs and reports for waste collected, type breakdowns and recycling vs landfill %.</div>
            </Section>
          )}

          {activeTab === 'earnings' && (
            <Section title="Earnings & Invoices">
              <div className="text-sm text-gray-600">Earnings per contract, subscription income and invoice downloads.</div>
            </Section>
          )}

          {activeTab === 'reviews' && (
            <Section title="Reviews & Feedback">
              <div className="text-sm text-gray-600">Client ratings and society feedback.</div>
            </Section>
          )}

          {activeTab === 'compliance' && (
            <Section title="Compliance & Documents">
              <div className="text-sm text-gray-600">Upload licenses, download reports and track certifications.</div>
            </Section>
          )}

        </main>
      </div>

      {showServiceModal && (
        <ServiceModal preset={editingService} onClose={() => setShowServiceModal(false)} onSave={saveService} />
      )}
      {showServiceDetails && (
        <ServiceDetailsModal serviceId={serviceDetails?._id || serviceDetails?.id || serviceDetails} onClose={() => { setShowServiceDetails(false); setServiceDetails(null); }} />
      )}
      {selectedBooking && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setSelectedBooking(null)}>
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-4 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-black">Booking details</h3>
                <div className="text-sm text-gray-500">{selectedBooking.service?.title || 'Service'}</div>
              </div>
              <div className="text-right">
                <button className="text-gray-600" onClick={() => setSelectedBooking(null)}>✕</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-sm text-gray-600">Customer</div>
                <div className="font-medium text-gray-900">{selectedBooking.user?.fullName || selectedBooking.user?.email}</div>
                <div className="text-sm text-gray-500">{selectedBooking.user?.phoneNumber || selectedBooking.user?.phone || ''}</div>

                <div className="mt-3 text-sm text-gray-600">Pickup Address</div>
                <div className="text-sm text-gray-800">{selectedBooking.address || (selectedBooking.location && (selectedBooking.location.address || `${selectedBooking.location.city || ''} ${selectedBooking.location.pincode || ''}`))}</div>

                <div className="mt-3 text-sm text-gray-600">Schedule</div>
                <div className="text-sm text-gray-800">{new Date(selectedBooking.bookingDate).toLocaleDateString()} • {selectedBooking.timeSlot?.start} - {selectedBooking.timeSlot?.end}</div>

                <div className="mt-3 text-sm text-gray-600">Requirements</div>
                <div className="text-sm text-gray-800">{selectedBooking.requirements?.quantity || selectedBooking.requirements?.wasteType || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Special Instructions</div>
                <div className="text-sm text-gray-800 p-3 bg-gray-50 rounded">{selectedBooking.specialInstructions || '-'}</div>

                <div className="mt-3 text-sm text-gray-600">Contact Person</div>
                <div className="text-sm text-gray-800">{selectedBooking.contactPerson?.name || '-'} • {selectedBooking.contactPerson?.phone || '-'}</div>

                {selectedBooking.service?.images && selectedBooking.service.images.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-600">Images</div>
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                      {selectedBooking.service.images.map((img, i) => (
                        <img key={i} src={img} alt="img" className="h-20 w-28 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              {selectedBooking.status === 'pending' && (
                <>
                  <button className="px-4 py-2 rounded border text-red-600" onClick={async () => {
                    if (!confirm('Reject this booking?')) return;
                    try { await api(`/bookings/${selectedBooking._id}/status`, { method: 'PATCH', body: { status: 'rejected' } }); alert('Rejected'); setSelectedBooking(null); refreshProviderBookings(); } catch (e) { console.error(e); alert('Failed'); }
                  }}>Reject</button>
                  <button className="px-4 py-2 rounded bg-emerald-600 text-white" onClick={async () => {
                    if (!confirm('Accept this booking?')) return;
                    try { await api(`/bookings/${selectedBooking._id}/status`, { method: 'PATCH', body: { status: 'confirmed' } }); alert('Accepted'); setSelectedBooking(null); refreshProviderBookings(); } catch (e) { console.error(e); alert('Failed'); }
                  }}>Accept</button>
                </>
              )}
              <button className="px-4 py-2 rounded border" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
