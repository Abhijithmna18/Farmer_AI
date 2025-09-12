const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');

async function testPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/farmerai');
    console.log('Connected to database');

    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User password hash:', user.password);

    const isMatch = await bcrypt.compare('password123', user.password);
    console.log('Password match:', isMatch);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testPassword();
