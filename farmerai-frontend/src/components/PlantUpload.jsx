import React, { useState } from 'react';
import { uploadPlantImage } from '../services/plantService';
import { toast } from 'react-hot-toast';

export default function PlantUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return setFile(null);
    const ok = ['image/png', 'image/jpeg', 'image/jpg'].includes(f.type);
    if (!ok) {
      toast.error('Only PNG or JPG images are allowed');
      return;
    }
    setFile(f);
  };

  const onUpload = async () => {
    if (!file) return toast.error('Please choose an image first');
    setUploading(true);
    setResult(null);
    try {
      const data = await uploadPlantImage(file);
      setResult(data);
      toast.success('Image analyzed');
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded-2xl shadow-md">
      <h3 className="text-lg font-semibold mb-3">Identify Plant (PNG / JPG)</h3>

      <input
        type="file"
        accept="image/png, image/jpeg"
        onChange={onFileChange}
        className="mb-3"
      />

      {file && (
        <div className="mb-3">
          <div className="text-sm text-gray-700">Selected: {file.name} ({Math.round(file.size/1024)} KB)</div>
          <img src={URL.createObjectURL(file)} alt="preview" className="mt-2 w-48 h-48 object-contain rounded" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onUpload}
          disabled={uploading}
          className={`px-4 py-2 rounded-md text-white ${uploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {uploading ? 'Uploading...' : 'Upload & Identify'}
        </button>
        <button onClick={() => { setFile(null); setResult(null); }} className="px-3 py-2 rounded-md bg-gray-100">Clear</button>
      </div>

      {result && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">Result</h4>
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
