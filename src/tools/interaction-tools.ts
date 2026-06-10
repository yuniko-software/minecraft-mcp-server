import { z } from "zod";
import mineflayer from 'mineflayer';
import { Vec3 } from 'vec3';
import { ToolFactory } from '../tool-factory.js';

export function registerInteractionTools(factory: ToolFactory, getBot: () => mineflayer.Bot): void {
  // Use item (right click) - generic right click with held item
  factory.registerTool(
    "use-item",
    "Use (right-click) the currently held item. Useful for fishing rods, food, potions, etc.",
    {},
    async () => {
      const bot = getBot();
      bot.activateItem(false);
      return factory.createResponse("Activated held item (right-click)");
    }
  );

  // Stop using item
  factory.registerTool(
    "deactivate-item",
    "Stop using (release right-click) the currently held item. Use after fishing to reel in, or to stop eating.",
    {},
    async () => {
      const bot = getBot();
      bot.deactivateItem();
      return factory.createResponse("Deactivated held item");
    }
  );

  // Fish - full auto: cast, wait for bite, reel in
  factory.registerTool(
    "fish",
    "Full fishing cycle: cast the rod, wait for a fish to bite, then reel in. Must have a fishing rod equipped. Timeout default 60s.",
    {
      timeout: z.number().optional().describe("Max seconds to wait for a bite (default: 60)")
    },
    async ({ timeout = 60 }) => {
      const bot = getBot();
      const heldItem = bot.heldItem;
      if (!heldItem || !heldItem.name.includes('fishing_rod')) {
        return factory.createResponse("No fishing rod equipped! Equip one first with equip-item.");
      }

      try {
        await Promise.race([
          bot.fish(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('No bite - timed out')), timeout * 1000)
          )
        ]);
        return factory.createResponse("Caught something! Check inventory for new items.");
      } catch (error) {
        return factory.createResponse(`Fishing: ${(error as Error).message}`);
      }
    }
  );

  // Wait for fish bite - for when rod is already cast via use-item
  factory.registerTool(
    "wait-for-fish",
    "Wait for a fish to bite after you've already cast the rod with use-item. Watches the bobber entity for movement. Call use-item again after this to reel in.",
    {
      timeout: z.number().optional().describe("Max seconds to wait for a bite (default: 60)")
    },
    async ({ timeout = 60 }) => {
      const bot = getBot();

      return new Promise<ReturnType<typeof factory.createResponse>>((resolve) => {
        const timeoutId = setTimeout(() => {
          bot.removeListener('entityMoved', onEntityMoved);
          resolve(factory.createResponse("No bite detected within timeout. Try reeling in and casting again."));
        }, timeout * 1000);

        // Find the bobber entity owned by this bot
        const findBobber = () => {
          return Object.values(bot.entities).find(
            (e) => e.name === 'fishing_bobber'
          );
        };

        const bobber = findBobber();
        if (!bobber) {
          clearTimeout(timeoutId);
          resolve(factory.createResponse("No fishing bobber found! Cast the rod first with use-item."));
          return;
        }

        const onEntityMoved = (entity: typeof bobber) => {
          if (entity === bobber && entity.velocity && entity.velocity.y < -0.3) {
            clearTimeout(timeoutId);
            bot.removeListener('entityMoved', onEntityMoved);
            resolve(factory.createResponse("Fish on the hook! Quick, use use-item to reel in!"));
          }
        };

        bot.on('entityMoved', onEntityMoved);
      });
    }
  );

  // Eat/consume food or potion
  factory.registerTool(
    "eat",
    "Eat or consume the currently held item (food or potion). Equip the food item first.",
    {},
    async () => {
      const bot = getBot();
      const heldItem = bot.heldItem;
      if (!heldItem) {
        return factory.createResponse("No item in hand! Equip food first with equip-item.");
      }

      try {
        bot.activateItem(false);
        // Wait for eating to complete (roughly 1.6 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        bot.deactivateItem();
        return factory.createResponse(`Consumed ${heldItem.name}`);
      } catch (error) {
        return factory.createResponse(`Failed to eat: ${(error as Error).message}`);
      }
    }
  );

  // Toss/drop items
  factory.registerTool(
    "toss-item",
    "Drop/toss items from inventory onto the ground",
    {
      itemName: z.string().describe("Name of the item to toss"),
      count: z.number().optional().describe("Number of items to toss (default: all)")
    },
    async ({ itemName, count }) => {
      const bot = getBot();
      const items = bot.inventory.items();
      const item = items.find((i) => i.name.includes(itemName.toLowerCase()));

      if (!item) {
        return factory.createResponse(`Couldn't find '${itemName}' in inventory`);
      }

      try {
        const tossCount = count ?? item.count;
        await bot.toss(item.type, item.metadata, tossCount);
        return factory.createResponse(`Tossed ${tossCount} x ${item.name}`);
      } catch (error) {
        return factory.createResponse(`Failed to toss: ${(error as Error).message}`);
      }
    }
  );

  // Open chest and deposit items
  factory.registerTool(
    "deposit-to-chest",
    "Open a nearby chest and deposit items into it",
    {
      chestX: z.number().describe("X coordinate of the chest"),
      chestY: z.number().describe("Y coordinate of the chest"),
      chestZ: z.number().describe("Z coordinate of the chest"),
      itemName: z.string().describe("Name of the item to deposit"),
      count: z.number().optional().describe("Number of items to deposit (default: all)")
    },
    async ({ chestX, chestY, chestZ, itemName, count }) => {
      const bot = getBot();
      const chestBlock = bot.blockAt(new Vec3(chestX, chestY, chestZ));

      if (!chestBlock || !chestBlock.name.includes('chest')) {
        return factory.createResponse(`No chest found at (${chestX}, ${chestY}, ${chestZ})`);
      }

      try {
        const container = await bot.openContainer(chestBlock);
        const items = bot.inventory.items();
        const item = items.find((i) => i.name.includes(itemName.toLowerCase()));

        if (!item) {
          container.close();
          return factory.createResponse(`Couldn't find '${itemName}' in inventory`);
        }

        const depositCount = count ?? item.count;
        await container.deposit(item.type, item.metadata, depositCount);
        container.close();
        return factory.createResponse(`Deposited ${depositCount} x ${item.name} into chest`);
      } catch (error) {
        return factory.createResponse(`Failed to deposit: ${(error as Error).message}`);
      }
    }
  );

  // Withdraw items from chest
  factory.registerTool(
    "withdraw-from-chest",
    "Open a nearby chest and take items from it",
    {
      chestX: z.number().describe("X coordinate of the chest"),
      chestY: z.number().describe("Y coordinate of the chest"),
      chestZ: z.number().describe("Z coordinate of the chest"),
      itemName: z.string().describe("Name of the item to withdraw"),
      count: z.number().optional().describe("Number of items to withdraw (default: all)")
    },
    async ({ chestX, chestY, chestZ, itemName, count }) => {
      const bot = getBot();
      const chestBlock = bot.blockAt(new Vec3(chestX, chestY, chestZ));

      if (!chestBlock || !chestBlock.name.includes('chest')) {
        return factory.createResponse(`No chest found at (${chestX}, ${chestY}, ${chestZ})`);
      }

      try {
        const container = await bot.openContainer(chestBlock);
        const chestItems = container.containerItems();
        const item = chestItems.find((i) => i.name.includes(itemName.toLowerCase()));

        if (!item) {
          container.close();
          return factory.createResponse(`Couldn't find '${itemName}' in chest`);
        }

        const withdrawCount = count ?? item.count;
        await container.withdraw(item.type, item.metadata, withdrawCount);
        container.close();
        return factory.createResponse(`Withdrew ${withdrawCount} x ${item.name} from chest`);
      } catch (error) {
        return factory.createResponse(`Failed to withdraw: ${(error as Error).message}`);
      }
    }
  );
}
