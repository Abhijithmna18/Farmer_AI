const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

console.log('JWT_SECRET:', JWT_SECRET ? 'SET' : 'NOT SET');
console.log('JWT_SECRET length:', JWT_SECRET.length);

// Test JWT generation like admin login
const payload = {
  id: 'admin',
  email: 'abhijithmnair2002@gmail.com',
  role: 'admin'
};

console.log('Payload:', payload);

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
console.log('Generated token:', token.substring(0, 50) + '...');

// Test JWT verification
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ JWT verification successful');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.log('❌ JWT verification failed:', error.message);
}
