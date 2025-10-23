import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';

export default function OwnerWarehouses(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();
  const [searchParams, setSearchParams] = useSearchParams();
  const showNewForm = useMemo(() => searchParams.get('new') === '1', [searchParams.toString()]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    capacityTotal: '',
    capacityUnit: 'tons',
    type: 'cold-storage',
    pricePerDay: '',
    amenities: ''
  });
  const [photos, setPhotos] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isNumber = (v) => v !== '' && !Number.isNaN(Number(v));
  const isEmpty = (v) => v == null || String(v).trim() === '';
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const validate = (values) => {
    const errors = {};
    if (isEmpty(values.name)) errors.name = 'Name is required';
    if (isEmpty(values.description) || String(values.description).trim().length < 10) errors.description = 'Description must be at least 10 characters';
    if (isEmpty(values.address)) errors.address = 'Address is required';
    if (isEmpty(values.city)) errors.city = 'City is required';
    if (isEmpty(values.state)) errors.state = 'State is required';
    if (!/^\d{6}$/.test(String(values.pincode))) errors.pincode = 'Enter a valid 6-digit pincode';
    if (!isEmpty(values.latitude)) {
      if (!isNumber(values.latitude)) errors.latitude = 'Latitude must be a number';
      else if (Number(values.latitude) < -90 || Number(values.latitude) > 90) errors.latitude = 'Latitude must be between -90 and 90';
    }
    if (!isEmpty(values.longitude)) {
      if (!isNumber(values.longitude)) errors.longitude = 'Longitude must be a number';
      else if (Number(values.longitude) < -180 || Number(values.longitude) > 180) errors.longitude = 'Longitude must be between -180 and 180';
    }
    if (!isNumber(values.capacityTotal) || Number(values.capacityTotal) <= 0) errors.capacityTotal = 'Capacity must be greater than 0';
    if (isEmpty(values.capacityUnit)) errors.capacityUnit = 'Unit is required';
    if (isEmpty(values.type)) errors.type = 'Storage type is required';
    if (!isNumber(values.pricePerDay) || Number(values.pricePerDay) <= 0) errors.pricePerDay = 'Price per day must be a valid number greater than 0';
    if (photos.length === 0) errors.photos = 'At least one photo is required';
    return errors;
  };

  const formIsValid = useMemo(() => Object.keys(validate(form)).length === 0 && photos.length > 0, [form, photos]);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setPhotos(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setPhotoPreview(previews);
    }
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreview.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreview(newPreviews);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/owner/warehouses');
      setItems(res.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      {showNewForm && (
        <div className="rounded-xl border bg-white p-4">
          <div className="text-lg font-medium mb-3">Add New Warehouse</div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Name" required value={form.name} error={touched.name && formErrors.name} onBlur={() => setTouched({ ...touched, name: true })} onChange={e => {
              const next = { ...form, name: e.target.value };
              setForm(next);
              setFormErrors(validate(next));
            }} />
            <Input label="Price Per Day (₹)" type="number" min="1" step="0.01" required value={form.pricePerDay} error={touched.pricePerDay && formErrors.pricePerDay} onBlur={() => setTouched({ ...touched, pricePerDay: true })} onChange={e => {
              const next = { ...form, pricePerDay: e.target.value };
              setForm(next);
              setFormErrors(validate(next));
            }} />
            <Textarea label="Description" required minLength={10} value={form.description} error={touched.description && formErrors.description} onBlur={() => setTouched({ ...touched, description: true })} onChange={e => {
              const next = { ...form, description: e.target.value };
              setForm(next);
              setFormErrors(validate(next));
            }} />
            <Input label="Address" required value={form.address} error={touched.address && formErrors.address} onBlur={() => setTouched({ ...touched, address: true })} onChange={e => {
              const next = { ...form, address: e.target.value };
              setForm(next);
              setFormErrors(validate(next));
            }} />
            <Input label="City" required value={form.city} error={touched.city && formErrors.city} onBlur={() => setTouched({ ...touched, city: true })} onChange={e => {
              const next = { ...form, city: e.target.value };
              setForm(next);
              setFormErrors(validate(next));
            }} />
            <Input label="State" required value={form.state} error={touched.state && formErrors.state} onBlur={() => setTouched({ ...touched, state: true })} onChange={e => {
              const next = { ...form, state: e.target.value };
              setForm(next);
              setFormErrors(validate(next));
            }} />
            <Input label="Pincode" inputMode="numeric" pattern="^[0-9]{6}$" maxLength={6} required value={form.pincode} error={touched.pincode && formErrors.pincode} onBlur={() => setTouched({ ...touched, pincode: true })} onChange={e => {
              const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
              const next = { ...form, pincode: v };
              setForm(next);
              setFormErrors(validate(next));
            }} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Latitude (optional)" type="number" step="0.000001" min={-90} max={90} value={form.latitude} error={touched.latitude && formErrors.latitude} onBlur={() => setTouched({ ...touched, latitude: true })} onChange={e => {
                const val = e.target.value;
                const next = { ...form, latitude: val === '' ? '' : clamp(Number(val), -90, 90) };
                setForm(next);
                setFormErrors(validate(next));
              }} />
              <Input label="Longitude (optional)" type="number" step="0.000001" min={-180} max={180} value={form.longitude} error={touched.longitude && formErrors.longitude} onBlur={() => setTouched({ ...touched, longitude: true })} onChange={e => {
                const val = e.target.value;
                const next = { ...form, longitude: val === '' ? '' : clamp(Number(val), -180, 180) };
                setForm(next);
                setFormErrors(validate(next));
              }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Capacity Total" type="number" min="1" step="0.01" required value={form.capacityTotal} error={touched.capacityTotal && formErrors.capacityTotal} onBlur={() => setTouched({ ...touched, capacityTotal: true })} onChange={e => {
                const next = { ...form, capacityTotal: e.target.value };
                setForm(next);
                setFormErrors(validate(next));
              }} />
              <Select label="Unit" required value={form.capacityUnit} error={touched.capacityUnit && formErrors.capacityUnit} onBlur={() => setTouched({ ...touched, capacityUnit: true })} onChange={e => {
                const next = { ...form, capacityUnit: e.target.value };
                setForm(next);
                setFormErrors(validate(next));
              }} options={[{v:'kg',l:'kg'},{v:'tons',l:'tons'},{v:'quintals',l:'quintals'},{v:'bags',l:'bags'}]} />
            </div>
            <Select label="Type" required value={form.type} error={touched.type && formErrors.type} onBlur={() => setTouched({ ...touched, type: true })} onChange={e => {
              const next = { ...form, type: e.target.value };
              setForm(next);
              setFormErrors(validate(next));
            }} options={[{v:'cold-storage',l:'Cold Storage'},{v:'dry-storage',l:'Dry Storage'},{v:'container',l:'Container'}]} />
            <Input label="Amenities (comma separated)" placeholder="security, cctv, fire_safety" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} />
            <div className="md:col-span-2">
              <label className="block">
                <div className="text-sm text-slate-600 mb-1">Photos (required)</div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full border rounded px-3 py-2"
                />
                {touched.photos && formErrors.photos && <div className="text-xs text-red-600 mt-1">{formErrors.photos}</div>}
              </label>
              {photoPreview.length > 0 && (
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {photoPreview.map((preview, index) => (
                    <div key={index} className="relative">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded border" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
              disabled={saving || !formIsValid}
              onClick={async () => {
                setSaving(true);
                try {
                  const errs = validate(form);
                  setFormErrors(errs);
                  if (Object.keys(errs).length > 0) {
                    setSaving(false);
                    return;
                  }

                  const formData = new FormData();
                  
                  // Add warehouse data as JSON string
                  const warehouseData = {
                    name: form.name,
                    description: form.description,
                    address: {
                      address: form.address,
                      city: form.city,
                      state: form.state,
                      pincode: form.pincode,
                      coordinates: (form.latitude && form.longitude)
                        ? { latitude: Number(form.latitude), longitude: Number(form.longitude) }
                        : undefined
                    },
                    capacity: { total: Number(form.capacityTotal), unit: form.capacityUnit },
                    storageTypes: [form.type],
                    pricePerDay: Number(form.pricePerDay),
                    facilities: form.amenities.split(',').map(a => a.trim()).filter(Boolean)
                  };
                  
                  formData.append('warehouseData', JSON.stringify(warehouseData));
                  
                  // Add photos
                  photos.forEach((photo, index) => {
                    formData.append('photos', photo);
                  });

                  await apiClient.post('/owner/warehouses', formData, {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                    },
                  });
                  
                  await load();
                  // close form
                  setSearchParams(params => { params.delete('new'); return params; });
                  setForm({ name: '', description: '', address: '', city: '', state: '', pincode: '', latitude: '', longitude: '', capacityTotal: '', capacityUnit: 'tons', type: 'cold-storage', pricePerDay: '', amenities: '' });
                  setPhotos([]);
                  setPhotoPreview([]);
                  setFormErrors({});
                  setTouched({});
                } catch (e) {
                  console.error('Warehouse creation error:', e);
                  console.error('Error response:', e?.response?.data);
                  alert(e?.response?.data?.message || e?.response?.data?.error || 'Failed to create warehouse');
                } finally {
                  setSaving(false);
                }
              }}
            >Save</button>
            <button
              className="px-3 py-2 rounded border"
              onClick={() => setSearchParams(params => { params.delete('new'); return params; })}
            >Cancel</button>
          </div>
        </div>
      )}
      {items.map(w => (
        <div key={w._id} className="rounded-xl border bg-white p-4">
          <div className="flex gap-4">
            {w.images && w.images.length > 0 && (
              <div className="w-24 h-24 flex-shrink-0">
                <img 
                  src={w.images[0].url} 
                  alt={w.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{w.name}</div>
                  <div className="text-sm text-slate-600">{w.location?.address}, {w.location?.city}, {w.location?.state} {w.location?.pincode}</div>
                  <div className="text-sm">Capacity: {w.capacity?.total} {w.capacity?.unit}</div>
                  <div className="text-sm">Price: ₹{w.pricing?.basePrice} ({w.pricing?.pricePerUnit?.replaceAll('_',' ')})</div>
                  <div className="text-sm text-slate-500 mt-1">{w.description}</div>
                </div>
                <div className="text-right">
                  <span className={`inline-block text-xs px-2 py-1 rounded-full mr-2 ${w.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{w.status}</span>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full ${w.verification?.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : w.verification?.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>{w.verification?.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && <div>No warehouses yet.</div>}
    </div>
  );
}

function Input({ label, ...props }){
  return (
    <label className="block">
      <div className="text-sm text-slate-600 mb-1">{label}</div>
      <input aria-invalid={!!props.error} className={`w-full border rounded px-3 py-2 ${props.error ? 'border-red-400' : ''}`} {...props} />
      {props.error && <div className="text-xs text-red-600 mt-1">{props.error}</div>}
    </label>
  );
}

function Select({ label, options = [], ...props }){
  return (
    <label className="block">
      <div className="text-sm text-slate-600 mb-1">{label}</div>
      <select aria-invalid={!!props.error} className={`w-full border rounded px-3 py-2 ${props.error ? 'border-red-400' : ''}`} {...props}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      {props.error && <div className="text-xs text-red-600 mt-1">{props.error}</div>}
    </label>
  );
}

function Textarea({ label, ...props }){
  return (
    <label className="block">
      <div className="text-sm text-slate-600 mb-1">{label}</div>
      <textarea rows={3} aria-invalid={!!props.error} className={`w-full border rounded px-3 py-2 ${props.error ? 'border-red-400' : ''}`} {...props} />
      {props.error && <div className="text-xs text-red-600 mt-1">{props.error}</div>}
    </label>
  );
}


