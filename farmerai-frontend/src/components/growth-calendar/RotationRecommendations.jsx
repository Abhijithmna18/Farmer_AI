import React, { useState } from 'react';

const RotationRecommendations = ({ calendar = {}, onSave }) => {
  const [soilNotes, setSoilNotes] = useState(calendar.soilHealthNotes || '');
  const [rotationGuidelines, setRotationGuidelines] = useState(calendar.cropRotationGuidelines || '');
  const [suggestion, setSuggestion] = useState('');

  const rules = [
    { crop: 'Tomato', next: ['Legumes (beans, peas)', 'Leafy greens'], avoid: ['Potato', 'Chili', 'Eggplant'] },
    { crop: 'Maize', next: ['Legumes (soybean)', 'Root crops'], avoid: ['Maize'] },
    { crop: 'Rice', next: ['Pulses', 'Vegetables'], avoid: ['Rice'] },
  ];

  const generateSuggestion = () => {
    const crop = (calendar.cropName || '').toLowerCase();
    const rule = rules.find(r => crop.includes(r.crop.toLowerCase()));
    if (rule) {
      setSuggestion(`Suggested next crops: ${rule.next.join(', ')}. Avoid: ${rule.avoid.join(', ')}.`);
    } else {
      setSuggestion('Maintain rotation: avoid planting same family consecutively; add legumes to restore nitrogen.');
    }
  };

  const handleSave = () => {
    onSave?.({ soilHealthNotes: soilNotes, cropRotationGuidelines: rotationGuidelines });
  };

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Crop Rotation & Soil Notes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Soil Health Notes</label>
          <textarea
            className="w-full min-h-[100px] p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            value={soilNotes}
            onChange={(e)=>setSoilNotes(e.target.value)}
            placeholder="e.g., Low nitrogen observed; add compost after harvest"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Rotation Guidelines</label>
          <textarea
            className="w-full min-h-[100px] p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            value={rotationGuidelines}
            onChange={(e)=>setRotationGuidelines(e.target.value)}
            placeholder="e.g., Follow tomatoes with legumes; avoid solanaceae next season"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={generateSuggestion} className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Suggest Next Crop</button>
        <button onClick={handleSave} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Notes</button>
      </div>
      {suggestion && (
        <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-800 dark:text-emerald-200">
          {suggestion}
        </div>
      )}
    </div>
  );
};

export default RotationRecommendations;












