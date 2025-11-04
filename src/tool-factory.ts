import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BotConnection } from './bot-connection.js';

type McpResponse = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
  [key: string]: unknown;
};

type ToolExecutor<T = any> = (args: T) => Promise<McpResponse>;

export class ToolFactory {
  constructor(
    private server: McpServer,
    private connection: BotConnection
  ) {}

  registerTool<T = any>(
    name: string,
    description: string,
    schema: any,
    executor: ToolExecutor<T>
  ): void {
    this.server.tool(name, description, schema, async (args: any): Promise<McpResponse> => {
      const connectionCheck = await this.connection.checkConnectionAndReconnect();

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
