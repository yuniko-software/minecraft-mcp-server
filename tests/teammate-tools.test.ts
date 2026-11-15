import test from 'ava';
import sinon from 'sinon';
import type { Bot } from 'mineflayer';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BotConnection } from '../src/bot-connection.js';
import { Vec3 } from 'vec3';
import { ToolFactory } from '../src/tool-factory.js';
import { registerSurvivalTools } from '../src/tools/survival-tools.js';
import { registerInteractionTools } from '../src/tools/interaction-tools.js';
import { registerEntityTools } from '../src/tools/entity-tools.js';

function setup() {
  const entity = {
    id: 42, name: 'oak_boat', type: 'object', isValid: true,
    position: new Vec3(1, 64, 0), width: 1.375, height: 0.5625
  };
  const block = { name: 'lever', position: new Vec3(1, 64, 0) };
  const bot = {
    username: 'Kit', version: '1.21.11', health: 18, food: 12, foodSaturation: 3,
    oxygenLevel: 20, isSleeping: false, usingHeldItem: false,
    game: { gameMode: 'survival', dimension: 'overworld' },
    time: { timeOfDay: 14000 },
    entity: { id: 1, position: new Vec3(0, 64, 0), height: 1.8, onGround: true, isValid: true },
    entities: { 42: entity },
    vehicle: null as typeof entity | null,
    inventory: { items: sinon.stub().returns([{ name: 'bread', count: 2, type: 1 }]) },
    heldItem: { name: 'bread', count: 2 },
    currentWindow: null as { id: number; type: string } | null,
    targetDigBlock: null,
    equip: sinon.stub().resolves(),
    consume: sinon.stub().resolves(),
    blockAt: sinon.stub().returns(block),
    canSeeBlock: sinon.stub().returns(true),
    isABed: sinon.stub().callsFake(candidate => candidate.name.endsWith('_bed')),
    sleep: sinon.stub().callsFake(async () => { bot.isSleeping = true; }),
    wake: sinon.stub().callsFake(async () => { bot.isSleeping = false; }),
    activateBlock: sinon.stub().resolves(),
    activateEntity: sinon.stub().resolves(),
    lookAt: sinon.stub().resolves(),
    mount: sinon.stub().callsFake(() => { bot.vehicle = entity; }),
    dismount: sinon.stub().callsFake(() => { bot.vehicle = null; }),
    getControlState: sinon.stub().returns(false),
    nearestEntity: sinon.stub().returns(entity),
    world: { raycast: sinon.stub().returns(null) }
  };
  const tool = sinon.stub();
  const connection = { checkConnectionAndReconnect: sinon.stub().resolves({ connected: true }) };
  const factory = new ToolFactory({ tool } as unknown as McpServer, connection as unknown as BotConnection);
  const getBot = () => bot as unknown as Bot;
  registerSurvivalTools(factory, getBot);
  registerInteractionTools(factory, getBot);
  registerEntityTools(factory, getBot);
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const registered = tool.getCalls().find(call => call.args[0] === name);
    if (!registered) throw new Error(`Unregistered tool ${name}`);
    return registered.args[3](args) as Promise<ReturnType<ToolFactory['createResponse']>>;
  };
  return { bot, entity, block, call, connection };
}

test('eat equips exact inventory food and consumes once', async t => {
  const { bot, call } = setup();
  const result = await call('eat', { itemName: ' BREAD ' });
  t.falsy(result.isError);
  t.true(bot.equip.calledOnceWithExactly(bot.inventory.items()[0], 'hand'));
  t.true(bot.consume.calledOnce);
  t.true(bot.equip.calledBefore(bot.consume));
});

for (const name of ['missing', 'diamond_sword', 'cod_bucket']) {
  test(`eat rejects absent or inedible ${name}`, async t => {
    const { bot, call } = setup();
    if (name !== 'missing') bot.inventory.items.returns([{ name, count: 1 }]);
    t.true((await call('eat', { itemName: name })).isError);
    t.false(bot.equip.called);
    t.false(bot.consume.called);
  });
}

test('eat propagates native full-hunger and equip failures and releases its lock', async t => {
  const { bot, call } = setup();
  bot.consume.rejects(new Error('Food is full'));
  const full = await call('eat', { itemName: 'bread' });
  t.true(full.isError);
  t.regex(full.content[0].text, /Food is full/);
  bot.consume.resolves();
  bot.equip.rejects(new Error('inventory transaction rejected'));
  t.true((await call('eat', { itemName: 'bread' })).isError);
  bot.equip.resolves();
  t.falsy((await call('eat', { itemName: 'bread' })).isError);
});

