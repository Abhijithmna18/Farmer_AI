// Test script to verify chart data generation
function generateMockTrendData() {
  // Simulate what would happen if we had 3 crops
  const crops = ['Rice', 'Wheat', 'Maize'];
  
  // Generate mock price trends for each crop
  const mockTrends = {};
  crops.forEach((crop, index) => {
    const basePrice = 15 + index * 5 + Math.random() * 10;
    mockTrends[crop] = Array.from({ length: 7 }, (_, i) => {
      const variation = 1 + (Math.random() * 0.2 - 0.1);
      return parseFloat((basePrice * variation).toFixed(2));
    });
  });
  
  // Convert to chart format
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const dataPoint = { day: i + 1 };
    crops.forEach((crop, idx) => {
      dataPoint[`c${idx+1}`] = mockTrends[crop][i] || null;
    });
    return dataPoint;
  });
  
  console.log('Mock Trends Object:', mockTrends);
  console.log('Chart Data:', trendData);
  return { mockTrends, trendData };
}

// Test the function
generateMockTrendData();
console.log('\nChart should now display mock data even without backend connectivity!');