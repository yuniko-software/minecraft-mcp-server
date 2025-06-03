/**
 * This module provides tools for executing commands using minecraft remote connection.
 * It includes functionality to run commands on the Minecraft server.
 */

import { execSync } from 'node:child_process';
import { z as zod } from 'zod';

import type { Config, McpResponse, MinecraftMcpServer } from '@minecraft-mcp-server/types';

import { createErrorResponse, createResponse } from '../response';

/**
 * Helper function to normalize a Minecraft command by removing leading slash if present.
 * @param command - The raw command string
 * @returns The normalized command without leading slash
 */
function normalizeCommand(command: string): string {
    const slash = '/';
    return command.startsWith(slash) ? command.substring(1) : command;
}

/**
 * Helper function to execute a single Minecraft command via mcrcon.
 * @param command - The Minecraft command to execute
 * @param config - The server configuration containing mcrcon details
 * @returns Promise that resolves with the command output
 */
function executeMinecraftCommand(command: string, config: Config): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const normalizedCommand = normalizeCommand(command);
            const mcrconParams = `-H ${config.mcrconHost} -P ${config.mcrconPort} -p ${config.mcrconPass}`;
            const mcrconCommand = `mcrcon ${mcrconParams} "${normalizedCommand}"`;

            const output = execSync(mcrconCommand, {
                stdio: 'pipe', // Changed from 'inherit' to 'pipe' to capture output
                encoding: 'utf-8',
                cwd: process.cwd(),
                env: process.env,
            });

            // Strip ANSI escape codes from the output
            // eslint-disable-next-line no-control-regex
            const cleanOutput = output.toString().replace(/\u001b\[[0-9;]*m/g, '').trim();
            resolve(cleanOutput);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Helper function to execute multiple commands sequentially.
 * @param commands - Array of command strings to execute
 * @param config - The server configuration
 * @returns Promise that resolves with execution results
 */
async function executeCommandsSequential(
    commands: string[],
    config: Config,
): Promise<{ executed: Array<{ command: string; output: string }>; failed: string[] }> {
    const executed: Array<{ command: string; output: string }> = [];
    const failed: string[] = [];

    for (const command of commands) {
        try {
            const output = await executeMinecraftCommand(command, config);
            executed.push({ command: normalizeCommand(command), output });
        } catch {
            failed.push(normalizeCommand(command));
        }
    }

    return { executed, failed };
}

/**
 * Helper function to execute multiple commands in parallel.
 * @param commands - Array of command strings to execute
 * @param config - The server configuration
 * @returns Promise that resolves with execution results
 */
async function executeCommandsParallel(
    commands: string[],
    config: Config,
): Promise<{ executed: Array<{ command: string; output: string }>; failed: string[] }> {
    const results = await Promise.allSettled(
        commands.map(command => executeMinecraftCommand(command, config)),
    );

    const executed: Array<{ command: string; output: string }> = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
        const normalizedCommand = normalizeCommand(commands[index]);
        if (result.status === 'fulfilled') {
            executed.push({ command: normalizedCommand, output: result.value });
        } else {
            failed.push(normalizedCommand);
        }
    });

    return { executed, failed };
}

/**
 * Registers command tools for executing Minecraft commands.
 * @param server - The MinecraftMcpServer instance to register the command tool on.
 */
export function registerTools(server: MinecraftMcpServer, config: Config) {
    // Single command execution tool
    server.tool(
        'execute-command',
        'Execute a Minecraft command',
        {
            command: zod.string().describe('The Minecraft command to execute'),
        },
        async ({ command }: { command: string }): Promise<McpResponse> => {
            try {
                const output = await executeMinecraftCommand(command, config);
                const commandName = normalizeCommand(command);
                return createResponse(`Executed command: "${commandName}"\nResult: ${output}`);
            } catch (error) {
                return createErrorResponse(error as Error);
            }
        },
    );

    // Sequential batch command execution tool
    server.tool(
        'execute-sequential-command-batch',
        'Execute multiple Minecraft commands sequentially (one after another)',
        {
            commands: zod.array(zod.string()).describe('Array of Minecraft commands to execute in sequence'),
        },
        async ({ commands }: { commands: string[] }): Promise<McpResponse> => {
            try {
                if (commands.length === 0) {
                    return createResponse('No commands provided');
                }

                const { executed, failed } = await executeCommandsSequential(commands, config);

                let message = 'Sequential batch execution completed.\n';
                message += `Successfully executed ${executed.length} commands:\n`;
                executed.forEach(({ command, output }) => {
                    message += `  - ${command}: ${output}\n`;
                });

                if (failed.length > 0) {
                    message += `\nFailed to execute ${failed.length} commands: [${failed.join(', ')}]`;
                }

                return createResponse(message);
            } catch (error) {
                return createErrorResponse(error as Error);
            }
        },
    );

    // Parallel batch command execution tool
    server.tool(
        'execute-parallel-command-batch',
        'Execute multiple Minecraft commands in parallel (simultaneously)',
        {
            commands: zod.array(zod.string()).describe('Array of Minecraft commands to execute in parallel'),
        },
        async ({ commands }: { commands: string[] }): Promise<McpResponse> => {
            try {
                if (commands.length === 0) {
                    return createResponse('No commands provided');
                }

                const { executed, failed } = await executeCommandsParallel(commands, config);

                let message = 'Parallel batch execution completed.\n';
                message += `Successfully executed ${executed.length} commands:\n`;
                executed.forEach(({ command, output }) => {
                    message += `  - ${command}: ${output}\n`;
                });

                if (failed.length > 0) {
                    message += `\nFailed to execute ${failed.length} commands: [${failed.join(', ')}]`;
                }

                return createResponse(message);
            } catch (error) {
                return createErrorResponse(error as Error);
            }
        },
    );
}
