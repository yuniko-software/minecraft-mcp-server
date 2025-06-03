declare module '@minecraft-mcp-server/types' {
  import type { Vec3 } from 'vec3';
  import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
  import type { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';

  type ResourceTemplate = {
    name: string;
    description: string;
    category: string;
    commands: string[];
    materials: string[];
    dimensions?: string;
    notes?: string[];
  }

  type MinecraftMcpServer = McpServer;
  type MinecraftStdioServerTransport = StdioServerTransport;

  type TextContent = {
    type: 'text';
    text: string;
  };

  type ContentItem = TextContent;

  type McpResponse = {
    content: ContentItem[];
    _meta?: Record<string, unknown>;
    isError?: boolean;
    [key: string]: unknown;
  };

  interface InventoryItem {
    name: string;
    count: number;
    slot: number;
  }

  interface FaceOption {
    direction: string;
    vector: Vec3;
  }

  type Direction = 'forward' | 'back' | 'left' | 'right';
  type FaceDirection = 'up' | 'down' | 'north' | 'south' | 'east' | 'west';

  type Config = {
    name: string;
    description: string;
    version: string;
    minecraftHost: string;
    minecraftPort: number;
    mcrconHost: string;
    mcrconPort: number;
    mcrconPass: string;
  };

}
