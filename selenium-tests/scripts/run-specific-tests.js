#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class SpecificTestRunner {
    constructor() {
        this.rootDir = path.join(__dirname, '..');
        this.availableTests = this.getAvailableTests();
    }

    getAvailableTests() {
        const testDir = path.join(this.rootDir, 'tests');
        const tests = {};
        
        if (fs.existsSync(testDir)) {
            const categories = fs.readdirSync(testDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            
            for (const category of categories) {
                const categoryPath = path.join(testDir, category);
                const files = fs.readdirSync(categoryPath)
                    .filter(file => file.endsWith('.test.js'))
                    .map(file => file.replace('.test.js', ''));
                
                tests[category] = files;
            }
        }
        
        return tests;
    }

    async run() {
        const args = process.argv.slice(2);
        
        if (args.length === 0) {
            this.showHelp();
            return;
        }
        
        const command = args[0];
        
        switch (command) {
            case 'list':
                this.listTests();
                break;
            case 'run':
                await this.runSpecificTest(args[1], args[2]);
                break;
            case 'category':
                await this.runCategory(args[1]);
                break;
            case 'help':
                this.showHelp();
                break;
            default:
                console.error(`❌ Unknown command: ${command}`);
                this.showHelp();
        }
    }

    showHelp() {
        console.log('🧪 Farmer AI Selenium Test Runner');
        console.log('=================================');
        console.log('');
        console.log('Usage:');
        console.log('  node scripts/run-specific-tests.js list                    # List all available tests');
        console.log('  node scripts/run-specific-tests.js run <category> <test>  # Run specific test');
        console.log('  node scripts/run-specific-tests.js category <category>    # Run all tests in category');
        console.log('  node scripts/run-specific-tests.js help                   # Show this help');
        console.log('');
        console.log('Examples:');
        console.log('  node scripts/run-specific-tests.js run auth login         # Run login test');
        console.log('  node scripts/run-specific-tests.js category dashboard     # Run all dashboard tests');
        console.log('  node scripts/run-specific-tests.js list                   # List all tests');
    }

    listTests() {
        console.log('📋 Available Tests');
        console.log('==================');
        
        for (const [category, tests] of Object.entries(this.availableTests)) {
            console.log(`\n${category.toUpperCase()}:`);
            for (const test of tests) {
                console.log(`  - ${test}`);
            }
        }
        
        console.log('\n💡 Usage:');
        console.log('  node scripts/run-specific-tests.js run <category> <test>');
        console.log('  node scripts/run-specific-tests.js category <category>');
    }

    async runSpecificTest(category, test) {
        if (!category || !test) {
            console.error('❌ Please specify both category and test name');
            console.log('Usage: node scripts/run-specific-tests.js run <category> <test>');
            return;
        }
        
        if (!this.availableTests[category]) {
            console.error(`❌ Category '${category}' not found`);
            console.log('Available categories:', Object.keys(this.availableTests).join(', '));
            return;
        }
        
        if (!this.availableTests[category].includes(test)) {
            console.error(`❌ Test '${test}' not found in category '${category}'`);
            console.log('Available tests in', category + ':', this.availableTests[category].join(', '));
            return;
        }
        
        const testFile = path.join(this.rootDir, 'tests', category, `${test}.test.js`);
        
        if (!fs.existsSync(testFile)) {
            console.error(`❌ Test file not found: ${testFile}`);
            return;
        }
        
        console.log(`🧪 Running test: ${category}/${test}`);
        console.log('==================');
        
        await this.executeTest(testFile);
    }

    async runCategory(category) {
        if (!category) {
            console.error('❌ Please specify a category');
            console.log('Usage: node scripts/run-specific-tests.js category <category>');
            return;
        }
        
        if (!this.availableTests[category]) {
            console.error(`❌ Category '${category}' not found`);
            console.log('Available categories:', Object.keys(this.availableTests).join(', '));
            return;
        }
        
        console.log(`🧪 Running all tests in category: ${category}`);
        console.log('=====================================');
        
        const testPattern = path.join(this.rootDir, 'tests', category, '*.js');
        await this.executeTest(testPattern);
    }

    async executeTest(testPath) {
        return new Promise((resolve, reject) => {
            const mochaPath = path.join(this.rootDir, 'node_modules/.bin/mocha');
            const args = [
                testPath,
                '--timeout', '30000',
                '--reporter', 'spec',
                '--bail'
            ];
            
            const child = spawn(mochaPath, args, {
                cwd: this.rootDir,
                stdio: 'inherit',
                env: process.env
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    console.log('\n✅ Test completed successfully');
                } else {
                    console.log('\n❌ Test failed');
                }
                resolve();
            });
            
            child.on('error', (error) => {
                console.error('❌ Error running test:', error);
                reject(error);
            });
        });
    }
}

// Run if this script is executed directly
if (require.main === module) {
    const runner = new SpecificTestRunner();
    runner.run().catch(console.error);
}

module.exports = SpecificTestRunner;

