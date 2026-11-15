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
import { DigApproachGoal, hasReachableDigFace } from '../src/digging-geometry.js';
import type { world } from 'prismarine-world';
import { initializeSafeNavigation } from '../src/safe-navigation.js';
import { ToolFactory } from '../src/tool-factory.js';
import { registerBlockTools } from '../src/tools/block-tools.js';
import { registerPositionTools } from '../src/tools/position-tools.js';

function setup() {
  const block = {
    name: 'oak_log', type: 1, stateId: 1, position: new Vec3(4, 64, 0), diggable: true,
    canHarvest: sinon.stub().returns(true),
    digTime: sinon.stub().callsFake(type => type === 3 ? 200 : type === 2 ? 500 : 1000)
  };
  const stone = { name: 'stone_axe', type: 2, enchants: [] };
  const iron = { name: 'iron_axe', type: 3, enchants: [] };
  const bot = {
    registry: minecraftData('1.21.11'),
    game: { gameMode: 'survival' }, heldItem: { name: 'dirt' },
    entity: { position: new Vec3(0, 64, 0), effects: [], width: 0.6, height: 1.8 },
    world: { raycast: sinon.stub().returns(block) },
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

test('dig uses an exposed face without undoing a usable position when the center ray is occluded', async t => {
  const { bot, block, call } = setup();
  bot.entity.position = new Vec3(315.5, 70, -206.5);
  block.position = new Vec3(316, 69, -208);
  bot.canSeeBlock.returns(false);
  const result = await call('dig-block', { x: 316, y: 69, z: -208 });
  t.falsy(result.isError);
  t.false(bot.pathfinder.goto.called);
  t.true(bot.dig.calledOnceWithExactly(block, true, 'raycast'));
});

test('dig approach goal rejects a nearby occluded node and accepts a reachable visible canopy face', t => {
  const { bot, block } = setup();
  block.position = new Vec3(316, 69, -208);
  const node: Move = {
    x: 315, y: 70, z: -207, remainingBlocks: 0, cost: 0, toBreak: [], toPlace: [], parkour: false, hash: ''
  };
  const near = new pathfinderPkg.goals.GoalNear(316, 69, -208, 2);
  t.true(near.isEnd(node), 'Old radius-only approach stops even when obstructed');
  const goal = new DigApproachGoal(bot as unknown as Bot, block.position);
  bot.world.raycast.returns({ position: new Vec3(315, 70, -207) });
  t.false(goal.isEnd(node));
  bot.world.raycast.returns(block);
  t.true(goal.isEnd(node));
  t.false(goal.isEnd({ ...node, y: 62 }), 'Distant lower position is still out of reach');
});

test('dig rejects every obstructed face after approach without cutting supporting leaves', async t => {
  const { bot, call } = setup();
  bot.world.raycast.returns({ position: new Vec3(315, 69, -207) });
  const result = await call('dig-block');
  t.true(result.isError);
  t.regex(result.content[0].text, /no reachable visible face/);
  t.true(bot.pathfinder.goto.calledOnce);
  t.false(bot.dig.called);
  t.false(bot.equip.called);
});

test('dig-face checks retain vanilla reach and native dig failures propagate', async t => {
  const { bot, block, call } = setup();
  bot.entity.position = new Vec3(-10, 64, 0);
  t.false(hasReachableDigFace(bot as unknown as Bot, block as unknown as Block));
  bot.entity.position = new Vec3(0, 64, 0);
  bot.dig.rejects(new Error('Block not in view'));
  const result = await call('dig-block');
  t.true(result.isError);
  t.regex(result.content[0].text, /Block not in view/);
});

function geometryWorld() {
  const data = minecraftData('1.21.11');
  const loadBlock = createRequire(import.meta.url)('prismarine-block') as (version: string) => typeof Block;
  const BlockClass = loadBlock('1.21.11');
  const loadWorld = createRequire(import.meta.url)('prismarine-world') as (version: string) => new () => world.World;
  const World = loadWorld('1.21.11');
  const world = new World().sync;
  const blocks = new Map<string, Block>();
  const put = (name: string, x: number, y: number, z: number) => {
    const block = BlockClass.fromStateId(data.blocksByName[name].minStateId, 0);
    block.position = new Vec3(x, y, z);
    blocks.set(block.position.toString(), block);
    return block;
  };
  world.getBlock = position => {
    const existing = blocks.get(position.toString());
    if (existing) return existing;
    const air = BlockClass.fromStateId(data.blocksByName.air.minStateId, 0);
    air.position = position;
    return air;
  };
  return { world, put, blocks };
}

test('actual canopy raycasts reject observed occlusion and distinguish synthetic center-only occlusion', t => {
  const { world, put, blocks } = geometryWorld();
  const target = put('oak_log', 316, 69, -208);
  put('oak_leaves', 315, 69, -207);
  put('oak_leaves', 315, 70, -208);
  put('oak_leaves', 316, 70, -207);
  const { bot } = setup();
  bot.entity.position = new Vec3(315.47298800572617, 70, -206.5);
  bot.world.raycast.callsFake((from, direction, range) => world.raycast(from, direction, range));
  t.false(hasReachableDigFace(bot as unknown as Bot, target), 'Observed full-cube leaves obstruct the current exposed-face rays');
  // Synthetic counterexample only, not a proposed change to the live canopy.
  blocks.delete(new Vec3(315, 70, -208).toString());
  put('oak_leaves', 316, 70, -208);
  const eye = bot.entity.position.offset(0, 1.62, 0);
  const centerRay = target.position.offset(0.5, 0.5, 0.5).minus(eye).normalize();
  t.false(world.raycast(eye, centerRay, 4.5)?.position.equals(target.position));
  t.true(hasReachableDigFace(bot as unknown as Bot, target), 'An exposed west face can be valid even with the center ray still blocked');
});

test('explicit sugar-cane digging accepts the observed empty shape without approaching or harvesting its column', async t => {
  const { world, put } = geometryWorld();
  const target = put('sugar_cane', 323, 64, -185);
  put('sugar_cane', 323, 63, -185);
  put('sugar_cane', 323, 65, -185);
  t.deepEqual(target.shapes, []);
  const { bot, call } = setup();
  bot.entity.position = new Vec3(323.5, 64, -186.62879777705055);
  bot.blockAt.returns(target);
  bot.world.raycast.callsFake((from, direction, range) => world.raycast(from, direction, range));
  bot.canSeeBlock.returns(false);
  t.true(hasReachableDigFace(bot as unknown as Bot, target));
  const result = await call('dig-block', { x: 323, y: 64, z: -185 });
  t.falsy(result.isError);
  t.false(bot.pathfinder.goto.called);
  t.true(bot.dig.calledOnceWithExactly(target, true, 'auto'));
});

test('empty-shape plant targets retain center-line occlusion and ignore collisions behind the target', async t => {
  for (const name of ['sugar_cane', 'short_grass']) {
    const { world, put, blocks } = geometryWorld();
    const target = put(name, 323, 64, -185);
    t.deepEqual(target.shapes, []);
    const { bot, call } = setup();
    bot.entity.position = new Vec3(323.5, 64, -187.5);
    bot.blockAt.returns(target);
    bot.world.raycast.callsFake((from, direction, range) => world.raycast(from, direction, range));
    put('stone', 323, 64, -184);
    put('stone', 323, 65, -184);
    t.true(hasReachableDigFace(bot as unknown as Bot, target), 'Block beyond the plant is not an occluder');
    put('stone', 323, 64, -186);
    put('stone', 323, 65, -186);
    t.false(hasReachableDigFace(bot as unknown as Bot, target), 'Opaque block before the plant prevents targeting');
    const result = await call('dig-block', { x: 323, y: 64, z: -185 });
    t.true(result.isError);
    t.false(bot.dig.called);
    t.false(bot.equip.called);
    t.true(bot.pathfinder.goto.calledOnce);
    const movements = bot.pathfinder.movements;
    t.false(movements.canDig);
    t.false(movements.allow1by1towers);
    t.deepEqual(movements.scafoldingBlocks, []);
    blocks.delete(new Vec3(323, 64, -186).toString());
    blocks.delete(new Vec3(323, 65, -186).toString());
    t.true(hasReachableDigFace(bot as unknown as Bot, target));
  }
});

test('empty-shape digging and approach goals enforce vanilla center reach and native eligibility', async t => {
  const { world, put } = geometryWorld();
  const target = put('sugar_cane', 0, 64, 0);
  const { bot, call } = setup();
  bot.blockAt.returns(target);
  bot.world.raycast.callsFake((from, direction, range) => world.raycast(from, direction, range));
  bot.entity.position = new Vec3(0.5, 62.88, -4);
  t.true(hasReachableDigFace(bot as unknown as Bot, target), 'Survival accepts center at exactly 4.5 blocks');
  bot.entity.position = new Vec3(0.5, 62.88, -4.01);
  t.false(hasReachableDigFace(bot as unknown as Bot, target));
  bot.game.gameMode = 'creative';
  t.true(hasReachableDigFace(bot as unknown as Bot, target));
  bot.entity.position = new Vec3(0.5, 62.88, -4.51);
  t.false(hasReachableDigFace(bot as unknown as Bot, target), 'Creative does not exceed 5 blocks');
  bot.game.gameMode = 'survival';
  const goal = new DigApproachGoal(bot as unknown as Bot, target.position);
  const node: Move = { x: 0, y: 64, z: -2, remainingBlocks: 0, cost: 0, toBreak: [], toPlace: [], parkour: false, hash: '' };
  t.true(goal.isEnd(node));
  t.false(goal.isEnd({ ...node, z: -6 }));
  t.true((await call('dig-block', { x: 0, y: 64, z: 0 })).isError);
  t.false(bot.dig.called);
  bot.entity.position = new Vec3(0.5, 64, -1.5);
  bot.canDigBlock.returns(false);
  t.true((await call('dig-block', { x: 0, y: 64, z: 0 })).isError);
  t.false(bot.dig.called);
});
