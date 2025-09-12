// src/pages/PlantExplorer.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Toast from '../components/Toast';
import { uploadPlantImage, classifyPlant, fetchPlants, updatePlant, deletePlant } from '../services/plantService';

function PlantInfoCard({ plant }) {
  if (!plant) return null;

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex gap-4">
      {plant.imageUrl && (
        <img
          src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${plant.imageUrl}`}
          alt={plant.name}
          className="w-32 h-32 object-cover rounded"
        />
      )}
      <div>
        <h3 className="text-xl font-semibold">{plant.name}</h3>
        <p className="text-gray-600 dark:text-gray-300 italic">{plant.scientificName}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div><span className="font-medium">Growth Time:</span> {plant.growthTime || '-'}</div>
          <div><span className="font-medium">Climate:</span> {plant.climate || '-'}</div>
          <div><span className="font-medium">Season:</span> {plant.season || '-'}</div>
          <div><span className="font-medium">Uses:</span> {(plant.uses || []).join(', ') || '-'}</div>
        </div>
      </div>
    </div>
  );
}

function EditableCell({ value, onChange }) {
  const [v, setV] = useState(value ?? '');
  useEffect(() => setV(value ?? ''), [value]);
  return (
    <input
      className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => onChange(v)}
    />
  );
}

export default function PlantExplorer() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [latest, setLatest] = useState(null);
  const [plants, setPlants] = useState([]);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const load = async () => {
    try {
      const data = await fetchPlants();
      setPlants(data.plants || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load plants');
    }
  };

  useEffect(() => { load(); }, []);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filteredPlants = useMemo(() => {
    if (!debounced) return plants;
    return plants.filter((p) =>
      (p.name || '').toLowerCase().includes(debounced) ||
      (p.scientificName || '').toLowerCase().includes(debounced)
    );
  }, [plants, debounced]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await uploadPlantImage(file);
      setLatest(data.plant);
      await load();
      setToast({ message: 'Plant identified and saved successfully.', type: 'success' });
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Upload failed');
      setToast({ message: 'Failed to identify/save plant.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onClassify = async () => {
    if (!file) return setError('Please choose an image first');
    setLoading(true);
    setError('');
    try {
      const data = await classifyPlant(file);
      // data.predictions is expected
      setLatest(null);
      setPredictions(data.predictions || []);
      setToast({ message: 'Classification complete.', type: 'success' });
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Classification failed');
      setToast({ message: 'Classification failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const [predictions, setPredictions] = useState([]);

  const handleUpdate = async (id, field, value) => {
    try {
      const target = plants.find((p) => p._id === id);
      const payload = { ...target, [field]: value };
      delete payload._id;
      const updated = await updatePlant(id, payload);
      setPlants((prev) => prev.map((p) => (p._id === id ? updated.plant : p)));
      if (latest && latest._id === id) setLatest(updated.plant);
      setToast({ message: 'Plant updated.', type: 'success' });
    } catch (e) {
      // silent error UI
      console.error(e);
      setToast({ message: 'Update failed.', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this plant?')) return;
    try {
      await deletePlant(id);
      setPlants((prev) => prev.filter((p) => p._id !== id));
      if (latest && latest._id === id) setLatest(null);
      setToast({ message: 'Plant deleted.', type: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ message: 'Delete failed.', type: 'error' });
    }
  };

  return (
    <div className="p-4 space-y-6">
      <Toast message={toast.message} type={toast.type} onDismiss={() => setToast({ message: '', type: 'info' })} />
      <h1 className="text-2xl font-bold">Plant Info Explorer</h1>

      {/* Upload form */}
      <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Upload plant image</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!file || loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Processing…' : 'Identify & Save'}
          </button>
          <button
            type="button"
            onClick={onClassify}
            disabled={!file || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Classifying…' : 'Classify (HF)'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {/* Classification results */}
      {predictions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-3">Predictions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {predictions.map((p, i) => (
              <div key={p.label || i} className="p-3 border rounded-md">
                <div className="flex justify-between mb-2">
                  <div className="font-medium">{p.label}</div>
                  <div className="text-sm text-gray-600">{Math.round((p.score || 0) * 100)}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                  <div style={{ width: `${Math.round((p.score || 0) * 100)}%` }} className="h-2 bg-green-500"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest identified card */}
      {latest && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Latest Identified</h2>
          <PlantInfoCard plant={latest} />
        </div>
      )}

      {/* CRUD table */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Saved Plants</h2>
        {/* Search input */}
        <div className="mb-3 max-w-sm">
          <input
            type="text"
            placeholder="Search by name or scientific name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="p-2 text-left">Image</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Scientific Name</th>
                <th className="p-2 text-left">Growth Time</th>
                <th className="p-2 text-left">Climate</th>
                <th className="p-2 text-left">Season</th>
                <th className="p-2 text-left">Uses (comma-separated)</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlants.map((p) => (
                <tr key={p._id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="p-2">
                    {p.imageUrl ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${p.imageUrl}`}
                        alt={p.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded" />
                    )}
                  </td>
                  <td className="p-2"><EditableCell value={p.name} onChange={(v) => handleUpdate(p._id, 'name', v)} /></td>
                  <td className="p-2"><EditableCell value={p.scientificName} onChange={(v) => handleUpdate(p._id, 'scientificName', v)} /></td>
                  <td className="p-2"><EditableCell value={p.growthTime} onChange={(v) => handleUpdate(p._id, 'growthTime', v)} /></td>
                  <td className="p-2"><EditableCell value={p.climate} onChange={(v) => handleUpdate(p._id, 'climate', v)} /></td>
                  <td className="p-2"><EditableCell value={p.season} onChange={(v) => handleUpdate(p._id, 'season', v)} /></td>
                  <td className="p-2">
                    <EditableCell
                      value={(p.uses || []).join(', ')}
                      onChange={(v) => handleUpdate(p._id, 'uses', v.split(',').map((s) => s.trim()).filter(Boolean))}
                    />
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}