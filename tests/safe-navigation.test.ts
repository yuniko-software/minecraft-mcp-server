import test from 'ava';
import sinon from 'sinon';
import minecraftData from 'minecraft-data';
import type { Bot } from 'mineflayer';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BotConnection } from '../src/bot-connection.js';
import { Vec3 } from 'vec3';
import { createRequire } from 'node:module';
import type { Block } from 'prismarine-block';
import pathfinderPkg from 'mineflayer-pathfinder';
import type { Move } from 'mineflayer-pathfinder';
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
    entity: { position: new Vec3(0, 64, 0), effects: [], width: 0.6 },
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

test('actual 1.21.11 open-door shapes permit forward waypoints while closed doors stay blocked', t => {
  const data = minecraftData('1.21.11');
  const loadBlock = createRequire(import.meta.url)('prismarine-block') as (version: string) => typeof Block;
  const BlockClass = loadBlock('1.21.11');
  const definition = data.blocksByName.oak_door;
  for (const open of [false, true]) {
    for (const facing of ['north', 'south', 'east', 'west']) {
      for (const hinge of ['left', 'right']) {
        const door = (half: string, y: number) => {
          for (let id = definition.minStateId; id <= definition.maxStateId; id++) {
            const block = BlockClass.fromStateId(id, 0);
            const properties = block.getProperties();
            if (properties.open === open && properties.facing === facing && properties.hinge === hinge &&
              properties.half === half && properties.powered === false) {
              block.position = new Vec3(319, y, -196);
              return block;
            }
          }
          throw new Error('Missing test door state');
        };
        const lower = door('lower', 64);
        const upper = door('upper', 65);
        const { bot } = setup();
        bot.blockAt.callsFake(position => {
          if (position.equals(lower.position)) return lower;
          if (position.equals(upper.position)) return upper;
          const block = BlockClass.fromStateId(data.blocksByName[position.y === 63 ? 'stone' : 'air'].minStateId, 0);
          block.position = position;
          return block;
        });
        const direction = facing === 'north' || facing === 'south' ? { x: 0, z: 1 } : { x: 1, z: 0 };
        const node: Move = {
          x: 319 - direction.x, y: 64, z: -196 - direction.z,
          remainingBlocks: 0, cost: 0, toBreak: [], toPlace: [], parkour: false, hash: ''
        };
        const baseline = new pathfinderPkg.Movements(bot as unknown as Bot);
        baseline.canDig = false;
        const upstreamNeighbors: Move[] = [];
        baseline.getMoveForward(node, direction, upstreamNeighbors);
        t.is(upstreamNeighbors.length, 0, 'Upstream coarse classifier blocks even an open oak door');
        initializeSafeNavigation(bot as unknown as Bot);
        const safe = bot.pathfinder.setMovements.lastCall.args[0];
        const neighbors: Move[] = [];
        safe.getMoveForward(node, direction, neighbors);
        t.is(neighbors.length, open ? 1 : 0, `${facing}/${hinge}, open=${open}`);
        for (const next of neighbors) {
          t.deepEqual(next.toBreak, []);
          t.deepEqual(next.toPlace, []);
          const exterior: Move[] = [];
          safe.getMoveForward(next, direction, exterior);
          t.is(exterior.length, 1);
          const shape = lower.shapes[0];
          const panelDirection = shape[3] - shape[0] < 0.5
            ? { x: shape[0] === 0 ? -1 : 1, z: 0 }
            : { x: 0, z: shape[2] === 0 ? -1 : 1 };
          const blockedPanel: Move[] = [];
          safe.getMoveForward(next, panelDirection, blockedPanel);
          t.is(blockedPanel.length, 0, 'Exiting through the open door panel is still blocked');
        }
        if (open) {
          bot.entity.width = 1;
          const tooWide: Move[] = [];
          safe.getMoveForward(node, direction, tooWide);
          t.is(tooWide.length, 0, 'Player body must fit between collision panels');
          bot.entity.width = 0.6;
          bot.blockAt.withArgs(upper.position).returns(null);
          const unloaded: Move[] = [];
          safe.getMoveForward(node, direction, unloaded);
          t.is(unloaded.length, 0, 'Unloaded upper half is not traversable');
          bot.blockAt.resetBehavior();
        }
      }
    }
  }
});

test('range 0.5 on integer coordinates selects only the target block-grid node', t => {
  const goal = new pathfinderPkg.goals.GoalNear(319, 64, -194, 0.5);
  const node: Move = {
    x: 319, y: 64, z: -194, remainingBlocks: 0, cost: 0, toBreak: [], toPlace: [], parkour: false, hash: ''
  };
  t.true(goal.isEnd(node));
  t.false(goal.isEnd({ ...node, z: -195 }));
  t.false(goal.isEnd({ ...node, x: 325, z: -198 }));
});
