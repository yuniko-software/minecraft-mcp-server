import test from 'ava';
import sinon from 'sinon';
import { registerInventoryTools } from '../src/tools/inventory-tools.js';
import { ToolFactory } from '../src/tool-factory.js';
import { BotConnection } from '../src/bot-connection.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type mineflayer from 'mineflayer';

test('registerInventoryTools registers list-inventory tool', (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  const mockBot = {} as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

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
  const mockBot = {} as Partial<mineflayer.Bot>;
  const getBot = () => mockBot as mineflayer.Bot;

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
  } as unknown as mineflayer.Bot;
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
  } as unknown as mineflayer.Bot;
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
  } as unknown as mineflayer.Bot;
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
  } as unknown as mineflayer.Bot;
  const getBot = () => mockBot;

  registerInventoryTools(factory, getBot);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const equipItemCall = toolCalls.find(call => call.args[0] === 'equip-item');
  const executor = equipItemCall!.args[3];

  const result = await executor({ itemName: 'diamond_sword', destination: 'hand' });

  t.true(result.content[0].text.includes('Couldn\'t find'));
});

function setupDrop(name = 'cobblestone', stackSize = 64, count = stackSize) {
  const item = { name, stackSize, count, type: 1, metadata: 0, slot: 9 };
  let items = [item];
  const bot = {
    health: 20, isSleeping: false, game: { gameMode: 'survival' },
    currentWindow: null, usingHeldItem: false,
    inventory: {
      inventoryStart: 9, inventoryEnd: 45,
      selectedItem: null as typeof item | null,
      items: () => items
    },
    tossStack: sinon.stub().callsFake(async (target) => { items = items.filter(candidate => candidate !== target); }),
    toss: sinon.stub().callsFake(async (_type, _metadata, quantity) => { item.count -= quantity; }),
  };
  const tool = sinon.stub();
  const factory = new ToolFactory({ tool } as unknown as McpServer, {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection);
  registerInventoryTools(factory, () => bot as unknown as mineflayer.Bot);
  const call = (quantity: unknown, itemName = name) =>
    tool.getCalls().find(call => call.args[0] === 'drop-item')!.args[3]({ itemName, count: quantity }) as Promise<ReturnType<ToolFactory['createResponse']>>;
  return { bot, item, call, setItems: (value: typeof items) => { items = value; } };
}

test('drop-item clears a full 64-item stack in one native call', async t => {
  const { bot, item, call } = setupDrop();
  const result = await call(64, ' COBBLESTONE ');
  t.falsy(result.isError);
  t.true(bot.tossStack.calledOnceWithExactly(item));
  t.false(bot.toss.called);
  t.regex(result.content[0].text, /Dropped 64 cobblestone; 0 remaining/);
});

test('drop-item drops smaller requested quantities with native toss', async t => {
  const { bot, call } = setupDrop();
  const result = await call(12);
  t.falsy(result.isError);
  t.true(bot.toss.calledOnceWithExactly(1, 0, 12));
  t.false(bot.tossStack.called);
  t.regex(result.content[0].text, /Dropped 12 cobblestone; 52 remaining/);
});

for (const [name, stackSize] of [['ender_pearl', 16], ['diamond_pickaxe', 1]] as const) {
  test(`drop-item respects ${name} stack size ${stackSize}`, async t => {
    const { bot, call } = setupDrop(name, stackSize);
    t.true((await call(stackSize + 1)).isError);
    t.false(bot.tossStack.called);
    t.falsy((await call(stackSize)).isError);
    t.true(bot.tossStack.calledOnce);
  });
}

test('drop-item rejects missing, insufficient and invalid quantities before tossing', async t => {
  const { bot, call } = setupDrop('cobblestone', 64, 10);
  t.true((await call(1, 'stone')).isError);
  t.true((await call(11)).isError);
  for (const quantity of [0, -1, 1.5, Infinity, '64']) {
    t.true((await call(quantity)).isError);
  }
  t.false(bot.toss.called);
  t.false(bot.tossStack.called);
});

test('drop-item prefers a full stack over a smaller first matching stack', async t => {
  const { bot, item, call, setItems } = setupDrop();
  setItems([{ ...item, count: 4, slot: 10 }, item]);
  const result = await call(64);
  t.falsy(result.isError);
  t.true(bot.tossStack.calledOnceWithExactly(item));
  t.regex(result.content[0].text, /4 remaining/);
});

test('drop-item can use matching stacks for a requested quantity', async t => {
  const { bot, item, call, setItems } = setupDrop('cobblestone', 64, 32);
  const second = { ...item, slot: 10 };
  setItems([item, second]);
  bot.toss.callsFake(async () => { setItems([]); });
  t.falsy((await call(64)).isError);
  t.true(bot.toss.calledOnceWithExactly(1, 0, 64));
});

test('drop-item reports native partial failure and releases its operation lock', async t => {
  const { bot, item, call } = setupDrop();
  bot.toss.callsFake(async () => { item.count -= 3; throw new Error('server rejected transaction'); });
  const result = await call(12);
  t.true(result.isError);
  t.regex(result.content[0].text, /server rejected transaction/);
  t.regex(result.content[0].text, /inventory decreased by 3, remaining 61/);
  bot.toss.callsFake(async (_type, _metadata, quantity) => { item.count -= quantity; });
  t.falsy((await call(12)).isError);
});

test('drop-item detects unconfirmed native success and full-stack failures', async t => {
  const { bot, call } = setupDrop();
  bot.toss.resolves();
  const unconfirmed = await call(12);
  t.true(unconfirmed.isError);
  t.regex(unconfirmed.content[0].text, /inventory decreased by 0/);
  bot.tossStack.rejects(new Error('drop denied'));
  t.regex((await call(64)).content[0].text, /drop denied/);
});

test('drop-item refuses occupied cursor and reports cursor-held items after a failed toss', async t => {
  const { bot, item, call } = setupDrop();
  bot.inventory.selectedItem = item;
  t.true((await call(12)).isError);
  t.false(bot.toss.called);
  bot.inventory.selectedItem = null;
  bot.toss.callsFake(async () => {
    bot.inventory.selectedItem = { ...item, count: 3 };
    throw new Error('transaction timed out');
  });
  const result = await call(12);
  t.true(result.isError);
  t.regex(result.content[0].text, /cursor holds 3/);
});

test('drop-item rejects overlap without a second toss', async t => {
  const { bot, call } = setupDrop();
  let finish = () => {};
  bot.toss.callsFake(() => new Promise<void>(resolve => { finish = resolve; }));
  const first = call(12);
  await new Promise(resolve => setImmediate(resolve));
  t.true((await call(12)).isError);
  t.true(bot.toss.calledOnce);
  finish();
  t.true((await first).isError);
});
