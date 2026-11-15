import { z } from 'zod';
import type { Bot } from 'mineflayer';
import type { Entity } from 'prismarine-entity';
import { Vec3 } from 'vec3';
import { ToolFactory } from '../tool-factory.js';
import { coerceCoordinates } from './coordinate-utils.js';
import { closestPoint, eyePosition, getVehicle, requireAwake, waitForState } from './interaction-utils.js';

function requireEntity(bot: Bot, entityId: number): Entity {
  requireAwake(bot);
  const entity = bot.entities[entityId];
  if (!entity || !entity.isValid || entity.id === bot.entity.id) throw new Error(`No valid target entity with ID ${entityId}`);
  const eye = eyePosition(bot);
  const halfWidth = entity.width / 2;
  const point = closestPoint(eye, entity.position.offset(-halfWidth, 0, -halfWidth),
    entity.position.offset(halfWidth, entity.height, halfWidth));
  const distance = eye.distanceTo(point);
  const reach = bot.game.gameMode === 'creative' ? 5 : 3;
  if (distance > reach) throw new Error(`Entity ${entityId} is out of interaction reach (${reach} blocks)`);
  if (distance > 0 && bot.world.raycast(eye, point.minus(eye).normalize(), distance)) {
    throw new Error(`Entity ${entityId} is obstructed`);
  }
  return entity;
}

export function registerInteractionTools(factory: ToolFactory, getBot: () => Bot): void {
  const entitySchema = { entityId: z.coerce.number().int().nonnegative().describe('Entity ID returned by find-entity') };

  factory.registerTool(
    'interact-block',
    'Right-click a nearby visible block using the currently equipped main-hand item; sends a request, not confirmation',
    {
      x: z.coerce.number().finite().describe('Block X coordinate'),
      y: z.coerce.number().finite().describe('Block Y coordinate'),
      z: z.coerce.number().finite().describe('Block Z coordinate')
    },
    async ({ x, y, z }: { x: number; y: number; z: number }) => {
      const bot = getBot();
      requireAwake(bot);
      ({ x, y, z } = coerceCoordinates(x, y, z));
      const block = bot.blockAt(new Vec3(x, y, z).floored());
      if (!block || ['air', 'cave_air', 'void_air'].includes(block.name)) throw new Error('No loaded block at the specified coordinates');
      if (bot.isABed(block)) throw new Error('Use sleep to interact with a bed safely');
      const eye = eyePosition(bot);
      const distance = eye.distanceTo(closestPoint(eye, block.position, block.position.offset(1, 1, 1)));
      const reach = bot.game.gameMode === 'creative' ? 5 : 4.5;
      if (distance > reach) throw new Error(`Block is out of interaction reach (${reach} blocks)`);
      if (!bot.canSeeBlock(block)) throw new Error('Block is not visible');
      await bot.activateBlock(block);
      return factory.createResponse(`Sent interaction request for ${block.name} at (${block.position.x}, ${block.position.y}, ${block.position.z}); server outcome is not confirmed`);
    }
  );

  factory.registerTool(
    'interact-entity',
    'Right-click a nearby unobstructed entity by ID using the current main-hand item; sends a request, not confirmation',
    entitySchema,
    async ({ entityId }: { entityId: number }) => {
      const bot = getBot();
      const entity = requireEntity(bot, entityId);
      await bot.activateEntity(entity);
      return factory.createResponse(`Sent interaction request for entity ${entityId} (${entity.name ?? entity.type}); server outcome is not confirmed`);
    }
  );

  factory.registerTool(
    'mount',
    'Try boarding a nearby entity by ID, such as a boat; requires server-confirmed mounting within 3 seconds',
    entitySchema,
    async ({ entityId }: { entityId: number }) => {
      const bot = getBot();
      if (getVehicle(bot)) throw new Error('Already mounted; dismount first');
      const entity = requireEntity(bot, entityId);
      if (bot.getControlState('sneak')) throw new Error('Cannot mount while sneaking');
      await bot.lookAt(entity.position.offset(0, entity.height / 2, 0), true);
      bot.mount(entity);
      await waitForState(bot, () => getVehicle(bot)?.id === entityId, `Server did not confirm mounting entity ${entityId} within 3 seconds`);
      return factory.createResponse(`Mounted entity ${entityId} (${entity.name ?? entity.type})`);
    }
  );

  factory.registerTool('dismount', 'Leave the current vehicle; requires server confirmation within 3 seconds', {}, async () => {
    const bot = getBot();
    requireAwake(bot);
    if (!getVehicle(bot)) throw new Error('Bot is not mounted');
    bot.dismount();
    await waitForState(bot, () => !getVehicle(bot), 'Server did not confirm dismounting within 3 seconds');
    return factory.createResponse('Dismounted');
  });
}
