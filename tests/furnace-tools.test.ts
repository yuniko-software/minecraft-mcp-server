import test from 'ava';
import sinon from 'sinon';
import { EventEmitter } from 'events';
import { registerFurnaceTools } from '../src/tools/furnace-tools.js';
import { ToolFactory } from '../src/tool-factory.js';
import { BotConnection } from '../src/bot-connection.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type mineflayer from 'mineflayer';
import type { Item } from 'prismarine-item';

const createMockItem = (fields: {
  name: string;
  count: number;
  type: number;
  metadata: number;
  slot?: number;
}): Item => fields as unknown as Item;

test('registerFurnaceTools registers smelt-item tool', (t) => {
  const mockServer = { tool: sinon.stub() } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  const mockBot = {} as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerFurnaceTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const smeltCall = toolCalls.find(call => call.args[0] === 'smelt-item');
  t.truthy(smeltCall);
  t.is(smeltCall!.args[1], 'Smelt items using a furnace-like block');
});

test('smelt-item returns error when no furnace block found', async (t) => {
  const mockServer = { tool: sinon.stub() } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const mockBot = {
    blockAt: sinon.stub().returns(null)
  } as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerFurnaceTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const smeltCall = toolCalls.find(call => call.args[0] === 'smelt-item');
  const executor = smeltCall!.args[3];

  const result = await executor({
    x: 1,
    y: 2,
    z: 3,
    inputItem: 'iron_ore',
    fuelItem: 'coal'
  });

  t.true(result.content[0].text.includes('No furnace block found'));
});

test('smelt-item loads input and fuel and takes output', async (t) => {
  const mockServer = { tool: sinon.stub() } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const furnace = new EventEmitter() as mineflayer.Furnace & EventEmitter;
  const outputItem = createMockItem({
    name: 'iron_ingot',
    count: 1,
    type: 100,
    metadata: 0,
    slot: 0
  });

  furnace.putInput = sinon.stub().resolves();
  furnace.putFuel = sinon.stub().resolves();
  furnace.takeOutput = sinon.stub().resolves(outputItem);
  furnace.inputItem = sinon.stub().returns(null);
  furnace.fuelItem = sinon.stub().returns(null);
  furnace.outputItem = sinon.stub().returns(outputItem);
  furnace.close = sinon.stub();

  const mockBot = {
    blockAt: sinon.stub().returns({ name: 'furnace' }),
    openFurnace: sinon.stub().resolves(furnace),
    inventory: {
      items: () => [
        createMockItem({ name: 'iron_ore', count: 3, type: 15, metadata: 0 }),
        createMockItem({ name: 'coal', count: 2, type: 263, metadata: 0 })
      ]
    }
  } as unknown as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerFurnaceTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const smeltCall = toolCalls.find(call => call.args[0] === 'smelt-item');
  const executor = smeltCall!.args[3];

  const result = await executor({
    x: 1,
    y: 2,
    z: 3,
    inputItem: 'iron_ore',
    fuelItem: 'coal'
  });

  t.true(result.content[0].text.includes('Smelted 1 iron_ingot'));
  t.true((furnace.putInput as sinon.SinonStub).calledOnce);
  t.true((furnace.putFuel as sinon.SinonStub).calledOnce);
  t.true((furnace.takeOutput as sinon.SinonStub).calledOnce);
});

test('smelt-item returns validation error for non-positive counts', async (t) => {
  const mockServer = { tool: sinon.stub() } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  const mockBot = {} as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerFurnaceTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const smeltCall = toolCalls.find(call => call.args[0] === 'smelt-item');
  const executor = smeltCall!.args[3];

  const inputCountResult = await executor({
    x: 1,
    y: 2,
    z: 3,
    inputItem: 'iron_ore',
    inputCount: 0,
    fuelItem: 'coal',
    fuelCount: 1
  });

  t.true(inputCountResult.isError);
  t.true(inputCountResult.content[0].text.includes('inputCount must be a positive integer'));

  const fuelCountResult = await executor({
    x: 1,
    y: 2,
    z: 3,
    inputItem: 'iron_ore',
    inputCount: 1,
    fuelItem: 'coal',
    fuelCount: -1
  });

  t.true(fuelCountResult.isError);
  t.true(fuelCountResult.content[0].text.includes('fuelCount must be a positive integer'));
});
