import { z } from "zod";
import mineflayer from 'mineflayer';
import type { Item } from 'prismarine-item';
import { Vec3 } from 'vec3';
import { ToolFactory } from '../tool-factory.js';

const FURNACE_BLOCKS = new Set(['furnace', 'blast_furnace', 'smoker']);

export function registerFurnaceTools(factory: ToolFactory, getBot: () => mineflayer.Bot): void {
  factory.registerTool(
    "smelt-item",
    "Smelt items using a furnace-like block",
    {
      x: z.number().describe("X coordinate"),
      y: z.number().describe("Y coordinate"),
      z: z.number().describe("Z coordinate"),
      inputItem: z.string().describe("Name of item to smelt"),
      inputCount: z.number().int().positive().optional().describe("Amount of input to smelt (default: 1)"),
      fuelItem: z.string().describe("Name of fuel item"),
      fuelCount: z.number().int().positive().optional().describe("Amount of fuel to use (default: 1)"),
      takeOutput: z.boolean().optional().describe("Whether to take output when ready (default: true)"),
      timeoutMs: z.number().int().positive().optional().describe("Timeout waiting for output in ms (default: 60000)")
    },
    async ({
      x,
      y,
      z,
      inputItem,
      inputCount = 1,
      fuelItem,
      fuelCount = 1,
      takeOutput = true,
      timeoutMs = 60000
    }: {
      x: number;
      y: number;
      z: number;
      inputItem: string;
      inputCount?: number;
      fuelItem: string;
      fuelCount?: number;
      takeOutput?: boolean;
      timeoutMs?: number;
    }) => {
      const bot = getBot();
      if (inputCount <= 0) {
        return factory.createErrorResponse('inputCount must be a positive integer');
      }
      if (fuelCount <= 0) {
        return factory.createErrorResponse('fuelCount must be a positive integer');
      }
      if (timeoutMs <= 0) {
        return factory.createErrorResponse('timeoutMs must be a positive integer');
      }

      const furnacePos = new Vec3(x, y, z);
      const furnaceBlock = bot.blockAt(furnacePos);

      if (!furnaceBlock || !FURNACE_BLOCKS.has(furnaceBlock.name)) {
        return factory.createResponse(`No furnace block found at (${x}, ${y}, ${z})`);
      }

      const items = bot.inventory.items();
      const input = items.find((item) => item.name.includes(inputItem.toLowerCase()));
      if (!input) {
        return factory.createResponse(`Couldn't find any item matching '${inputItem}' in inventory`);
      }

      const fuel = items.find((item) => item.name.includes(fuelItem.toLowerCase()));
      if (!fuel) {
        return factory.createResponse(`Couldn't find any fuel item matching '${fuelItem}' in inventory`);
      }

      const resolvedInputCount = Math.min(inputCount, input.count);
      const resolvedFuelCount = Math.min(fuelCount, fuel.count);

      const furnace = await bot.openFurnace(furnaceBlock);
      const cleanup = () => {
        try {
          furnace.close();
        } catch {
          // ignore
        }
      };

      try {
        const existingInput = furnace.inputItem();
        if (existingInput && existingInput.name !== input.name) {
          return factory.createResponse(`Furnace input slot is occupied by ${existingInput.name}`);
        }

        const existingFuel = furnace.fuelItem();
        if (existingFuel && existingFuel.name !== fuel.name) {
          return factory.createResponse(`Furnace fuel slot is occupied by ${existingFuel.name}`);
        }

        await furnace.putFuel(fuel.type, fuel.metadata ?? null, resolvedFuelCount);
        await furnace.putInput(input.type, input.metadata ?? null, resolvedInputCount);

        if (!takeOutput) {
          return factory.createResponse(
            `Started smelting ${resolvedInputCount} ${input.name} with ${resolvedFuelCount} ${fuel.name}`
          );
        }

        const output = await waitForOutput(furnace, timeoutMs);
        if (!output) {
          return factory.createResponse(`No output after ${timeoutMs}ms`);
        }

        const taken = await furnace.takeOutput();
        return factory.createResponse(`Smelted ${taken.count} ${taken.name}`);
      } finally {
        cleanup();
      }
    }
  );
}

async function waitForOutput(furnace: mineflayer.Furnace, timeoutMs: number): Promise<Item | null> {
  const existing = furnace.outputItem();
  if (existing) {
    return existing;
  }

  return new Promise((resolve) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const onUpdate = () => {
      const output = furnace.outputItem();
      if (output) {
        cleanup();
        resolve(output);
      }
    };

    const cleanup = () => {
      furnace.removeListener('update', onUpdate);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    furnace.on('update', onUpdate);

    timeoutId = setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeoutMs);
  });
}
