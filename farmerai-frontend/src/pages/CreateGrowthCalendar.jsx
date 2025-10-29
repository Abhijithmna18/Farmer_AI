import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGrowthCalendar } from '../services/calendarService';
import PageHeader from '../components/PageHeader';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { Plus, Trash2 } from 'lucide-react';

const CreateGrowthCalendar = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cropName: '',
    variety: '',
    plantingDate: '',
    transplantDate: '',
    estimatedHarvestDate: '',
    regionalClimate: '',
    stages: [],
  });
  const [calendarSystem, setCalendarSystem] = useState('gregorian'); // 'gregorian' | 'malayalam'
  const MALAYALAM_MONTHS = [
    'Chingam','Kanni','Thulam','Vrischikam','Dhanu','Makaram','Kumbham','Meenam','Medam','Edavam','Mithunam','Karkidakam'
  ];
  const [malPlanting, setMalPlanting] = useState({ year: '', monthIndex: 0, day: 1 });
  const [malHarvest, setMalHarvest] = useState({ year: '', monthIndex: 0, day: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Prevent spacebar entry for text inputs
  const handleKeyDown = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  // Handle input change with spacebar validation
  const handleInputChangeWithValidation = (e) => {
    const { name, value } = e.target;
    // Remove any spaces that might have been entered
    const cleanValue = value.replace(/\s/g, '');
    setFormData({ ...formData, [name]: cleanValue });
  };

  const handleStageChange = (index, e) => {
    const { name, value } = e.target;
    const stages = [...formData.stages];
    // Remove spaces for text fields (not for description fields)
    const cleanValue = (name === 'stageName' || name === 'careNeeds' || name === 'nutrientRequirements') 
      ? value.replace(/\s/g, '') 
      : value;
    stages[index][name] = cleanValue;
    setFormData({ ...formData, stages });
  };

  // Handle stage input key down to prevent spacebar
  const handleStageKeyDown = (e) => {
    const { name } = e.target;
    // Only prevent spacebar for specific fields, allow it for description
    if ((name === 'stageName' || name === 'careNeeds' || name === 'nutrientRequirements') && e.key === ' ') {
      e.preventDefault();
    }
  };

  const addStage = () => {
    setFormData({
      ...formData,
      stages: [
        ...formData.stages,
        { 
          stageName: '', 
          startDate: '', 
          endDate: '', 
          description: '',
          careNeeds: '',
          nutrientRequirements: ''
        },
      ],
    });
  };

  const removeStage = (index) => {
    const stages = [...formData.stages];
    stages.splice(index, 1);
    setFormData({ ...formData, stages });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Basic validation
    if (!formData.cropName.trim()) {
      setError('Crop name is required');
      setLoading(false);
      return;
    }
    // Validate dates based on calendar system
    if (calendarSystem === 'gregorian') {
      if (!formData.plantingDate) {
        setError('Planting date is required');
        setLoading(false);
        return;
      }
    } else {
      if (!malPlanting.year || malPlanting.year.toString().trim() === '') {
        setError('Malayalam planting year is required');
        setLoading(false);
        return;
      }
    }
    
    // Validate stages
    for (let i = 0; i < formData.stages.length; i++) {
      const stage = formData.stages[i];
      if (!stage.stageName || !stage.startDate || !stage.endDate) {
        setError(`Stage ${i + 1} is missing required fields (Stage Name, Start Date, or End Date)`);
        setLoading(false);
        return;
      }
    }
    
    try {
      console.log('Submitting calendar data:', formData);
      const payload = { ...formData };
      payload.calendarSystem = calendarSystem;
      if (calendarSystem === 'malayalam') {
        // Remove Gregorian-only plantingDate if empty
        if (!payload.plantingDate) delete payload.plantingDate;
        payload.malayalamDates = {
          planting: {
            year: Number(malPlanting.year),
            monthIndex: Number(malPlanting.monthIndex || 0),
            month: MALAYALAM_MONTHS[Number(malPlanting.monthIndex || 0)],
            day: Number(malPlanting.day || 1),
          }
        };
        if (malHarvest?.year) {
          payload.malayalamDates.estimatedHarvest = {
            year: Number(malHarvest.year),
            monthIndex: Number(malHarvest.monthIndex || 0),
            month: MALAYALAM_MONTHS[Number(malHarvest.monthIndex || 0)],
            day: Number(malHarvest.day || 1),
          };
          // If user entered Malayalam harvest date but left Gregorian estimatedHarvestDate empty, remove it so backend can derive
          if (!payload.estimatedHarvestDate) delete payload.estimatedHarvestDate;
        }
      }
      const created = await createGrowthCalendar(payload);
      // Add toast notification for success
      const newId = created?._id || created?.id;
      if (newId) {
        navigate(`/growth-calendar/${newId}`);
      } else {
        navigate('/growth-calendar');
      }
    } catch (err) {
      console.error('Calendar creation error:', err);
      setError(err.message || 'Failed to create calendar');
      // Add toast notification for error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <PageHeader title="Create New Growth Calendar" />
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Calendar System</label>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button type="button" onClick={() => setCalendarSystem('gregorian')} className={`px-4 py-2 text-sm font-medium border ${calendarSystem==='gregorian' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'} rounded-l-lg`}>Gregorian</button>
            <button type="button" onClick={() => setCalendarSystem('malayalam')} className={`px-4 py-2 text-sm font-medium border ${calendarSystem==='malayalam' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'} rounded-r-lg`}>Malayalam (Kollavarsham)</button>
          </div>
        </div>
        <InputField
          label="Crop Name"
          name="cropName"
          value={formData.cropName}
          onChange={handleInputChangeWithValidation}
          onKeyDown={handleKeyDown}
          required
        />
        <InputField
          label="Variety (Optional)"
          name="variety"
          value={formData.variety}
          onChange={handleInputChangeWithValidation}
          onKeyDown={handleKeyDown}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {calendarSystem === 'gregorian' ? (
            <InputField
              label="Planting Date"
              name="plantingDate"
              type="date"
              value={formData.plantingDate}
              onChange={handleInputChange}
              required
            />
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Planting (Malayalam)</label>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" min="1" placeholder="Year" className="px-3 py-2 border rounded-md" value={malPlanting.year} onChange={(e)=>setMalPlanting(p=>({...p, year: e.target.value}))} />
                <select className="px-3 py-2 border rounded-md" value={malPlanting.monthIndex} onChange={(e)=>setMalPlanting(p=>({...p, monthIndex: Number(e.target.value)}))}>
                  {MALAYALAM_MONTHS.map((m, idx)=>(<option key={idx} value={idx}>{m}</option>))}
                </select>
                <input type="number" min="1" max="31" placeholder="Day" className="px-3 py-2 border rounded-md" value={malPlanting.day} onChange={(e)=>setMalPlanting(p=>({...p, day: Number(e.target.value)}))} />
              </div>
              <p className="text-xs text-gray-500">Select Malayalam Year, Month, and Day. We will store both Malayalam and Gregorian equivalents.</p>
            </div>
          )}
          <InputField
            label="Transplant Date (optional)"
            name="transplantDate"
            type="date"
            value={formData.transplantDate}
            onChange={handleInputChange}
          />
          {calendarSystem === 'gregorian' ? (
            <InputField
              label="Harvest Date (expected)"
              name="estimatedHarvestDate"
              type="date"
              value={formData.estimatedHarvestDate}
              onChange={handleInputChange}
            />
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Harvest (Malayalam, optional)</label>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" min="1" placeholder="Year" className="px-3 py-2 border rounded-md" value={malHarvest.year} onChange={(e)=>setMalHarvest(p=>({...p, year: e.target.value}))} />
                <select className="px-3 py-2 border rounded-md" value={malHarvest.monthIndex} onChange={(e)=>setMalHarvest(p=>({...p, monthIndex: Number(e.target.value)}))}>
                  {MALAYALAM_MONTHS.map((m, idx)=>(<option key={idx} value={idx}>{m}</option>))}
                </select>
                <input type="number" min="1" max="31" placeholder="Day" className="px-3 py-2 border rounded-md" value={malHarvest.day} onChange={(e)=>setMalHarvest(p=>({...p, day: Number(e.target.value)}))} />
              </div>
            </div>
          )}
        </div>
        <InputField
          label="Regional Climate (e.g., Temperate, Tropical)"
          name="regionalClimate"
          value={formData.regionalClimate}
          onChange={handleInputChangeWithValidation}
          onKeyDown={handleKeyDown}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Growth Stages</h3>
          {formData.stages.map((stage, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-2 relative">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stage Name *
                </label>
                <select
                  name="stageName"
                  value={stage.stageName}
                  onChange={(e) => handleStageChange(index, e)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a stage</option>
                  <option value="Seed">Seed</option>
                  <option value="Sprout">Sprout</option>
                  <option value="Seedling">Seedling</option>
                  <option value="Vegetative">Vegetative</option>
                  <option value="Budding">Budding</option>
                  <option value="Flowering">Flowering</option>
                  <option value="Ripening">Ripening</option>
                  <option value="Harvest">Harvest</option>
                </select>
              </div>
              <InputField
                label="Start Date"
                name="startDate"
                type="date"
                value={stage.startDate}
                onChange={(e) => handleStageChange(index, e)}
                required
              />
              <InputField
                label="End Date"
                name="endDate"
                type="date"
                value={stage.endDate}
                onChange={(e) => handleStageChange(index, e)}
                required
              />
              <InputField
                label="Description"
                name="description"
                value={stage.description || ''}
                onChange={(e) => handleStageChange(index, e)}
                placeholder="e.g., Rapid leaf and stem growth"
              />
              <InputField
                label="Care Needs"
                name="careNeeds"
                value={stage.careNeeds || ''}
                onChange={(e) => handleStageChange(index, e)}
                onKeyDown={handleStageKeyDown}
                placeholder="e.g., Regular watering and pruning"
              />
              <InputField
                label="Nutrient Requirements"
                name="nutrientRequirements"
                value={stage.nutrientRequirements || ''}
                onChange={(e) => handleStageChange(index, e)}
                onKeyDown={handleStageKeyDown}
                placeholder="e.g., NPK 10-10-10"
              />
              <button
                type="button"
                onClick={() => removeStage(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          <Button type="button" onClick={addStage} variant="secondary">
            <Plus size={20} className="mr-2" />
            Add Stage
          </Button>
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Calendar'}
        </Button>
      </form>
    </div>
  );
};

export default CreateGrowthCalendar;