test('eat rejects overlapping consumption before another equip', async t => {
  const { bot, call } = setup();
  let finish = () => {};
  bot.consume.callsFake(() => new Promise<void>(resolve => { finish = resolve; }));
  const first = call('eat', { itemName: 'bread' });
  await new Promise(resolve => setImmediate(resolve));
  t.true((await call('eat', { itemName: 'bread' })).isError);
  t.true(bot.equip.calledOnce);
  finish();
  t.falsy((await first).isError);
});

test('sleep uses the specified loaded bed and returns on entry without waiting for dawn', async t => {
  const { bot, block, call } = setup();
  block.name = 'red_bed';
  const result = await call('sleep', { x: '1', y: 64, z: 0 });
  t.falsy(result.isError);
  t.true(bot.sleep.calledOnceWithExactly(block));
  t.true(bot.blockAt.firstCall.args[0].equals(new Vec3(1, 64, 0)));
  t.true(bot.isSleeping);
  t.false(bot.wake.called);
});

test('sleep propagates native bed rejection', async t => {
  const { bot, block, call } = setup();
  block.name = 'red_bed';
  bot.sleep.rejects(new Error('monsters nearby'));
  const result = await call('sleep', { x: 1, y: 64, z: 0 });
  t.true(result.isError);
  t.regex(result.content[0].text, /monsters nearby/);
});

test('sleep rejects missing, non-bed, obstructed and unsafe-dimension targets before activation', async t => {
  const { bot, block, call } = setup();
  const args = { x: 1, y: 64, z: 0 };
  t.true((await call('sleep', args)).isError);
  bot.blockAt.returns(null);
  t.true((await call('sleep', args)).isError);
  bot.blockAt.returns(block);
  block.name = 'red_bed';
  bot.canSeeBlock.returns(false);
  t.true((await call('sleep', args)).isError);
  bot.canSeeBlock.returns(true);
  bot.game.dimension = 'the_nether';
  t.true((await call('sleep', args)).isError);
  t.false(bot.sleep.called);
});

test('wake rejects already awake and waits for the server state change', async t => {
  const { bot, call } = setup();
  t.true((await call('wake')).isError);
  t.false(bot.wake.called);
  bot.isSleeping = true;
  bot.wake.callsFake(async () => { setTimeout(() => { bot.isSleeping = false; }, 10); });
  t.falsy((await call('wake')).isError);
  t.false(bot.isSleeping);
});

test('status exposes survival and current state with unavailable saturation as null', async t => {
  const { bot, entity, call } = setup();
  bot.vehicle = entity;
  bot.currentWindow = { id: 2, type: 'minecraft:chest' };
  bot.foodSaturation = Number.NaN;
  const result = await call('status');
  const state = JSON.parse(result.content[0].text);
  t.is(state.health, 18);
  t.is(state.food, 12);
  t.is(state.saturation, null);
  t.false(state.sleeping);
  t.is(state.vehicle.id, 42);
  t.is(state.openWindow.type, 'minecraft:chest');
  t.deepEqual(state.position, { x: 0, y: 64, z: 0 });
});

test('find-entity supplies a usable ID for interaction and mounting', async t => {
  const { call } = setup();
  t.regex((await call('find-entity')).content[0].text, /entity ID: 42/);
});

test('block and entity interactions dispatch exact targets and only claim requests', async t => {
  const { bot, block, entity, call } = setup();
  const blockResult = await call('interact-block', { x: 1, y: 64, z: 0 });
  const entityResult = await call('interact-entity', { entityId: '42' });
  t.falsy(blockResult.isError);
  t.falsy(entityResult.isError);
  t.true(bot.activateBlock.calledOnceWithExactly(block));
  t.true(bot.activateEntity.calledOnceWithExactly(entity));
  t.regex(blockResult.content[0].text, /not confirmed/);
  t.regex(entityResult.content[0].text, /not confirmed/);
});

test('block interaction rejects missing, air, bed, distant and hidden blocks', async t => {
  const { bot, block, call } = setup();
  const args = { x: 1, y: 64, z: 0 };
  bot.blockAt.returns(null);
  t.true((await call('interact-block', args)).isError);
  bot.blockAt.returns(block);
  for (const name of ['air', 'cave_air', 'void_air', 'red_bed']) {
    block.name = name;
    t.true((await call('interact-block', args)).isError);
  }
  block.name = 'lever';
  block.position = new Vec3(10, 64, 0);
  t.true((await call('interact-block', args)).isError);
  block.position = new Vec3(1, 64, 0);
  bot.canSeeBlock.returns(false);
  t.true((await call('interact-block', args)).isError);
  t.false(bot.activateBlock.called);
});

