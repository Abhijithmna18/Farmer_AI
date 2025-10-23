import React, { useEffect, useMemo, useState } from "react";
import HomeButton from "../components/HomeButton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import recommendationService, { generateRecommendations, getRecommendations, getSoilRecommendations, getSoilHistory, toggleFavorite, listFavorites } from '../services/recommendationService';
import { toast } from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import { gsap } from 'gsap';
import assistantService from '../services/assistantService';
import { generateMockMarketTrends, convertTrendsToChartData, generateFallbackChartData, formatPrice, getCropNameForLegend } from '../utils/chartUtils';

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

  const load = async () => {
    try {
      setLoading(true);
      const res = await getRecommendations(user?._id);
      setItems(res?.data || []);
      
      // Fetch market trends for the top 3 crops
      if (res?.data && res.data.length > 0) {
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
          setMarketDrivers(''); // Remove the message entirely
        }
      }
      
      const h = await getSoilHistory();
      setSoilHistory(h?.data || []);
      const fav = await listFavorites();
      setFavorites(fav?.data || []);
    } finally { setLoading(false); }
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
              toast.error(e?.response?.data?.message || 'Failed to generate');
            }
          }} className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Generate</button>
          <button onClick={async () => {
            try {
              const salt = Math.random().toString(36).slice(2);
              const res = await generateRecommendations({ soilType, season, location, salt });
              toast.success('Shuffled');
              await load();
            } catch (e) { toast.error('Shuffle failed'); }
          }} className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Shuffle</button>
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
            <input value={N} onChange={e=>setN(e.target.value.replace(/[^\d.]/g,''))} className="w-full border rounded px-3 py-2" placeholder="e.g., 40" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Phosphorus (P)</label>
            <input value={P} onChange={e=>setP(e.target.value.replace(/[^\d.]/g,''))} className="w-full border rounded px-3 py-2" placeholder="e.g., 20" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Potassium (K)</label>
            <input value={K} onChange={e=>setK(e.target.value.replace(/[^\d.]/g,''))} className="w-full border rounded px-3 py-2" placeholder="e.g., 30" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Rainfall (mm)</label>
            <input value={rainfall} onChange={e=>setRainfall(e.target.value.replace(/[^\d.]/g,''))} className="w-full border rounded px-3 py-2" placeholder="e.g., 120" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Humidity (%)</label>
            <input value={humidity} onChange={e=>setHumidity(e.target.value.replace(/[^\d.]/g,''))} className="w-full border rounded px-3 py-2" placeholder="e.g., 70" />
          </div>
        </div>
        <div className="mt-3">
          <button onClick={async ()=>{
            try {
              const res = await getSoilRecommendations({ N:Number(N), P:Number(P), K:Number(K), rainfall:Number(rainfall), humidity:Number(humidity) });
              const doc = res?.data;
              setSoilDocId(doc?._id || null);
              setSoilResults(doc?.recommendedCrops || []);
              toast.success('Soil-based recommendations generated');
              await load();
            } catch(e){ toast.error(e?.response?.data?.message || 'Failed to generate'); }
          }} className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Get Recommendations</button>
        </div>

        {/* Soil Results */}
        {soilResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {soilResults.map((r,i)=>(
              <div key={i} className="p-4 bg-white rounded-2xl border shadow-sm">
                <div className="font-semibold">{r.crop}</div>
                <div className="text-xs text-gray-500">Variety: {r.variety || '-'}</div>
                <div className="text-sm mt-1">Season: {r.season || '-'} • Window: {r.plantingWindow || '-'}</div>
                <div className="text-sm mt-1">Yield: {r.yieldEstimation || '-'}</div>
                <div className="text-sm text-gray-700 mt-2">{r.reason}</div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="text-xs px-2 py-1 border rounded"
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
                  >Save</button>
                  <button
                    className="text-xs px-2 py-1 border rounded"
                    onClick={async ()=>{
                      try {
                        const res = await toggleFavorite({ crop: r.crop, meta: r, source: 'soil' });
                        toast.success(res?.data?.favorited ? 'Added to favorites' : 'Removed from favorites');
                        await load();
                      } catch(e){ toast.error('Toggle failed'); }
                    }}
                  >{favorites.some(f=>f.crop===r.crop) ? '★ Favorited' : '☆ Favorite'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top 5 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.slice(0,5).map((r, idx) => (
          <div key={idx} className="rec-card p-4 bg-white rounded-2xl border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded bg-emerald-50 flex items-center justify-center text-lg">🌾</div>
              <div>
                <div className="font-semibold">{r.crop}</div>
                <div className="text-xs text-gray-500">{r.variety || 'Any variety'}</div>
              </div>
            </div>
            <div className="text-sm text-gray-700">{r.reason}</div>
            <div className="mt-2 text-sm">Yield: {r.expectedYield || '-'} • Profit: {r.profitEstimation || '-'}</div>
            <div className="mt-3 flex gap-2">
              <button className="text-xs px-2 py-1 border rounded">Save</button>
              <button className="text-xs px-2 py-1 border rounded">Exclude</button>
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="text-gray-500">No recommendations yet. Click Generate.</div>
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
              <input className="border rounded px-2 py-1" value={editForm.N} onChange={e=>setEditForm(f=>({...f,N:e.target.value.replace(/[^\d.]/g,'')}))} placeholder="N" />
              <input className="border rounded px-2 py-1" value={editForm.P} onChange={e=>setEditForm(f=>({...f,P:e.target.value.replace(/[^\d.]/g,'')}))} placeholder="P" />
              <input className="border rounded px-2 py-1" value={editForm.K} onChange={e=>setEditForm(f=>({...f,K:e.target.value.replace(/[^\d.]/g,'')}))} placeholder="K" />
              <input className="border rounded px-2 py-1" value={editForm.rainfall} onChange={e=>setEditForm(f=>({...f,rainfall:e.target.value.replace(/[^\d.]/g,'')}))} placeholder="Rainfall" />
              <input className="border rounded px-2 py-1" value={editForm.humidity} onChange={e=>setEditForm(f=>({...f,humidity:e.target.value.replace(/[^\d.]/g,'')}))} placeholder="Humidity" />
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