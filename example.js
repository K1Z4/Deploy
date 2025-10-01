import express from 'express';
import createDeployMiddleware from './deploy.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Mount the deploy middleware
app.use('/deploy', createDeployMiddleware({
    express: express,
    serviceName: 'example-service', // Mock service name
    includeDev: true, // Include dev dependencies
    runBuild: false, // Don't run build for testing
    folderPath: process.cwd(), // Use current directory
    logger: console // Use console for logging
}));


// Add a root endpoint with instructions
app.get('/', (req, res) => {
    res.send('Hello World');
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Example server running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down example server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down example server...');
    process.exit(0);
});
