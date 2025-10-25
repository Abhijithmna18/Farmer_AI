#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DependencyInstaller {
    constructor() {
        this.rootDir = path.join(__dirname, '..');
    }

    async install() {
        console.log('📦 Installing Selenium Test Dependencies');
        console.log('========================================');
        
        try {
            await this.installNodeModules();
            await this.installBrowserDrivers();
            await this.verifyInstallation();
            
            console.log('\n✅ All dependencies installed successfully!');
        } catch (error) {
            console.error('❌ Installation failed:', error.message);
            process.exit(1);
        }
    }

    async installNodeModules() {
        console.log('📦 Installing Node.js modules...');
        
        const packageJson = {
            "name": "farmer-ai-selenium-tests",
            "version": "1.0.0",
            "description": "Selenium WebDriver tests for Farmer AI application",
            "main": "index.js",
            "scripts": {
                "test": "mocha tests/**/*.js --timeout 30000",
                "test:auth": "mocha tests/auth/*.js --timeout 30000",
                "test:dashboard": "mocha tests/dashboard/*.js --timeout 30000",
                "test:warehouse": "mocha tests/warehouse/*.js --timeout 30000",
                "test:payment": "mocha tests/payment/*.js --timeout 30000",
                "test:admin": "mocha tests/admin/*.js --timeout 30000",
                "test:all": "mocha tests/**/*.js --timeout 60000",
                "test:headless": "mocha tests/**/*.js --timeout 30000 --env headless",
                "test:chrome": "mocha tests/**/*.js --timeout 30000 --env chrome",
                "test:firefox": "mocha tests/**/*.js --timeout 30000 --env firefox",
                "setup": "node scripts/setup.js",
                "install-deps": "node scripts/install-dependencies.js"
            },
            "dependencies": {
                "selenium-webdriver": "^4.15.0",
                "chai": "^4.3.10",
                "mocha": "^10.2.0",
                "dotenv": "^16.3.1",
                "axios": "^1.6.0",
                "moment": "^2.29.4"
            },
            "devDependencies": {
                "chromedriver": "^119.0.1",
                "geckodriver": "^4.2.1"
            }
        };

        // Write package.json if it doesn't exist
        const packageJsonPath = path.join(this.rootDir, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            console.log('✅ Created package.json');
        }

        // Install dependencies
        try {
            execSync('npm install', { 
                cwd: this.rootDir, 
                stdio: 'inherit' 
            });
            console.log('✅ Node.js modules installed');
        } catch (error) {
            throw new Error('Failed to install Node.js modules');
        }
    }

    async installBrowserDrivers() {
        console.log('🌐 Installing browser drivers...');
        
        try {
            // Install ChromeDriver
            console.log('   Installing ChromeDriver...');
            execSync('npm install chromedriver --save-dev', { 
                cwd: this.rootDir, 
                stdio: 'pipe' 
            });
            console.log('   ✅ ChromeDriver installed');
            
            // Install GeckoDriver
            console.log('   Installing GeckoDriver...');
            execSync('npm install geckodriver --save-dev', { 
                cwd: this.rootDir, 
                stdio: 'pipe' 
            });
            console.log('   ✅ GeckoDriver installed');
            
        } catch (error) {
            console.warn('⚠️  Browser driver installation failed:', error.message);
            console.warn('   You may need to install drivers manually');
        }
    }

    async verifyInstallation() {
        console.log('🔍 Verifying installation...');
        
        // Check if node_modules exists
        const nodeModulesPath = path.join(this.rootDir, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            throw new Error('node_modules directory not found');
        }
        
        // Check if key dependencies are installed
        const keyDependencies = [
            'selenium-webdriver',
            'chai',
            'mocha',
            'chromedriver',
            'geckodriver'
        ];
        
        for (const dep of keyDependencies) {
            const depPath = path.join(nodeModulesPath, dep);
            if (!fs.existsSync(depPath)) {
                console.warn(`⚠️  Dependency ${dep} not found`);
            } else {
                console.log(`   ✅ ${dep} found`);
            }
        }
        
        // Check if test files exist
        const testDirs = [
            'tests/auth',
            'tests/dashboard',
            'tests/warehouse',
            'tests/payment',
            'tests/farm-monitoring',
            'tests/admin'
        ];
        
        for (const dir of testDirs) {
            const dirPath = path.join(this.rootDir, dir);
            if (!fs.existsSync(dirPath)) {
                console.warn(`⚠️  Test directory ${dir} not found`);
            } else {
                console.log(`   ✅ ${dir} found`);
            }
        }
        
        console.log('✅ Installation verification complete');
    }
}

// Run installation if this script is executed directly
if (require.main === module) {
    const installer = new DependencyInstaller();
    installer.install().catch(console.error);
}

module.exports = DependencyInstaller;

