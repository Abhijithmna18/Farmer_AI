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
    sowingDate: '',
    transplantDate: '',
    harvestDate: '',
    regionalClimate: '',
    stages: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleStageChange = (index, e) => {
    const { name, value } = e.target;
    const stages = [...formData.stages];
    stages[index][name] = value;
    setFormData({ ...formData, stages });
  };

  const addStage = () => {
    setFormData({
      ...formData,
      stages: [
        ...formData.stages,
        { stageName: '', startDate: '', endDate: '', description: '' },
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
    try {
      await createGrowthCalendar(formData);
      // Add toast notification for success
      navigate('/growth-calendar');
    } catch (err) {
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
        <InputField
          label="Crop Name"
          name="cropName"
          value={formData.cropName}
          onChange={handleInputChange}
          required
        />
        <InputField
          label="Variety (Optional)"
          name="variety"
          value={formData.variety}
          onChange={handleInputChange}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Sowing Date"
            name="sowingDate"
            type="date"
            value={formData.sowingDate}
            onChange={handleInputChange}
            required
          />
          <InputField
            label="Transplant Date (optional)"
            name="transplantDate"
            type="date"
            value={formData.transplantDate}
            onChange={handleInputChange}
          />
          <InputField
            label="Harvest Date (expected)"
            name="harvestDate"
            type="date"
            value={formData.harvestDate}
            onChange={handleInputChange}
          />
        </div>
        <InputField
          label="Regional Climate (e.g., Temperate, Tropical)"
          name="regionalClimate"
          value={formData.regionalClimate}
          onChange={handleInputChange}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Growth Stages</h3>
          {formData.stages.map((stage, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-2 relative">
              <InputField
                label="Stage Name"
                name="stageName"
                value={stage.stageName}
                onChange={(e) => handleStageChange(index, e)}
                placeholder="e.g., Vegetative"
              />
              <InputField
                label="Start Date"
                name="startDate"
                type="date"
                value={stage.startDate}
                onChange={(e) => handleStageChange(index, e)}
              />
              <InputField
                label="End Date"
                name="endDate"
                type="date"
                value={stage.endDate}
                onChange={(e) => handleStageChange(index, e)}
              />
              <InputField
                label="Nutrient Requirements"
                name="nutrientRequirements"
                value={stage.nutrientRequirements || ''}
                onChange={(e) => handleStageChange(index, e)}
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
