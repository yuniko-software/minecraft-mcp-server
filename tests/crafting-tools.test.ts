import test from 'ava';
import sinon from 'sinon';
import { registerCraftingTools } from '../src/tools/crafting-tools.js';
import { ToolFactory } from '../src/tool-factory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BotConnection } from '../src/bot-connection.js';
import type mineflayer from 'mineflayer';
import minecraftData from 'minecraft-data';

function flattenRecipes(recipes: unknown): unknown[] {
  const all: unknown[] = [];
  if (Array.isArray(recipes)) return recipes;
  if (recipes && typeof recipes === 'object') {
    for (const v of Object.values(recipes as Record<string, unknown>)) {
      if (Array.isArray(v)) all.push(...v);
    }
  }
  return all;
}

function resolveItemNameFromMcData(mcData: unknown, value: unknown): string | null {
  const data = mcData as Record<string, unknown>;
  const items = data.items as Record<string, { name?: unknown }> | undefined;
  if (!items) return null;

  if (typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (value === 0) return null;
    const item = items[String(value)];
    return typeof item?.name === 'string' ? item.name : null;
  }

  if (Array.isArray(value)) {
    for (const v of value) {
      const name = resolveItemNameFromMcData(mcData, v);
      if (name) return name;
    }
    return null;
  }

  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof v.name === 'string') return v.name;
    if (typeof v.id === 'number') {
      if (v.id === 0) return null;
      const item = items[String(v.id)];
      return typeof item?.name === 'string' ? item.name : null;
    }
  }

  return null;
}

function countRecipeIngredients(mcData: unknown, recipe: unknown): Record<string, number> {
  const r = recipe as Record<string, unknown>;
  const counts: Record<string, number> = {};

  if (Array.isArray(r.inShape)) {
    for (const row of r.inShape as unknown[]) {
      if (!Array.isArray(row)) continue;
      for (const cell of row) {
        const name = resolveItemNameFromMcData(mcData, cell);
        if (!name) continue;
        counts[name] = (counts[name] || 0) + 1;
      }
    }
    return counts;
  }

  if (Array.isArray(r.ingredients)) {
    for (const ing of r.ingredients as unknown[]) {
      const name = resolveItemNameFromMcData(mcData, ing);
      if (!name) continue;
      counts[name] = (counts[name] || 0) + 1;
    }
  }

  return counts;
}

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
    version: '1.21.10',
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

  const text = result.content[0].text.toLowerCase();
  t.true(text.includes('cannot craft'));
  t.true(text.includes('missing'));
  t.true(text.includes('- '));
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

  const mcData = minecraftData('1.21.8');
  const recipes = flattenRecipes((mcData as unknown as { recipes: unknown }).recipes);
  const stickId = (mcData as unknown as { itemsByName: Record<string, { id: number }> }).itemsByName.stick.id;
  const stickRecipe = recipes.find((recipe) => {
    const r = recipe as Record<string, unknown>;
    const res = r.result as Record<string, unknown> | undefined;
    return !!res && typeof res.id === 'number' && res.id === stickId;
  });
  t.truthy(stickRecipe);
  const ingredientCounts = countRecipeIngredients(mcData, stickRecipe);
  const ingredientNames = Object.keys(ingredientCounts);

  const text = result.content[0].text.toLowerCase();
  t.true(text.includes('ingredients'));
  t.true(ingredientNames.some(n => text.includes(n.toLowerCase())));
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

  const mockBot = {
    version: '1.21.8',
    inventory: {
      items: () => [
        { name: 'oak_planks', count: 64, slot: 0 }
      ]
    }
  } as unknown as mineflayer.Bot;
  const getBot = () => mockBot;

  registerCraftingTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const listRecipesCall = toolCalls.find(call => call.args[0] === 'list-recipes');
  const executor = listRecipesCall!.args[3];

  const result = await executor({ outputItem: undefined });

  const text = result.content[0].text.toLowerCase();
  t.true(text.length > 0);
  t.true(text.includes('stick'));
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

  const result = await executor({ outputItem: 'stick', amount: 1 });

  t.true(result.content[0].text.length > 0);
  t.true(!!result.isError);
  t.true(Array.isArray(result.content));
});

test('craft-item crafts successfully when ingredients are available', async (t) => {
  const mcData = minecraftData('1.21.8');
  const recipes = flattenRecipes((mcData as unknown as { recipes: unknown }).recipes);
  const stickId = (mcData as unknown as { itemsByName: Record<string, { id: number }> }).itemsByName.stick.id;

  const stickRecipe = recipes.find((recipe) => {
    const r = recipe as Record<string, unknown>;
    const result = r.result as Record<string, unknown> | undefined;
    return !!result && typeof result.id === 'number' && result.id === stickId;
  });

  t.truthy(stickRecipe);

  const ingredientCounts = countRecipeIngredients(mcData, stickRecipe);
  const inventoryItems = Object.entries(ingredientCounts).map(([name, count], idx) => ({ name, count, slot: idx }));

  const mockServer = { tool: sinon.stub() } as unknown as McpServer;
  const mockConnection = { checkConnectionAndReconnect: sinon.stub().resolves({ connected: true }) } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);

  const craftStub = sinon.stub().resolves();
  const mockBot = {
    version: '1.21.8',
    inventory: { items: () => inventoryItems },
    craft: craftStub
  } as unknown as mineflayer.Bot;

  registerCraftingTools(factory, () => mockBot);
  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const craftItemCall = toolCalls.find(call => call.args[0] === 'craft-item');
  const executor = craftItemCall!.args[3];

  const result = await executor({ outputItem: 'stick', amount: 1 });

  t.true(craftStub.called);
  t.false(!!result.isError);
  t.true(result.content[0].text.toLowerCase().includes('successfully crafted'));
});

test('uses real minecraft-data recipes for version 1.21.8', async (t) => {
  const mcData = minecraftData('1.21.8');
  
  t.truthy(mcData.recipes);
  const isValid = mcData.recipes && (Array.isArray(mcData.recipes) || typeof mcData.recipes === 'object');
  t.true(isValid);
});
