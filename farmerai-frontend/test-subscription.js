// Test script to debug subscription order creation
async function testSubscriptionOrder() {
  try {
    console.log('Testing subscription order creation...');
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    console.log('Token:', token ? 'Found' : 'Not found');
    
    if (!token) {
      console.log('No token found. Please log in first.');
      return;
    }
    
    // Test the API call
    const response = await fetch('http://localhost:5002/api/workshops/subscription/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'monthly'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Check if response is OK before parsing JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response text:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testSubscriptionOrder();