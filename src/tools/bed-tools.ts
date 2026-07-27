import { z } from "zod";
import mineflayer from 'mineflayer';
import { ToolFactory } from '../tool-factory.js';

export function registerBedTools(factory: ToolFactory, getBot: () => mineflayer.Bot): void {
    factory.registerTool(
        "sleep-bed",
        "Find a bed block nearby max distance, then make the bot sleep in bed",
        {
            maxDistance: z.coerce.number().int().positive().default(16).describe("Maximum search distance for a bed (default: 16)")
        },
        async ({ maxDistance }: { maxDistance: number }) => {
            const bot = getBot();

            const bedBlock = bot.findBlock({
                matching: (block) => bot.isABed(block),
                maxDistance: maxDistance
            });

            if (!bedBlock) {
                return factory.createResponse(`No bed found within ${maxDistance} blocks`);
            }

            try {
                await bot.sleep(bedBlock);
                return factory.createResponse(`Successfully sleeping in bed at (${bedBlock.position.x}, ${bedBlock.position.y}, ${bedBlock.position.z})`);
            } catch (err) {
                return factory.createResponse(`Failed to sleep: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    );

    factory.registerTool(
        "wake-up",
        "Wake the bot up from bed",
        {},
        async () => {
            const bot = getBot();

            try {
                await bot.wake();
                return factory.createResponse("Successfully woke up");
            } catch (err) {
                return factory.createResponse(`Error waking up: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    );
}
