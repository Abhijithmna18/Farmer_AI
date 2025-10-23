// src/services/config.service.js
const fs = require('fs');
const path = require('path');

class ConfigService {
  constructor() {
    this.envPath = path.resolve(__dirname, '../../.env');
  }

  // Read environment variables from .env file
  readEnvFile() {
    try {
      if (!fs.existsSync(this.envPath)) {
        return {};
      }

      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const envVars = {};
      
      envContent.split('\n').forEach(line => {
        // Skip comments and empty lines
        if (line.trim() === '' || line.startsWith('#')) {
          return;
        }
        
        const [key, value] = line.split('=');
        if (key && value !== undefined) {
          envVars[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes
        }
      });
      
      return envVars;
    } catch (error) {
      console.error('Error reading .env file:', error);
      return {};
    }
  }

  // Update environment variables in .env file
  updateEnvFile(updates) {
    try {
      // Read current .env file
      let envContent = '';
      if (fs.existsSync(this.envPath)) {
        envContent = fs.readFileSync(this.envPath, 'utf8');
      }

      // Convert to array of lines for easier manipulation
      const lines = envContent.split('\n');
      const updatedLines = [];
      const updatedKeys = new Set(Object.keys(updates));

      // Process each line
      lines.forEach(line => {
        // Skip empty lines and comments
        if (line.trim() === '' || line.startsWith('#')) {
          updatedLines.push(line);
          return;
        }

        const [key, value] = line.split('=');
        if (key && value !== undefined) {
          const trimmedKey = key.trim();
          // If this key is being updated, use the new value
          if (updatedKeys.has(trimmedKey)) {
            updatedLines.push(`${trimmedKey}=${updates[trimmedKey]}`);
            updatedKeys.delete(trimmedKey); // Remove from set to track which ones we've handled
          } else {
            // Keep existing line as is
            updatedLines.push(line);
          }
        } else {
          // Keep malformed lines as is
          updatedLines.push(line);
        }
      });

      // Add any new keys that weren't in the original file
      updatedKeys.forEach(key => {
        updatedLines.push(`${key}=${updates[key]}`);
      });

      // Write back to file
      fs.writeFileSync(this.envPath, updatedLines.join('\n'), 'utf8');
      
      return true;
    } catch (error) {
      console.error('Error updating .env file:', error);
      return false;
    }
  }

  // Mask sensitive values for security
  maskSensitiveValues(envVars) {
    const sensitiveKeys = [
      'JWT_SECRET',
      'EMAIL_PASS',
      'RAZORPAY_KEY_SECRET',
      'FIREBASE_PRIVATE_KEY',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REFRESH_TOKEN'
    ];

    const maskedVars = { ...envVars };
    
    sensitiveKeys.forEach(key => {
      if (maskedVars[key]) {
        maskedVars[key] = '********';
      }
    });
    
    // Special handling for MongoDB URI
    if (maskedVars.MONGO_URI) {
      maskedVars.MONGO_URI = maskedVars.MONGO_URI.replace(
        /\/\/([^:]+):([^@]+)@/,
        '//***:***@'
      );
    }
    
    return maskedVars;
  }
}

module.exports = new ConfigService();