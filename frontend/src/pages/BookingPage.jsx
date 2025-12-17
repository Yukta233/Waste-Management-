import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

// Booking page with dynamic requirements, time slots, pricing summary and payment option
export default function BookingPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    bookingDate: '',
    timeSlot: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    specialInstructions: '',
    requirements: {},
    paymentMethod: 'cash',
    payNow: false
  });

  useEffect(() => {
    async function load() {
      if (!serviceId) return;
      setLoading(true);
      try {
        const base =   import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token') || sessionStorage.getItem('accessToken');
        const res = await fetch(`${base}/services/${serviceId}`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch service');
        const json = await res.json();
        const svc = json?.data || json?.service || json;
        setService(svc);

        // prefill form address/contact from user or service
        try {
          const u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
          setForm(prev => ({
            ...prev,
            address: prev.address || u?.address || (svc?.location?.address ? svc.location.address : ''),
            city: prev.city || u?.city || (svc?.location?.city || ''),
            state: prev.state || u?.state || (svc?.location?.state || ''),
            pincode: prev.pincode || u?.pincode || (svc?.location?.pincode || ''),
            contactName: prev.contactName || u?.fullName || '',
            contactPhone: prev.contactPhone || u?.phone || u?.contact || '',
            contactEmail: prev.contactEmail || u?.email || ''
          }));
        } catch (err) {}
      } catch (err) {
        console.error(err);
        alert('Failed to load service');
      } finally { setLoading(false); }
    }
    load();
  }, [serviceId]);

  // generate hourly time slots between 08:00 and 20:00
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h < 20; h++) {
      const start = `${String(h).padStart(2,'0')}:00`;
      const end = `${String(h+1).padStart(2,'0')}:00`;
      slots.push(`${start} - ${end}`);
    }
    return slots;
  }, []);

  function renderRequirements() {
    const cat = (service?.category || '').toLowerCase();
    if (cat.includes('waste') || cat.includes('collection')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label className="block"><span className="text-sm text-gray-700">Waste Type</span>
            <input value={form.requirements.wasteType || ''} onChange={e => setForm(prev => ({ ...prev, requirements: { ...prev.requirements, wasteType: e.target.value } }))} className="mt-1 w-full rounded-lg border bg-white text-black placeholder-gray-600 px-3 py-2" />
          </label>
          <label className="block"><span className="text-sm text-gray-700">Quantity (e.g., 10kg)</span>
            <input value={form.requirements.quantity || ''} onChange={e => setForm(prev => ({ ...prev, requirements: { ...prev.requirements, quantity: e.target.value } }))} className="mt-1 w-full rounded-lg border bg-white text-black placeholder-gray-600 px-3 py-2" />
          </label>
        </div>
      );
    }

    if (cat.includes('home') || cat.includes('setup')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label className="block"><span className="text-sm text-gray-700">Setup Location</span>
            <input value={form.requirements.setupLocation || ''} onChange={e => setForm(prev => ({ ...prev, requirements: { ...prev.requirements, setupLocation: e.target.value } }))} className="mt-1 w-full rounded-lg border bg-white text-black placeholder-gray-600 px-3 py-2" />
          </label>
          <label className="block"><span className="text-sm text-gray-700">Space Available (sq ft)</span>
            <input value={form.requirements.spaceAvailable || ''} onChange={e => setForm(prev => ({ ...prev, requirements: { ...prev.requirements, spaceAvailable: e.target.value } }))} className="mt-1 w-full rounded-lg border bg-white text-black placeholder-gray-600 px-3 py-2" />
          </label>
        </div>
      );
    }

    if (cat.includes('workshop')) {
      return (
        <label className="block"><span className="text-sm text-gray-700">Number of Participants</span>
          <input type="number" min={1} value={form.requirements.numberOfParticipants || ''} onChange={e => setForm(prev => ({ ...prev, requirements: { ...prev.requirements, numberOfParticipants: e.target.value } }))} className="mt-1 w-full rounded-lg border bg-white text-black placeholder-gray-600 px-3 py-2" />
        </label>
      );
    }

    // default - allow free text requirements
    return (
      <label className="block"><span className="text-sm text-gray-700">Requirements</span>
        <input value={form.requirements.notes || ''} onChange={e => setForm(prev => ({ ...prev, requirements: { ...prev.requirements, notes: e.target.value } }))} className="mt-1 w-full rounded-lg border bg-white text-black placeholder-gray-600 px-3 py-2" />
      </label>
    );
  }

  const pricing = useMemo(() => {
    const base = Number(service?.price || 0);
    const total = Math.max(0, base);
    return { base, total };
  }, [service]);

  function validate() {
    if (!form.bookingDate) return 'Please select booking date';
    if (!form.timeSlot) return 'Please select time slot';
    if (!form.address) return 'Please enter address';
    if (!form.contactPhone) return 'Please enter contact phone';
    return null;
  }

  async function submit(e) {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);
    if (!service) return alert('Service not loaded');
    setSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token') || sessionStorage.getItem('accessToken');

      const [start, end] = form.timeSlot.split(' - ').map(s => s.trim());

      const payload = {
        serviceId: service._id || service.id,
        bookingDate: form.bookingDate,
        timeSlot: { start, end },
        address: form.address,
        location: { address: form.address, city: form.city, state: form.state, pincode: form.pincode },
        contactPerson: { name: form.contactName, phone: form.contactPhone, email: form.contactEmail },
        specialInstructions: form.specialInstructions,
        requirements: form.requirements,
        basePrice: pricing.base,
        totalAmount: pricing.total,
        paymentMethod: form.paymentMethod,
        paymentStatus: form.payNow ? 'pending' : 'pending', // payment integration TODO
        status: 'pending'
      };

      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Booking failed');
      }

      const json = await res.json();
      alert('Booking created successfully');
      // navigate to dashboard bookings section
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to create booking: ' + (err.message || ''));
    } finally { setSubmitting(false); }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Book Service</h1>
        {!service && <div className="p-4 bg-white rounded border">Service not found.</div>}
        {service && (
          <div className="bg-white rounded-xl border p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <img src={(service.images && service.images[0]) || service.image || '/placeholder-avatar.png'} alt={service.title} className="w-full h-48 object-cover rounded mb-3" />
                <div className="font-semibold text-lg text-black">{service.title}</div>
                <div className="text-sm text-gray-500">Provided by {service.provider?.fullName || service.provider || '—'}</div>
                <div className="text-sm mt-2 text-black">Base price: {service.price ? `₹${service.price}` : '—'}</div>
                <div className="mt-3 text-sm text-gray-700">Category: {service.category}</div>
              </div>

              <div className="md:col-span-2">
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="block"><span className="text-sm text-gray-700">Booking Date</span>
                      <input type="date" required value={form.bookingDate} onChange={e => setForm(prev => ({ ...prev, bookingDate: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white text-black placeholder-gray-600 px-3 py-2" />
                    </label>

                    <label className="block"><span className="text-sm text-gray-700">Time Slot</span>
                      <select required value={form.timeSlot} onChange={e => setForm(prev => ({ ...prev, timeSlot: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white text-black placeholder-gray-600 px-3 py-2">
                        <option value="">Select a time slot</option>
                        {timeSlots.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                      </select>
                    </label>
                  </div>

                  <div>
                    <div className="text-sm text-gray-700 mb-2">Address & Location</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input placeholder="House no, street, landmark" required value={form.address} onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))} className="rounded border bg-white text-black placeholder-gray-600 px-3 py-2 col-span-2" />
                      <input placeholder="Pincode (e.g., 560001)" value={form.pincode} onChange={e => setForm(prev => ({ ...prev, pincode: e.target.value }))} className="rounded border bg-white text-black placeholder-gray-600 px-3 py-2 w-full" />
                      <input placeholder="City (e.g., Bengaluru)" value={form.city} onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))} className="rounded border bg-white text-black placeholder-gray-600 px-3 py-2" />
                      <input placeholder="State (e.g., Karnataka)" value={form.state} onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))} className="rounded border bg-white text-black placeholder-gray-600 px-3 py-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className="block"><span className="text-sm text-gray-700">Contact Name</span>
                      <input required value={form.contactName} onChange={e => setForm(prev => ({ ...prev, contactName: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white text-black placeholder-gray-600 px-3 py-2" />
                    </label>
                    <label className="block"><span className="text-sm text-gray-700">Contact Phone</span>
                      <input required value={form.contactPhone} onChange={e => setForm(prev => ({ ...prev, contactPhone: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white text-black placeholder-gray-600 px-3 py-2" />
                    </label>
                    <label className="block"><span className="text-sm text-gray-700">Contact Email</span>
                      <input value={form.contactEmail} onChange={e => setForm(prev => ({ ...prev, contactEmail: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white text-black placeholder-gray-600 px-3 py-2" />
                    </label>
                  </div>

                  <div>
                    <div className="text-sm text-gray-700 mb-2">Service Requirements</div>
                    {renderRequirements()}
                  </div>

                  <div>
                    <label className="block"><span className="text-sm text-gray-700">Special Instructions (max 500 chars)</span>
                      <textarea maxLength={500} value={form.specialInstructions} onChange={e => setForm(prev => ({ ...prev, specialInstructions: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white text-black placeholder-gray-600 px-3 py-2 h-24" />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                    <div className="md:col-span-1">
                      <div className="text-sm text-gray-700">Payment</div>
                      <select value={form.paymentMethod} onChange={e => setForm(prev => ({ ...prev, paymentMethod: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white text-black placeholder-gray-600 px-3 py-2">
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="wallet">Wallet</option>
                      </select>
                      <div className="mt-2 text-xs text-gray-500">Pay now option not integrated — paymentStatus will be pending.</div>
                    </div>
                  </div>

                  <div className="p-3 border rounded bg-gray-50">
                    <div className="flex justify-between text-sm text-gray-600"><div>Base price</div><div>₹{pricing.base}</div></div>
                    <div className="flex justify-between text-lg font-semibold mt-2 text-black"><div>Total</div><div>₹{pricing.total}</div></div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button type="button" className="px-4 py-2 rounded border text-black" onClick={() => navigate(-1)}>Back</button>
                    <button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white" disabled={submitting}>{submitting ? 'Booking...' : 'Confirm Booking'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
