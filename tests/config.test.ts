import test from 'ava';
import { parseConfig } from '../src/config.js';

const ORIGINAL_ARGV = process.argv;
const ORIGINAL_ENV = {
  host: process.env.MINECRAFT_HOST,
  port: process.env.MINECRAFT_PORT,
  username: process.env.MINECRAFT_USERNAME,
  keepAliveWithoutClient: process.env.MCP_KEEP_ALIVE_WITHOUT_CLIENT,
  transport: process.env.MCP_TRANSPORT,
  mcpHttpHost: process.env.MCP_HTTP_HOST,
  mcpHttpPort: process.env.MCP_HTTP_PORT,
  mcpHttpPath: process.env.MCP_HTTP_PATH
};

test.beforeEach(() => {
  process.argv = ['node', 'script.js'];
  delete process.env.MINECRAFT_HOST;
  delete process.env.MINECRAFT_PORT;
  delete process.env.MINECRAFT_USERNAME;
  delete process.env.MCP_KEEP_ALIVE_WITHOUT_CLIENT;
  delete process.env.MCP_TRANSPORT;
  delete process.env.MCP_HTTP_HOST;
  delete process.env.MCP_HTTP_PORT;
  delete process.env.MCP_HTTP_PATH;
});

test.after.always(() => {
  process.argv = ORIGINAL_ARGV;
  if (ORIGINAL_ENV.host === undefined) {
    delete process.env.MINECRAFT_HOST;
  } else {
    process.env.MINECRAFT_HOST = ORIGINAL_ENV.host;
  }
  if (ORIGINAL_ENV.port === undefined) {
    delete process.env.MINECRAFT_PORT;
  } else {
    process.env.MINECRAFT_PORT = ORIGINAL_ENV.port;
  }
  if (ORIGINAL_ENV.username === undefined) {
    delete process.env.MINECRAFT_USERNAME;
  } else {
    process.env.MINECRAFT_USERNAME = ORIGINAL_ENV.username;
  }
  if (ORIGINAL_ENV.keepAliveWithoutClient === undefined) {
    delete process.env.MCP_KEEP_ALIVE_WITHOUT_CLIENT;
  } else {
    process.env.MCP_KEEP_ALIVE_WITHOUT_CLIENT = ORIGINAL_ENV.keepAliveWithoutClient;
  }
  if (ORIGINAL_ENV.transport === undefined) {
    delete process.env.MCP_TRANSPORT;
  } else {
    process.env.MCP_TRANSPORT = ORIGINAL_ENV.transport;
  }
  if (ORIGINAL_ENV.mcpHttpHost === undefined) {
    delete process.env.MCP_HTTP_HOST;
  } else {
    process.env.MCP_HTTP_HOST = ORIGINAL_ENV.mcpHttpHost;
  }
  if (ORIGINAL_ENV.mcpHttpPort === undefined) {
    delete process.env.MCP_HTTP_PORT;
  } else {
    process.env.MCP_HTTP_PORT = ORIGINAL_ENV.mcpHttpPort;
  }
  if (ORIGINAL_ENV.mcpHttpPath === undefined) {
    delete process.env.MCP_HTTP_PATH;
  } else {
    process.env.MCP_HTTP_PATH = ORIGINAL_ENV.mcpHttpPath;
  }
});

test.serial('parseConfig returns default values', (t) => {
  const config = parseConfig();

  t.is(config.host, 'localhost');
  t.is(config.port, 25565);
  t.is(config.username, 'LLMBot');
  t.false(config.keepAliveWithoutClient);
  t.is(config.transport, 'stdio');
  t.is(config.mcpHttpHost, '0.0.0.0');
  t.is(config.mcpHttpPort, 3001);
  t.is(config.mcpHttpPath, '/mcp');
});

