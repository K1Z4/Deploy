import fs from 'fs';

// Simple template engine
export async function renderTemplate(templatePath, variables) {
    const template = await fs.promises.readFile(templatePath, 'utf8');
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] !== undefined ? variables[key] : match;
    });
}

export function validateRootPath(rootPath) {
    if (typeof rootPath !== 'string') {
        throw new Error('rootPath must be a string');
    }

    if (!rootPath.startsWith('/')) {
        throw new Error('rootPath must start with /');
    }

    if (rootPath.endsWith('/')) {
        throw new Error('rootPath must not end with / (use "/_deploy" not "/_deploy/")');
    }

    if (!/^\/[\w\-\/]*$/.test(rootPath)) {
        throw new Error('rootPath contains invalid characters (only alphanumeric, hyphens, underscores, and forward slashes allowed)');
    }
}