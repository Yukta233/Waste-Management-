import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { Sidebar, SidebarBody, SidebarLink } from '../components/sidebar';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    const t = localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token') || sessionStorage.getItem('accessToken');
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
    if (t) setToken(t);
  }, []);

  async function api(path, { method = 'GET', body, tk } = {}) {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
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
      const resp = await api('/bookings');
      setBookings(resp?.data?.bookings || resp?.bookings || resp || []);
    } catch (err) { console.error('loadBookings', err); }
  }

  async function loadProfile() {
    try {
      const resp = await api('/users/me');
      setProfile(resp?.data || resp?.user || resp);
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

  useEffect(() => { if (user) { loadServices(); loadBookings(); loadProfile(); loadReviews(); loadNotifications(); } }, [user]);

  const stats = useMemo(() => ({
    upcomingBookings: bookings.filter(b => b.status === 'upcoming').length,
    pastBookings: bookings.filter(b => b.status === 'completed' || b.status === 'cancelled').length,
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
                        <div className="font-medium">{b.service?.title || b.title}</div>
                        <div className="text-xs text-gray-500">{b.date ? new Date(b.date).toLocaleString() : (b.startAt || '')} • {b.status}</div>
                      </div>
                      <div className="flex gap-2">
                        {b.status === 'upcoming' && <button className="px-3 py-1 rounded border text-red-600" onClick={() => alert('Cancel booking')}>Cancel</button>}
                        <button className="px-3 py-1 rounded border" onClick={() => alert('Open booking')}>Details</button>
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
                      <div className="font-medium">{r.serviceTitle || r.service?.title}</div>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <img src={profile?.profilePhoto || '/placeholder-avatar.png'} alt="profile" className="h-24 w-24 rounded-full object-cover mb-2" />
                    <div className="font-medium">{profile?.fullName || user?.fullName}</div>
                    <div className="text-sm text-gray-500">{profile?.email || user?.email}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="mb-2">
                      <div className="text-sm text-gray-600">Contact</div>
                      <div className="font-medium">{profile?.phone || '-'}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-sm text-gray-600">Saved Addresses</div>
                      {(profile?.addresses || []).length === 0 ? <div className="text-sm text-gray-500">No saved addresses.</div> : (
                        <div className="space-y-2">{(profile.addresses || []).map((a, i) => <div key={i} className="p-2 border rounded">{a.label ? a.label + ': ' : ''}{a.address}</div>)}</div>
                      )}
                    </div>
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
                    await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1') + '/support', { method: 'POST', body: JSON.stringify({ subject: form.get('subject'), message: form.get('message') }), headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
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
        </main>
      </div>
    </div>
  );
}
