---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary
This repository contains a full-stack application called Farmer AI, consisting of a React frontend and Express.js backend. The application appears to be designed to provide AI-powered services for farmers, with authentication capabilities including Google OAuth integration.

## Repository Structure
The repository is organized into two main components:
- **farmerai-frontend**: React-based frontend built with Vite
- **FarmerAI-backend**: Express.js-based backend API

### Main Repository Components
- **farmerai-frontend**: User interface built with React, Vite, and TailwindCSS
- **FarmerAI-backend**: RESTful API server with authentication, database integration, and business logic
- **.zencoder**: Configuration directory for development tools

## Projects

### farmerai-frontend
**Configuration File**: package.json

#### Language & Runtime
**Language**: JavaScript (React)
**Version**: React 19.1.1
**Build System**: Vite 7.1.2
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- react 19.1.1
- react-dom 19.1.1
- react-router-dom 7.8.1
- axios 1.11.0
- firebase 12.1.0
- framer-motion 12.23.12
- bootstrap 5.3.7

**Development Dependencies**:
- vite 7.1.2
- eslint 9.33.0
- tailwindcss 3.4.17
- postcss 8.5.6

#### Build & Installation
```bash
npm install
npm run dev    # Development server
npm run build  # Production build
```

#### Testing
**Framework**: Not explicitly defined, but test files exist
**Test Location**: tests/
**Test Files**: auth.test.jsx

### FarmerAI-backend
**Configuration File**: package.json

#### Language & Runtime
**Language**: JavaScript (Node.js)
**Build System**: Node.js
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- express 5.1.0
- mongoose 8.17.1
- firebase 12.1.0
- firebase-admin 13.4.0
- bcrypt 6.0.0
- jsonwebtoken 9.0.2
- passport 0.7.0
- passport-google-oauth20 2.0.0
- winston 3.17.0

**Development Dependencies**:
- jest 30.0.5
- nodemon 3.1.10
- supertest 7.1.4

#### Build & Installation
```bash
npm install
node server.js        # Start server
# or with nodemon (if available)
nodemon server.js     # Start server with auto-reload
```

#### Testing
**Framework**: Jest 30.0.5
**Test Location**: tests/
**Test Files**: auth.test.js
**Run Command**:
```bash
npx jest
```

#### Server Configuration
**Port**: 5000 (default, configurable via .env)
**Database**: MongoDB (via mongoose)
**Authentication**: JWT, Passport.js with Google OAuth
**API Routes**:
- /api/auth - Authentication endpoints
- / - Health check endpoint