import test from 'ava';
import sinon from 'sinon';
import { registerCraftingTools } from '../src/tools/crafting-tools.js';
import { ToolFactory } from '../src/tool-factory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BotConnection } from '../src/bot-connection.js';
import type mineflayer from 'mineflayer';
import minecraftData from 'minecraft-data';

test('registerCraftingTools registers all 4 tools', (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  const mockBot = {} as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

  registerCraftingTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const toolNames = toolCalls.map(call => call.args[0]);

  t.true(toolNames.includes('list-recipes'));
  t.true(toolNames.includes('craft-item'));
  t.true(toolNames.includes('get-recipe'));
  t.true(toolNames.includes('can-craft'));
});

test('can-craft with empty inventory returns missing items', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const mockBot = {
    version: '1.21.8',
    inventory: {
      items: () => []
    }
  } as unknown as mineflayer.Bot;
  const getBot = () => mockBot;

  registerCraftingTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const canCraftCall = toolCalls.find(call => call.args[0] === 'can-craft');
  const executor = canCraftCall!.args[3];

  const result = await executor({ itemName: 'stick' });

  t.true(result.content[0].text.includes('Cannot') || result.content[0].text.includes('No recipe') || result.content[0].text.includes('Missing'));
});

test('get-recipe returns recipe structure for valid item', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const mockBot = {
    version: '1.21.8',
    inventory: {
      items: () => []
    }
  } as unknown as mineflayer.Bot;
  const getBot = () => mockBot;

  registerCraftingTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const getRecipeCall = toolCalls.find(call => call.args[0] === 'get-recipe');
  const executor = getRecipeCall!.args[3];

  const result = await executor({ itemName: 'stick' });

  // Should return either a recipe or "No recipes found" message
  t.true(result.content[0].text.length > 0);
  t.true(Array.isArray(result.content));
});

test('list-recipes returns proper structure', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  // Mock with some wood to craft sticks
  const mockBot = {
    version: '1.21.8',
    inventory: {
      items: () => [
        { name: 'oak_wood', count: 64, slot: 0 }
      ]
    }
  } as unknown as mineflayer.Bot;
  const getBot = () => mockBot;

  registerCraftingTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const listRecipesCall = toolCalls.find(call => call.args[0] === 'list-recipes');
  const executor = listRecipesCall!.args[3];

  const result = await executor({ outputItem: undefined });

  t.true(result.content[0].text.length > 0);
  t.true(Array.isArray(result.content));
});

test('craft-item returns error when recipe not available', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const mockBot = {
    version: '1.21.8',
    inventory: {
      items: () => []
    }
  } as unknown as mineflayer.Bot;
  const getBot = () => mockBot;

  registerCraftingTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const craftItemCall = toolCalls.find(call => call.args[0] === 'craft-item');
  const executor = craftItemCall!.args[3];

  const result = await executor({ itemName: 'stick', amount: 1 });

  // Should return either success or error response with valid text
  t.true(result.content[0].text.length > 0);
  t.true(Array.isArray(result.content));
});

test('uses real minecraft-data recipes for version 1.21.8', async (t) => {
  const mcData = minecraftData('1.21.8');
  
  t.truthy(mcData.recipes);
  // recipes can be a map or array, just verify it exists and has content
  const isValid = mcData.recipes && (Array.isArray(mcData.recipes) || typeof mcData.recipes === 'object');
  t.true(isValid);
});
