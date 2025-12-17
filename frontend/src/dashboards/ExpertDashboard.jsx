import React, { useEffect, useMemo, useState, useRef } from 'react';
import Header from '../components/Header';
import ServiceForm from '../components/ServiceForm';
import { motion } from 'framer-motion';
import { Sidebar, SidebarBody, SidebarLink } from '../components/sidebar';

// Utility: simple fetch wrapper
async function api(path, { method = 'GET', body, token } = {}) {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  if (!res.ok) {
    if (res.status === 401) {
      try {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
      } catch {}
      throw new Error('Unauthorized (token expired). Please login again.');
    }
    const t = await res.text();
    throw new Error(t || `Request failed ${res.status}`);
  }
  return res.json();
}

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
      <input className="mt-1 w-full rounded-lg border px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 caret-emerald-600 focus:outline-none focus:ring focus:border-emerald-500 appearance-none" {...props} />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-700">{label}</span>
      <select className="mt-1 w-full rounded-lg border px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring focus:border-emerald-500 appearance-none" {...props}>
        {children}
      </select>
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-700">{label}</span>
      <textarea className="mt-1 w-full rounded-lg border px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 caret-emerald-600 focus:outline-none focus:ring focus:border-emerald-500" rows={4} {...props} />
    </label>
  );
}

