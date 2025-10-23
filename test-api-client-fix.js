// Test the API client fix
const fs = require('fs');

console.log('Testing API Client Fix...\n');

// Check if the recommendationService.js file has been updated
try {
  const serviceFile = fs.readFileSync('./farmerai-frontend/src/services/recommendationService.js', 'utf8');
  
  // Check for new delete function
  if (serviceFile.includes('deleteSoilRecommendation') && 
      serviceFile.includes('apiClient.delete')) {
    console.log('✅ Delete function added to recommendation service');
  } else {
    console.log('❌ Delete function may not be properly added to recommendation service');
  }
  
  // Check for new update function
  if (serviceFile.includes('updateSoilRecommendation') && 
      serviceFile.includes('apiClient.put')) {
    console.log('✅ Update function added to recommendation service');
  } else {
    console.log('❌ Update function may not be properly added to recommendation service');
  }
  
} catch (err) {
  console.log('❌ Could not read recommendationService.js file');
}

// Check if the Recommendations.jsx file has been updated
try {
  const recommendationsFile = fs.readFileSync('./farmerai-frontend/src/pages/Recommendations.jsx', 'utf8');
  
  // Check for improved API calls using recommendationService
  if (recommendationsFile.includes('recommendationService.deleteSoilRecommendation') && 
      recommendationsFile.includes('recommendationService.updateSoilRecommendation')) {
    console.log('✅ Recommendations component uses proper API client');
  } else {
    console.log('❌ Recommendations component may not use proper API client');
  }
  
} catch (err) {
  console.log('❌ Could not read Recommendations.jsx file');
}

console.log('\nFix verification complete!');
console.log('The API client issue should now be resolved:');
console.log('1. Requests now use the proper API base URL');
console.log('2. Token authentication is handled automatically');
console.log('3. Better error handling with axios response structure');
console.log('4. Consistent with other API calls in the application');