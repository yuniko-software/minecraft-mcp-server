import test from 'ava';
import sinon from 'sinon';
import minecraftData from 'minecraft-data';
import type { Bot } from 'mineflayer';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BotConnection } from '../src/bot-connection.js';
import { Vec3 } from 'vec3';
import { initializeSafeNavigation } from '../src/safe-navigation.js';
import { ToolFactory } from '../src/tool-factory.js';
import { registerBlockTools } from '../src/tools/block-tools.js';
import { registerPositionTools } from '../src/tools/position-tools.js';

function setup() {
  const block = {
    name: 'oak_log', type: 1, stateId: 1, position: new Vec3(4, 64, 0),
    canHarvest: sinon.stub().returns(true),
    digTime: sinon.stub().callsFake(type => type === 3 ? 200 : type === 2 ? 500 : 1000)
  };
  const stone = { name: 'stone_axe', type: 2, enchants: [] };
  const iron = { name: 'iron_axe', type: 3, enchants: [] };
  const bot = {
    registry: minecraftData('1.21.11'),
    game: { gameMode: 'survival' }, heldItem: { name: 'dirt' },
    entity: { position: new Vec3(0, 64, 0), effects: [] },
    inventory: { items: sinon.stub().returns([stone, iron]) },
    blockAt: sinon.stub().returns(block),
    canDigBlock: sinon.stub().returns(true), canSeeBlock: sinon.stub().returns(true),
    equip: sinon.stub().resolves(), unequip: sinon.stub().resolves(),
    dig: sinon.stub().resolves(), placeBlock: sinon.stub().resolves(), lookAt: sinon.stub().resolves(),
    pathfinder: {
      movements: { canDig: true, allow1by1towers: true, scafoldingBlocks: [10] },
      setMovements: sinon.stub(),
      goto: sinon.stub().resolves(), stop: sinon.stub()
    }
  };
  const tool = sinon.stub();
  const factory = new ToolFactory({ tool } as unknown as McpServer, {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection);
  registerBlockTools(factory, () => bot as unknown as Bot);
  registerPositionTools(factory, () => bot as unknown as Bot);
  const call = (name: string, args: Record<string, unknown> = { x: 4, y: 64, z: 0 }) =>
    tool.getCalls().find(call => call.args[0] === name)!.args[3](args) as Promise<ReturnType<ToolFactory['createResponse']>>;
  return { bot, block, stone, iron, call };
}

test('spawn/reconnect initialization installs actual non-destructive pathfinder movements', t => {
  const { bot } = setup();
  initializeSafeNavigation(bot as unknown as Bot);
  initializeSafeNavigation(bot as unknown as Bot);
  for (const call of bot.pathfinder.setMovements.getCalls()) {
    const movements = call.args[0];
    t.false(movements.canDig);
    t.false(movements.allow1by1towers);
    t.deepEqual(movements.scafoldingBlocks, []);
    t.is(movements.countScaffoldingItems(), 0);
  }
});

test('explicit movement applies safe flags before goto and propagates unreachable paths', async t => {
  const { bot, call } = setup();
  bot.pathfinder.goto.callsFake(async () => {
    t.false(bot.pathfinder.movements.canDig);
    t.false(bot.pathfinder.movements.allow1by1towers);
    t.deepEqual(bot.pathfinder.movements.scafoldingBlocks, []);
    throw new Error('No non-destructive path');
  });
  t.true((await call('move-to-position')).isError);
  t.false(bot.dig.called);
  t.false(bot.placeBlock.called);
});

test('dig approaches safely then equips the faster iron axe immediately before intentional digging', async t => {
  const { bot, iron, call } = setup();
  bot.canDigBlock.onFirstCall().returns(false);
  bot.pathfinder.goto.callsFake(async () => {
    t.false(bot.pathfinder.movements.canDig);
    t.deepEqual(bot.pathfinder.movements.scafoldingBlocks, []);
    bot.heldItem = { name: 'dirt' };
  });
  t.falsy((await call('dig-block')).isError);
  t.true(bot.pathfinder.goto.calledBefore(bot.equip));
  t.true(bot.equip.calledOnceWithExactly(iron, 'hand'));
  t.true(bot.equip.calledBefore(bot.dig));
  t.true(bot.dig.calledOnce);
});

test('dig falls back to stone axe when iron is absent', async t => {
  const { bot, stone, call } = setup();
  bot.inventory.items.returns([stone]);
  t.falsy((await call('dig-block')).isError);
  t.true(bot.equip.calledOnceWithExactly(stone, 'hand'));
});

test('hand-harvestable block can be mined without equipping a tool or dropping held items', async t => {
  const { bot, call } = setup();
  bot.inventory.items.returns([]);
  t.falsy((await call('dig-block')).isError);
  t.false(bot.unequip.called);
  t.true(bot.dig.calledOnce);
  t.false(bot.equip.called);
});

test('dig rejects missing required harvesting tool, reach and native equip failures', async t => {
  const { bot, block, call } = setup();
  block.canHarvest.returns(false);
  t.true((await call('dig-block')).isError);
  t.false(bot.dig.called);
  block.canHarvest.returns(true);
  bot.canDigBlock.returns(false);
  t.true((await call('dig-block')).isError);
  t.false(bot.equip.called);
  bot.canDigBlock.returns(true);
  bot.equip.rejects(new Error('equip denied'));
  t.true((await call('dig-block')).isError);
  t.false(bot.dig.called);
});

test('implicit digging approach never falls back to destructive navigation', async t => {
  const { bot, call } = setup();
  bot.canDigBlock.returns(false);
  bot.pathfinder.goto.rejects(new Error('No path'));
  t.true((await call('dig-block')).isError);
  t.false(bot.dig.called);
  t.false(bot.equip.called);
});

test('implicit placement approach uses safe settings but intentional place remains enabled', async t => {
  const { bot, block, call } = setup();
  bot.blockAt.callsFake(position => position.equals(new Vec3(4, 64, 0)) ? null : block);
  bot.canSeeBlock.returns(false);
  bot.pathfinder.goto.callsFake(async () => {
    t.false(bot.pathfinder.movements.canDig);
    t.false(bot.pathfinder.movements.allow1by1towers);
    t.deepEqual(bot.pathfinder.movements.scafoldingBlocks, []);
  });
  t.falsy((await call('place-block')).isError);
  t.true(bot.pathfinder.goto.called);
  t.true(bot.placeBlock.calledOnce);
  t.false(bot.dig.called);
});

test('placement fails on unreachable approach without placing or digging', async t => {
  const { bot, block, call } = setup();
  bot.blockAt.callsFake(position => position.equals(new Vec3(4, 64, 0)) ? null : block);
  bot.canSeeBlock.returns(false);
  bot.pathfinder.goto.rejects(new Error('No path'));
  t.true((await call('place-block')).isError);
  t.false(bot.placeBlock.called);
  t.false(bot.dig.called);
});
