import test from 'ava';
import sinon from 'sinon';
import { registerInventoryTools } from '../src/tools/inventory-tools.js';
import { ToolFactory } from '../src/tool-factory.js';
import { BotConnection } from '../src/bot-connection.js';
import type { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';

test('registerInventoryTools registers list-inventory tool', (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  const mockBot = {} as any;
  const getBot = () => mockBot;

  registerInventoryTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const listInventoryCall = toolCalls.find(call => call.args[0] === 'list-inventory');

  t.truthy(listInventoryCall);
  t.is(listInventoryCall!.args[1], 'List all items in the bot\'s inventory');
});

test('registerInventoryTools registers equip-item tool', (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  const mockBot = {} as any;
  const getBot = () => mockBot;

  registerInventoryTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const equipItemCall = toolCalls.find(call => call.args[0] === 'equip-item');

  t.truthy(equipItemCall);
  t.is(equipItemCall!.args[1], 'Equip a specific item');
});

test('list-inventory returns empty when no items', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const mockBot = {
    inventory: {
      items: () => []
    }
  } as any;
  const getBot = () => mockBot;

  registerInventoryTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const listInventoryCall = toolCalls.find(call => call.args[0] === 'list-inventory');
  const executor = listInventoryCall!.args[3];

  const result = await executor({});

  t.true(result.content[0].text.includes('empty'));
});

test('list-inventory returns items with counts', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const mockBot = {
    inventory: {
      items: () => [
        { name: 'diamond_pickaxe', count: 1, slot: 0 },
        { name: 'cobblestone', count: 64, slot: 1 }
      ]
    }
  } as any;
  const getBot = () => mockBot;

  registerInventoryTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const listInventoryCall = toolCalls.find(call => call.args[0] === 'list-inventory');
  const executor = listInventoryCall!.args[3];

  const result = await executor({});

  t.true(result.content[0].text.includes('diamond_pickaxe'));
  t.true(result.content[0].text.includes('cobblestone'));
  t.true(result.content[0].text.includes('64'));
});

test('equip-item calls bot.equip', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const equipStub = sinon.stub().resolves();
  const mockBot = {
    inventory: {
      items: () => [
        { name: 'diamond_sword', type: 1 }
      ]
    },
    equip: equipStub
  } as any;
  const getBot = () => mockBot;

  registerInventoryTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const equipItemCall = toolCalls.find(call => call.args[0] === 'equip-item');
  const executor = equipItemCall!.args[3];

  const result = await executor({ itemName: 'diamond_sword', destination: 'hand' });

  t.true(equipStub.calledOnce);
  t.true(result.content[0].text.includes('Equipped'));
  t.true(result.content[0].text.includes('diamond_sword'));
});

test('equip-item returns message when item not found', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const mockBot = {
    inventory: {
      items: () => []
    }
  } as any;
  const getBot = () => mockBot;

  registerInventoryTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const equipItemCall = toolCalls.find(call => call.args[0] === 'equip-item');
  const executor = equipItemCall!.args[3];

  const result = await executor({ itemName: 'diamond_sword', destination: 'hand' });

  t.true(result.content[0].text.includes('Couldn\'t find'));
});
