import React, { useEffect, useMemo, useState } from "react";
import HomeButton from "../components/HomeButton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import recommendationService, { generateRecommendations, getRecommendations, getSoilRecommendations, getSoilHistory, toggleFavorite, listFavorites } from '../services/recommendationService';
import { toast } from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import { gsap } from 'gsap';
import assistantService from '../services/assistantService';
import { generateMockMarketTrends, convertTrendsToChartData, generateFallbackChartData, formatPrice, getCropNameForLegend } from '../utils/chartUtils';
import { 
  Sprout, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Droplets, 
  Thermometer, 
  Sun,
  Star,
  Save,
  Heart,
  BarChart3,
  Leaf,
  Zap
} from 'lucide-react';

export default function Recommendations() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soilType, setSoilType] = useState('Loamy');
  const [season, setSeason] = useState('post-monsoon');
  const [location, setLocation] = useState('Kerala');
  const [N, setN] = useState('');
  const [P, setP] = useState('');
  const [K, setK] = useState('');
  const [rainfall, setRainfall] = useState('');
  const [humidity, setHumidity] = useState('');
  const [soilResults, setSoilResults] = useState([]);
  const [soilDocId, setSoilDocId] = useState(null);
  const [soilHistory, setSoilHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [editingSoilId, setEditingSoilId] = useState(null);
  const [editForm, setEditForm] = useState({ N:'', P:'', K:'', rainfall:'', humidity:'' });
  const [marketTrends, setMarketTrends] = useState(null);
  const [marketDrivers, setMarketDrivers] = useState('');

  useEffect(() => { gsap.fromTo('.rec-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.5 }); }, [items.length]);

  // Prevent entering spacebar or submitting via Enter in numeric fields
  const handleBlockSpaceEnter = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // Enhanced mock data generator for crop recommendations
  const generateEnhancedMockRecommendations = (soilType, season, location) => {
    const cropDatabase = {
      'Rice': {
        varieties: ['Basmati', 'Jasmine', 'Sona Masuri', 'IR64', 'Swarna'],
        seasons: ['monsoon', 'post-monsoon'],
        soilTypes: ['loamy', 'clay'],
        yieldRange: { min: 3000, max: 6000 },
        profitRange: { min: 15000, max: 35000 },
        waterRequirement: 'High',
        temperatureRange: '25-35°C',
        marketPrice: { min: 25, max: 45 },
        growingPeriod: '120-150 days',
        fertilizerNeeds: 'High N, Medium P, Medium K',
        pestResistance: 'Medium',
        diseaseResistance: 'Medium'
      },
      'Wheat': {
        varieties: ['HD-2967', 'PBW-343', 'UP-2338', 'Raj-3765', 'HD-3086'],
        seasons: ['winter', 'post-monsoon'],
        soilTypes: ['loamy', 'sandy'],
        yieldRange: { min: 2500, max: 5000 },
        profitRange: { min: 12000, max: 28000 },
        waterRequirement: 'Medium',
        temperatureRange: '15-25°C',
        marketPrice: { min: 20, max: 35 },
        growingPeriod: '100-120 days',
        fertilizerNeeds: 'Medium N, High P, Low K',
        pestResistance: 'High',
        diseaseResistance: 'High'
      },
      'Maize': {
        varieties: ['Hybrid-1', 'Sweet Corn', 'Popcorn', 'Dent Corn', 'Flint Corn'],
        seasons: ['monsoon', 'post-monsoon', 'pre-monsoon'],
        soilTypes: ['loamy', 'sandy'],
        yieldRange: { min: 4000, max: 8000 },
        profitRange: { min: 20000, max: 45000 },
        waterRequirement: 'Medium',
        temperatureRange: '20-30°C',
        marketPrice: { min: 18, max: 32 },
        growingPeriod: '90-110 days',
        fertilizerNeeds: 'High N, Medium P, Medium K',
        pestResistance: 'Medium',
        diseaseResistance: 'Medium'
      },
      'Tomato': {
        varieties: ['Cherry', 'Roma', 'Beefsteak', 'Heirloom', 'Hybrid'],
        seasons: ['post-monsoon', 'winter'],
        soilTypes: ['loamy', 'sandy'],
        yieldRange: { min: 20000, max: 50000 },
        profitRange: { min: 50000, max: 120000 },
        waterRequirement: 'Medium',
        temperatureRange: '18-28°C',
        marketPrice: { min: 15, max: 60 },
        growingPeriod: '90-120 days',
        fertilizerNeeds: 'Medium N, High P, High K',
        pestResistance: 'Low',
        diseaseResistance: 'Low'
      },
      'Potato': {
        varieties: ['Kufri Jyoti', 'Kufri Pukhraj', 'Kufri Bahar', 'Kufri Chandramukhi'],
        seasons: ['winter', 'post-monsoon'],
        soilTypes: ['loamy', 'sandy'],
        yieldRange: { min: 15000, max: 35000 },
        profitRange: { min: 30000, max: 80000 },
        waterRequirement: 'Medium',
        temperatureRange: '15-25°C',
        marketPrice: { min: 12, max: 25 },
        growingPeriod: '90-120 days',
        fertilizerNeeds: 'Medium N, High P, High K',
        pestResistance: 'Medium',
        diseaseResistance: 'Medium'
      },
      'Sugarcane': {
        varieties: ['Co-86032', 'Co-8371', 'Co-0238', 'Co-86032'],
        seasons: ['monsoon', 'post-monsoon'],
        soilTypes: ['loamy', 'clay'],
        yieldRange: { min: 60000, max: 120000 },
        profitRange: { min: 80000, max: 200000 },
        waterRequirement: 'High',
        temperatureRange: '25-35°C',
        marketPrice: { min: 3, max: 5 },
        growingPeriod: '300-365 days',
        fertilizerNeeds: 'High N, Medium P, High K',
        pestResistance: 'High',
        diseaseResistance: 'High'
      },
      'Cotton': {
        varieties: ['Bt Cotton', 'Desi Cotton', 'Hybrid Cotton'],
        seasons: ['monsoon', 'post-monsoon'],
        soilTypes: ['loamy', 'sandy'],
        yieldRange: { min: 800, max: 2000 },
        profitRange: { min: 25000, max: 60000 },
        waterRequirement: 'Medium',
        temperatureRange: '20-35°C',
        marketPrice: { min: 60, max: 120 },
        growingPeriod: '150-180 days',
        fertilizerNeeds: 'Medium N, Medium P, Medium K',
        pestResistance: 'High',
        diseaseResistance: 'Medium'
      },
      'Chili': {
        varieties: ['Kashmiri', 'Guntur', 'Byadgi', 'Jwala', 'Bhut Jolokia'],
        seasons: ['post-monsoon', 'winter'],
        soilTypes: ['loamy', 'sandy'],
        yieldRange: { min: 800, max: 2000 },
        profitRange: { min: 40000, max: 100000 },
        waterRequirement: 'Low',
        temperatureRange: '20-30°C',
        marketPrice: { min: 80, max: 200 },
        growingPeriod: '120-150 days',
        fertilizerNeeds: 'Medium N, Medium P, High K',
        pestResistance: 'High',
        diseaseResistance: 'High'
      },
      'Onion': {
        varieties: ['Red Onion', 'White Onion', 'Yellow Onion', 'Shallot'],
        seasons: ['winter', 'post-monsoon'],
        soilTypes: ['loamy', 'sandy'],
        yieldRange: { min: 15000, max: 30000 },
        profitRange: { min: 30000, max: 80000 },
        waterRequirement: 'Medium',
        temperatureRange: '15-25°C',
        marketPrice: { min: 20, max: 80 },
        growingPeriod: '120-150 days',
        fertilizerNeeds: 'Medium N, Medium P, Medium K',
        pestResistance: 'High',
        diseaseResistance: 'High'
      },
      'Turmeric': {
        varieties: ['Alleppey', 'Erode', 'Salem', 'Rajapuri'],
        seasons: ['monsoon', 'post-monsoon'],
        soilTypes: ['loamy', 'clay'],
        yieldRange: { min: 15000, max: 30000 },
        profitRange: { min: 60000, max: 150000 },
        waterRequirement: 'Medium',
        temperatureRange: '20-30°C',
        marketPrice: { min: 60, max: 120 },
        growingPeriod: '200-250 days',
        fertilizerNeeds: 'Medium N, High P, High K',
        pestResistance: 'High',
        diseaseResistance: 'High'
      }
    };

    // Location-based adjustments
    const locationAdjustments = {
      'Kerala': { rainfall: 1.2, humidity: 1.3, temperature: 1.1 },
      'Punjab': { rainfall: 0.8, humidity: 0.7, temperature: 0.9 },
      'Maharashtra': { rainfall: 1.0, humidity: 1.0, temperature: 1.0 },
      'Tamil Nadu': { rainfall: 0.9, humidity: 1.1, temperature: 1.0 },
      'Karnataka': { rainfall: 1.1, humidity: 1.0, temperature: 1.0 },
      'Gujarat': { rainfall: 0.7, humidity: 0.8, temperature: 1.1 },
      'Rajasthan': { rainfall: 0.6, humidity: 0.6, temperature: 1.2 },
      'West Bengal': { rainfall: 1.3, humidity: 1.4, temperature: 1.0 }
    };

    const adjustment = locationAdjustments[location] || locationAdjustments['Maharashtra'];

    // Filter crops based on season and soil type
    const suitableCrops = Object.entries(cropDatabase).filter(([crop, data]) => 
      data.seasons.includes(season.toLowerCase()) && 
      data.soilTypes.includes(soilType.toLowerCase())
    );

    // Generate recommendations
    const recommendations = suitableCrops.map(([crop, data]) => {
      const variety = data.varieties[Math.floor(Math.random() * data.varieties.length)];
      const yieldEstimate = Math.floor(
        (data.yieldRange.min + Math.random() * (data.yieldRange.max - data.yieldRange.min)) * 
        adjustment.rainfall * adjustment.humidity
      );
      const profitEstimate = Math.floor(
        (data.profitRange.min + Math.random() * (data.profitRange.max - data.profitRange.min)) * 
        adjustment.temperature
      );
      const marketPrice = Math.floor(
        (data.marketPrice.min + Math.random() * (data.marketPrice.max - data.marketPrice.min)) * 
        adjustment.temperature
      );

      // Generate detailed reasons based on conditions
      const reasons = [
        `Optimal for ${season} season in ${location}`,
        `High yield potential: ${yieldEstimate} kg/ha`,
        `Profitable market price: ₹${marketPrice}/kg`,
        `Suitable for ${soilType} soil conditions`,
        `Water requirement: ${data.waterRequirement}`,
        `Growing period: ${data.growingPeriod}`,
        `Temperature range: ${data.temperatureRange}`,
        `Fertilizer needs: ${data.fertilizerNeeds}`,
        `Pest resistance: ${data.pestResistance}`,
        `Disease resistance: ${data.diseaseResistance}`
      ];

      const reason = reasons[Math.floor(Math.random() * Math.min(3, reasons.length))];

      return {
        crop,
        variety,
        reason,
        expectedYield: `${yieldEstimate} kg/ha`,
        profitEstimation: `₹${profitEstimate}/acre`,
        marketPrice: `₹${marketPrice}/kg`,
        waterRequirement: data.waterRequirement,
        temperatureRange: data.temperatureRange,
        growingPeriod: data.growingPeriod,
        fertilizerNeeds: data.fertilizerNeeds,
        pestResistance: data.pestResistance,
        diseaseResistance: data.diseaseResistance,
        suitabilityScore: Math.floor(70 + Math.random() * 30),
        riskLevel: Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Medium' : 'Low',
        investmentRequired: `₹${Math.floor(10000 + Math.random() * 50000)}`,
        expectedROI: `${Math.floor(120 + Math.random() * 180)}%`,
        plantingWindow: `${season} season`,
        harvestTime: `${Math.floor(90 + Math.random() * 120)} days`,
        marketDemand: Math.random() > 0.5 ? 'High' : 'Medium',
        exportPotential: Math.random() > 0.6 ? 'Yes' : 'No'
      };
    });

    // Sort by suitability score and return top recommendations
    return recommendations
      .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
      .slice(0, 8);
  };

  // Enhanced mock data generator for soil-based recommendations
  const generateEnhancedSoilRecommendations = (N, P, K, rainfall, humidity) => {
    const soilConditions = {
      nitrogen: N,
      phosphorus: P,
      potassium: K,
      rainfall: rainfall,
      humidity: humidity
    };

    // Analyze soil conditions
    const soilAnalysis = {
      nitrogenLevel: N < 30 ? 'Low' : N < 60 ? 'Medium' : 'High',
      phosphorusLevel: P < 15 ? 'Low' : P < 30 ? 'Medium' : 'High',
      potassiumLevel: K < 20 ? 'Low' : K < 40 ? 'Medium' : 'High',
      moistureLevel: rainfall < 50 ? 'Low' : rainfall < 150 ? 'Medium' : 'High',
      humidityLevel: humidity < 40 ? 'Low' : humidity < 70 ? 'Medium' : 'High'
    };

    // Generate crop recommendations based on soil analysis
    const recommendations = [];

    // High nitrogen crops
    if (soilAnalysis.nitrogenLevel === 'High') {
      recommendations.push({
        crop: 'Rice',
        variety: 'Basmati',
        season: 'monsoon',
        plantingWindow: 'June-July',
        yieldEstimation: '4000-6000 kg/ha',
        reason: 'High nitrogen levels are ideal for rice cultivation. Rice requires substantial nitrogen for optimal growth and yield.',
        suitabilityScore: 95,
        expectedProfit: '₹25000-35000/acre',
        waterRequirement: 'High',
        fertilizerNeeds: 'High N, Medium P, Medium K',
        marketPrice: '₹30-45/kg',
        growingPeriod: '120-150 days',
        riskLevel: 'Low',
        pestResistance: 'Medium',
        diseaseResistance: 'Medium'
      });
    }

    // Medium phosphorus crops
    if (soilAnalysis.phosphorusLevel === 'Medium' || soilAnalysis.phosphorusLevel === 'High') {
      recommendations.push({
        crop: 'Wheat',
        variety: 'HD-2967',
        season: 'winter',
        plantingWindow: 'November-December',
        yieldEstimation: '3000-5000 kg/ha',
        reason: 'Medium to high phosphorus levels support wheat growth. Wheat requires adequate phosphorus for root development and grain formation.',
        suitabilityScore: 88,
        expectedProfit: '₹15000-28000/acre',
        waterRequirement: 'Medium',
        fertilizerNeeds: 'Medium N, High P, Low K',
        marketPrice: '₹22-35/kg',
        growingPeriod: '100-120 days',
        riskLevel: 'Low',
        pestResistance: 'High',
        diseaseResistance: 'High'
      });
    }

    // High potassium crops
    if (soilAnalysis.potassiumLevel === 'High') {
      recommendations.push({
        crop: 'Potato',
        variety: 'Kufri Jyoti',
        season: 'winter',
        plantingWindow: 'October-November',
        yieldEstimation: '20000-35000 kg/ha',
        reason: 'High potassium levels are excellent for potato cultivation. Potassium is crucial for tuber development and quality.',
        suitabilityScore: 92,
        expectedProfit: '₹40000-80000/acre',
        waterRequirement: 'Medium',
        fertilizerNeeds: 'Medium N, High P, High K',
        marketPrice: '₹15-25/kg',
        growingPeriod: '90-120 days',
        riskLevel: 'Medium',
        pestResistance: 'Medium',
        diseaseResistance: 'Medium'
      });
    }

    // Moisture-loving crops
    if (soilAnalysis.moistureLevel === 'High' && soilAnalysis.humidityLevel === 'High') {
      recommendations.push({
        crop: 'Sugarcane',
        variety: 'Co-86032',
        season: 'monsoon',
        plantingWindow: 'June-August',
        yieldEstimation: '80000-120000 kg/ha',
        reason: 'High moisture and humidity levels are perfect for sugarcane. Sugarcane thrives in humid conditions with adequate rainfall.',
        suitabilityScore: 90,
        expectedProfit: '₹100000-200000/acre',
        waterRequirement: 'High',
        fertilizerNeeds: 'High N, Medium P, High K',
        marketPrice: '₹3-5/kg',
        growingPeriod: '300-365 days',
        riskLevel: 'Low',
        pestResistance: 'High',
        diseaseResistance: 'High'
      });
    }

    // Balanced nutrient crops
    if (soilAnalysis.nitrogenLevel === 'Medium' && soilAnalysis.phosphorusLevel === 'Medium' && soilAnalysis.potassiumLevel === 'Medium') {
      recommendations.push({
        crop: 'Maize',
        variety: 'Hybrid-1',
        season: 'post-monsoon',
        plantingWindow: 'September-October',
        yieldEstimation: '5000-8000 kg/ha',
        reason: 'Balanced nutrient levels are ideal for maize cultivation. Maize requires balanced NPK for optimal growth.',
        suitabilityScore: 85,
        expectedProfit: '₹25000-45000/acre',
        waterRequirement: 'Medium',
        fertilizerNeeds: 'High N, Medium P, Medium K',
        marketPrice: '₹20-32/kg',
        growingPeriod: '90-110 days',
        riskLevel: 'Medium',
        pestResistance: 'Medium',
        diseaseResistance: 'Medium'
      });
    }

    // Low nutrient crops
    if (soilAnalysis.nitrogenLevel === 'Low' || soilAnalysis.phosphorusLevel === 'Low' || soilAnalysis.potassiumLevel === 'Low') {
      recommendations.push({
        crop: 'Chili',
        variety: 'Kashmiri',
        season: 'post-monsoon',
        plantingWindow: 'September-October',
        yieldEstimation: '1000-2000 kg/ha',
        reason: 'Chili can tolerate lower nutrient levels and is suitable for soil improvement. It helps in soil conditioning.',
        suitabilityScore: 75,
        expectedProfit: '₹50000-100000/acre',
        waterRequirement: 'Low',
        fertilizerNeeds: 'Medium N, Medium P, High K',
        marketPrice: '₹100-200/kg',
        growingPeriod: '120-150 days',
        riskLevel: 'High',
        pestResistance: 'High',
        diseaseResistance: 'High'
      });
    }

    // Add more diverse recommendations
    recommendations.push({
      crop: 'Tomato',
      variety: 'Cherry',
      season: 'winter',
      plantingWindow: 'November-December',
      yieldEstimation: '25000-40000 kg/ha',
      reason: 'Tomato cultivation is suitable for moderate nutrient levels. High market demand and good profitability.',
      suitabilityScore: 80,
      expectedProfit: '₹60000-120000/acre',
      waterRequirement: 'Medium',
      fertilizerNeeds: 'Medium N, High P, High K',
      marketPrice: '₹20-60/kg',
      growingPeriod: '90-120 days',
      riskLevel: 'High',
      pestResistance: 'Low',
      diseaseResistance: 'Low'
    });

    recommendations.push({
      crop: 'Onion',
      variety: 'Red Onion',
      season: 'winter',
      plantingWindow: 'October-November',
      yieldEstimation: '20000-30000 kg/ha',
      reason: 'Onion cultivation is suitable for various soil conditions. Good storage life and market stability.',
      suitabilityScore: 82,
      expectedProfit: '₹40000-80000/acre',
      waterRequirement: 'Medium',
      fertilizerNeeds: 'Medium N, Medium P, Medium K',
      marketPrice: '₹25-80/kg',
      growingPeriod: '120-150 days',
      riskLevel: 'Medium',
      pestResistance: 'High',
      diseaseResistance: 'High'
    });

    // Sort by suitability score
    return recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await getRecommendations(user?._id);
      
      // Use enhanced mock data if API fails or returns empty data
      if (!res?.data || res.data.length === 0) {
        const mockRecommendations = generateEnhancedMockRecommendations(soilType, season, location);
        setItems(mockRecommendations);
        
        // Generate market trends for mock data
        const topCrops = mockRecommendations.slice(0, 3).map(item => item.crop);
        const simulatedTrends = generateMockMarketTrends(topCrops, 7);
        setMarketTrends(simulatedTrends);
        setMarketDrivers('');
      } else {
        setItems(res.data);
        
        // Fetch market trends for the top 3 crops
        const topCrops = res.data.slice(0, 3).map(item => item.crop);
        try {
          const trendsRes = await assistantService.getMarketTrends(topCrops, 7);
          if (trendsRes?.data?.trends) {
            setMarketTrends(trendsRes.data.trends);
            setMarketDrivers(trendsRes.data.marketDrivers || '');
          }
        } catch (err) {
          console.error('Failed to fetch market trends:', err);
          // Use simulated data as fallback when API fails
          const simulatedTrends = generateMockMarketTrends(topCrops, 7);
          setMarketTrends(simulatedTrends);
          setMarketDrivers('');
        }
      }
      
      const h = await getSoilHistory();
      setSoilHistory(h?.data || []);
      const fav = await listFavorites();
      setFavorites(fav?.data || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      // Fallback to mock data
      const mockRecommendations = generateEnhancedMockRecommendations(soilType, season, location);
      setItems(mockRecommendations);
      
      const topCrops = mockRecommendations.slice(0, 3).map(item => item.crop);
      const simulatedTrends = generateMockMarketTrends(topCrops, 7);
      setMarketTrends(simulatedTrends);
      setMarketDrivers('');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const trendData = useMemo(() => {
    if (marketTrends) {
      // Use real market trends data
      return convertTrendsToChartData(marketTrends);
    } else if (items && items.length > 0) {
      // Fallback to original mock data based on items
      const crops = items.slice(0, 3).map(item => item.crop);
      const mockTrends = generateMockMarketTrends(crops, 7);
      return convertTrendsToChartData(mockTrends);
    } else {
      // Complete fallback with generic mock data
      return generateFallbackChartData(7);
    }
  }, [items, marketTrends]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <HomeButton />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Crop Recommendations</h2>
        <div className="flex gap-2">
          <button onClick={async () => {
            try {
              const salt = String(Date.now());
              const res = await generateRecommendations({ soilType, season, location, salt });
              toast.success(res?.message || 'Recommendations generated');
              await load();
            } catch (e) {
              console.error('API failed, using mock data:', e);
              // Use enhanced mock data when API fails
              const mockRecommendations = generateEnhancedMockRecommendations(soilType, season, location);
              setItems(mockRecommendations);
              
              const topCrops = mockRecommendations.slice(0, 3).map(item => item.crop);
              const simulatedTrends = generateMockMarketTrends(topCrops, 7);
              setMarketTrends(simulatedTrends);
              setMarketDrivers('');
              
              toast.success('Generated recommendations using enhanced mock data');
            }
          }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Generate
          </button>
          <button onClick={async () => {
            try {
              const salt = Math.random().toString(36).slice(2);
              const res = await generateRecommendations({ soilType, season, location, salt });
              toast.success('Shuffled');
              await load();
            } catch (e) { 
              console.error('API failed, using mock data:', e);
              // Use enhanced mock data when API fails
              const mockRecommendations = generateEnhancedMockRecommendations(soilType, season, location);
              setItems(mockRecommendations);
              
              const topCrops = mockRecommendations.slice(0, 3).map(item => item.crop);
              const simulatedTrends = generateMockMarketTrends(topCrops, 7);
              setMarketTrends(simulatedTrends);
              setMarketDrivers('');
              
              toast.success('Shuffled recommendations using enhanced mock data');
            }
          }} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Shuffle
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-gray-600">Soil Type</label>
          <select value={soilType} onChange={e => setSoilType(e.target.value)} className="w-full border rounded px-3 py-2">
            <option>Loamy</option><option>Sandy</option><option>Clay</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600">Season</label>
          <select value={season} onChange={e => setSeason(e.target.value)} className="w-full border rounded px-3 py-2">
            <option>pre-monsoon</option><option>monsoon</option><option>post-monsoon</option><option>winter</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600">Location</label>
          <input value={location} onChange={e => setLocation(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
      </div>

      {/* Soil Input Form */}
      <div className="p-4 bg-white rounded-2xl border shadow-sm">
        <div className="font-semibold mb-2">Soil-based Recommendation</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-sm text-gray-600">Nitrogen (N)</label>
            <input value={N} onChange={e=>setN(e.target.value.replace(/[^\d.]/g,''))} onKeyDown={handleBlockSpaceEnter} className="w-full border rounded px-3 py-2" placeholder="e.g., 40" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Phosphorus (P)</label>
            <input value={P} onChange={e=>setP(e.target.value.replace(/[^\d.]/g,''))} onKeyDown={handleBlockSpaceEnter} className="w-full border rounded px-3 py-2" placeholder="e.g., 20" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Potassium (K)</label>
            <input value={K} onChange={e=>setK(e.target.value.replace(/[^\d.]/g,''))} onKeyDown={handleBlockSpaceEnter} className="w-full border rounded px-3 py-2" placeholder="e.g., 30" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Rainfall (mm)</label>
            <input value={rainfall} onChange={e=>setRainfall(e.target.value.replace(/[^\d.]/g,''))} onKeyDown={handleBlockSpaceEnter} className="w-full border rounded px-3 py-2" placeholder="e.g., 120" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Humidity (%)</label>
            <input value={humidity} onChange={e=>setHumidity(e.target.value.replace(/[^\d.]/g,''))} onKeyDown={handleBlockSpaceEnter} className="w-full border rounded px-3 py-2" placeholder="e.g., 70" />
          </div>
        </div>
        <div className="mt-3">
          <button onClick={async ()=>{
            const values = [N, P, K, rainfall, humidity];
            if (values.some(v => String(v).trim() === '')) {
              toast.error('Please enter all soil inputs (no spaces/empty).');
              return;
            }
            try {
              const res = await getSoilRecommendations({ N:Number(N), P:Number(P), K:Number(K), rainfall:Number(rainfall), humidity:Number(humidity) });
              const doc = res?.data;
              setSoilDocId(doc?._id || null);
              setSoilResults(doc?.recommendedCrops || []);
              toast.success('Soil-based recommendations generated');
              await load();
            } catch(e){ 
              console.error('API failed, using enhanced mock data:', e);
              // Use enhanced mock data when API fails
              const mockSoilRecommendations = generateEnhancedSoilRecommendations(Number(N), Number(P), Number(K), Number(rainfall), Number(humidity));
              setSoilResults(mockSoilRecommendations);
              setSoilDocId('mock_' + Date.now());
              toast.success('Generated soil-based recommendations using enhanced mock data');
            }
          }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            Get Recommendations
          </button>
        </div>

        {/* Enhanced Soil Results */}
        {soilResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {soilResults.map((r,i)=>(
              <div key={i} className="p-6 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-xl">
                    <Leaf className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900">{r.crop}</div>
                    <div className="text-sm text-gray-500">{r.variety || 'Any variety'}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        r.suitabilityScore >= 90 ? 'bg-green-100 text-green-800' :
                        r.suitabilityScore >= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {r.suitabilityScore || 85}% Match
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        r.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                        r.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {r.riskLevel || 'Medium'} Risk
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Season:</span>
                    <span className="font-medium">{r.season || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Planting Window:</span>
                    <span className="font-medium">{r.plantingWindow || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Yield:</span>
                    <span className="font-medium">{r.yieldEstimation || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Expected Profit:</span>
                    <span className="font-medium text-green-600">{r.expectedProfit || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Market Price:</span>
                    <span className="font-medium">{r.marketPrice || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Growing Period:</span>
                    <span className="font-medium">{r.growingPeriod || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Water Need:</span>
                    <span className="font-medium">{r.waterRequirement || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Fertilizer Needs:</span>
                    <span className="font-medium text-xs">{r.fertilizerNeeds || '-'}</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-700 mb-4 p-3 bg-gray-50 rounded-lg">
                  {r.reason}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    className="flex-1 text-xs px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1"
                    onClick={async ()=>{
                      if (!soilDocId) return toast.error('No document to save');
                      try {
                        const updated = [...soilResults];
                        updated[i] = { ...updated[i], saved: true };
                        
                        await recommendationService.updateSoilRecommendation(soilDocId, { recommendedCrops: updated });
                        setSoilResults(updated);
                        toast.success('Saved successfully');
                      } catch(e) { 
                        console.error('Save error:', e);
                        toast.error('Save failed: ' + (e.response?.data?.message || e.message || 'Network error'));
                      }
                    }}
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    className="flex-1 text-xs px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1"
                    onClick={async ()=>{
                      try {
                        const res = await toggleFavorite({ crop: r.crop, meta: r, source: 'soil' });
                        toast.success(res?.data?.favorited ? 'Added to favorites' : 'Removed from favorites');
                        await load();
                      } catch(e){ toast.error('Toggle failed'); }
                    }}
                  >
                    <Heart className="w-3 h-3" />
                    {favorites.some(f=>f.crop===r.crop) ? 'Favorited' : 'Favorite'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Crop Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.slice(0,8).map((r, idx) => (
          <div key={idx} className="rec-card p-6 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center text-xl">
                <Sprout className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg text-gray-900">{r.crop}</div>
                <div className="text-sm text-gray-500">{r.variety || 'Any variety'}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    r.suitabilityScore >= 90 ? 'bg-green-100 text-green-800' :
                    r.suitabilityScore >= 80 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {r.suitabilityScore || 85}% Match
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    r.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                    r.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {r.riskLevel || 'Medium'} Risk
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-700 mb-3">{r.reason}</div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Yield:</span>
                <span className="font-medium">{r.expectedYield || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Profit:</span>
                <span className="font-medium text-green-600">{r.profitEstimation || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Market Price:</span>
                <span className="font-medium">{r.marketPrice || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Growing Period:</span>
                <span className="font-medium">{r.growingPeriod || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Water Need:</span>
                <span className="font-medium">{r.waterRequirement || '-'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <button className="flex-1 text-xs px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1">
                <Save className="w-3 h-3" />
                Save
              </button>
              <button className="flex-1 text-xs px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1">
                <Heart className="w-3 h-3" />
                Favorite
              </button>
            </div>
            
            <div className="text-xs text-gray-500 border-t pt-2">
              <div className="flex items-center justify-between">
                <span>Investment: {r.investmentRequired || '₹25,000'}</span>
                <span>ROI: {r.expectedROI || '150%'}</span>
              </div>
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Sprout className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No recommendations yet.</p>
            <p className="text-sm">Click Generate to get crop recommendations based on your conditions.</p>
          </div>
        )}
      </div>

      {/* Comparison Chart */}
      <div className="p-4 bg-white rounded-2xl border shadow-sm">
        <div className="font-semibold mb-2">Market Price Trends</div>
        {marketDrivers && (
          <div className="text-sm text-gray-600 mb-2">{marketDrivers}</div>
        )}
        <div className="h-64">
          {trendData && trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip 
                  formatter={(value) => [formatPrice(value), 'Price (INR/kg)']}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="c1" 
                  name={getCropNameForLegend(marketTrends, items, 0)} 
                  stroke="#10B981" 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="c2" 
                  name={getCropNameForLegend(marketTrends, items, 1)} 
                  stroke="#3B82F6" 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="c3" 
                  name={getCropNameForLegend(marketTrends, items, 2)} 
                  stroke="#F59E0B" 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading market data...
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="p-4 bg-white rounded-2xl border shadow-sm">
        <div className="font-semibold mb-2">Past Soil-Based Recommendations</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left text-gray-600"><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">N-P-K</th><th className="py-2 pr-4">Rain / Humidity</th><th className="py-2 pr-4">Top Crop</th><th className="py-2 pr-4">Actions</th></tr></thead>
            <tbody>
              {soilHistory.map(h => (
                <tr key={h._id} className="border-t">
                  <td className="py-2 pr-4">{new Date(h.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-4">{h.N}-{h.P}-{h.K}</td>
                  <td className="py-2 pr-4">{h.rainfall} mm / {h.humidity}%</td>
                  <td className="py-2 pr-4">{h.recommendedCrops?.[0]?.crop || '-'}</td>
                  <td className="py-2 pr-4 space-x-2">
                    <button className="px-2 py-1 text-xs border rounded" onClick={()=>{ setEditingSoilId(h._id); setEditForm({ N:String(h.N), P:String(h.P), K:String(h.K), rainfall:String(h.rainfall), humidity:String(h.humidity) }); }}>Edit</button>
                    <button className="px-2 py-1 text-xs border rounded" onClick={async ()=>{ 
                      try { 
                        await recommendationService.deleteSoilRecommendation(h._id);
                        toast.success('Deleted successfully');
                        await load(); // Reload the data to reflect the deletion
                      } catch(e) { 
                        console.error('Delete error:', e);
                        toast.error('Delete failed: ' + (e.response?.data?.message || e.message || 'Network error'));
                      } 
                    }}>Delete</button>
                  </td>
                </tr>
              ))}
              {soilHistory.length === 0 && <tr><td className="py-2 text-gray-500" colSpan={4}>No history yet.</td></tr>}
            </tbody>
          </table>
        </div>
        {editingSoilId && (
          <div className="mt-3 p-3 border rounded-lg bg-gray-50">
            <div className="font-medium mb-2">Edit Soil Inputs</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <input className="border rounded px-2 py-1" value={editForm.N} onChange={e=>setEditForm(f=>({...f,N:e.target.value.replace(/[^\d.]/g,'')}))} onKeyDown={handleBlockSpaceEnter} placeholder="N" />
              <input className="border rounded px-2 py-1" value={editForm.P} onChange={e=>setEditForm(f=>({...f,P:e.target.value.replace(/[^\d.]/g,'')}))} onKeyDown={handleBlockSpaceEnter} placeholder="P" />
              <input className="border rounded px-2 py-1" value={editForm.K} onChange={e=>setEditForm(f=>({...f,K:e.target.value.replace(/[^\d.]/g,'')}))} onKeyDown={handleBlockSpaceEnter} placeholder="K" />
              <input className="border rounded px-2 py-1" value={editForm.rainfall} onChange={e=>setEditForm(f=>({...f,rainfall:e.target.value.replace(/[^\d.]/g,'')}))} onKeyDown={handleBlockSpaceEnter} placeholder="Rainfall" />
              <input className="border rounded px-2 py-1" value={editForm.humidity} onChange={e=>setEditForm(f=>({...f,humidity:e.target.value.replace(/[^\d.]/g,'')}))} onKeyDown={handleBlockSpaceEnter} placeholder="Humidity" />
            </div>
            <div className="mt-2 space-x-2">
              <button className="px-3 py-1 text-xs border rounded" onClick={()=>setEditingSoilId(null)}>Cancel</button>
              <button className="px-3 py-1 text-xs border rounded bg-emerald-600 text-white" onClick={async ()=>{ 
                try { 
                  await recommendationService.updateSoilRecommendation(editingSoilId, { 
                    N: Number(editForm.N), 
                    P: Number(editForm.P), 
                    K: Number(editForm.K), 
                    rainfall: Number(editForm.rainfall), 
                    humidity: Number(editForm.humidity) 
                  });
                  toast.success('Updated successfully');
                  setEditingSoilId(null);
                  await load(); // Reload the data to reflect the update
                } catch(e) { 
                  console.error('Update error:', e);
                  toast.error('Update failed: ' + (e.response?.data?.message || e.message || 'Network error'));
                } 
              }}>Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}