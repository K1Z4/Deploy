import express from 'express';
import createDeployMiddleware from './deploy.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Mount the deploy middleware
app.use('/deploy-service', authCheck, createDeployMiddleware({
    express: express,
    rootPath: "/deploy-service", // Must be the same as first param of app.use
    serviceName: 'example-service', // Mock service name
    includeDev: false,
    runBuild: false,
    logger: console
}));


// Add a root endpoint with instructions
app.get('/', (req, res) => {
    res.send('Hello World, go to <a href="/deploy">Deploy page</a>');
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Example server running on http://localhost:${PORT}/deploy`);
});

// Mock authentication check. Always ensure the route is authed!
function authCheck(req, res, next) {
    if (false) {
        res.status(403).send("Not authed for deploy");
        return;
    }

    next();
}