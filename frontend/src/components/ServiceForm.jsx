import React, { useEffect, useState } from 'react';

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

export default function ServiceForm({ preset, onSave, hideActions = false, onRegisterSubmit }) {
  const initFromPreset = (p) => {
    const base = p || { category: 'home_setup' };
    return {
      ...base,
      priceStr: base.price != null ? String(base.price) : '',
      minQtyStr: base.minQty != null ? String(base.minQty) : '',
      durationHoursStr: base.durationHours != null ? String(base.durationHours) : '',
      participantsStr: base.participants != null ? String(base.participants) : '',
      monthlyPriceStr: base.monthlyPrice != null ? String(base.monthlyPrice) : '',
      stockStr: base.stock != null ? String(base.stock) : '',
      images: Array.isArray(base.images) ? base.images : (base.imagesText ? (base.imagesText || '').split(',').map(s => s.trim()).filter(Boolean) : []),
    };
  };

  const [form, setForm] = useState(() => initFromPreset(preset));
  const [formError, setFormError] = useState('');
  const [imagesFiles, setImagesFiles] = useState([]);
  const [imagesPreviews, setImagesPreviews] = useState(() => (Array.isArray(initFromPreset(preset).images) ? initFromPreset(preset).images : []));

  useEffect(() => {
    const init = initFromPreset(preset);
    setForm(init);
    setImagesPreviews(Array.isArray(init.images) ? init.images : []);
  }, [preset?._id]);

  const cat = form.category;

  function Field({ children }) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>; }

  const common = (
    <>
      <Field>
        <Input label="Title" required value={form.title || ''} onChange={e => { setForm(prev => ({ ...prev, title: e.target.value })); }} />
        <Input label="Price" required type="text" value={form.priceStr || ''} onChange={e => { setForm(prev => ({ ...prev, priceStr: e.target.value })); }} />
        <TextArea label="Description" required value={form.description || ''} onChange={e => { setForm(prev => ({ ...prev, description: e.target.value })); }} />
        <div>
          <label className="block text-sm text-gray-700">Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="mt-2"
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              if (files.length === 0) return;
              // update files state
              setImagesFiles(prev => [...prev, ...files]);
              // generate previews
              const readers = files.map(f => new Promise((res, rej) => {
                const r = new FileReader();
                r.onload = () => res(r.result);
                r.onerror = rej;
                r.readAsDataURL(f);
              }));
              try {
                const results = await Promise.all(readers);
                setImagesPreviews(prev => [...prev, ...results]);
              } catch (err) {
                console.error('Failed to read images', err);
              }
            }}
          />

          {imagesPreviews && imagesPreviews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {imagesPreviews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt={`img-${i}`} className="w-20 h-20 object-cover rounded-lg border" />
                  <button type="button" className="absolute -top-2 -right-2 bg-white border rounded-full text-xs p-0.5" onClick={() => {
                    setImagesPreviews(prev => prev.filter((_, idx) => idx !== i));
                    setImagesFiles(prev => prev.filter((_, idx) => idx !== i));
                  }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Field>
      <Field>
        <Input label="Address (optional)" value={form.address || ''} onChange={e => { setForm(prev => ({ ...prev, address: e.target.value })); }} />
        <Input label="City" required value={form.city || ''} onChange={e => { setForm(prev => ({ ...prev, city: e.target.value })); }} />
        <Input label="State" required value={form.state || ''} onChange={e => { setForm(prev => ({ ...prev, state: e.target.value })); }} />
        <Input label="Pincode" required value={form.pincode || ''} onChange={e => { setForm(prev => ({ ...prev, pincode: e.target.value })); }} />
      </Field>
      <Field>
        <Select label="Availability" value={form.availability || 'anytime'} onChange={e => { setForm(prev => ({ ...prev, availability: e.target.value })); }}>
          <option value="anytime">Anytime</option>
          <option value="mon-fri">Weekdays (Mon-Fri)</option>
          <option value="weekends">Weekends</option>
          <option value="custom">Custom</option>
        </Select>
        <Input label="Availability details (optional, e.g., Mon-Fri 9-5)" value={form.availabilityNote || ''} onChange={e => { setForm(prev => ({ ...prev, availabilityNote: e.target.value })); }} />
        <Input label="Tags (comma separated)" value={form.tags || ''} onChange={e => { setForm(prev => ({ ...prev, tags: e.target.value })); }} />
      </Field>
    </>
  );

  const handleSave = () => {
    const title = (form.title || '').trim();
    const description = (form.description || '').trim();
    const category = (form.category || 'home_setup').trim();
    const city = (form.city || '').trim();
    const state = (form.state || '').trim();
    const pincode = (form.pincode || '').trim();
    const priceNum = Number(form.priceStr);

    if (!title || !description || !category || !city || !state || !pincode || Number.isNaN(priceNum)) {
      setFormError('Please fill Title, Description, Category, a valid Price, City, State and Pincode.');
      return;
    }

    setFormError('');
    const payload = {
    ...form,
      price: priceNum,
      minQty: form.minQtyStr !== '' ? Number(form.minQtyStr) : undefined,
      durationHours: form.durationHoursStr !== '' ? Number(form.durationHoursStr) : undefined,
      participants: form.participantsStr !== '' ? Number(form.participantsStr) : undefined,
      monthlyPrice: form.monthlyPriceStr !== '' ? Number(form.monthlyPriceStr) : undefined,
      stock: form.stockStr !== '' ? Number(form.stockStr) : undefined,
      images: imagesPreviews && imagesPreviews.length ? imagesPreviews : (Array.isArray(form.images) ? form.images : []),
      address: form.address || '',
      city,
      state,
      pincode,
      availability: (form.availability && String(form.availability).trim()) ? String(form.availability).trim() : 'anytime',
      tags: (form.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    };
    delete payload.priceStr;
    delete payload.minQtyStr;
    delete payload.durationHoursStr;
    delete payload.participantsStr;
    delete payload.monthlyPriceStr;
    delete payload.stockStr;
    onSave && onSave(payload);
  };

  // expose submit to parent if requested
  useEffect(() => {
    if (typeof onRegisterSubmit === 'function') {
      try { onRegisterSubmit(handleSave); } catch {};
    }
    // unregister on unmount
    return () => {
      try { onRegisterSubmit && onRegisterSubmit(null); } catch {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterSubmit]);

  return (
    <div className="space-y-3">
      {formError && <div className="p-2 rounded bg-red-50 text-red-700 text-sm border border-red-200">{formError}</div>}
      <Select label="Service Category" value={cat} onChange={e => { setForm(prev => ({ ...prev, category: e.target.value })); }}>
        <option value="home_setup">Home Compost Setup</option>
        <option value="kitchen_compost">Kitchen Waste Composting</option>
        <option value="garden_compost">Garden Composting</option>
        <option value="community_compost">Community/Society Compost Mgmt</option>
        <option value="workshop">Workshops / Training</option>
        <option value="sell_compost">Sell Compost</option>
      </Select>

      {cat === 'home_setup' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label="Setup type" value={form.setupType || ''} onChange={e => { setForm(prev => ({ ...prev, setupType: e.target.value })); }}>
              <option value="kitchen">Kitchen</option>
              <option value="balcony">Balcony</option>
              <option value="garden">Garden</option>
              <option value="vermicompost">Vermicompost</option>
            </Select>
            <Input label="Capacity" value={form.capacity || ''} onChange={e => { setForm(prev => ({ ...prev, capacity: e.target.value })); }} />
            <Input label="Materials included" value={form.materials || ''} onChange={e => { setForm(prev => ({ ...prev, materials: e.target.value })); }} />
            <Input label="Duration" value={form.duration || ''} onChange={e => { setForm(prev => ({ ...prev, duration: e.target.value })); }} />
          </div>
          {common}
        </div>
      )}

      {cat === 'kitchen_compost' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label="Composting type" value={form.compostType || ''} onChange={e => { setForm(prev => ({ ...prev, compostType: e.target.value })); }}>
              <option value="on_site">On-site</option>
              <option value="off_site">Off-site</option>
            </Select>
            <Input label="Waste types accepted" value={form.wasteTypes || ''} onChange={e => { setForm(prev => ({ ...prev, wasteTypes: e.target.value })); }} />
            <Input label="Frequency" value={form.frequency || ''} onChange={e => { setForm(prev => ({ ...prev, frequency: e.target.value })); }} />
            <Input label="Min quantity (kg)" type="text" value={form.minQtyStr || ''} onChange={e => { setForm(prev => ({ ...prev, minQtyStr: e.target.value })); }} />
            <Select label="Pricing model" value={form.pricingModel || ''} onChange={e => { setForm(prev => ({ ...prev, pricingModel: e.target.value })); }}>
              <option value="per_kg">Per kg</option>
              <option value="subscription">Subscription</option>
            </Select>
          </div>
          {common}
        </div>
      )}

      {cat === 'garden_compost' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Garden size" value={form.gardenSize || ''} onChange={e => { setForm(prev => ({ ...prev, gardenSize: e.target.value })); }} />
            <Input label="Waste type" value={form.gardenWasteType || ''} onChange={e => { setForm(prev => ({ ...prev, gardenWasteType: e.target.value })); }} />
            <Input label="Compost pit setup" value={form.pitSetup || ''} onChange={e => { setForm(prev => ({ ...prev, pitSetup: e.target.value })); }} />
            <Input label="Organic manure preparation" value={form.manurePrep || ''} onChange={e => { setForm(prev => ({ ...prev, manurePrep: e.target.value })); }} />
          </div>
          {common}
        </div>
      )}

      {cat === 'community_compost' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Society size (flats)" type="text" value={form.societySize || ''} onChange={e => { setForm(prev => ({ ...prev, societySize: e.target.value })); }} />
            <Input label="Daily waste quantity (kg)" type="text" value={form.dailyWaste || ''} onChange={e => { setForm(prev => ({ ...prev, dailyWaste: e.target.value })); }} />
            <Select label="Staff provided" value={form.staffProvided || 'no'} onChange={e => { setForm(prev => ({ ...prev, staffProvided: e.target.value })); }}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
            <Input label="Monitoring frequency" value={form.monitoring || ''} onChange={e => { setForm(prev => ({ ...prev, monitoring: e.target.value })); }} />
            <Input label="Monthly pricing" type="text" value={form.monthlyPriceStr || ''} onChange={e => { setForm(prev => ({ ...prev, monthlyPriceStr: e.target.value })); }} />
          </div>
          {common}
        </div>
      )}

      {cat === 'workshop' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label="Mode" value={form.mode || ''} onChange={e => { setForm(prev => ({ ...prev, mode: e.target.value })); }}>
              <option value="offline">Offline</option>
              <option value="online">Online</option>
            </Select>
            <Input label="Duration (hours)" type="text" value={form.durationHoursStr || ''} onChange={e => { setForm(prev => ({ ...prev, durationHoursStr: e.target.value })); }} />
            <Input label="Participants limit" type="text" value={form.participantsStr || ''} onChange={e => { setForm(prev => ({ ...prev, participantsStr: e.target.value })); }} />
            <Select label="Certification provided" value={form.certProvided || 'no'} onChange={e => { setForm(prev => ({ ...prev, certProvided: e.target.value })); }}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
            <Input label="Materials provided" value={form.materials || ''} onChange={e => { setForm(prev => ({ ...prev, materials: e.target.value })); }} />
            <Input label="Workshop date & time" type="datetime-local" value={form.datetime || ''} onChange={e => { setForm(prev => ({ ...prev, datetime: e.target.value })); }} />
          </div>
          {common}
        </div>
      )}

      {cat === 'sell_compost' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label="Product type" value={form.productType || ''} onChange={e => { setForm(prev => ({ ...prev, productType: e.target.value })); }}>
              <option value="vermicompost">Vermicompost</option>
              <option value="manure">Manure</option>
            </Select>
            <Select label="Weight" value={form.weight || ''} onChange={e => { setForm(prev => ({ ...prev, weight: e.target.value })); }}>
              <option value="1kg">1kg</option>
              <option value="5kg">5kg</option>
              <option value="10kg">10kg</option>
            </Select>
            <Input label="Packaging" value={form.packaging || ''} onChange={e => { setForm(prev => ({ ...prev, packaging: e.target.value })); }} />
            <Input label="Price" type="text" value={form.priceStr || ''} onChange={e => { setForm(prev => ({ ...prev, priceStr: e.target.value })); }} />
            <Input label="Stock availability" type="text" value={form.stockStr || ''} onChange={e => { setForm(prev => ({ ...prev, stockStr: e.target.value })); }} />
          </div>
          {common}
        </div>
      )}

      {!hideActions && (
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-4 py-2 rounded-lg border" type="button" onClick={() => onSave && onSave(null)}>Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white" onClick={handleSave}>Save</button>
        </div>
      )}
    </div>
  );
}

// register submit callback for parent
// call onRegisterSubmit(handleSave) if provided
// (do this after component mounts)
export function registerSubmitHook(instance) {
  // noop placeholder for potential external usage
}
