const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/farmerai');
    console.log('Connected to database');

    const user = await User.findOne({ email: 'test@example.com' });
    if (user) {
      console.log('User found:', {
        id: user._id,
        email: user.email,
        name: user.name,
        password: user.password ? 'Set' : 'Not set',
        verified: user.verified,
        roles: user.roles,
        userType: user.userType
      });
    } else {
      console.log('User not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
