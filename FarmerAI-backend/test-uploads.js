// Test script to verify upload directories exist
const fs = require('fs');
const path = require('path');

const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'profile-pictures'),
  path.join(__dirname, 'uploads', 'warehouses'),
  path.join(__dirname, 'uploads', 'feedback-attachments'),
  path.join(__dirname, 'src', 'uploads')
];

console.log('Checking upload directories...\n');

uploadDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir} - EXISTS`);
  } else {
    console.log(`❌ ${dir} - MISSING`);
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ ${dir} - CREATED`);
    } catch (error) {
      console.log(`❌ ${dir} - FAILED TO CREATE: ${error.message}`);
    }
  }
});

console.log('\nUpload directory check complete!');



