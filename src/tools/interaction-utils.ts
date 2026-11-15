import type { Bot } from 'mineflayer';
import type { Entity } from 'prismarine-entity';
import { Vec3 } from 'vec3';

// Mineflayer maintains bot.vehicle, but omits it from its Bot declaration.
export function getVehicle(bot: Bot & { vehicle?: Entity | null }): Entity | null {
  return bot.vehicle ?? null;
}

export function requireAwake(bot: Bot): void {
  if (bot.health <= 0) throw new Error('Bot is dead');
  if (bot.isSleeping) throw new Error('Bot is sleeping; use wake first');
  if (bot.game.gameMode === 'spectator') throw new Error('Cannot interact in spectator mode');
}

export function eyePosition(bot: Bot): Vec3 {
  return bot.entity.position.offset(0, bot.entity.height * 0.9, 0);
}

export function closestPoint(eye: Vec3, min: Vec3, max: Vec3): Vec3 {
  const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
  return new Vec3(clamp(eye.x, min.x, max.x), clamp(eye.y, min.y, max.y), clamp(eye.z, min.z, max.z));
}

export async function waitForState(bot: Bot, condition: () => boolean, failure: string): Promise<void> {
  const deadline = Date.now() + 3000;
  while (!condition()) {
    if (bot.health <= 0 || !bot.entity.isValid) throw new Error('Bot died or disconnected while awaiting confirmation');
    if (Date.now() >= deadline) throw new Error(failure);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
