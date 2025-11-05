import test from 'ava';
import sinon from 'sinon';
import { registerGameStateTools } from '../src/tools/gamestate-tools.js';
import { ToolFactory } from '../src/tool-factory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BotConnection } from '../src/bot-connection.js';

test('registerGameStateTools registers detect-gamemode tool', (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  const mockBot = {} as any;
  const getBot = () => mockBot;

  registerGameStateTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const detectGamemodeCall = toolCalls.find(call => call.args[0] === 'detect-gamemode');

  t.truthy(detectGamemodeCall);
  t.is(detectGamemodeCall!.args[1], 'Detect the gamemode on game');
});

test('detect-gamemode returns creative mode', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  
  const mockBot = {
    game: {
      gameMode: 'creative'
    }
  } as any;
  const getBot = () => mockBot;

  registerGameStateTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const detectGamemodeCall = toolCalls.find(call => call.args[0] === 'detect-gamemode');
  const executor = detectGamemodeCall!.args[3];

  const result = await executor({});

  t.true(result.content[0].text.includes('creative'));
});

test('detect-gamemode returns survival mode', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  
  const mockBot = {
    game: {
      gameMode: 'survival'
    }
  } as any;
  const getBot = () => mockBot;

  registerGameStateTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const detectGamemodeCall = toolCalls.find(call => call.args[0] === 'detect-gamemode');
  const executor = detectGamemodeCall!.args[3];

  const result = await executor({});

  t.true(result.content[0].text.includes('survival'));
});

test('detect-gamemode returns adventure mode', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  
  const mockBot = {
    game: {
      gameMode: 'adventure'
    }
  } as any;
  const getBot = () => mockBot;

  registerGameStateTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const detectGamemodeCall = toolCalls.find(call => call.args[0] === 'detect-gamemode');
  const executor = detectGamemodeCall!.args[3];

  const result = await executor({});

  t.true(result.content[0].text.includes('adventure'));
});
