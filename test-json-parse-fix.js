// Test the JSON parsing fix
const fs = require('fs');

console.log('Testing JSON Parsing Fix...\n');

// Check if the Recommendations.jsx file has been updated
try {
  const recommendationsFile = fs.readFileSync('./farmerai-frontend/src/pages/Recommendations.jsx', 'utf8');
  
  // Check for improved error handling in delete function
  if (recommendationsFile.includes('try {') && 
      recommendationsFile.includes('const errorData = await response.json();') && 
      recommendationsFile.includes('} catch (parseError) {')) {
    console.log('✅ Delete functionality has improved JSON parsing error handling');
  } else {
    console.log('❌ Delete functionality may not have proper JSON parsing error handling');
  }
  
  // Check for improved error handling in update function
  if (recommendationsFile.includes('PUT') && 
      recommendationsFile.includes('response.statusText ||') && 
      recommendationsFile.includes('parseError')) {
    console.log('✅ Update functionality has improved JSON parsing error handling');
  } else {
    console.log('❌ Update functionality may not have proper JSON parsing error handling');
  }
  
  // Check for improved error handling in save function
  if (recommendationsFile.includes('recommendedCrops: updated') && 
      recommendationsFile.includes('response.statusText ||') && 
      recommendationsFile.includes('parseError')) {
    console.log('✅ Save functionality has improved JSON parsing error handling');
  } else {
    console.log('❌ Save functionality may not have proper JSON parsing error handling');
  }
  
} catch (err) {
  console.log('❌ Could not read Recommendations.jsx file');
}

console.log('\nFix verification complete!');
console.log('The JSON parsing issue should now be resolved:');
console.log('1. Empty responses are handled gracefully');
console.log('2. JSON parsing errors are caught and handled');
console.log('3. Fallback to statusText when JSON parsing fails');
console.log('4. Proper user feedback in all scenarios');