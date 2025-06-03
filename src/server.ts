/**
 * This module provides model context protocol (MCP) server functionality for Minecraft.
 * It allows interaction with a Minecraft server using the Model Context Protocol.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import type {
    Config,
    MinecraftMcpServer,
    MinecraftStdioServerTransport,
} from '@minecraft-mcp-server/types';

/**
 * Creates a new Minecraft Model Context Protocol (MCP) server instance.
 * This server is used to interact with a Minecraft bot using the Model Context Protocol.
 * @returns A new instance of MinecraftMcpServer.
 */
export function createMcpServer(config: Config): MinecraftMcpServer {
    const server = new McpServer({
        name: config.name,
        version: config.version,
    });
    return server as MinecraftMcpServer;
}

/**
 * Creates a new Minecraft Model Context Protocol (MCP) server transport using standard input/output.
 * This transport is used to communicate with the MCP server via the command line.
 * @returns A new instance of MinecraftStdioServerTransport.
 */
export function createMcpServerTransport(): MinecraftStdioServerTransport {
    const transport = new StdioServerTransport();
    return transport as MinecraftStdioServerTransport;
}
