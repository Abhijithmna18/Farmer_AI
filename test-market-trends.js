// First, let's test if the route exists by making a request without auth
const http = require('http');

// Test the market trends endpoint
function testMarketTrends() {
  console.log('Testing market trends endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 5002,
    path: '/api/assistant/market-trends?crops[]=Rice&crops[]=Wheat&crops[]=Maize&days=7',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
      console.log(`Body: ${chunk}`);
    });
    
    res.on('end', () => {
      console.log('Request completed');
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error.message);
  });

  req.end();
}

testMarketTrends();