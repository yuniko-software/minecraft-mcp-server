/**
 * This module provides configuration for the application.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import type { Config } from '@minecraft-mcp-server/types';

export const defaultParseIntRadix = 10;
export const defaultMinecraftHost = 'localhost';
export const defaultMinecraftPort = '25565';
export const defaultBotUsername = 'LLMBot';
export const defaultMcrconHost = defaultMinecraftHost;
export const defaultMcrconPort = '25575';
export const defaultMcrconPass = 'minecraft';

/**
 * Parses the package.json file to extract application metadata.
 * @returns Parsed package.json content.
 */
function parsePackageJson() {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson;
}

/**
 * Parses command line arguments using yargs.
 * @returns Parsed command line arguments.
 */
function parseCommandLineArgs() {
    return yargs(hideBin(process.argv))
        .option('host', {
            type: 'string',
            description: 'Minecraft server host',
            default: defaultMinecraftHost,
        })
        .option('port', {
            type: 'string',
            description: 'Minecraft server port',
            default: defaultMinecraftPort,
        })
        .option('username', {
            type: 'string',
            description: 'Bot username',
            default: defaultBotUsername,
        })
        .help()
        .alias('help', 'h')
        .parseSync();
}

/**
 * Creates a configuration object for the application.
 * @returns configuration settings object.
 */
export function createConfig(): Config {
    const packageJson = parsePackageJson();
    const args = parseCommandLineArgs();
    return {
        name: packageJson.name,
        description: packageJson.description,
        version: packageJson.version,
        minecraftHost: String(process.env.MINECRAFT_HOST ?? args.host),
        minecraftPort: Number.parseInt(process.env.MINECRAFT_PORT ?? args.port, defaultParseIntRadix),
        mcrconHost: String(process.env.MCRCON_HOST ?? defaultMcrconHost),
        mcrconPort: Number.parseInt(process.env.MCRCON_PORT ?? defaultMcrconPort, defaultParseIntRadix),
        mcrconPass: String(process.env.MCRCON_PASS ?? defaultMcrconPass),
    };
};
