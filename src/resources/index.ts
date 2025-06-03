/**
 * This module provides MCP resources for Minecraft server management.
 * Resources provide static information and documentation that can be referenced by AI models.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { MinecraftMcpServer } from '@minecraft-mcp-server/types';
import { getAllTemplates } from './templates/utils';
import { generateTemplateDocumentation } from './templates/documentation';

/**
 * Helper function to load markdown content from a file
 */
function loadResourcesDocumentation(filename: string): string {
    const contentPath = join(process.cwd(), 'docs', 'resources', filename);
    return readFileSync(contentPath, 'utf-8');
}

/**
 * Registers all MCP resources with the server.
 * Resources provide static information that can be referenced by AI models.
 */
export function registerResources(server: MinecraftMcpServer): void {
    // Minecraft Command Reference
    server.resource(
        'minecraft-commands',
        'minecraft://commands',
        () => ({
            contents: [{
                uri: 'minecraft://commands',
                mimeType: 'text/markdown',
                text: loadResourcesDocumentation('minecraft-commands.md'),
            }],
        }),
    );

    // Building Patterns and Templates
    server.resource(
        'building-patterns',
        'minecraft://building-patterns',
        () => ({
            contents: [{
                uri: 'minecraft://building-patterns',
                mimeType: 'text/markdown',
                text: loadResourcesDocumentation('building-patterns.md'),
            }],
        }),
    );

    // Server Configuration Guide
    server.resource(
        'server-config',
        'minecraft://server-config',
        () => ({
            contents: [{
                uri: 'minecraft://server-config',
                mimeType: 'text/markdown',
                text: loadResourcesDocumentation('server-config.md'),
            }],
        }),
    );

    // Block and Item Reference
    server.resource(
        'block-reference',
        'minecraft://block-reference',
        () => ({
            contents: [{
                uri: 'minecraft://block-reference',
                mimeType: 'text/markdown',
                text: loadResourcesDocumentation('block-reference.md'),
            }],
        }),
    );

    // Resource Templates
    server.resource(
        'resource-templates',
        'minecraft://resource-templates',
        () => ({
            contents: [{
                uri: 'minecraft://resource-templates',
                mimeType: 'text/markdown',
                text: generateTemplateDocumentation(),
            }],
        }),
    );

    // Register individual template resources instead of using private handlers
    getAllTemplates().forEach((template) => {
        const templateUri = `minecraft://template/${encodeURIComponent(template.name)}`;
        server.resource(
            `template-${template.name.toLowerCase().replace(/\s+/g, '-')}`,
            templateUri,
            () => ({
                contents: [{
                    uri: templateUri,
                    mimeType: 'application/json',
                    text: JSON.stringify(template, null, 2),
                }],
            }),
        );
    });
    console.log('MCP resources registered successfully');
}
