// src/pages/PlantExplorer.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Toast from '../components/Toast';
import { uploadPlantImage, classifyPlant, fetchPlants, updatePlant, deletePlant, createPlant, fetchPlantDetailsByName } from '../services/plantService';

// Enhanced Plant Info Card Component
function PlantInfoCard({ plant, onEdit }) {
  if (!plant) return null;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {plant.imageUrl && (
          <div className="flex-shrink-0">
            <img
              src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${plant.imageUrl}`}
              alt={plant.name}
              className="w-48 h-48 object-cover rounded-lg shadow-md"
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plant.name}</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 italic">{plant.scientificName}</p>
            </div>
            {onEdit && (
              <button
                onClick={() => onEdit(plant)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Growth Time:</span>
              <p className="text-gray-600 dark:text-gray-400">{plant.growthTime || 'Not specified'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Climate:</span>
              <p className="text-gray-600 dark:text-gray-400">{plant.climate || 'Not specified'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Season:</span>
              <p className="text-gray-600 dark:text-gray-400">{plant.season || 'Not specified'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Uses:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {(plant.uses || []).length > 0 ? plant.uses.join(', ') : 'Not specified'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Enhanced Editable Cell Component
function EditableCell({ value, onChange, placeholder = "Click to edit" }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? '');

  useEffect(() => {
    setEditValue(value ?? '');
  }, [value]);

  const handleSave = useCallback(() => {
    onChange(editValue);
    setIsEditing(false);
  }, [editValue, onChange]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value ?? '');
      setIsEditing(false);
    }
  }, [handleSave, value]);

  if (isEditing) {
    return (
      <input
        className="w-full bg-white dark:bg-gray-700 border border-blue-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyPress}
        autoFocus
      />
    );
  }

  return (
    <div
      className="w-full px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded min-h-[32px] flex items-center"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </div>
  );
}

// Enhanced Error Display Component
function ErrorDisplay({ error, suggestions = [] }) {
  if (!error) return null;

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Plant Identification Failed
          </h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            <p>{error}</p>
          </div>
          {suggestions.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Suggestions:</h4>
              <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading Spinner Component
function LoadingSpinner({ message = "Processing..." }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="text-gray-600 dark:text-gray-400">{message}</span>
      </div>
    </div>
  );
}

// Main Plant Explorer Component
export default function PlantExplorer() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorSuggestions, setErrorSuggestions] = useState([]);
  const [latest, setLatest] = useState(null);
  const [plants, setPlants] = useState([]);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [predictions, setPredictions] = useState([]);
  const [editingPlant, setEditingPlant] = useState(null);

  // Load plants from API
  const load = useCallback(async () => {
    try {
      const data = await fetchPlants();
      setPlants(data.plants || []);
      setError('');
    } catch (err) {
      console.error('Failed to load plants:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load plants';
      setError(errorMessage);
      setToast({ message: 'Failed to load saved plants', type: 'error' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Enrich plants that have a name but missing details
  useEffect(() => {
    const toEnrich = (plants || []).filter((p) => 
      !!p?.name && 
      p.name !== 'Unknown Plant' && 
      (!p.scientificName || !p.climate || !p.season || !Array.isArray(p.uses) || p.uses.length === 0)
    );
    
    if (toEnrich.length === 0) return;
    
    let cancelled = false;
    (async () => {
      for (const p of toEnrich) {
        if (cancelled) break;
        
        try {
          const resp = await fetchPlantDetailsByName(p.name);
          const details = resp?.details;
          
          if (details && !cancelled) {
            const payload = {
              name: details.name || p.name,
              scientificName: details.scientificName ?? p.scientificName ?? null,
              growthTime: details.growthTime ?? p.growthTime ?? null,
              climate: details.climate ?? p.climate ?? null,
              season: details.season ?? p.season ?? null,
              uses: Array.isArray(details.uses) ? details.uses : (p.uses || []),
            };
            
            const updated = await updatePlant(p._id, payload);
            setPlants((prev) => prev.map((x) => (x._id === p._id ? updated.plant : x)));
            if (latest && latest._id === p._id) setLatest(updated.plant);
          }
        } catch (e) {
          console.warn('Failed to enrich plant:', p.name, e.message);
        }
      }
    })();
    
    return () => { cancelled = true; };
  }, [plants, latest]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter plants based on search
  const filteredPlants = useMemo(() => {
    if (!debounced) return plants;
    return plants.filter((p) =>
      (p.name || '').toLowerCase().includes(debounced) ||
      (p.scientificName || '').toLowerCase().includes(debounced)
    );
  }, [plants, debounced]);

  // Handle plant image upload and identification
  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image file first');
      setToast({ message: 'Please select an image file first', type: 'error' });
      return;
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)');
      setToast({ message: 'Please select a valid image file (JPEG, PNG, or WebP)', type: 'error' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image file is too large. Please select an image smaller than 10MB.');
      setToast({ message: 'Image file is too large. Please select an image smaller than 10MB.', type: 'error' });
      return;
    }

    setLoading(true);
    setError('');
    setErrorSuggestions([]);
    setLatest(null);
    setPredictions([]);

    try {
      const data = await uploadPlantImage(file);
      let plant = data.plant;

      // Validate that we got a valid plant response
      if (!plant || !plant.name || plant.name.trim() === '' || plant.name.toLowerCase().includes('unknown')) {
        throw new Error('Plant identification returned invalid results');
      }

      // Try enrichment if name is known but fields are missing
      if (plant?.name && plant.name !== 'Unknown Plant' && 
          (!plant.scientificName || !plant.climate || !plant.season || !Array.isArray(plant.uses) || plant.uses.length === 0)) {
        try {
          const resp = await fetchPlantDetailsByName(plant.name);
          const details = resp?.details;
          if (details) {
            const payload = {
              name: details.name || plant.name,
              scientificName: details.scientificName ?? plant.scientificName ?? null,
              growthTime: details.growthTime ?? plant.growthTime ?? null,
              climate: details.climate ?? plant.climate ?? null,
              season: details.season ?? plant.season ?? null,
              uses: Array.isArray(details.uses) ? details.uses : (plant.uses || []),
            };
            const updated = await updatePlant(plant._id, payload);
            plant = updated.plant;
          }
        } catch (e) {
          console.warn('Failed to enrich plant details:', e.message);
        }
      }

      setLatest(plant);
      await load();
      
      const successMessage = data.message || `Plant "${plant.name}" identified and saved successfully!`;
      setToast({ message: successMessage, type: 'success' });
      
    } catch (e) {
      console.error('Plant identification error:', e);
      
      const errorData = e?.response?.data;
      const errorMessage = errorData?.message || e.message || 'Plant identification failed';
      
      setError(errorMessage);
      setErrorSuggestions(errorData?.suggestions || [
        'Try uploading a clearer image of the plant',
        'Ensure the plant is clearly visible in the image',
        'Try different angles or lighting',
        'Enter plant details manually if available'
      ]);
      
      let userMessage = 'Failed to identify plant.';
      if (errorMessage.includes('not properly configured')) {
        userMessage = 'Plant identification service is not configured. Please contact support.';
      } else if (errorMessage.includes('access denied')) {
        userMessage = 'Plant identification service access denied. Please contact support.';
      } else if (errorMessage.includes('temporarily unavailable')) {
        userMessage = 'Plant identification service is temporarily unavailable. Please try again later.';
      } else if (errorMessage.includes('timed out')) {
        userMessage = 'Request timed out. The image might be too large. Please try with a smaller image.';
      } else if (errorMessage.includes('could not identify')) {
        userMessage = 'Could not identify the plant from the image. Please try a clearer image or enter details manually.';
      } else if (e?.response?.status === 422) {
        userMessage = errorMessage;
      } else if (e?.response?.status === 400) {
        userMessage = 'Invalid image format or file. Please try a different image.';
      } else if (e?.response?.status === 413) {
        userMessage = 'Image file is too large. Please select a smaller image.';
      }
      
      setToast({ message: userMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [file, load]);

  // Handle plant classification (Hugging Face)
  const onClassify = useCallback(async () => {
    if (!file) {
      setError('Please select an image file first');
      setToast({ message: 'Please select an image file first', type: 'error' });
      return;
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)');
      setToast({ message: 'Please select a valid image file (JPEG, PNG, or WebP)', type: 'error' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image file is too large. Please select an image smaller than 10MB.');
      setToast({ message: 'Image file is too large. Please select an image smaller than 10MB.', type: 'error' });
      return;
    }

    setLoading(true);
    setError('');
    setErrorSuggestions([]);
    setLatest(null);
    setPredictions([]);

    try {
      const data = await classifyPlant(file);
      setPredictions(data.predictions || []);
      setToast({ message: 'Classification completed successfully!', type: 'success' });
    } catch (e) {
      console.error('Plant classification error:', e);
      const errorMessage = e?.response?.data?.message || e.message || 'Classification failed';
      setError(errorMessage);
      setErrorSuggestions([
        'Try uploading a clearer image',
        'Ensure the image contains a plant',
        'Check your internet connection'
      ]);
      
      let userMessage = 'Classification failed.';
      if (errorMessage.includes('404')) {
        userMessage = 'Classification service is temporarily unavailable.';
      } else if (errorMessage.includes('400')) {
        userMessage = 'Invalid image format for classification.';
      } else if (errorMessage.includes('403')) {
        userMessage = 'Classification service access denied. Please contact support.';
      } else if (errorMessage.includes('429')) {
        userMessage = 'Classification service is temporarily unavailable due to high usage.';
      }
      
      setToast({ message: userMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [file]);

  // Handle plant updates
  const handleUpdate = useCallback(async (id, field, value) => {
    try {
      const target = plants.find((p) => p._id === id);
      if (!target) return;

      const payload = { ...target, [field]: value };
      delete payload._id;
      
      const updated = await updatePlant(id, payload);
      setPlants((prev) => prev.map((p) => (p._id === id ? updated.plant : p)));
      
      if (latest && latest._id === id) setLatest(updated.plant);
      if (editingPlant && editingPlant._id === id) setEditingPlant(updated.plant);
      
      setToast({ message: 'Plant updated successfully!', type: 'success' });
    } catch (e) {
      console.error('Update failed:', e);
      setToast({ message: 'Failed to update plant', type: 'error' });
    }
  }, [plants, latest, editingPlant]);

  // Handle plant deletion
  const handleDelete = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this plant?')) return;
    
    try {
      await deletePlant(id);
      setPlants((prev) => prev.filter((p) => p._id !== id));
      if (latest && latest._id === id) setLatest(null);
      if (editingPlant && editingPlant._id === id) setEditingPlant(null);
      setToast({ message: 'Plant deleted successfully!', type: 'success' });
    } catch (e) {
      console.error('Delete failed:', e);
      setToast({ message: 'Failed to delete plant', type: 'error' });
    }
  }, [latest, editingPlant]);

  // Handle saving prediction as plant
  const handleSavePrediction = useCallback(async (label) => {
    try {
      const created = await createPlant({ name: label });
      let newPlant = created.plant;
      
      // Try to enrich with details
      try {
        const resp = await fetchPlantDetailsByName(label);
        const details = resp?.details;
        if (details) {
          const payload = {
            name: details.name || label,
            scientificName: details.scientificName ?? null,
            growthTime: details.growthTime ?? null,
            climate: details.climate ?? null,
            season: details.season ?? null,
            uses: Array.isArray(details.uses) ? details.uses : [],
          };
          const updated = await updatePlant(newPlant._id, payload);
          newPlant = updated.plant;
        }
      } catch (e) {
        console.warn('Failed to enrich prediction:', e.message);
      }
      
      setPlants((prev) => [newPlant, ...prev]);
      setToast({ message: `Plant "${label}" saved successfully!`, type: 'success' });
    } catch (e) {
      console.error('Save failed:', e);
      setToast({ message: 'Failed to save plant', type: 'error' });
    }
  }, []);

  // Handle file selection
  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select a valid image file');
        setToast({ message: 'Please select a valid image file', type: 'error' });
        return;
      }
      
      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Image file is too large. Please select an image smaller than 10MB');
        setToast({ message: 'Image file is too large. Please select an image smaller than 10MB', type: 'error' });
        return;
      }
      
      setFile(selectedFile);
      setError('');
      setErrorSuggestions([]);
      setLatest(null);
      setPredictions([]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onDismiss={() => setToast({ message: '', type: 'info' })} 
        />
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Plant Info Explorer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Upload plant images to identify and learn about different plant species
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Upload Plant Image
          </h2>
          
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Plant Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900/20 dark:file:text-green-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Supported formats: JPG, PNG, WebP, GIF. Maximum size: 10MB
              </p>
            </div>

            {file && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!file || loading}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Identify & Save Plant
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={onClassify}
                disabled={!file || loading}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Classifying...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Classify (HF)
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error
                  </h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                  {errorSuggestions && errorSuggestions.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                        Suggestions:
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                        {errorSuggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <LoadingSpinner message="Processing your plant image..." />
          </div>
        )}

        {/* Classification Results */}
        {predictions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Classification Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predictions.map((p, i) => (
                <div key={p.label || i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-2">
                      {p.label}
                    </h3>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                      {Math.round((p.score || 0) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-3">
                    <div
                      style={{ width: `${Math.round((p.score || 0) * 100)}%` }}
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    ></div>
                  </div>
                  <button
                    onClick={() => handleSavePrediction(p.label)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Save as Plant
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest Identified Plant */}
        {latest && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Latest Identified Plant
            </h2>
            <PlantInfoCard plant={latest} onEdit={setEditingPlant} />
          </div>
        )}

        {/* Saved Plants Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Saved Plants ({filteredPlants.length})
            </h2>
            <button
              onClick={load}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name or scientific name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Plants Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Image</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Scientific Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Growth Time</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Climate</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Season</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Uses</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPlants.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      {p.imageUrl ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${p.imageUrl}`}
                          alt={p.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <EditableCell 
                        value={p.name} 
                        onChange={(v) => handleUpdate(p._id, 'name', v)}
                        placeholder="Plant name"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <EditableCell 
                        value={p.scientificName} 
                        onChange={(v) => handleUpdate(p._id, 'scientificName', v)}
                        placeholder="Scientific name"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <EditableCell 
                        value={p.growthTime} 
                        onChange={(v) => handleUpdate(p._id, 'growthTime', v)}
                        placeholder="Growth time"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <EditableCell 
                        value={p.climate} 
                        onChange={(v) => handleUpdate(p._id, 'climate', v)}
                        placeholder="Climate"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <EditableCell 
                        value={p.season} 
                        onChange={(v) => handleUpdate(p._id, 'season', v)}
                        placeholder="Season"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <EditableCell
                        value={(p.uses || []).join(', ')}
                        onChange={(v) => handleUpdate(p._id, 'uses', v.split(',').map((s) => s.trim()).filter(Boolean))}
                        placeholder="Uses (comma-separated)"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setLatest(p)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-xs"
                          title="View details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                          title="Delete plant"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPlants.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No plants found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {search ? 'Try adjusting your search terms.' : 'Upload your first plant image to get started!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}