import React, { useState, useEffect } from 'react';
import { Leaf, Calendar, DollarSign, CheckCircle, AlertTriangle, Target } from 'lucide-react';

const FertilizerRecommendation = () => {
  const [formData, setFormData] = useState({
    farmId: '',
    cropType: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    ph: '',
    organicMatter: '2.0',
    soilType: 'loamy',
    previousCrop: '',
    plantingDate: '',
    budget: '1000'
  });
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const cropTypes = ['Rice', 'Wheat', 'Maize', 'Tomato', 'Potato', 'Sugarcane', 'Cotton'];
  const soilTypes = ['Sandy', 'Loamy', 'Clay', 'Silty'];
  const previousCrops = ['Rice', 'Wheat', 'Maize', 'Tomato', 'Potato', 'Legumes', 'None'];

  useEffect(() => {
    // Load recommendation history
    loadRecommendationHistory();
  }, []);

  const loadRecommendationHistory = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setHistory([
          {
            id: 1,
            cropType: 'Rice',
            totalCost: 1250,
            confidence: 88,
            date: '2024-01-15',
            status: 'Applied',
            soilType: 'Loamy',
            yieldIncrease: 18,
            recommendations: 4
          },
          {
            id: 2,
            cropType: 'Wheat',
            totalCost: 890,
            confidence: 92,
            date: '2024-01-10',
            status: 'Pending',
            soilType: 'Clay',
            yieldIncrease: 15,
            recommendations: 3
          },
          {
            id: 3,
            cropType: 'Tomato',
            totalCost: 2100,
            confidence: 85,
            date: '2024-01-05',
            status: 'Applied',
            soilType: 'Sandy',
            yieldIncrease: 22,
            recommendations: 5
          },
          {
            id: 4,
            cropType: 'Maize',
            totalCost: 1450,
            confidence: 90,
            date: '2023-12-28',
            status: 'Applied',
            soilType: 'Loamy',
            yieldIncrease: 20,
            recommendations: 4
          },
          {
            id: 5,
            cropType: 'Potato',
            totalCost: 1800,
            confidence: 87,
            date: '2023-12-20',
            status: 'Applied',
            soilType: 'Silty',
            yieldIncrease: 25,
            recommendations: 6
          },
          {
            id: 6,
            cropType: 'Cotton',
            totalCost: 1100,
            confidence: 83,
            date: '2023-12-15',
            status: 'Pending',
            soilType: 'Clay',
            yieldIncrease: 12,
            recommendations: 3
          }
        ]);
      }, 500);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Enhanced mock data generator based on soil and crop conditions
  const generateMockRecommendation = (formData) => {
    const { cropType, nitrogen, phosphorus, potassium, ph, organicMatter, soilType, previousCrop, budget } = formData;
    
    // Convert string values to numbers
    const n = parseFloat(nitrogen) || 0;
    const p = parseFloat(phosphorus) || 0;
    const k = parseFloat(potassium) || 0;
    const soilPh = parseFloat(ph) || 6.5;
    const om = parseFloat(organicMatter) || 2.0;
    const budgetAmount = parseFloat(budget) || 1000;
    
    // Crop-specific nutrient requirements (kg/ha)
    const cropRequirements = {
      'Rice': { n: 120, p: 60, k: 80, ph: { min: 5.5, max: 7.0 } },
      'Wheat': { n: 100, p: 50, k: 60, ph: { min: 6.0, max: 7.5 } },
      'Maize': { n: 150, p: 70, k: 90, ph: { min: 5.8, max: 7.2 } },
      'Tomato': { n: 180, p: 80, k: 120, ph: { min: 6.0, max: 6.8 } },
      'Potato': { n: 160, p: 90, k: 200, ph: { min: 5.5, max: 6.5 } },
      'Sugarcane': { n: 200, p: 100, k: 150, ph: { min: 6.0, max: 7.5 } },
      'Cotton': { n: 120, p: 60, k: 80, ph: { min: 5.8, max: 7.0 } }
    };
    
    const requirements = cropRequirements[cropType] || cropRequirements['Rice'];
    
    // Soil type adjustments
    const soilAdjustments = {
      'sandy': { n: 1.2, p: 1.3, k: 1.1, retention: 0.7 },
      'loamy': { n: 1.0, p: 1.0, k: 1.0, retention: 1.0 },
      'clay': { n: 0.8, p: 0.9, k: 0.9, retention: 1.3 },
      'silty': { n: 0.9, p: 1.1, k: 1.0, retention: 1.1 }
    };
    
    const adjustment = soilAdjustments[soilType] || soilAdjustments['loamy'];
    
    // Calculate nutrient deficiencies
    const nDeficiency = Math.max(0, (requirements.n * adjustment.n) - n);
    const pDeficiency = Math.max(0, (requirements.p * adjustment.p) - p);
    const kDeficiency = Math.max(0, (requirements.k * adjustment.k) - k);
    
    // pH adjustment recommendations
    const phAdjustments = [];
    if (soilPh < requirements.ph.min) {
      phAdjustments.push({
        fertilizerType: 'Lime (CaCO3)',
        amount: Math.round((requirements.ph.min - soilPh) * 200),
        unit: 'kg',
        applicationMethod: 'broadcast',
        timing: 'pre_planting',
        priority: 'critical',
        reason: `Soil pH (${soilPh}) is below optimal range (${requirements.ph.min}-${requirements.ph.max})`,
        expectedBenefit: 'Improves nutrient availability and soil structure'
      });
    } else if (soilPh > requirements.ph.max) {
      phAdjustments.push({
        fertilizerType: 'Sulfur (S)',
        amount: Math.round((soilPh - requirements.ph.max) * 50),
        unit: 'kg',
        applicationMethod: 'broadcast',
        timing: 'pre_planting',
        priority: 'high',
        reason: `Soil pH (${soilPh}) is above optimal range (${requirements.ph.min}-${requirements.ph.max})`,
        expectedBenefit: 'Lowers pH to improve nutrient uptake'
      });
    }
    
    // Generate fertilizer recommendations based on deficiencies
    const recommendations = [];
    
    // Nitrogen recommendations
    if (nDeficiency > 0) {
      const ureaAmount = Math.round(nDeficiency * 2.17); // Urea is 46% N
      const ammoniumSulfateAmount = Math.round(nDeficiency * 4.76); // Ammonium sulfate is 21% N
      
      if (soilPh < 6.0) {
        recommendations.push({
          fertilizerType: 'Ammonium Sulfate',
          amount: ammoniumSulfateAmount,
          unit: 'kg',
          applicationMethod: 'broadcast',
          timing: 'pre_planting',
          priority: 'high',
          reason: `Low nitrogen (${n} kg/ha) and acidic soil (pH ${soilPh})`,
          expectedBenefit: 'Provides nitrogen and helps lower soil pH',
          cost: ammoniumSulfateAmount * 12
        });
      } else {
        recommendations.push({
          fertilizerType: 'Urea',
          amount: ureaAmount,
          unit: 'kg',
          applicationMethod: 'broadcast',
          timing: 'pre_planting',
          priority: 'high',
          reason: `Low nitrogen levels (${n} kg/ha vs required ${Math.round(requirements.n * adjustment.n)} kg/ha)`,
          expectedBenefit: 'Promotes vegetative growth and protein synthesis',
          cost: ureaAmount * 8
        });
      }
    }
    
    // Phosphorus recommendations
    if (pDeficiency > 0) {
      const dapAmount = Math.round(pDeficiency * 2.27); // DAP is 44% P2O5
      const sspAmount = Math.round(pDeficiency * 4.35); // SSP is 23% P2O5
      
      if (soilType === 'clay') {
        recommendations.push({
          fertilizerType: 'DAP (Diammonium Phosphate)',
          amount: dapAmount,
          unit: 'kg',
          applicationMethod: 'band_placement',
          timing: 'at_planting',
          priority: 'high',
          reason: `Low phosphorus (${p} kg/ha) in clay soil with poor P mobility`,
          expectedBenefit: 'Improves root development and flowering',
          cost: dapAmount * 15
        });
      } else {
        recommendations.push({
          fertilizerType: 'SSP (Single Super Phosphate)',
          amount: sspAmount,
          unit: 'kg',
          applicationMethod: 'broadcast',
          timing: 'pre_planting',
          priority: 'high',
          reason: `Low phosphorus levels (${p} kg/ha vs required ${Math.round(requirements.p * adjustment.p)} kg/ha)`,
          expectedBenefit: 'Enhances root growth and energy transfer',
          cost: sspAmount * 10
        });
      }
    }
    
    // Potassium recommendations
    if (kDeficiency > 0) {
      const mopAmount = Math.round(kDeficiency * 1.67); // MOP is 60% K2O
      const sopAmount = Math.round(kDeficiency * 2.08); // SOP is 48% K2O
      
      if (cropType === 'Tomato' || cropType === 'Potato') {
        recommendations.push({
          fertilizerType: 'SOP (Sulfate of Potash)',
          amount: sopAmount,
          unit: 'kg',
          applicationMethod: 'side_dressing',
          timing: 'side_dressing',
          priority: 'high',
          reason: `Low potassium (${k} kg/ha) for ${cropType} - critical for fruit quality`,
          expectedBenefit: 'Improves fruit quality, color, and disease resistance',
          cost: sopAmount * 18
        });
      } else {
        recommendations.push({
          fertilizerType: 'MOP (Muriate of Potash)',
          amount: mopAmount,
          unit: 'kg',
          applicationMethod: 'broadcast',
          timing: 'side_dressing',
          priority: 'medium',
          reason: `Low potassium levels (${k} kg/ha vs required ${Math.round(requirements.k * adjustment.k)} kg/ha)`,
          expectedBenefit: 'Enhances water regulation and stress tolerance',
          cost: mopAmount * 12
        });
      }
    }
    
    // Micronutrient recommendations based on soil type and pH
    const micronutrients = [];
    
    if (soilPh > 7.0) {
      micronutrients.push({
        fertilizerType: 'Iron Chelate',
        amount: 2,
        unit: 'kg',
        applicationMethod: 'foliar_spray',
        timing: 'side_dressing',
        priority: 'medium',
        reason: 'High pH reduces iron availability',
        expectedBenefit: 'Prevents iron chlorosis and improves chlorophyll synthesis',
        cost: 200
      });
    }
    
    if (soilType === 'sandy' && om < 2.0) {
      micronutrients.push({
        fertilizerType: 'Zinc Sulfate',
        amount: 5,
        unit: 'kg',
        applicationMethod: 'broadcast',
        timing: 'pre_planting',
        priority: 'medium',
        reason: 'Sandy soil with low organic matter - zinc deficiency likely',
        expectedBenefit: 'Improves enzyme activity and protein synthesis',
        cost: 150
      });
    }
    
    if (cropType === 'Maize' || cropType === 'Rice') {
      micronutrients.push({
        fertilizerType: 'Boron',
        amount: 1,
        unit: 'kg',
        applicationMethod: 'foliar_spray',
        timing: 'side_dressing',
        priority: 'low',
        reason: `${cropType} is sensitive to boron deficiency`,
        expectedBenefit: 'Improves pollen viability and grain development',
        cost: 100
      });
    }
    
    // Organic matter recommendations
    if (om < 2.0) {
      recommendations.push({
        fertilizerType: 'Farmyard Manure',
        amount: 5000,
        unit: 'kg',
        applicationMethod: 'broadcast',
        timing: 'pre_planting',
        priority: 'medium',
        reason: `Low organic matter (${om}%) - soil health improvement needed`,
        expectedBenefit: 'Improves soil structure, water retention, and microbial activity',
        cost: 2000
      });
    }
    
    // Combine all recommendations
    const allRecommendations = [...phAdjustments, ...recommendations, ...micronutrients];
    
    // Calculate total cost
    const totalCost = allRecommendations.reduce((sum, rec) => sum + (rec.cost || 0), 0);
    
    // Generate application schedule
    const applicationSchedule = allRecommendations.map((rec, index) => {
      const baseDate = new Date();
      let scheduleDate;
      
      switch (rec.timing) {
        case 'pre_planting':
          scheduleDate = new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'at_planting':
          scheduleDate = baseDate;
          break;
        case 'side_dressing':
          scheduleDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case 'top_dressing':
          scheduleDate = new Date(baseDate.getTime() + 45 * 24 * 60 * 60 * 1000);
          break;
        default:
          scheduleDate = baseDate;
      }
      
      return {
        date: scheduleDate.toISOString(),
        fertilizer: rec.fertilizerType,
        amount: rec.amount,
        method: rec.applicationMethod,
        notes: rec.reason
      };
    });
    
    // Generate decision tree path
    const decisionPath = `Crop: ${cropType}, Soil: ${soilType} → pH: ${soilPh} → N: ${n}/${Math.round(requirements.n * adjustment.n)} → P: ${p}/${Math.round(requirements.p * adjustment.p)} → K: ${k}/${Math.round(requirements.k * adjustment.k)} → ${allRecommendations.length} recommendations`;
    
    // Calculate confidence based on data completeness and soil conditions
    let confidence = 85;
    if (soilPh < requirements.ph.min || soilPh > requirements.ph.max) confidence -= 10;
    if (om < 1.5) confidence -= 5;
    if (previousCrop === 'none' || !previousCrop) confidence -= 5;
    if (totalCost > budgetAmount) confidence -= 15;
    
    return {
      recommendationId: 'rec_' + Date.now(),
      cropType: cropType,
      soilAnalysis: {
        nitrogen: n,
        phosphorus: p,
        potassium: k,
        ph: soilPh,
        organicMatter: om,
        soilType: soilType
      },
      recommendations: allRecommendations,
      decisionTreePath: decisionPath,
      confidence: Math.max(60, confidence),
      totalCost: Math.round(totalCost),
      currency: 'INR',
      applicationSchedule: applicationSchedule,
      summary: {
        totalRecommendations: allRecommendations.length,
        highPriorityCount: allRecommendations.filter(r => r.priority === 'high' || r.priority === 'critical').length,
        totalCost: Math.round(totalCost),
        fertilizerTypes: [...new Set(allRecommendations.map(r => r.fertilizerType))],
        applicationPeriod: 45,
        budgetUtilization: Math.round((totalCost / budgetAmount) * 100)
      },
      recommendationDate: new Date().toISOString(),
      soilHealthScore: Math.round(((n / (requirements.n * adjustment.n)) + (p / (requirements.p * adjustment.p)) + (k / (requirements.k * adjustment.k)) + (om / 3)) * 25),
      expectedYieldIncrease: Math.round(Math.min(25, (nDeficiency + pDeficiency + kDeficiency) / 10))
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      setTimeout(() => {
        const mockRecommendation = generateMockRecommendation(formData);
        setRecommendation(mockRecommendation);
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Recommendation failed:', error);
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTimingColor = (timing) => {
    switch (timing) {
      case 'pre_planting': return 'text-blue-600 bg-blue-100';
      case 'at_planting': return 'text-green-600 bg-green-100';
      case 'side_dressing': return 'text-yellow-600 bg-yellow-100';
      case 'top_dressing': return 'text-orange-600 bg-orange-100';
      case 'post_harvest': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Leaf className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fertilizer Recommendation</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Get AI-powered fertilizer recommendations using decision tree classification
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recommendation Form */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Soil Analysis Input</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Farm ID
                  </label>
                  <input
                    type="text"
                    name="farmId"
                    value={formData.farmId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Enter farm ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Crop Type
                  </label>
                  <select
                    name="cropType"
                    value={formData.cropType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    required
                  >
                    <option value="">Select crop type</option>
                    {cropTypes.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Soil Nutrients */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nitrogen (kg/ha)
                  </label>
                  <input
                    type="number"
                    name="nitrogen"
                    value={formData.nitrogen}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phosphorus (kg/ha)
                  </label>
                  <input
                    type="number"
                    name="phosphorus"
                    value={formData.phosphorus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Potassium (kg/ha)
                  </label>
                  <input
                    type="number"
                    name="potassium"
                    value={formData.potassium}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Soil Properties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Soil pH
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="ph"
                    value={formData.ph}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="6.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organic Matter (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="organicMatter"
                    value={formData.organicMatter}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="2.0"
                  />
                </div>
              </div>

              {/* Soil Type and Previous Crop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Soil Type
                  </label>
                  <select
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  >
                    {soilTypes.map(soil => (
                      <option key={soil} value={soil.toLowerCase()}>{soil}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Previous Crop
                  </label>
                  <select
                    name="previousCrop"
                    value={formData.previousCrop}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  >
                    {previousCrops.map(crop => (
                      <option key={crop} value={crop.toLowerCase()}>{crop}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Planting Date and Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Planting Date
                  </label>
                  <input
                    type="date"
                    name="plantingDate"
                    value={formData.plantingDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="1000"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Analyzing...' : 'Get Recommendations'}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recommendation Results</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Analyzing soil data...</p>
              </div>
            ) : recommendation ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Recommendation Summary</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">Total Cost</p>
                      <p className="font-bold text-blue-800 dark:text-blue-200">₹{recommendation.totalCost}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">Confidence</p>
                      <p className="font-bold text-blue-800 dark:text-blue-200">{recommendation.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">Recommendations</p>
                      <p className="font-bold text-blue-800 dark:text-blue-200">{recommendation.summary.totalRecommendations}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">High Priority</p>
                      <p className="font-bold text-blue-800 dark:text-blue-200">{recommendation.summary.highPriorityCount}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">Budget Utilization</p>
                      <p className="font-bold text-blue-800 dark:text-blue-200">{recommendation.summary.budgetUtilization}%</p>
                    </div>
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">Soil Health Score</p>
                      <p className="font-bold text-blue-800 dark:text-blue-200">{recommendation.soilHealthScore}/100</p>
                    </div>
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">Expected Yield Increase</p>
                      <p className="font-bold text-blue-800 dark:text-blue-200">+{recommendation.expectedYieldIncrease}%</p>
                    </div>
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">Application Period</p>
                      <p className="font-bold text-blue-800 dark:text-blue-200">{recommendation.summary.applicationPeriod} days</p>
                    </div>
                  </div>
                </div>

                {/* Soil Analysis */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Soil Analysis Results</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-700 dark:text-green-300">Nitrogen (N)</p>
                      <p className="font-bold text-green-800 dark:text-green-200">{recommendation.soilAnalysis.nitrogen} kg/ha</p>
                    </div>
                    <div>
                      <p className="text-green-700 dark:text-green-300">Phosphorus (P)</p>
                      <p className="font-bold text-green-800 dark:text-green-200">{recommendation.soilAnalysis.phosphorus} kg/ha</p>
                    </div>
                    <div>
                      <p className="text-green-700 dark:text-green-300">Potassium (K)</p>
                      <p className="font-bold text-green-800 dark:text-green-200">{recommendation.soilAnalysis.potassium} kg/ha</p>
                    </div>
                    <div>
                      <p className="text-green-700 dark:text-green-300">Soil pH</p>
                      <p className="font-bold text-green-800 dark:text-green-200">{recommendation.soilAnalysis.ph}</p>
                    </div>
                    <div>
                      <p className="text-green-700 dark:text-green-300">Organic Matter</p>
                      <p className="font-bold text-green-800 dark:text-green-200">{recommendation.soilAnalysis.organicMatter}%</p>
                    </div>
                    <div>
                      <p className="text-green-700 dark:text-green-300">Soil Type</p>
                      <p className="font-bold text-green-800 dark:text-green-200">{recommendation.soilAnalysis.soilType}</p>
                    </div>
                  </div>
                </div>

                {/* Fertilizer Recommendations */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Fertilizer Recommendations</h4>
                  <div className="space-y-3">
                    {recommendation.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          rec.priority === 'high' || rec.priority === 'critical'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            : rec.priority === 'medium'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-gray-900 dark:text-white">{rec.fertilizerType}</h5>
                              <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(rec.priority)}`}>
                                {rec.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {rec.amount} {rec.unit} • {rec.applicationMethod} • {rec.timing.replace('_', ' ')}
                              {rec.cost && <span className="ml-2 font-semibold text-blue-600">₹{rec.cost}</span>}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rec.reason}</p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">{rec.expectedBenefit}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Application Schedule */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Application Schedule</h4>
                  <div className="space-y-2">
                    {recommendation.applicationSchedule.map((schedule, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {schedule.fertilizer} - {schedule.amount}kg
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(schedule.date).toLocaleDateString()} • {schedule.method}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getTimingColor(schedule.method)}`}>
                          {schedule.method}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decision Tree Path */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p className="font-medium mb-1">Decision Tree Path:</p>
                  <p className="break-words">{recommendation.decisionTreePath}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Leaf className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter soil analysis data to get recommendations</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendation History */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <div key={item.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{item.cropType}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === 'Applied' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">₹{item.totalCost}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Confidence: {item.confidence}%</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">+{item.yieldIncrease}% yield</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{item.soilType} soil</span>
                    <span>{item.recommendations} fertilizers</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FertilizerRecommendation;