test('entity interaction rejects stale, distant, obstructed and self targets', async t => {
  const { bot, entity, call } = setup();
  t.true((await call('interact-entity', { entityId: 999 })).isError);
  t.true((await call('interact-entity', { entityId: 1 })).isError);
  entity.isValid = false;
  t.true((await call('interact-entity', { entityId: 42 })).isError);
  entity.isValid = true;
  entity.position = new Vec3(10, 64, 0);
  t.true((await call('interact-entity', { entityId: 42 })).isError);
  entity.position = new Vec3(1, 64, 0);
  bot.world.raycast.returns({ position: new Vec3(0, 64, 0) });
  t.true((await call('interact-entity', { entityId: 42 })).isError);
  t.false(bot.activateEntity.called);
});

for (const gameMode of ['survival', 'creative']) {
  test(`interactions enforce exact vanilla reach boundaries in ${gameMode}`, async t => {
    const { bot, block, entity, call } = setup();
    bot.game.gameMode = gameMode;
    const blockReach = gameMode === 'creative' ? 5 : 4.5;
    bot.entity.position.x = 5 - blockReach;
    block.position = new Vec3(5, 65, 0);
    t.falsy((await call('interact-block', { x: 5, y: 65, z: 0 })).isError);
    bot.entity.position.x -= 0.001;
    t.true((await call('interact-block', { x: 5, y: 65, z: 0 })).isError);
    bot.entity.position.x = 5 - blockReach;
    const entityReach = gameMode === 'creative' ? 5 : 3;
    entity.position = new Vec3(bot.entity.position.x + entityReach + entity.width / 2, 65.5, 0);
    t.falsy((await call('interact-entity', { entityId: 42 })).isError);
    entity.position = entity.position.offset(0.001, 0, 0);
    t.true((await call('interact-entity', { entityId: 42 })).isError);
    t.true(bot.activateBlock.calledOnce);
    t.true(bot.activateEntity.calledOnce);
  });
}

test('interactions propagate native activation errors', async t => {
  const { bot, call } = setup();
  bot.activateBlock.rejects(new Error('activation failed'));
  bot.activateEntity.rejects(new Error('activation failed'));
  t.true((await call('interact-block', { x: 1, y: 64, z: 0 })).isError);
  t.true((await call('interact-entity', { entityId: 42 })).isError);
});

test('mount and dismount confirm state including a mount update during the native call', async t => {
  const { bot, entity, call } = setup();
  t.falsy((await call('mount', { entityId: 42 })).isError);
  t.true(bot.mount.calledOnceWithExactly(entity));
  t.is(bot.vehicle, entity);
  t.true((await call('mount', { entityId: 42 })).isError);
  t.falsy((await call('dismount')).isError);
  t.is(bot.vehicle, null);
  t.true((await call('dismount')).isError);
  t.true(bot.dismount.calledOnce);
});

test('mount rejects sneaking without attempting boarding', async t => {
  const { bot, call } = setup();
  bot.getControlState.returns(true);
  t.true((await call('mount', { entityId: 42 })).isError);
  t.false(bot.mount.called);
});

for (const name of ['wake', 'mount', 'dismount']) {
  test(`${name} times out with an MCP error when the server does not confirm`, async t => {
    const { bot, entity, call } = setup();
    bot.isSleeping = name === 'wake';
    bot.vehicle = name === 'dismount' ? entity : null;
    bot.wake.resolves();
    bot.mount.callsFake(() => {});
    bot.dismount.callsFake(() => {});
    const result = await call(name, name === 'mount' ? { entityId: 42 } : {});
    t.true(result.isError);
    t.regex(result.content[0].text, /did not confirm/);
  });
}

test('invalid arguments and disconnected calls never activate targets', async t => {
  const { bot, call, connection } = setup();
  for (const args of [{ entityId: -1 }, { entityId: 1.5 }, { entityId: 'NaN' }]) {
    t.true((await call('mount', args)).isError);
  }
  t.true((await call('sleep', { x: Infinity, y: 64, z: 0 })).isError);
  t.true((await call('eat', { itemName: '' })).isError);
  connection.checkConnectionAndReconnect.resolves({ connected: false, message: 'offline' });
  t.true((await call('interact-entity', { entityId: 42 })).isError);
  t.false(bot.mount.called);
  t.false(bot.sleep.called);
  t.false(bot.activateEntity.called);
});

test('sleeping, dead or spectator bots cannot eat or interact', async t => {
  const { bot, call } = setup();
  bot.isSleeping = true;
  t.true((await call('eat', { itemName: 'bread' })).isError);
  t.true((await call('interact-entity', { entityId: 42 })).isError);
  bot.isSleeping = false;
  bot.health = 0;
  t.true((await call('mount', { entityId: 42 })).isError);
  bot.health = 20;
  bot.game.gameMode = 'spectator';
  t.true((await call('interact-block', { x: 1, y: 64, z: 0 })).isError);
  t.false(bot.equip.called);
  t.false(bot.mount.called);
  t.false(bot.activateBlock.called);
});
