import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types';

import type {
    MinecraftMcpServer,
    MinecraftStdioServerTransport,
} from '@minecraft-mcp-server/types';

import { createConfig } from './src/config';
import { createMcpServer, createMcpServerTransport } from './src/server';

import { registerTools } from './src/tools';
import { registerResources } from './src/resources';
import { formatTemplatesForProtocol } from './src/resources/templates/protocol';
import { registerPrompts } from './src/prompts';

/**
 * Handles process termination signals to gracefully shut down the bot and server.
 * @param signal The signal that was received.
 */
function createTerminationCallback(
    server: MinecraftMcpServer,
    transport: MinecraftStdioServerTransport,
): (signal: NodeJS.Signals) => void {
    return (signal: NodeJS.Signals) => {
        console.info(`Received ${signal}, shutting down...`);
        server.close();
        transport.close();
        process.exit(0);
    };
}

/**
 * Application entry point.
 */
async function main() {
    const config = createConfig();
    const server = createMcpServer(config);
    registerPrompts(server);
    registerResources(server);
    registerTools(server, config);
    const transport = createMcpServerTransport();

    // Patch: Intercept raw JSON-RPC for template listing
    // eslint-disable-next-line no-underscore-dangle
    const origOnData = transport._ondata?.bind(transport);
    if (origOnData) {
        // eslint-disable-next-line no-underscore-dangle
        transport._ondata = (chunk: Buffer) => {
            try {
                const msg = JSON.parse(chunk.toString());
                if (msg.method === 'resources/templates/list') {
                    const resourceTemplates = formatTemplatesForProtocol();
                    const jsonRpcResponse: JSONRPCMessage = {
                        id: msg.id,
                        jsonrpc: '2.0',
                        result: {
                            _meta: {
                                mimeType: 'application/json',
                                uriTemplate: 'resources/templates/list',
                            },
                            resourceTemplates,
                        },
                    };
                    transport.send(jsonRpcResponse);
                    return;
                }
            } catch (e) {
                // ignore and pass to original
                console.error('Error parsing JSON-RPC message:', e);
            }
            origOnData(chunk);
        };
    }

    const terminationCallback = createTerminationCallback(server, transport);
    process.on('SIGTERM', terminationCallback);
    await server.connect(transport);
    console.info('Minecraft MCP Server running on stdio...');
}

main();
