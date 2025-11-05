import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BotConnection } from './bot-connection.js';

type McpResponse = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
  [key: string]: unknown;
};

export class ToolFactory {
  constructor(
    private _server: McpServer,
    private _connection: BotConnection
  ) {}

  registerTool(
    name: string,
    description: string,
    schema: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executor: (args: any) => Promise<McpResponse>
  ): void {
    this._server.tool(name, description, schema, async (args: unknown): Promise<McpResponse> => {
      const connectionCheck = await this._connection.checkConnectionAndReconnect();

      if (!connectionCheck.connected) {
        return {
          content: [{ type: "text", text: connectionCheck.message! }],
          isError: true
        };
      }

      try {
        return await executor(args);
      } catch (error) {
        return this.createErrorResponse(error as Error);
      }
    });
  }

  createResponse(text: string): McpResponse {
    return {
      content: [{ type: "text", text }]
    };
  }

  createErrorResponse(error: Error | string): McpResponse {
    const errorMessage = error instanceof Error ? error.message : error;
    return {
      content: [{ type: "text", text: `Failed: ${errorMessage}` }],
      isError: true
    };
  }
}
