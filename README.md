# Deploy

Express.js middleware that provides a web interface for deploying applications via Git pull, dependency installation, and service restart.

## Installation

```bash
npm install @kiza/deploy
```

## Usage

```javascript
import express from 'express';
import createDeployMiddleware from '@kiza/deploy';

const app = express();

// Mount the deploy middleware
app.use('/_deploy', ensureAuthed, createDeployMiddleware({
    express: app,
    serviceName: 'your-service-name',  // Required: systemd service name
    rootPath: '/_deploy' // Must be the same as the first app.use param
    folderPath: '/path/to/your/project', // Optional: defaults to process.cwd()
    includeDev: false,                 // Optional: include dev dependencies
    runBuild: false,                   // Optional: run npm run build after install
    logger: console                     // Optional: custom logger
}));

function ensureAuthed(req, res, next) {
    // Simple API key authentication
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const validApiKey = process.env.DEPLOY_API_KEY || 'your-secret-key';
    
    if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Valid API key required' 
        });
    }
    
    next();
}

app.listen(3000);
```

## Deployment Process

1. Visit `/_deploy` in your browser
2. Enter your Git username and access token
3. Click "Deploy" to trigger:
   - Git pull from origin
   - npm install (with optional dev dependencies)
   - Optional build step
   - Service restart via systemctl

## Requirements

- Node.js with ES modules support
- systemd service for your application
- Git repository with HTTPS access
- sudo privileges for service restart