test.serial('parseConfig parses custom host', (t) => {
  process.argv = ['node', 'script.js', '--host', 'example.com'];

  const config = parseConfig();

  t.is(config.host, 'example.com');
  t.is(config.port, 25565);
  t.is(config.username, 'LLMBot');
});

test.serial('parseConfig parses custom port', (t) => {
  process.argv = ['node', 'script.js', '--port', '12345'];

  const config = parseConfig();

  t.is(config.host, 'localhost');
  t.is(config.port, 12345);
  t.is(config.username, 'LLMBot');
});

test.serial('parseConfig parses custom username', (t) => {
  process.argv = ['node', 'script.js', '--username', 'CustomBot'];

  const config = parseConfig();

  t.is(config.host, 'localhost');
  t.is(config.port, 25565);
  t.is(config.username, 'CustomBot');
});

test.serial('parseConfig parses all custom options', (t) => {
  process.argv = ['node', 'script.js', '--host', 'server.net', '--port', '9999', '--username', 'TestBot'];

  const config = parseConfig();

  t.is(config.host, 'server.net');
  t.is(config.port, 9999);
  t.is(config.username, 'TestBot');
});

test.serial('parseConfig handles numeric port as number type', (t) => {
  process.argv = ['node', 'script.js', '--port', '30000'];

  const config = parseConfig();

  t.is(typeof config.port, 'number');
  t.is(config.port, 30000);
});

test.serial('parseConfig reads values from environment variables', (t) => {
  process.env.MINECRAFT_HOST = 'env-host';
  process.env.MINECRAFT_PORT = '25570';
  process.env.MINECRAFT_USERNAME = 'EnvBot';
  process.env.MCP_KEEP_ALIVE_WITHOUT_CLIENT = 'true';
  process.env.MCP_TRANSPORT = 'http';
  process.env.MCP_HTTP_HOST = '127.0.0.1';
  process.env.MCP_HTTP_PORT = '4000';
  process.env.MCP_HTTP_PATH = '/remote-mcp';

  const config = parseConfig();

  t.is(config.host, 'env-host');
  t.is(config.port, 25570);
  t.is(config.username, 'EnvBot');
  t.true(config.keepAliveWithoutClient);
  t.is(config.transport, 'http');
  t.is(config.mcpHttpHost, '127.0.0.1');
  t.is(config.mcpHttpPort, 4000);
  t.is(config.mcpHttpPath, '/remote-mcp');
});

test.serial('parseConfig prefers inline args over environment variables', (t) => {
  process.env.MINECRAFT_HOST = 'env-host';
  process.env.MINECRAFT_PORT = '25570';
  process.env.MINECRAFT_USERNAME = 'EnvBot';
  process.argv = ['node', 'script.js', '--host', 'cli-host', '--port', '25571', '--username', 'CliBot'];

  const config = parseConfig();

  t.is(config.host, 'cli-host');
  t.is(config.port, 25571);
  t.is(config.username, 'CliBot');
});

test.serial('parseConfig falls back to default port for invalid environment port', (t) => {
  process.env.MINECRAFT_PORT = 'not-a-number';

  const config = parseConfig();

  t.is(config.port, 25565);
});

test.serial('parseConfig keeps running without client when requested via inline arg', (t) => {
  process.argv = ['node', 'script.js', '--keep-alive-without-client'];

  const config = parseConfig();

  t.true(config.keepAliveWithoutClient);
});

test.serial('parseConfig prefers inline keep-alive arg over env var', (t) => {
  process.env.MCP_KEEP_ALIVE_WITHOUT_CLIENT = 'true';
  process.argv = ['node', 'script.js', '--no-keep-alive-without-client'];

  const config = parseConfig();

  t.false(config.keepAliveWithoutClient);
});

test.serial('parseConfig normalizes mcp http path', (t) => {
  process.argv = ['node', 'script.js', '--mcp-http-path', 'custom-mcp'];

  const config = parseConfig();

  t.is(config.mcpHttpPath, '/custom-mcp');
});
