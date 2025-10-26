# FarmerAI Frontend

This is the frontend application for FarmerAI built with React and Vite.

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Deployment to Render

The application is configured for deployment to Render with the following settings:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run serve`
- **Port**: Configured to use the PORT environment variable

The application will automatically use the PORT environment variable on Render while defaulting to port 5173 locally.
