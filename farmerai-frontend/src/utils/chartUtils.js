// Utility functions for chart data generation and handling

/**
 * Generate simulated market trends for crops
 * @param {string[]} crops - Array of crop names
 * @param {number} days - Number of days of data to generate
 * @returns {Object} Object with crop names as keys and price arrays as values
 */
export const generateMockMarketTrends = (crops, days = 7) => {
  const simulatedTrends = {};
  
  crops.forEach((crop, index) => {
    // Base price varies by crop type (Rice: ~15-25, Wheat: ~20-30, Maize: ~25-35)
    const basePrice = 15 + index * 5 + Math.random() * 10;
    
    simulatedTrends[crop] = Array.from({ length: days }, (_, i) => {
      // Create natural price fluctuations using sine wave + random variation
      const trendComponent = Math.sin(i * 0.5 + index) * 2;
      const randomVariation = (Math.random() * 0.2 - 0.1); // ±10% variation
      const price = basePrice + trendComponent + randomVariation;
      
      // Ensure price is positive and format to 2 decimal places
      return parseFloat(Math.max(0.01, price).toFixed(2));
    });
  });
  
  return simulatedTrends;
};

/**
 * Convert market trends object to chart data format
 * @param {Object} marketTrends - Object with crop names as keys and price arrays as values
 * @returns {Array} Array of objects formatted for Recharts
 */
export const convertTrendsToChartData = (marketTrends) => {
  if (!marketTrends) return [];
  
  const crops = Object.keys(marketTrends);
  const days = marketTrends[crops[0]]?.length || 0;
  
  if (days === 0) return [];
  
  return Array.from({ length: days }, (_, i) => {
    const dataPoint = { day: i + 1 };
    crops.forEach((crop, idx) => {
      dataPoint[`c${idx+1}`] = marketTrends[crop][i] || null;
    });
    return dataPoint;
  });
};

/**
 * Generate fallback chart data when no real data is available
 * @param {number} days - Number of days of data to generate
 * @returns {Array} Array of objects formatted for Recharts
 */
export const generateFallbackChartData = (days = 7) => {
  return Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    c1: parseFloat((25 + Math.sin(i) * 3 + Math.random() * 2).toFixed(2)),
    c2: parseFloat((30 + Math.cos(i) * 2 + Math.random() * 2).toFixed(2)),
    c3: parseFloat((20 + Math.sin(i * 0.5) * 4 + Math.random() * 2).toFixed(2))
  }));
};

/**
 * Format price for display in tooltips
 * @param {number} price - Price value
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  return `₹${parseFloat(price).toFixed(2)}`;
};

/**
 * Get crop name for chart legend
 * @param {Object} marketTrends - Market trends object
 * @param {Array} items - Recommendation items
 * @param {number} index - Crop index
 * @returns {string} Crop name for legend
 */
export const getCropNameForLegend = (marketTrends, items, index) => {
  if (marketTrends) {
    const crops = Object.keys(marketTrends);
    return crops[index] || `Crop ${String.fromCharCode(65 + index)}`;
  }
  return items[index]?.crop || `Crop ${String.fromCharCode(65 + index)}`;
};

export default {
  generateMockMarketTrends,
  convertTrendsToChartData,
  generateFallbackChartData,
  formatPrice,
  getCropNameForLegend
};