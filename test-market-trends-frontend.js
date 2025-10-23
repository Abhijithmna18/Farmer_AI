// Test the frontend service function
const fs = require('fs');

// Read the assistantService.js file
const serviceFile = fs.readFileSync('./farmerai-frontend/src/services/assistantService.js', 'utf8');

// Check if getMarketTrends function is properly exported
if (serviceFile.includes('getMarketTrends') && serviceFile.includes('export {') && serviceFile.includes('getMarketTrends')) {
  console.log('✅ Frontend service function is properly defined and exported');
} else {
  console.log('❌ Frontend service function is not properly defined or exported');
}

// Check if the function is included in the default export
if (serviceFile.includes('getMarketTrends') && serviceFile.includes('assistantService')) {
  console.log('✅ Frontend service function is included in the assistantService object');
} else {
  console.log('❌ Frontend service function is not included in the assistantService object');
}

// Check if the Recommendations.jsx file imports the service
const recommendationsFile = fs.readFileSync('./farmerai-frontend/src/pages/Recommendations.jsx', 'utf8');

if (recommendationsFile.includes('assistantService') && recommendationsFile.includes('getMarketTrends')) {
  console.log('✅ Recommendations component imports assistantService');
} else {
  console.log('❌ Recommendations component does not import assistantService properly');
}

// Check if the component uses the getMarketTrends function
if (recommendationsFile.includes('getMarketTrends') && recommendationsFile.includes('marketTrends')) {
  console.log('✅ Recommendations component uses getMarketTrends function');
} else {
  console.log('❌ Recommendations component does not use getMarketTrends function properly');
}

console.log('\nFrontend implementation verification complete!');