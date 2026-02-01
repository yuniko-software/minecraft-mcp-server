import test from 'ava';
import sinon from 'sinon';
import { registerPositionTools } from '../src/tools/position-tools.js';
import { ToolFactory } from '../src/tool-factory.js';
import { BotConnection } from '../src/bot-connection.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type mineflayer from 'mineflayer';
import { Vec3 } from 'vec3';

test('registerPositionTools registers get-position tool', (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  const mockBot = {} as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerPositionTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const getPositionCall = toolCalls.find(call => call.args[0] === 'get-position');

  t.truthy(getPositionCall);
  t.is(getPositionCall!.args[1], 'Get the current position of the bot');
});

test('registerPositionTools registers move-to-position tool', (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  const mockBot = {} as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerPositionTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const moveToPositionCall = toolCalls.find(call => call.args[0] === 'move-to-position');

  t.truthy(moveToPositionCall);
  t.is(moveToPositionCall!.args[1], 'Move the bot to a specific position');
});

test('get-position returns current bot position', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const mockBot = {
    entity: {
      position: new Vec3(100, 64, 200)
    }
  } as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerPositionTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const getPositionCall = toolCalls.find(call => call.args[0] === 'get-position');
  const executor = getPositionCall!.args[3];

  const result = await executor({});

  t.true(result.content[0].text.includes('100'));
  t.true(result.content[0].text.includes('64'));
  t.true(result.content[0].text.includes('200'));
});

test('move-to-position returns error when pathfinding fails', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const mockBot = {
    pathfinder: {
      goto: sinon.stub().rejects(new Error('Cannot find path')),
      stop: sinon.stub()
    },
    entity: {
      position: new Vec3(10, 20, 30)
    }
  } as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerPositionTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const moveToPositionCall = toolCalls.find(call => call.args[0] === 'move-to-position');
  const executor = moveToPositionCall!.args[3];

  const result = await executor({ x: 100, y: 64, z: 200 });

  t.true(result.isError);
  t.true(result.content[0].text.includes('Cannot find path'));
});

test('move-to-position returns timeout error and stops pathfinder', async (t) => {
  const clock = sinon.useFakeTimers();
  t.teardown(() => clock.restore());

  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const mockBot = {
    pathfinder: {
      goto: sinon.stub().returns(new Promise(() => {})),
      stop: sinon.stub()
    }
  } as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerPositionTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const moveToPositionCall = toolCalls.find(call => call.args[0] === 'move-to-position');
  const executor = moveToPositionCall!.args[3];

  const resultPromise = executor({ x: 100, y: 64, z: 200, timeoutMs: 1000 });
  await clock.tickAsync(1000);
  const result = await resultPromise;

  t.true(result.isError);
  t.true(result.content[0].text.includes('Move timed out after 1000ms'));
  t.true((mockBot.pathfinder!.stop as sinon.SinonStub).calledOnce);
});

test('move-to-position preserves pathfinder error when not timing out', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const mockBot = {
    pathfinder: {
      goto: sinon.stub().rejects(new Error('Path was stopped before it could be completed! Thus, the desired goal was not reached.')),
      stop: sinon.stub()
    }
  } as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerPositionTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const moveToPositionCall = toolCalls.find(call => call.args[0] === 'move-to-position');
  const executor = moveToPositionCall!.args[3];

  const result = await executor({ x: 100, y: 64, z: 200, timeoutMs: 5000 });

  t.true(result.isError);
  t.true(result.content[0].text.includes('Path was stopped before it could be completed'));
  t.true((mockBot.pathfinder!.stop as sinon.SinonStub).calledOnce);
});
