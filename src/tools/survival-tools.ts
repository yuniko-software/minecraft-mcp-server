import { z } from 'zod';
import type { Bot } from 'mineflayer';
import minecraftData from 'minecraft-data';
import { Vec3 } from 'vec3';
import { ToolFactory } from '../tool-factory.js';
import { coerceCoordinates } from './coordinate-utils.js';
import { getVehicle, requireAwake, waitForState } from './interaction-utils.js';

export function registerSurvivalTools(factory: ToolFactory, getBot: () => Bot): void {
  let eating = false;

  factory.registerTool(
    'eat',
    'Eat one inventory food item by exact item name; leaves it equipped in the main hand',
    { itemName: z.string().trim().min(1).describe('Exact inventory food name, for example bread') },
    async ({ itemName }: { itemName: string }) => {
      const bot = getBot();
      requireAwake(bot);
      if (eating || bot.usingHeldItem) throw new Error('Already consuming or using a held item');
      if (bot.currentWindow) throw new Error('Close the open inventory window before eating');
      const name = itemName.toLowerCase();
      const item = bot.inventory.items().find(item => item.name === name);
      if (!item) throw new Error(`No ${name} in inventory`);
      // The food table also includes fish buckets, which are not edible items.
      if (!minecraftData(bot.version).foodsByName[name] || name.endsWith('_bucket')) {
        throw new Error(`${name} is not an edible food item`);
      }
      eating = true;
      try {
        await bot.equip(item, 'hand');
        await bot.consume();
        return factory.createResponse(`Consumed ${name}. Food: ${bot.food}/20; health: ${bot.health}/20`);
      } finally {
        eating = false;
      }
    }
  );

  factory.registerTool(
    'sleep',
    'Enter an explicitly identified nearby bed; returns on bed entry, not at dawn',
    {
      x: z.coerce.number().finite().describe('Bed X coordinate'),
      y: z.coerce.number().finite().describe('Bed Y coordinate'),
      z: z.coerce.number().finite().describe('Bed Z coordinate')
    },
    async ({ x, y, z }: { x: number; y: number; z: number }) => {
      const bot = getBot();
      requireAwake(bot);
      if (getVehicle(bot)) throw new Error('Dismount before sleeping');
      if (bot.game.dimension !== 'overworld') throw new Error('Beds are unsafe outside the overworld');
      ({ x, y, z } = coerceCoordinates(x, y, z));
      const bed = bot.blockAt(new Vec3(x, y, z).floored());
      if (!bed || !bot.isABed(bed)) throw new Error('No loaded bed at the specified coordinates');
      if (!bot.canSeeBlock(bed)) throw new Error('Bed is not visible');
      // Native sleep validates range, time, occupancy and nearby monsters, and
      // resolves on the sleep event (not the subsequent wake event).
      await bot.sleep(bed);
      return factory.createResponse(`Entered bed at (${bed.position.x}, ${bed.position.y}, ${bed.position.z})`);
    }
  );

  factory.registerTool('wake', 'Wake from the current bed', {}, async () => {
    const bot = getBot();
    if (!bot.isSleeping) throw new Error('Bot is already awake');
    await bot.wake();
    await waitForState(bot, () => !bot.isSleeping, 'Server did not confirm waking within 3 seconds');
    return factory.createResponse('Bot is awake');
  });

  factory.registerTool('status', 'Report survival stats and current bot state as JSON', {}, async () => {
    const bot = getBot();
    const vehicle = getVehicle(bot);
    const available = (value: number) => Number.isFinite(value) ? value : null;
    return factory.createResponse(JSON.stringify({
      username: bot.username,
      version: bot.version,
      health: available(bot.health),
      food: available(bot.food),
      saturation: available(bot.foodSaturation),
      oxygen: available(bot.oxygenLevel),
      sleeping: bot.isSleeping,
      alive: bot.health > 0,
      position: bot.entity.position,
      onGround: bot.entity.onGround,
      gameMode: bot.game.gameMode,
      dimension: bot.game.dimension,
      timeOfDay: bot.time.timeOfDay,
      heldItem: bot.heldItem ? { name: bot.heldItem.name, count: bot.heldItem.count } : null,
      usingHeldItem: bot.usingHeldItem,
      vehicle: vehicle ? { id: vehicle.id, name: vehicle.name ?? vehicle.type } : null,
      openWindow: bot.currentWindow ? { id: bot.currentWindow.id, type: bot.currentWindow.type } : null,
      digging: bot.targetDigBlock ? { name: bot.targetDigBlock.name, position: bot.targetDigBlock.position } : null
    }));
  });
}
