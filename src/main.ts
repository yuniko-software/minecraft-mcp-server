#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { setupStdioFiltering } from './stdio-filter.js';
import { log } from './logger.js';
import { parseConfig } from './config.js';
import { BotConnection } from './bot-connection.js';
import { ToolFactory } from './tool-factory.js';
import { MessageStore } from './message-store.js';
import { registerPositionTools } from './tools/position-tools.js';
import { registerInventoryTools } from './tools/inventory-tools.js';
import { registerBlockTools } from './tools/block-tools.js';
import { registerEntityTools } from './tools/entity-tools.js';
import { registerChatTools } from './tools/chat-tools.js';
import { registerFlightTools } from './tools/flight-tools.js';
import { registerGameStateTools } from './tools/gamestate-tools.js';
import { registerCraftingTools } from './tools/crafting-tools.js';
import { registerFurnaceTools } from './tools/furnace-tools.js';

interface HttpSession {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
}

type HttpRequest = IncomingMessage & { body?: unknown };

function writeJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function writeText(res: ServerResponse, statusCode: number, message: string): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(message);
}

process.on('unhandledRejection', (reason) => {
  log('error', `Unhandled rejection: ${reason}`);
});

process.on('uncaughtException', (error) => {
  log('error', `Uncaught exception: ${error}`);
});

function createMcpServer(connection: BotConnection, messageStore: MessageStore): McpServer {
  const server = new McpServer({
    name: 'minecraft-mcp-server',
    version: '2.0.4'
  });

  const factory = new ToolFactory(server, connection);
  const getBot = () => connection.getBot()!;

  registerPositionTools(factory, getBot);
  registerInventoryTools(factory, getBot);
  registerBlockTools(factory, getBot);
  registerEntityTools(factory, getBot);
  registerChatTools(factory, getBot, messageStore);
  registerFlightTools(factory, getBot);
  registerGameStateTools(factory, getBot);
  registerCraftingTools(factory, getBot);
  registerFurnaceTools(factory, getBot);

  return server;
}

async function closeHttpSessions(sessions: Record<string, HttpSession>): Promise<void> {
  const sessionEntries = Object.entries(sessions);
  for (const [sessionId, session] of sessionEntries) {
    try {
      await session.server.close();
    } catch (error) {
      log('warn', `Failed to close MCP server for session ${sessionId}: ${String(error)}`);
    }

    try {
      await session.transport.close();
    } catch (error) {
      log('warn', `Failed to close transport for session ${sessionId}: ${String(error)}`);
    }

    delete sessions[sessionId];
  }
}

async function main() {
  const config = parseConfig();
  const messageStore = new MessageStore();

  const connection = new BotConnection(
    config,
    {
      onLog: log,
      onChatMessage: (username, message) => messageStore.addMessage(username, message)
    }
  );

  connection.connect();

  if (config.transport === 'stdio') {
    setupStdioFiltering();

    const server = createMcpServer(connection, messageStore);

    process.stdin.on('end', () => {
      if (config.keepAliveWithoutClient) {
        log('info', 'MCP Client has disconnected. keep-alive mode is enabled; server will continue running.');
        return;
      }

      connection.cleanup();
      log('info', 'MCP Client has disconnected. Shutting down...');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await server.close();
      connection.cleanup();
      log('info', 'SIGTERM received. Shutting down...');
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      await server.close();
      connection.cleanup();
      log('info', 'SIGINT received. Shutting down...');
      process.exit(0);
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    return;
  }

  const app = createMcpExpressApp({ host: config.mcpHttpHost });
  const sessions: Record<string, HttpSession> = {};

  app.post(config.mcpHttpPath, async (req: HttpRequest, res: ServerResponse) => {
    const sessionIdHeader = req.headers['mcp-session-id'];
    const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

    try {
      if (sessionId && sessions[sessionId]) {
        await sessions[sessionId].transport.handleRequest(req, res, req.body);
        return;
      }

      if (!sessionId && isInitializeRequest(req.body)) {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (initializedSessionId) => {
            sessions[initializedSessionId] = {
              server,
              transport
            };
          }
        });

        const server = createMcpServer(connection, messageStore);

        transport.onclose = () => {
          if (transport.sessionId) {
            delete sessions[transport.sessionId];
          }
          void server.close();
        };

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }

      writeJson(res, 400, {
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided'
        },
        id: null
      });
    } catch (error) {
      log('error', `HTTP MCP POST handler error: ${String(error)}`);
      if (!res.headersSent) {
        writeJson(res, 500, {
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        });
      }
    }
  });

  app.get(config.mcpHttpPath, async (req: HttpRequest, res: ServerResponse) => {
    const sessionIdHeader = req.headers['mcp-session-id'];
    const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

    if (!sessionId || !sessions[sessionId]) {
      writeText(res, 400, 'Invalid or missing session ID');
      return;
    }

    await sessions[sessionId].transport.handleRequest(req, res);
  });

  app.delete(config.mcpHttpPath, async (req: HttpRequest, res: ServerResponse) => {
    const sessionIdHeader = req.headers['mcp-session-id'];
    const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

    if (!sessionId || !sessions[sessionId]) {
      writeText(res, 400, 'Invalid or missing session ID');
      return;
    }

    await sessions[sessionId].transport.handleRequest(req, res);
  });

  const httpServer = app.listen(config.mcpHttpPort, config.mcpHttpHost, () => {
    log('info', `MCP HTTP server listening on http://${config.mcpHttpHost}:${config.mcpHttpPort}${config.mcpHttpPath}`);
  });

  process.on('SIGTERM', async () => {
    await closeHttpSessions(sessions);
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    connection.cleanup();
    log('info', 'SIGTERM received. Shutting down...');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await closeHttpSessions(sessions);
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    connection.cleanup();
    log('info', 'SIGINT received. Shutting down...');
    process.exit(0);
  });
}

main().catch((error) => {
  log('error', `Fatal error in main(): ${error}`);
  process.exit(1);
});
