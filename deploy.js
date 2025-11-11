import util from 'util';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderTemplate, validateRootPath } from './util/templating.js';

const execAsync = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function createDeployMiddleware(options = {}) {
    const config = {
        express: options.express,
        rootPath: options.rootPath || '/deploy',
        serviceName: options.serviceName,
        includeDev: options.includeDev || false,
        runBuild: options.runBuild || false,
        folderPath: options.folderPath || process.cwd(),
        logger: options.logger || console,
    };

    if (!config.express) {
        throw new Error('options.express needs to be an Express instance.');
    }

    if (!config.serviceName) {
        throw new Error('options.serviceName is required.');
    }

    validateRootPath(config.rootPath);

    const router = config.express.Router();

    // Serve the main deploy page with dynamic template
    router.get('/', async (req, res) => {
        const templatePath = path.join(__dirname, 'template.html');
        const variables = {
            rootPath: config.rootPath
        };
        const html = await renderTemplate(templatePath, variables);
        res.send(html);
    });
    router.post('/', config.express.json(), deploy(config));

    router.get('/uptime', uptime);

    router.use(config.express.static(path.join(__dirname, 'public')));

    return router;
}

function uptime(req, res, next) {
    const uptime = process.uptime();
    res.json({ uptime });
}

function deploy(config) {
    return async (req, res, next) => {
        try {
            const username = req.body.gitUsername;
            const accessToken = req.body.gitAccessToken;
            if (!username || !accessToken) {
                res.json({
                    success: false,
                    message: 'Username and access token are required',
                });
                return;
            }

            res.on('finish', () => {
                restartService(config);
            });

            const repoPath = await getGitRepoPath(config);
            const gitPull = `git pull https://${username}:${accessToken}@github.com/${repoPath}`;
            const command = 
                `${gitPull} && npm install --no-audit ${config.includeDev ? '--include=dev' : '--omit=dev'} ${config.runBuild ? '&& npm run build' : ''}`;

            try {
                const { stdout, stderr } = await execAsync(command, { cwd: config.folderPath });

                res.json({
                    success: true,
                    stdout: stdout + stderr,
                });
            } catch (deployError) {
                config.logger.error("Error deploying");
                config.logger.error(deployError);
                const errorText = deployError.stdout + deployError.stderr || deployError;
                res.json({
                    success: false,
                    stdout: errorText,
                });
            }
        } catch (err) {
            next(err);
        }
    };
}

async function restartService(config) {
    try {
        const command = `sudo systemctl restart ${config.serviceName}`;
        await execAsync(command);
    } catch (error) {
        config.logger.error(error);
    }
}

async function getGitRepoPath(config) {
    const currentGitRepo = await execAsync('git remote get-url origin', { cwd: config.folderPath });
    const repoUrl = currentGitRepo.stdout.trim();
    
    // Handle SSH URLs (git@github.com:user/repo.git)
    if (repoUrl.startsWith('git@')) {
        return repoUrl.split(':')[1].replace('.git', '');
    }
    
    // Handle HTTPS URLs (https://github.com/user/repo.git)
    try {
        const url = new URL(repoUrl);
        return url.pathname.slice(1).replace('.git', ''); // Remove leading slash and .git
    } catch (error) {
        config.logger.error(`Invalid Git repository URL format: ${repoUrl}`);
        throw error;
    }
}

