import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { Sidebar, SidebarBody, SidebarLink } from '../components/sidebar';
import { useNavigate, useLocation } from 'react-router-dom';

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

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-700">{label}</span>
      <input className="mt-1 w-full rounded-lg border px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring focus:border-emerald-500" {...props} />
    </label>
  );
}

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('browse');

  // data
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serviceFilters, setServiceFilters] = useState({ category: '', city: '', minPrice: '', maxPrice: '', rating: '', available: '' });
  const [selectedService, setSelectedService] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [sellForm, setSellForm] = useState({ wasteType: 'plastic', quantityKg: '', preferredPickupDate: '', preferredPickupTime: '', address: '', images: [] });
  const [mySellListings, setMySellListings] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    const t = localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token') || sessionStorage.getItem('accessToken');
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
    if (t) setToken(t);
  }, []);

  async function api(path, { method = 'GET', body, tk } = {}) {
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
      const text = await res.text().catch(() => '');
      throw new Error(text || `Request failed ${res.status}`);
    }
    return res.json();
  }

  async function loadServices() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (serviceFilters.category) qs.set('category', serviceFilters.category);
      if (serviceFilters.city) qs.set('city', serviceFilters.city);
      if (serviceFilters.minPrice) qs.set('minPrice', serviceFilters.minPrice);
      if (serviceFilters.maxPrice) qs.set('maxPrice', serviceFilters.maxPrice);
      if (serviceFilters.rating) qs.set('rating', serviceFilters.rating);
      if (serviceFilters.available) qs.set('available', serviceFilters.available);
      const resp = await api(`/services?${qs.toString()}`);
      const arr = resp?.data?.services || resp?.data || resp?.services || resp || [];
      setServices(Array.isArray(arr) ? arr : []);
    } catch (err) {
      console.error('loadServices', err);
    } finally { setLoading(false); }
  }

  async function loadBookings() {
    try {
      const resp = await api('/bookings/my-bookings');
      setBookings(resp?.data?.bookings || resp?.bookings || resp || []);
    } catch (err) { console.error('loadBookings', err); }
  }

  async function loadProfile() {
    try {
      const resp = await api('/users/profile');
      const p = resp?.data || resp?.user || resp;
      setProfile(p);
      // keep local profile; avoid overwriting top-level `user` here to prevent re-triggering effects
      setEditForm(p ? {
        fullName: p.fullName || '',
        phoneNumber: p.phoneNumber || p.phone || '',
        bio: p.bio || '',
        website: p.website || '',
        addresses: Array.isArray(p.addresses) ? p.addresses.slice() : (p.address ? [p.address] : []),
        expertise: Array.isArray(p.expertise) ? p.expertise.join(', ') : (p.expertise || ''),
        serviceArea: Array.isArray(p.serviceArea) ? p.serviceArea.join(', ') : (p.serviceArea || '')
      } : null);
    } catch (err) { console.error('loadProfile', err); }
  }

  async function loadReviews() {
    try {
      const resp = await api('/reviews/my');
      setReviews(resp?.data?.reviews || resp?.reviews || resp || []);
    } catch (err) { console.error('loadReviews', err); }
  }

  async function loadNotifications() {
    try {
      const resp = await api('/notifications');
      setNotifications(resp?.data?.notifications || resp?.notifications || resp || []);
    } catch (err) { console.error('loadNotifications', err); }
  }

  // Load dashboard data once when token becomes available to avoid re-render loops
  useEffect(() => {
    if (token) {
      loadServices();
      loadBookings();
      loadProfile();
      loadReviews();
      loadNotifications();
    }
  }, [token]);


  async function loadMySellListings() {
    try {
      const resp = await api('/sell-waste/my');
      setMySellListings(resp?.data || resp || []);
    } catch (err) { console.error('loadMySellListings', err); }
  }

  useEffect(() => { if (token) loadMySellListings(); }, [token]);

    // react to navigation state (e.g., after creating a booking)
    const location = useLocation();
    useEffect(() => {
      if (location?.state?.refreshBookings) {
        loadBookings();
        if (location.state.activeTab) setActiveTab(location.state.activeTab);
        try { window.history.replaceState({}, document.title); } catch (e) {}
      }
    }, [location]);

  const stats = useMemo(() => ({
    upcomingBookings: bookings.filter(b => ['pending', 'confirmed', 'scheduled', 'in_progress'].includes(b.status)).length,
    pastBookings: bookings.filter(b => ['completed', 'cancelled', 'rejected', 'expired'].includes(b.status)).length,
    savedServices: services.length,
  }), [bookings, services]);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1 w-full">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
          <SidebarBody>
              <div className="flex flex-col gap-2">
              <SidebarLink open={sidebarOpen} label="Browse" onClick={() => setActiveTab('browse')} active={activeTab === 'browse'} icon={<span>🔎</span>} />
              <SidebarLink open={sidebarOpen} label="Sell Waste" onClick={() => setActiveTab('sell-waste')} active={activeTab === 'sell-waste'} icon={<span>🗑️</span>} />
              <SidebarLink open={sidebarOpen} label="Bookings" onClick={() => setActiveTab('bookings')} active={activeTab === 'bookings'} icon={<span>📅</span>} />
              <SidebarLink open={sidebarOpen} label="My Reviews" onClick={() => setActiveTab('reviews')} active={activeTab === 'reviews'} icon={<span>⭐</span>} />
              <SidebarLink open={sidebarOpen} label="Profile" onClick={() => setActiveTab('profile')} active={activeTab === 'profile'} icon={<span>👤</span>} />
              <SidebarLink open={sidebarOpen} label="Notifications" onClick={() => setActiveTab('notifications')} active={activeTab === 'notifications'} icon={<span>🔔</span>} />
              <SidebarLink open={sidebarOpen} label="Support" onClick={() => setActiveTab('support')} active={activeTab === 'support'} icon={<span>❓</span>} />
            </div>
          </SidebarBody>
        </Sidebar>

        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">User Dashboard</h1>
              <div className="text-sm text-gray-800">Signed in as {user?.fullName || user?.name} — {user?.email}</div>
            </div>
          </div>

          {/* Top stats moved here for cleaner layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <StatCard title="Upcoming" value={stats.upcomingBookings} icon="📅" />
            <StatCard title="Past" value={stats.pastBookings} icon="📜" />
            <StatCard title="Saved" value={stats.savedServices} icon="💾" />
          </div>

          {activeTab === 'browse' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <div className="bg-white rounded-xl border p-4">
                    <div className="mb-3">
                      <div className="flex justify-center">
                        <div className="flex gap-2 flex-wrap items-center">
                          <select value={serviceFilters.category} onChange={e => setServiceFilters(prev => ({ ...prev, category: e.target.value }))} className="rounded border px-3 py-2">
                        <option value="">All categories</option>
                        <option value="home-setup">Home Setup</option>
                        <option value="waste-collection">Waste Collection</option>
                        <option value="workshop">Workshop</option>
                        <option value="cleaning">Cleaning</option>
                      </select>
                      <input placeholder="City / Pincode" value={serviceFilters.city} onChange={e => setServiceFilters(prev => ({ ...prev, city: e.target.value }))} className="rounded border px-3 py-2" />
                      <input placeholder="Min" type="number" value={serviceFilters.minPrice} onChange={e => setServiceFilters(prev => ({ ...prev, minPrice: e.target.value }))} className="rounded border px-3 py-2 w-24" />
                      <input placeholder="Max" type="number" value={serviceFilters.maxPrice} onChange={e => setServiceFilters(prev => ({ ...prev, maxPrice: e.target.value }))} className="rounded border px-3 py-2 w-24" />
                          <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={loadServices}>Filter</button>
                        </div>
                      </div>
                    </div>

                    {loading && <div>Loading...</div>}
                    {!loading && services.length === 0 && <div className="text-sm text-gray-500">No services found.</div>}
                    <div className="grid gap-3">
                      {services.map(s => (
                        <div key={s._id || s.id} className="p-3 border rounded flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={(s.images && s.images[0]) || s.image || '/placeholder-avatar.png'} alt={s.title} className="h-16 w-24 object-cover rounded" />
                            <div>
                              <div className="font-medium text-black">{s.title}</div>
                              <div className="text-xs text-gray-500">{s.category} • {s.location?.city || s.city || '-'}</div>
                              <div className="text-sm text-gray-700">{s.description ? (s.description.length > 100 ? s.description.slice(0,100) + '…' : s.description) : ''}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-sm font-semibold text-black">{s.price ? `₹${s.price}` : '—'}</div>
                            <div className="flex gap-2">
                              <button className="px-2 py-1 text-sm rounded border text-gray-700 hover:bg-gray-50" onClick={() => setSelectedService(s)}>View details</button>
                              <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={() => navigate(`/book/${s._id || s.id}`)}>Book now</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">My Bookings</h2>
              <div className="bg-white rounded-xl border p-4">
                {bookings.length === 0 && <div className="text-sm text-gray-500">No bookings found.</div>}
                <div className="space-y-3">
                  {bookings.map(b => (
                    <div key={b._id || b.id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium text-black">{b.service?.title || b.title}</div>
                        <div className="text-xs text-gray-500">{b.date ? new Date(b.date).toLocaleString() : (b.startAt || '')} • {b.status}</div>
                      </div>
                      <div className="flex gap-2">
                        {b.status === 'upcoming' && <button className="px-3 py-1 rounded border text-red-600" onClick={() => alert('Cancel booking')}>Cancel</button>}
                        <button className="px-3 py-1 rounded border text-black" onClick={() => alert('Open booking')}>Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">My Reviews</h2>
              <div className="bg-white rounded-xl border p-4">
                {reviews.length === 0 && <div className="text-sm text-gray-500">No reviews yet.</div>}
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r._id || r.id} className="p-3 border rounded">
                      <div className="font-medium text-black">{r.serviceTitle || r.service?.title}</div>
                      <div className="text-xs text-gray-500">Rating: {r.rating} • {new Date(r.createdAt || r.date).toLocaleDateString()}</div>
                      <div className="mt-1 text-gray-700">{r.comment}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Profile & Addresses</h2>
              <div className="bg-white rounded-xl border p-4">
                <div className="flex justify-end mb-3">
                  {!editingProfile ? (
                    <button className="px-3 py-1 rounded border text-black" onClick={() => setEditingProfile(true)}>Edit Profile</button>
                  ) : (
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded border text-black" onClick={() => { setEditingProfile(false); setEditForm(profile ? {
                        fullName: profile.fullName || '', phoneNumber: profile.phoneNumber || profile.phone || '', bio: profile.bio || '', website: profile.website || '', addresses: Array.isArray(profile.addresses) ? profile.addresses.slice() : (profile.address ? [profile.address] : []), expertise: Array.isArray(profile.expertise) ? profile.expertise.join(', ') : (profile.expertise || ''), serviceArea: Array.isArray(profile.serviceArea) ? profile.serviceArea.join(', ') : (profile.serviceArea || '')
                      } : null) }}>Cancel</button>
                      <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={async () => {
                        try {
                          const update = {
                            fullName: editForm.fullName,
                            phoneNumber: editForm.phoneNumber,
                            bio: editForm.bio,
                            website: editForm.website,
                            address: editForm.addresses,
                            expertise: editForm.expertise,
                            serviceArea: editForm.serviceArea
                          };
                          const resp = await api('/users/profile', { method: 'PUT', body: update });
                          const updated = resp?.data || resp;
                          setProfile(updated);
                          // update local `user` state and storage so dashboard reflects changes for this user only
                          try { setUser(updated); localStorage.setItem('user', JSON.stringify(updated)); } catch (e) {}
                          setEditingProfile(false);
                          
                        } catch (err) {
                          console.error('Failed to update profile', err);
                          alert('Failed to update profile');
                        }
                      }}>Save</button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <img src={profile?.profilePhoto || '/placeholder-avatar.png'} alt="profile" className="h-24 w-24 rounded-full object-cover mb-2" />
                    <div className="font-medium text-black">{profile?.fullName || user?.fullName}</div>
                    <div className="text-sm text-gray-500">{profile?.email || user?.email}</div>
                  </div>
                  <div className="md:col-span-2">
                    {!editingProfile && (
                      <>
                        <div className="mb-2">
                          <div className="text-sm text-gray-600">Contact</div>
                          <div className="font-medium text-gray-800">{profile?.phoneNumber || profile?.phone || '-'}</div>
                        </div>
                        <div className="mb-2">
                          <div className="text-sm text-gray-600">Saved Addresses</div>
                          {(profile?.addresses || []).length === 0 ? <div className="text-sm text-gray-500">No saved addresses.</div> : (
                            <div className="space-y-2">{(profile.addresses || []).map((a, i) => <div key={i} className="p-2 border rounded">{a.label ? a.label + ': ' : ''}{a.address}</div>)}</div>
                          )}
                        </div>
                        <div className="mb-2">
                          <div className="text-sm text-gray-600">Bio</div>
                          <div className="text-sm text-gray-700">{profile?.bio || '-'}</div>
                        </div>
                      </>
                    )}

                    {editingProfile && editForm && (
                      <form onSubmit={e => e.preventDefault()} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <label className="block"><span className="text-sm text-gray-700">Full name</span>
                            <input value={editForm.fullName} onChange={e => setEditForm(prev => ({ ...prev, fullName: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2 bg-white text-black placeholder-gray-600" />
                          </label>
                          <label className="block"><span className="text-sm text-gray-700">Phone</span>
                            <input value={editForm.phoneNumber} onChange={e => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2 bg-white text-black placeholder-gray-600" />
                          </label>
                        </div>

                        <label className="block"><span className="text-sm text-gray-700">Website</span>
                          <input value={editForm.website} onChange={e => setEditForm(prev => ({ ...prev, website: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2 bg-white text-black placeholder-gray-600" />
                        </label>

                        <label className="block"><span className="text-sm text-gray-700">Bio</span>
                          <textarea value={editForm.bio} onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2 h-24 bg-white text-black placeholder-gray-600" />
                        </label>

                        <div>
                          <div className="text-sm text-gray-700 mb-2">Addresses</div>
                          {(editForm.addresses || []).map((a, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 items-start">
                              <input placeholder="Label (Home, Office)" value={a.label || ''} onChange={e => setEditForm(prev => { const arr = prev.addresses.slice(); arr[i] = { ...arr[i], label: e.target.value }; return { ...prev, addresses: arr }; })} className="rounded border px-3 py-2 bg-white text-black placeholder-gray-600" />
                              <input placeholder="Address" value={a.address || ''} onChange={e => setEditForm(prev => { const arr = prev.addresses.slice(); arr[i] = { ...arr[i], address: e.target.value }; return { ...prev, addresses: arr }; })} className="rounded border px-3 py-2 md:col-span-1 bg-white text-black placeholder-gray-600" />
                              <div className="flex gap-2">
                                <button type="button" className="px-2 py-1 rounded border text-sm text-gray-800" onClick={() => setEditForm(prev => { const arr = prev.addresses.slice(); arr.splice(i,1); return { ...prev, addresses: arr }; })}>Remove</button>
                              </div>
                            </div>
                          ))}
                          <div>
                            <button type="button" className="px-3 py-1 rounded border text-gray-800" onClick={() => setEditForm(prev => ({ ...prev, addresses: [...(prev.addresses||[]), { label: '', address: '' }] }))}>Add Address</button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <label className="block"><span className="text-sm text-gray-700">Expertise (comma separated)</span>
                            <input value={editForm.expertise} onChange={e => setEditForm(prev => ({ ...prev, expertise: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2 bg-white text-black placeholder-gray-600" />
                          </label>
                          <label className="block"><span className="text-sm text-gray-700">Service Area (comma separated)</span>
                            <input value={editForm.serviceArea} onChange={e => setEditForm(prev => ({ ...prev, serviceArea: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2 bg-white text-black placeholder-gray-600" />
                          </label>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
              <div className="bg-white rounded-xl border p-4">
                {notifications.length === 0 && <div className="text-sm text-gray-500">No notifications.</div>}
                <div className="space-y-2">{notifications.map(n => (
                  <div key={n._id || n.id} className="p-2 border rounded flex items-center justify-between">
                    <div>
                      <div className="text-sm">{n.title || n.message}</div>
                      <div className="text-xs text-gray-500">{new Date(n.createdAt || n.date).toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-gray-500">{n.type || ''}</div>
                  </div>
                ))}</div>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Support / Help</h2>
              <div className="bg-white rounded-xl border p-4">
                <div className="mb-3 text-sm text-gray-600">Raise issues, report bad services, or check FAQs.</div>
                <form onSubmit={async e => {
                  e.preventDefault();
                  const form = new FormData(e.target);
                  try {
                    await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1') + '/support', { method: 'POST', body: JSON.stringify({ subject: form.get('subject'), message: form.get('message') }), headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
                    alert('Support request sent');
                    e.target.reset();
                  } catch (err) { console.error(err); alert('Failed to send'); }
                }} className="grid gap-2">
                  <input name="subject" required placeholder="Subject" className="rounded border px-3 py-2" />
                  <textarea name="message" required placeholder="Describe the issue" className="rounded border px-3 py-2 h-28" />
                  <div>
                    <button type="submit" className="px-3 py-2 rounded bg-emerald-600 text-white">Send</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {selectedService && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black opacity-50" onClick={() => setSelectedService(null)}></div>
              <div className="relative bg-white rounded-lg shadow-lg z-50 max-w-4xl w-full mx-4 overflow-auto" style={{ maxHeight: '90vh' }}>
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedService.title}</h3>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 rounded border text-black" onClick={() => setSelectedService(null)}>Close</button>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <img src={(selectedService.images && selectedService.images[0]) || selectedService.image || '/placeholder-avatar.png'} alt="" className="w-full h-48 object-cover rounded mb-3" />
                    <div className="text-sm text-gray-600">Provider</div>
                    <div className="font-medium text-gray-900">{selectedService.provider?.fullName || selectedService.provider || '—'}</div>
                    <div className="text-xs text-gray-500 text-black">{selectedService.provider?.email}</div>
                    <div className="mt-3 text-sm text-gray-600">Price</div>
                    <div className="font-medium text-black">{selectedService.price ? `₹${selectedService.price}` : '—'} {selectedService.priceType || ''}</div>
                    <div className="mt-3 text-sm text-gray-600">Availability</div>
                    <div className="font-medium text-black">{selectedService.isAvailable ? 'Available' : 'Unavailable'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="mb-3">
                      <div className="text-sm text-gray-600">Description</div>
                      <div className="text-gray-800">{selectedService.description}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-sm text-gray-600">Location</div>
                      <div className="text-gray-800">{selectedService.location?.address || ''} {selectedService.location?.city ? '• ' + selectedService.location.city : ''}</div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={() => alert('Open booking (not implemented)')}>Book Now</button>
                      <button className="px-3 py-2 rounded border" onClick={() => setSelectedService(null)}>Close</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sell-waste' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Sell Waste / Request Pickup</h2>
              <div className="bg-white rounded-xl border p-4">
                <form onSubmit={async e => {
                  e.preventDefault();
                  try {
                    const fd = new FormData();
                    fd.append('wasteType', sellForm.wasteType);
                    fd.append('quantityKg', sellForm.quantityKg);
                    fd.append('address', typeof sellForm.address === 'string' ? sellForm.address : JSON.stringify(sellForm.address));
                    // combine date + time into ISO datetime if both provided
                    if (sellForm.preferredPickupDate && sellForm.preferredPickupTime) {
                      const dt = new Date(sellForm.preferredPickupDate + 'T' + sellForm.preferredPickupTime);
                      if (!isNaN(dt.getTime())) fd.append('preferredPickupAt', dt.toISOString());
                    }
                    if (sellForm.images && sellForm.images.length) {
                      for (let i = 0; i < sellForm.images.length; i++) fd.append('images', sellForm.images[i]);
                    }
                    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
                    const headers = {};
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    const res = await fetch(base + '/sell-waste', { method: 'POST', body: fd, headers, credentials: 'include' });
                    if (!res.ok) {
                      let errText = 'Failed to create listing';
                      try { const j = await res.json(); errText = j?.message || j?.error || JSON.stringify(j) || errText; } catch(e) {}
                      throw new Error(errText);
                    }
                    alert('Sell request created');
                    setSellForm({ wasteType: 'plastic', quantityKg: '', preferredPickupAt: '', address: '', images: [] });
                    loadMySellListings();
                  } catch (err) { console.error(err); alert('Failed to create listing'); }
                }} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <label className="block"><span className="text-sm text-gray-700">Waste Type</span>
                      <select value={sellForm.wasteType} onChange={e => setSellForm(prev => ({ ...prev, wasteType: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2 bg-white text-black">
                        <option value="plastic">Plastic</option>
                        <option value="paper">Paper</option>
                        <option value="metal">Metal</option>
                        <option value="e-waste">E-waste</option>
                        <option value="glass">Glass</option>
                      </select>
                    </label>
                    <label className="block"><span className="text-sm text-gray-700">Approx Quantity (kg)</span>
                      <input value={sellForm.quantityKg} onChange={e => setSellForm(prev => ({ ...prev, quantityKg: e.target.value }))} type="number" min="0" step="0.1" className="mt-1 w-full rounded border px-3 py-2 bg-white text-black" />
                    </label>
                  </div>

                  <label className="block"><span className="text-sm text-gray-700">Pickup Address</span>
                    <input value={sellForm.address} onChange={e => setSellForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Enter pickup address or select saved address" className="mt-1 w-full rounded border px-3 py-2 bg-white text-black" />
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <label className="block"><span className="text-sm text-gray-700">Preferred pickup date</span>
                      <input value={sellForm.preferredPickupDate} onChange={e => setSellForm(prev => ({ ...prev, preferredPickupDate: e.target.value }))} type="date" className="mt-1 w-full rounded border px-3 py-2 bg-white text-black" />
                    </label>
                    <label className="block"><span className="text-sm text-gray-700">Preferred pickup time</span>
                      <input value={sellForm.preferredPickupTime} onChange={e => setSellForm(prev => ({ ...prev, preferredPickupTime: e.target.value }))} type="time" className="mt-1 w-full rounded border px-3 py-2 bg-white text-black" />
                    </label>
                  </div>

                  <label className="block"><span className="text-sm text-gray-700">Images (optional)</span>
                    <input type="file" multiple accept="image/*" onChange={e => setSellForm(prev => ({ ...prev, images: Array.from(e.target.files || []) }))} className="mt-1 w-full text-black" />
                  </label>

                  <div>
                    <button type="submit" className="px-3 py-2 rounded bg-emerald-600 text-white">Create Sell Request</button>
                  </div>
                </form>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-black">My Sell Requests</h3>
                  {mySellListings.length === 0 && <div className="text-sm text-gray-500">No sell requests yet.</div>}
                  <div className="space-y-3 mt-2">{mySellListings.map(l => (
                    <div key={l._id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{l.wasteType} — {l.quantityKg} kg</div>
                        <div className="text-xs text-gray-500">Status: {l.status} • {new Date(l.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        {l.status === 'open' && <button className="px-2 py-1 rounded border" onClick={() => navigator.clipboard.writeText(l._id)}>Copy ID</button>}
                        <button className="px-2 py-1 rounded border" onClick={() => alert(JSON.stringify(l, null, 2))}>Details</button>
                      </div>
                    </div>
                  ))}</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