export default function ExpertDashboard() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data stores
  const [overview, setOverview] = useState({ activeServices: 0, upcoming: 0, workshops: 0, compostSoldKg: 0, avgRating: 0 });
  const [profile, setProfile] = useState({ fullName: '', expertiseInput: '', experienceYears: '', certifications: '', bio: '', cities: '', avatarUrl: '' });
  const [services, setServices] = useState([]); // expert-owned services
  const [lastAddedService, setLastAddedService] = useState(null);
  const [showServicePreview, setShowServicePreview] = useState(false);
  const [previewService, setPreviewService] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [earnings, setEarnings] = useState({ byService: [], monthly: [], completed: 0, pending: 0 });
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const isEditingProfileRef = useRef(false);
  const [isEditingService, setIsEditingService] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editServiceItem, setEditServiceItem] = useState(null);
  const [serviceFormSubmit, setServiceFormSubmit] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    const t = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    if (t) setToken(t);
  }, []);

  const isExpert = useMemo(() => (user?.role === 'expert' || user?.role === 'provider' || user?.isExpert), [user]);

  useEffect(() => {
    async function bootstrap() {
      // Avoid heavy dashboard refresh while editing service to prevent form remounts causing input resets
      if (!isExpert || isEditingService) return;
      setLoading(true); setError('');
      try {
        // Restore last added banner if present
        try {
          const saved = localStorage.getItem('lastAddedService');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.title) setLastAddedService(parsed);
          }
        } catch {}
        // Profile
        const me = await api('/users/profile', { token });
        if (!profileLoaded && !isEditingProfileRef.current) {
          setProfile({
            fullName: me?.fullName || me?.name || '',
            expertiseInput: (me?.expertise || []).join(', '),
            experienceYears: me?.experienceYears || '',
            certifications: me?.certifications || '',
            bio: me?.bio || '',
            cities: (me?.citiesServed || []).join(', '),
            avatarUrl: me?.avatar || '',
          });
          setProfileLoaded(true);
        }
        // Services owned by expert (skip updates while editing service form)
        if (!isEditingService) {
          const svcResp = await api(`/services/provider/${user?._id}`, { token });
          const svcArr = Array.isArray(svcResp?.data)
            ? svcResp.data
            : Array.isArray(svcResp?.services)
              ? svcResp.services
              : [];
          setServices(svcArr);
        }
        // Bookings for expert services
        const bResp = await api('/bookings/provider/bookings', { token });
        const bArr = Array.isArray(bResp?.data)
          ? bResp.data
          : Array.isArray(bResp?.data?.bookings)
            ? bResp.data.bookings
            : Array.isArray(bResp?.bookings)
              ? bResp.bookings
              : [];
        setBookings(bArr);
        // Ratings
        const r = null;
        setReviews([]);
        // Overview aggregates (compute using current state if editing service)
        const svcBase = isEditingService ? services : (Array.isArray(services) ? services : []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
    }
    bootstrap();
  }, [isExpert, isEditingService, token, profileLoaded]);

  // Create or update a service, then refresh the list and overview
  async function upsertService(payload) {
    if (!payload) return null;
    setLoading(true); setError('');
    try {
      let res;
      if (payload._id) {
        // update existing
        res = await api(`/services/${payload._id}`, { method: 'PATCH', body: payload, token });
      } else {
        // create new
        res = await api('/services', { method: 'POST', body: payload, token });
      }
      // refresh services
      const svcResp = await api(`/services/provider/${user?._id}`, { token });
      const svcArr = Array.isArray(svcResp?.data)
        ? svcResp.data
        : Array.isArray(svcResp?.services)
          ? svcResp.services
          : [];
      setServices(svcArr);
      // Update overview counts
      setOverview(prev => ({ ...prev, activeServices: Array.isArray(svcArr) ? svcArr.length : 0, workshops: (svcArr || []).filter(s => String(s.category) === 'workshop').length }));
      // store last added if created
      const createdSvc = res?.data || res?.service || res?.data?.service || null;
      if (createdSvc && !payload._id) {
        setLastAddedService(createdSvc);
        try { localStorage.setItem('lastAddedService', JSON.stringify({ title: createdSvc.title, category: createdSvc.category, price: createdSvc.price, features: createdSvc.features || createdSvc.tags || [] })); } catch {}
      }
      return res;
    } catch (err) { setError(err.message || 'Failed to save'); throw err; }
    finally { setLoading(false); }
  }

  async function updateBookingStatus(id, status) {
    setLoading(true); setError('');
    try {
      await api(`/bookings/${id}/status`, { method: 'PATCH', body: { status }, token });
      const bResp = await api('/bookings/provider/bookings', { token });
      const bArr = Array.isArray(bResp?.data)
        ? bResp.data
        : Array.isArray(bResp?.data?.bookings)
          ? bResp.data.bookings
          : Array.isArray(bResp?.bookings)
            ? bResp.bookings
            : [];
      setBookings(bArr);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function deleteServiceById(id) {
    if (!id) return;
    const confirmDel = window.confirm('Are you sure you want to delete this service?');
    if (!confirmDel) return;
    setLoading(true); setError('');
    try {
      await api(`/services/${id}`, { method: 'DELETE', token });
      const svcResp = await api(`/services/provider/${user?._id}`, { token });
      const svcArr = Array.isArray(svcResp?.data)
        ? svcResp.data
        : Array.isArray(svcResp?.services)
          ? svcResp.services
          : [];
      setServices(svcArr);
      if (previewService?._id === id) { setShowServicePreview(false); setPreviewService(null); }
      // Clear banner to avoid showing deleted one
      try { localStorage.removeItem('lastAddedService'); } catch {}
      setLastAddedService(null);
    } catch (err) { setError(err.message || 'Failed to delete'); }
    finally { setLoading(false); }
  }

  // Use the external ServiceForm component (imported at top)


  function ServicesManager() {
    // Use the outer `showServiceForm` and `editServiceItem` state
    // (avoid shadowing to keep modal and form state consistent)

    return (
      <Section title="Composting Services" actions={(
        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-emerald-600 text-white"
          onClick={() => {
            setEditServiceItem(null);
            setShowServiceForm(true);
            setIsEditingService(true);
          }}
        >
          Add Service
        </button>
      )}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map(s => (
            <div key={s._id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{s.title}</div>
                  <div className="text-xs text-gray-500">{s.category}</div>
                </div>
                <div className="text-emerald-700 font-semibold">₹{s.price}</div>
              </div>
              <div className="text-sm text-gray-600 mt-2 line-clamp-3">{s.description}</div>
              <div className="flex gap-2 justify-end mt-3">
                <button
          type="button"
          className="px-3 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          onClick={() => {
            setEditServiceItem(s);
            setShowServiceForm(true);
            setIsEditingService(true);
          }}
        >
          Edit
        </button>

              </div>
            </div>
          ))}
          {services.length === 0 && <div className="text-sm text-gray-500">No services yet. Use Add Service to create one.</div>}
        </div>

      {showServiceForm && (
  <div
  className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 transition-opacity duration-200 ${
    showServiceForm ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
  }`}
  onClick={() => {
    setShowServiceForm(false);
    setEditServiceItem(null);
    setIsEditingService(false);
  }}
>
  <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-lg m-4 flex flex-col"
    onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
  >
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <h3 className="text-lg font-semibold text-gray-800">
        {editServiceItem ? 'Edit Service' : 'Add Service'}
      </h3>
      <button
        type="button"
        className="text-xl text-gray-500 hover:text-gray-700"
        onClick={() => {
          setShowServiceForm(false);
          setEditServiceItem(null);
          setIsEditingService(false);
        }}
      >
        ×
      </button>
    </div>
    <div className="p-4 overflow-auto flex-1">
      <ServiceForm
        preset={editServiceItem}
        onSave={async (data) => {
          setShowServiceForm(false);
          setEditServiceItem(null);
          setIsEditingService(false);
          if (data) await upsertService(data);
        }}
      />
    </div>
  </div>
</div>

)}


      </Section>
    );
  }

  function BookingsSection() {
    return (
      <Section title="Bookings & Requests">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">Service</th>
                <th className="py-2">User</th>
                <th className="py-2">Date & time</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b._id} className="border-t">
                  <td className="py-2 text-gray-900">{b.service?.title || b.serviceTitle}</td>
                  <td className="py-2 text-gray-900">{b.user?.fullName || b.customerName}</td>
                  <td className="py-2 text-gray-900">{new Date(b.date || b.datetime).toLocaleString()}</td>
                  <td className="py-2 capitalize text-gray-900">{b.status}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      {b.status === 'pending' && (
                        <>
                          <button className="px-2 py-1 rounded bg-emerald-600 text-white" onClick={() => updateBookingStatus(b._id, 'confirmed')}>Accept</button>
                          <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={() => updateBookingStatus(b._id, 'rejected')}>Reject</button>
                          <button className="px-2 py-1 rounded border" onClick={() => { setSelectedBooking(b); setShowBookingDetails(true); }}>Details</button>
                        </>
                      )}

                      {b.status === 'confirmed' && (
                        <>
                          <button className="px-2 py-1 rounded bg-amber-600 text-white" onClick={() => updateBookingStatus(b._id, 'scheduled')}>Mark Scheduled</button>
                          <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={() => updateBookingStatus(b._id, 'cancelled')}>Cancel</button>
                          <button className="px-2 py-1 rounded border" onClick={() => { setSelectedBooking(b); setShowBookingDetails(true); }}>Details</button>
                        </>
                      )}

                      {b.status === 'scheduled' && (
                        <>
                          <button className="px-2 py-1 rounded bg-indigo-600 text-white" onClick={() => updateBookingStatus(b._id, 'in_progress')}>Start</button>
                          <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={() => updateBookingStatus(b._id, 'cancelled')}>Cancel</button>
                          <button className="px-2 py-1 rounded border" onClick={() => { setSelectedBooking(b); setShowBookingDetails(true); }}>Details</button>
                        </>
                      )}

                      {b.status === 'in_progress' && (
                        <>
                          <button className="px-2 py-1 rounded bg-gray-200" onClick={() => updateBookingStatus(b._id, 'completed')}>Complete</button>
                          <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={() => updateBookingStatus(b._id, 'cancelled')}>Cancel</button>
                          <button className="px-2 py-1 rounded border" onClick={() => { setSelectedBooking(b); setShowBookingDetails(true); }}>Details</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td className="py-4 text-gray-500" colSpan="5">No bookings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    );
  }

  function ReviewsSection() {
    const avg = overview.avgRating || (reviews.length ? (reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length) : 0);
    return (
      <Section title="Reviews & Ratings">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-2xl">⭐</div>
          <div className="text-lg font-semibold">{avg.toFixed(1)} average</div>
          <div className="text-gray-500">({reviews.length} reviews)</div>
        </div>
        <div className="space-y-3">
          {reviews.map((r, idx) => (
            <div key={idx} className="border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                <div className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="text-sm text-gray-700 mt-1">{r.comment}</div>
              <div className="text-xs text-gray-500">Service: {r.service?.title || '-'}</div>
            </div>
          ))}
          {reviews.length === 0 && <div className="text-sm text-gray-500">No reviews yet.</div>}
        </div>
      </Section>
    );
  }

  // Booking details modal
  const BookingDetailsModal = ({ booking, onClose }) => {
    if (!booking) return null;
    return (
      <div className="fixed inset-0 z-[9000] bg-black/50 flex items-center justify-center" onClick={onClose}>
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h3 className="text-lg font-semibold">Booking Details</h3>
            <button className="text-2xl leading-none text-gray-500 hover:text-gray-700" onClick={onClose}>×</button>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">Service</div>
                <div className="font-medium text-gray-900">{booking.service?.title || booking.serviceTitle || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">User</div>
                <div className="font-medium text-gray-900">{booking.user?.fullName || booking.customerName || '-'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">Date & Time</div>
                <div className="font-medium text-gray-900">{new Date(booking.bookingDate || booking.date || booking.datetime).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Status</div>
                <div className="font-medium text-gray-900 capitalize">{booking.status}</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Address</div>
              <div className="font-medium text-gray-900">{(booking.address || booking.location?.address || '')}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Contact Person</div>
              <div className="font-medium text-gray-900">{booking.contactPerson?.name || '-'} — {booking.contactPerson?.phone || '-'}</div>
            </div>

            {booking.specialInstructions && (
              <div>
                <div className="text-xs text-gray-500">Special Instructions</div>
                <div className="font-medium text-gray-900">{booking.specialInstructions}</div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded bg-gray-100" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // render booking details modal when selected
  useEffect(() => {
    if (!showBookingDetails) setSelectedBooking(null);
  }, [showBookingDetails]);

  return (
    <>
      {showBookingDetails && selectedBooking && (
        <BookingDetailsModal booking={selectedBooking} onClose={() => setShowBookingDetails(false)} />
      )}
    </>
  );


  function EarningsSection() {
    return (
      <Section title="Earnings & Payments">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title="Completed bookings" value={earnings.completed} icon="✅" />
          <StatCard title="Pending payments" value={earnings.pending} icon="⏳" />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Earnings per service</div>
            <div className="space-y-2">
              {earnings.byService?.map((row, i) => (
                <div key={i} className="flex justify-between text-sm border rounded p-2">
                  <div className="text-gray-700">{row.title}</div>
                  <div className="font-semibold text-emerald-700">₹{row.amount}</div>
                </div>
              ))}
              {(!earnings.byService || earnings.byService.length === 0) && <div className="text-sm text-gray-500">No data</div>}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Monthly earnings</div>
            <div className="space-y-2">
              {earnings.monthly?.map((row, i) => (
                <div key={i} className="flex justify-between text-sm border rounded p-2">
                  <div className="text-gray-700">{row.month}</div>
                  <div className="font-semibold text-emerald-700">₹{row.amount}</div>
                </div>
              ))}
              {(!earnings.monthly || earnings.monthly.length === 0) && <div className="text-sm text-gray-500">No data</div>}
            </div>
          </div>
        </div>
      </Section>
    );
  }

  function ProfileSection() {
    const [form, setForm] = useState(profile);
    const [editingLocal, setEditingLocal] = useState(false);
    const [fieldEdit, setFieldEdit] = useState({});

    const storageKey = useMemo(() => user?._id ? `profileFieldReadOnly:${user._id}` : null, [user?._id]);

    const computeDefaultFlags = (p) => ({
      fullName: !(p?.fullName),
      experienceYears: !(p?.experienceYears),
      expertiseInput: !(p?.expertiseInput),
      certifications: !(p?.certifications),
      cities: !(p?.cities),
      avatarUrl: !(p?.avatarUrl),
      bio: !(p?.bio),
    });

    const loadFlags = (p) => {
      const defaults = computeDefaultFlags(p);
      if (!storageKey) return defaults;
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return defaults;
        const saved = JSON.parse(raw);
        return { ...defaults, ...saved };
      } catch { return defaults; }
    };

    const saveFlags = (flags) => {
      if (!storageKey) return;
      try { localStorage.setItem(storageKey, JSON.stringify(flags)); } catch {}
    };

    useEffect(() => {
      if (!editingLocal) {
        setForm(profile);
        const flags = loadFlags(profile);
        setFieldEdit(flags);
      }
    }, [profile, storageKey]);

    const toggleEdit = (key, val = true) => {
      setFieldEdit(prev => {
        const next = { ...prev, [key]: val };
        saveFlags(next);
        return next;
      });
    };

    const onCancel = () => {
      setForm(profile);
      setEditingLocal(false);
      setIsEditingProfile(false);
      isEditingProfileRef.current = false;
      const flags = loadFlags(profile);
      setFieldEdit(flags);
    };

    const onSubmit = async (e) => {
      await saveProfile(e, form);
      const nextFlags = computeDefaultFlags(form);
      setFieldEdit(nextFlags);
      saveFlags(nextFlags);
    };

    const ReadOnlyRow = ({ label, value, onEdit, className }) => (
      <div className={`flex items-center justify-between rounded-lg border px-3 py-2 bg-gray-50 ${className || ''}`}>
        <div>
          <div className="text-sm text-gray-500">{label}</div>
          <div className="text-gray-900 font-medium break-words">{value || '-'}</div>
        </div>
        <button type="button" className="text-emerald-700 text-sm font-semibold hover:underline" onClick={onEdit}>Edit</button>
      </div>
    );

    return (
      <Section title="My Profile">
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fieldEdit.fullName ? (
            <Input label="Name" value={form.fullName || ''} onChange={e => { setIsEditingProfile(true); isEditingProfileRef.current = true; setEditingLocal(true); setForm(prev => ({ ...prev, fullName: e.target.value })); }} />
          ) : (
            <ReadOnlyRow label="Name" value={profile.fullName} onEdit={() => toggleEdit('fullName', true)} />
          )}

          {fieldEdit.experienceYears ? (
            <Input label="Years of experience" type="text" value={form.experienceYears || ''} onChange={e => { setIsEditingProfile(true); isEditingProfileRef.current = true; setEditingLocal(true); setForm(prev => ({ ...prev, experienceYears: e.target.value })); }} />
          ) : (
            <ReadOnlyRow label="Years of experience" value={profile.experienceYears} onEdit={() => toggleEdit('experienceYears', true)} />
          )}

          {fieldEdit.expertiseInput ? (
            <Input label="Expertise areas (comma)" value={form.expertiseInput || ''} onChange={e => { setIsEditingProfile(true); isEditingProfileRef.current = true; setEditingLocal(true); setForm(prev => ({ ...prev, expertiseInput: e.target.value })); }} />
          ) : (
            <ReadOnlyRow label="Expertise areas" value={profile.expertiseInput} onEdit={() => toggleEdit('expertiseInput', true)} />
          )}

          {fieldEdit.certifications ? (
            <Input label="Certifications (optional)" value={form.certifications || ''} onChange={e => { setIsEditingProfile(true); isEditingProfileRef.current = true; setEditingLocal(true); setForm(prev => ({ ...prev, certifications: e.target.value })); }} />
          ) : (
            <ReadOnlyRow label="Certifications" value={profile.certifications} onEdit={() => toggleEdit('certifications', true)} />
          )}

          {fieldEdit.cities ? (
            <Input label="Cities served (comma)" value={form.cities || ''} onChange={e => { setIsEditingProfile(true); isEditingProfileRef.current = true; setEditingLocal(true); setForm(prev => ({ ...prev, cities: e.target.value })); }} />
          ) : (
            <ReadOnlyRow label="Cities served" value={profile.cities} onEdit={() => toggleEdit('cities', true)} />
          )}

          {fieldEdit.avatarUrl ? (
            <Input label="Profile image URL" value={form.avatarUrl || ''} onChange={e => { setIsEditingProfile(true); isEditingProfileRef.current = true; setEditingLocal(true); setForm(prev => ({ ...prev, avatarUrl: e.target.value })); }} />
          ) : (
            <ReadOnlyRow label="Profile image URL" value={profile.avatarUrl} onEdit={() => toggleEdit('avatarUrl', true)} />
          )}

          {fieldEdit.bio ? (
            <TextArea label="Bio / About" value={form.bio || ''} onChange={e => { setIsEditingProfile(true); isEditingProfileRef.current = true; setEditingLocal(true); setForm(prev => ({ ...prev, bio: e.target.value })); }} />
          ) : (
            <div className="md:col-span-2">
              <ReadOnlyRow label="Bio / About" value={profile.bio} onEdit={() => toggleEdit('bio', true)} />
            </div>
          )}

          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" className="px-4 py-2 rounded-lg border text-black" onClick={onCancel}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white">Save</button>
          </div>
        </form>
      </Section>
    );
  }

  function SupportSection() {
    return (
      <Section title="Support & Learning">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <div className="font-semibold mb-1">Composting tips</div>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Balance greens (nitrogen) and browns (carbon) for faster composting.</li>
              <li>Maintain moisture like a wrung-out sponge; avoid waterlogging.</li>
              <li>Shred kitchen scraps to speed up decomposition.</li>
            </ul>
          </div>
          <div className="rounded-lg border p-4">
            <div className="font-semibold mb-1">Community discussions</div>
            <div className="text-sm text-gray-600">Join our forum to share best practices with other experts.</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="font-semibold mb-1">Contact admin</div>
            <div className="text-sm text-gray-600">Email: admin@greenapp.local</div>
          </div>
        </div>
      </Section>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-gray-700">Please login to continue.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex flex-1 w-full">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
          <SidebarBody>
            <div className="flex flex-col gap-2">
              <SidebarLink open={sidebarOpen} label="Dashboard Home" onClick={() => setActiveTab('overview')} active={activeTab === 'overview'} icon={<span>🏠</span>} />
              <SidebarLink open={sidebarOpen} label="My Profile" onClick={() => setActiveTab('profile')} active={activeTab === 'profile'} icon={<span>👤</span>} />
              <SidebarLink open={sidebarOpen} label="Composting Services" onClick={() => setActiveTab('services')} active={activeTab === 'services'} icon={<span>♻️</span>} />
              <SidebarLink open={sidebarOpen} label="Bookings & Requests" onClick={() => setActiveTab('bookings')} active={activeTab === 'bookings'} icon={<span>📅</span>} />
              <SidebarLink open={sidebarOpen} label="Reviews & Ratings" onClick={() => setActiveTab('reviews')} active={activeTab === 'reviews'} icon={<span>⭐</span>} />
              <SidebarLink open={sidebarOpen} label="Earnings & Payments" onClick={() => setActiveTab('earnings')} active={activeTab === 'earnings'} icon={<span>💰</span>} />
              <SidebarLink open={sidebarOpen} label="Support & Learning" onClick={() => setActiveTab('support')} active={activeTab === 'support'} icon={<span>📚</span>} />
            </div>

            {/* bottom account area removed as requested */}
          </SidebarBody>
        </Sidebar>

        {/* Main content area */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Service Expert Dashboard</h1>
              <div className="text-sm text-gray-500">Signed in as {user?.fullName || user?.name} — {user?.email}</div>
            </div>
          </div>

          {error && <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">{error}</div>}

          {/* Overview Stats (top) */}
          <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard title="Active Compost Services" value={overview.activeServices} icon="♻️" />
            <StatCard title="Upcoming Bookings" value={overview.upcoming} icon="📅" />
            <StatCard title="Workshops Scheduled" value={overview.workshops} icon="🎓" />
            <StatCard title="Compost Sold (kg)" value={overview.compostSoldKg} icon="🧪" />
            <StatCard title="Average Rating" value={overview.avgRating?.toFixed(1)} icon="⭐" />
          </div>

          <div className="mt-6 space-y-6">
            {activeTab === 'overview' && (
              <Section title="Overview">
                {lastAddedService && (
                  <div className="mb-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm">
                    <div className="font-semibold">Service added successfully</div>
                    <div className="mt-1">
                      <span className="font-medium">{lastAddedService.title}</span> — {lastAddedService.category?.replace(/_/g, ' ')} — ₹{lastAddedService.price}
                    </div>
                    {Array.isArray(lastAddedService.features) && lastAddedService.features.length > 0 && (
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {lastAddedService.features.slice(0,4).map((f, i) => (
                          <li key={i} className="text-emerald-900">{f}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                <div className="text-sm text-gray-600 mb-4">Quick snapshot of your composting business. Use the sidebar to manage details.</div>
                <div className="mt-2">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Recent services</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from(new Map(services.map(ss => [ss._id, ss])).values()).slice(0,3).map((s) => {
                      const feats = Array.isArray(s.features) && s.features.length
                        ? s.features
                        : Array.isArray(s.tags) ? s.tags : [];
                      return (
                        <div key={s._id} className="border rounded-lg p-3 bg-white">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-gray-800 line-clamp-1">{s.title}</div>
                            <div className="text-emerald-700 font-semibold text-sm">₹{s.price}</div>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{String(s.category).replace(/_/g, ' ')}</div>
                          <div className="mt-2">
                            {feats.length > 0 ? (
                              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                                {feats.slice(0,4).map((f, i) => (
                                  <li key={i}>{f}</li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-sm text-gray-600">No features listed</div>
                            )}
                          </div>
                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              type="button"
                              className="px-3 py-1 rounded-full border text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => { setPreviewService(s); setShowServicePreview(true); }}
                            >
                              View Service
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1 rounded-full border text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => deleteServiceById(s._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {services.length === 0 && (
                      <div className="text-sm text-gray-500">No services yet. Use the Services tab to add one.</div>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'services' && <ServicesManager />}
            {activeTab === 'bookings' && <BookingsSection />}
            {activeTab === 'reviews' && <ReviewsSection />}
            {activeTab === 'earnings' && <EarningsSection />}
            {activeTab === 'support' && <SupportSection />}
          </div>

          {showServicePreview && previewService && (
            <div className="fixed inset-0 z-[9000] bg-black/50 flex items-center justify-center" onClick={() => { setShowServicePreview(false); setPreviewService(null); }}>
              <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {String(previewService.category || '').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <button className="text-2xl leading-none text-gray-500 hover:text-gray-700" onClick={() => { setShowServicePreview(false); setPreviewService(null); }}>×</button>
                </div>

                {/* Body */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {/* Images */}
                  <div className="p-5 border-b md:border-b-0 md:border-r">
                    {Array.isArray(previewService.images) && previewService.images.length > 0 ? (
                      <img src={previewService.images[0]} alt="service" className="w-full h-64 object-cover rounded-xl" />
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    {Array.isArray(previewService.images) && previewService.images.length > 1 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {previewService.images.slice(0,6).map((img, i) => (
                          <img key={i} src={img} className="w-16 h-16 object-cover rounded-lg border" />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 line-clamp-2">{previewService.title}</h3>
                      <div className="text-emerald-700 font-extrabold text-xl whitespace-nowrap">₹{previewService.price}</div>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{String(previewService.category || '').replace(/_/g, ' ')}</div>

                    <p className="mt-3 text-gray-700 text-sm leading-relaxed whitespace-pre-line">{previewService.description}</p>

                    {/* Features / tags */}
                    {((previewService.features && previewService.features.length) || (previewService.tags && previewService.tags.length)) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(previewService.features || previewService.tags || []).slice(0,10).map((t, i) => (
                          <span key={i} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border">{t}</span>
                        ))}
                      </div>
                    )}

                    {/* Quick facts */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border p-3">
                        <div className="text-gray-500">Availability</div>
                        <div className="font-medium text-gray-900">{previewService.availability || 'anytime'}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-gray-500">Location</div>
                        <div className="font-medium text-gray-900">
                          {previewService.location?.city || previewService.city || '-'}, {previewService.location?.state || previewService.state || '-'} {previewService.location?.pincode || previewService.pincode || ''}
                        </div>
                      </div>
                      {previewService.provider?.fullName && (
                        <div className="rounded-lg border p-3">
                          <div className="text-gray-500">Provider</div>
                          <div className="font-medium text-gray-900">{previewService.provider.fullName}</div>
                        </div>
                      )}
                      {/* Category-specific hints when present */}
                      {previewService.setupType && (
                        <div className="rounded-lg border p-3">
                          <div className="text-gray-500">Setup type</div>
                          <div className="font-medium text-gray-900">{previewService.setupType}</div>
                        </div>
                      )}
                      {previewService.compostType && (
                        <div className="rounded-lg border p-3">
                          <div className="text-gray-500">Composting type</div>
                          <div className="font-medium text-gray-900">{previewService.compostType}</div>
                        </div>
                      )}
                      {previewService.minQty != null && (
                        <div className="rounded-lg border p-3">
                          <div className="text-gray-500">Min quantity</div>
                          <div className="font-medium text-gray-900">{previewService.minQty} kg</div>
                        </div>
                      )}
                      {previewService.pricingModel && (
                        <div className="rounded-lg border p-3">
                          <div className="text-gray-500">Pricing model</div>
                          <div className="font-medium text-gray-900">{previewService.pricingModel}</div>
                        </div>
                      )}
                      {previewService.durationHours != null && (
                        <div className="rounded-lg border p-3">
                          <div className="text-gray-500">Duration</div>
                          <div className="font-medium text-gray-900">{previewService.durationHours} hours</div>
                        </div>
                      )}
                      {previewService.participants != null && (
                        <div className="rounded-lg border p-3">
                          <div className="text-gray-500">Participants</div>
                          <div className="font-medium text-gray-900">{previewService.participants}</div>
                        </div>
                      )}
                      {previewService.monthlyPrice != null && (
                        <div className="rounded-lg border p-3">
                          <div className="text-gray-500">Monthly price</div>
                          <div className="font-medium text-gray-900">₹{previewService.monthlyPrice}</div>
                        </div>
                      )}
                      {previewService.stock != null && (
                        <div className="rounded-lg border p-3">
                          <div className="text-gray-500">Stock</div>
                          <div className="font-medium text-gray-900">{previewService.stock}</div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                      <button className="px-4 py-2 rounded-lg border" onClick={() => { setShowServicePreview(false); setPreviewService(null); }}>Close</button>
                      <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white" onClick={() => {
                        const svc = previewService;
                        setShowServicePreview(false);
                        setPreviewService(null);
                        setEditServiceItem(svc);
                        setShowServiceForm(true);
                        setIsEditingService(true);
                      }}>Edit</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading && !isEditingService && (
             <div className="fixed inset-0 z-[5000] bg-black/20 flex items-center justify-center">
              <div className="bg-white px-4 py-3 rounded-lg shadow pointer-events-auto">Loading...</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
