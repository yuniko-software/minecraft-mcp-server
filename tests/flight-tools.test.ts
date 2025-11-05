import test from 'ava';
import sinon from 'sinon';
import { registerFlightTools } from '../src/tools/flight-tools.js';
import { ToolFactory } from '../src/tool-factory.js';
import { BotConnection } from '../src/bot-connection.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type mineflayer from 'mineflayer';
import { Vec3 } from 'vec3';

test('registerFlightTools registers fly-to tool', (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  const mockBot = {} as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerFlightTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const flyToCall = toolCalls.find(call => call.args[0] === 'fly-to');

  t.truthy(flyToCall);
  t.is(flyToCall!.args[1], 'Make the bot fly to a specific position');
});

test('fly-to successfully flies to destination', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const flyToStub = sinon.stub().resolves();
  const stopFlyingStub = sinon.stub();
  const mockBot = {
    creative: {
      flyTo: flyToStub,
      stopFlying: stopFlyingStub
    },
    entity: {
      position: new Vec3(0, 64, 0)
    }
  } as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerFlightTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const flyToCall = toolCalls.find(call => call.args[0] === 'fly-to');
  const executor = flyToCall!.args[3];

  const result = await executor({ x: 100, y: 80, z: 200 });

  t.true(flyToStub.calledOnce);
  t.true(stopFlyingStub.calledOnce);
  t.true(result.content[0].text.includes('Successfully flew'));
  t.true(result.content[0].text.includes('100'));
});

test('fly-to returns error when creative mode not available', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const mockBot = {
    creative: null
  } as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerFlightTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const flyToCall = toolCalls.find(call => call.args[0] === 'fly-to');
  const executor = flyToCall!.args[3];

  const result = await executor({ x: 100, y: 80, z: 200 });

  t.true(result.content[0].text.includes('Creative mode is not available'));
});

test('fly-to handles flight errors', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const flyToStub = sinon.stub().rejects(new Error('Cannot reach destination'));
  const stopFlyingStub = sinon.stub();
  const mockBot = {
    creative: {
      flyTo: flyToStub,
      stopFlying: stopFlyingStub
    },
    entity: {
      position: new Vec3(0, 64, 0)
    }
  } as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerFlightTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const flyToCall = toolCalls.find(call => call.args[0] === 'fly-to');
  const executor = flyToCall!.args[3];

  const result = await executor({ x: 100, y: 80, z: 200 });

  t.true(result.isError);
  t.true(result.content[0].text.includes('Cannot reach destination'));
});
