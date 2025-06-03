/**
 * This module provides MCP prompts for Minecraft server management.
 * Prompts provide standardized instructions and examples for common tasks.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { MinecraftMcpServer } from '@minecraft-mcp-server/types';

/**
 * Load markdown content from the prompts content directory
 */
function loadPromptsDocumentation(filename: string): string {
    const contentPath = join(process.cwd(), 'docs', 'prompts', filename);
    return readFileSync(contentPath, 'utf-8').trim();
}

/**
 * Registers all MCP prompts with the server.
 * Prompts provide standardized instructions and examples for common Minecraft tasks.
 */
export function registerPrompts(server: MinecraftMcpServer): void {
    // Building and Construction Prompts
    server.prompt(
        'build-house',
        'Guide for building a complete house in Minecraft',
        () => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: 'I want to build a house in Minecraft. Can you help me create a step-by-step plan?',
                    },
                },
                {
                    role: 'assistant',
                    content: {
                        type: 'text',
                        text: loadPromptsDocumentation('build-house.md'),
                    },
                },
            ],
        }),
    );

    server.prompt(
        'terraform-landscape',
        'Guide for terraforming and landscape modification',
        () => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: 'How can I modify the landscape around my build to make it look more natural?',
                    },
                },
                {
                    role: 'assistant',
                    content: {
                        type: 'text',
                        text: loadPromptsDocumentation('terraform-landscape.md'),
                    },
                },
            ],
        }),
    );

    server.prompt(
        'redstone-automation',
        'Guide for creating redstone contraptions and automation',
        () => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: 'I want to learn about redstone automation. Can you teach me some basic contraptions?',
                    },
                },
                {
                    role: 'assistant',
                    content: {
                        type: 'text',
                        text: loadPromptsDocumentation('redstone-automation.md'),
                    },
                },
            ],
        }),
    );

    server.prompt(
        'command-optimization',
        'Guide for efficient use of Minecraft commands',
        () => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: 'What are the best practices for using Minecraft commands efficiently?',
                    },
                },
                {
                    role: 'assistant',
                    content: {
                        type: 'text',
                        text: loadPromptsDocumentation('command-optimization.md'),
                    },
                },
            ],
        }),
    );

    server.prompt(
        'debug-issues',
        'Guide for troubleshooting common Minecraft server issues',
        () => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: 'My Minecraft commands are not working as expected. How can I debug what\'s wrong?',
                    },
                },
                {
                    role: 'assistant',
                    content: {
                        type: 'text',
                        text: loadPromptsDocumentation('debug-issues.md'),
                    },
                },
            ],
        }),
    );

    server.prompt(
        'creative-projects',
        'Ideas and guidance for creative Minecraft building projects',
        () => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: 'I\'m looking for creative building project ideas. ' +
                              'What are some interesting things to build?',
                    },
                },
                {
                    role: 'assistant',
                    content: {
                        type: 'text',
                        text: loadPromptsDocumentation('creative-projects.md'),
                    },
                },
            ],
        }),
    );

    console.log('MCP prompts registered successfully');
}
