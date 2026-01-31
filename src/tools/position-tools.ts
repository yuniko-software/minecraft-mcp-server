import { z } from "zod";
import mineflayer from 'mineflayer';
import pathfinderPkg from 'mineflayer-pathfinder';
const { goals } = pathfinderPkg;
import { Vec3 } from 'vec3';
import { ToolFactory } from '../tool-factory.js';

type Direction = 'forward' | 'back' | 'left' | 'right';

export function registerPositionTools(factory: ToolFactory, getBot: () => mineflayer.Bot): void {
  factory.registerTool(
    "get-position",
    "Get the current position of the bot",
    {},
    async () => {
      const bot = getBot();
      const position = bot.entity.position;
      const pos = {
        x: Math.floor(position.x),
        y: Math.floor(position.y),
        z: Math.floor(position.z)
      };
      return factory.createResponse(`Current position: (${pos.x}, ${pos.y}, ${pos.z})`);
    }
  );

  factory.registerTool(
    "move-to-position",
    "Move the bot to a specific position",
    {
      x: z.number().describe("X coordinate"),
      y: z.number().describe("Y coordinate"),
      z: z.number().describe("Z coordinate"),
      range: z.number().optional().describe("How close to get to the target (default: 1)"),
      timeoutMs: z.number().optional().describe("Timeout in milliseconds before cancelling (default: no timeout)")
    },
    async ({ x, y, z, range = 1, timeoutMs }: { x: number; y: number; z: number; range?: number; timeoutMs?: number }) => {
      const bot = getBot();
      const goal = new goals.GoalNear(x, y, z, range);
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let timeoutPromise: Promise<never> | null = null;
      let timedOut = false;

      if (timeoutMs && timeoutMs > 0) {
        timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            timedOut = true;
            reject(new Error(`Move timed out after ${timeoutMs}ms`));
          }, timeoutMs);
        });
      }

      const gotoPromise = bot.pathfinder.goto(goal);

      try {
        if (timeoutPromise) {
          await Promise.race([gotoPromise, timeoutPromise]);
        } else {
          await gotoPromise;
        }
        return factory.createResponse(`Successfully moved to position near (${x}, ${y}, ${z})`);
      } catch (error) {
        if (timedOut) {
          throw new Error(`Move timed out after ${timeoutMs}ms`);
        }
        throw error;
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        bot.pathfinder.stop();
        if (timedOut) {
          gotoPromise.catch(() => {});
        }
      }
    }
  );

  factory.registerTool(
    "look-at",
    "Make the bot look at a specific position",
    {
      x: z.number().describe("X coordinate"),
      y: z.number().describe("Y coordinate"),
      z: z.number().describe("Z coordinate"),
    },
    async ({ x, y, z }) => {
      const bot = getBot();
      await bot.lookAt(new Vec3(x, y, z), true);
      return factory.createResponse(`Looking at position (${x}, ${y}, ${z})`);
    }
  );

  factory.registerTool(
    "jump",
    "Make the bot jump",
    {},
    async () => {
      const bot = getBot();
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 250);
      return factory.createResponse("Successfully jumped");
    }
  );

  factory.registerTool(
    "move-in-direction",
    "Move the bot in a specific direction for a duration",
    {
      direction: z.enum(['forward', 'back', 'left', 'right']).describe("Direction to move"),
      duration: z.number().optional().describe("Duration in milliseconds (default: 1000)")
    },
    async ({ direction, duration = 1000 }: { direction: Direction, duration?: number }) => {
      const bot = getBot();
      return new Promise((resolve) => {
        bot.setControlState(direction, true);
        setTimeout(() => {
          bot.setControlState(direction, false);
          resolve(factory.createResponse(`Moved ${direction} for ${duration}ms`));
        }, duration);
      });
    }
  );
}
