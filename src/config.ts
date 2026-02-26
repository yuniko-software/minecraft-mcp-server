import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export interface ServerConfig {
  host: string;
  port: number;
  username: string;
  keepAliveWithoutClient: boolean;
  transport: 'stdio' | 'http';
  mcpHttpHost: string;
  mcpHttpPort: number;
  mcpHttpPath: string;
}

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 25565;
const DEFAULT_USERNAME = 'LLMBot';
const DEFAULT_KEEP_ALIVE_WITHOUT_CLIENT = false;
const DEFAULT_MCP_TRANSPORT: ServerConfig['transport'] = 'stdio';
const DEFAULT_MCP_HTTP_HOST = '0.0.0.0';
const DEFAULT_MCP_HTTP_PORT = 3001;
const DEFAULT_MCP_HTTP_PATH = '/mcp';

function getPortFromEnv(): number {
  const envPort = process.env.MINECRAFT_PORT;
  if (!envPort) {
    return DEFAULT_PORT;
  }

  const parsedPort = Number(envPort);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    return DEFAULT_PORT;
  }

  return parsedPort;
}

function getMcpHttpPortFromEnv(): number {
  const envPort = process.env.MCP_HTTP_PORT;
  if (!envPort) {
    return DEFAULT_MCP_HTTP_PORT;
  }

  const parsedPort = Number(envPort);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    return DEFAULT_MCP_HTTP_PORT;
  }

  return parsedPort;
}

function getTransportFromEnv(): ServerConfig['transport'] {
  const envTransport = process.env.MCP_TRANSPORT;
  if (envTransport === 'http' || envTransport === 'stdio') {
    return envTransport;
  }

  return DEFAULT_MCP_TRANSPORT;
}

function normalizeHttpPath(path: string): string {
  if (!path.trim()) {
    return DEFAULT_MCP_HTTP_PATH;
  }

  return path.startsWith('/') ? path : `/${path}`;
}

function getBooleanFromEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

export function parseConfig(): ServerConfig {
  const parsed = yargs(hideBin(process.argv))
    .option('host', {
      type: 'string',
      description: 'Minecraft server host',
      default: process.env.MINECRAFT_HOST ?? DEFAULT_HOST
    })
    .option('port', {
      type: 'number',
      description: 'Minecraft server port',
      default: getPortFromEnv()
    })
    .option('username', {
      type: 'string',
      description: 'Bot username',
      default: process.env.MINECRAFT_USERNAME ?? DEFAULT_USERNAME
    })
    .option('keep-alive-without-client', {
      type: 'boolean',
      description: 'Keep running when MCP stdio client disconnects',
      default: getBooleanFromEnv(process.env.MCP_KEEP_ALIVE_WITHOUT_CLIENT, DEFAULT_KEEP_ALIVE_WITHOUT_CLIENT)
    })
    .option('transport', {
      choices: ['stdio', 'http'] as const,
      description: 'MCP transport mode',
      default: getTransportFromEnv()
    })
    .option('mcp-http-host', {
      type: 'string',
      description: 'MCP HTTP transport listen host',
      default: process.env.MCP_HTTP_HOST ?? DEFAULT_MCP_HTTP_HOST
    })
    .option('mcp-http-port', {
      type: 'number',
      description: 'MCP HTTP transport listen port',
      default: getMcpHttpPortFromEnv()
    })
    .option('mcp-http-path', {
      type: 'string',
      description: 'MCP HTTP transport route path',
      default: normalizeHttpPath(process.env.MCP_HTTP_PATH ?? DEFAULT_MCP_HTTP_PATH)
    })
    .help()
    .alias('help', 'h')
    .coerce('mcp-http-path', normalizeHttpPath)
    .parseSync();

  return {
    host: parsed.host,
    port: parsed.port,
    username: parsed.username,
    keepAliveWithoutClient: parsed.keepAliveWithoutClient,
    transport: parsed.transport,
    mcpHttpHost: parsed.mcpHttpHost,
    mcpHttpPort: parsed.mcpHttpPort,
    mcpHttpPath: parsed.mcpHttpPath ?? DEFAULT_MCP_HTTP_PATH
  };
}
