import { z } from "zod";
import mineflayer from 'mineflayer';
import { ToolFactory } from '../tool-factory.js';
import { requireAwake } from './interaction-utils.js';

interface InventoryItem {
  name: string;
  count: number;
  slot: number;
}

export function registerInventoryTools(factory: ToolFactory, getBot: () => mineflayer.Bot): void {
  let dropping = false;
  factory.registerTool(
    "drop-item",
    "Drop an exact inventory item name with a quantity up to its full stack size; does not move the bot",
    {
      itemName: z.string().trim().min(1).describe("Exact item name, for example cobblestone"),
      count: z.number().int().positive().describe("Quantity to drop, up to this item's stack size (usually 64, 16 or 1)")
    },
    async ({ itemName, count }: { itemName: string; count: number }) => {
      const bot = getBot();
      const cursorCount = () => bot.inventory.selectedItem?.count ?? 0;
      requireAwake(bot);
      if (dropping) throw new Error('Another drop operation is in progress');
      if (bot.currentWindow || bot.inventory.selectedItem) throw new Error('Close the inventory window and clear its cursor before dropping');
      if (bot.usingHeldItem) throw new Error('Finish using the held item before dropping');
      const name = itemName.toLowerCase();
      const items = bot.inventory.items().filter(item => item.name === name &&
        item.slot >= bot.inventory.inventoryStart && item.slot < bot.inventory.inventoryEnd);
      if (!items.length) throw new Error(`No ${name} in inventory`);
      const item = items.find(item => item.count === count) ?? items[0];
      if (count > item.stackSize) throw new Error(`${name} has a maximum stack size of ${item.stackSize}; requested ${count}`);
      const matchingCount = () => bot.inventory.items()
        .filter(candidate => candidate.name === name && candidate.type === item.type &&
          candidate.metadata === item.metadata && candidate.slot >= bot.inventory.inventoryStart &&
          candidate.slot < bot.inventory.inventoryEnd)
        .reduce((total, candidate) => total + candidate.count, 0);
      const before = matchingCount();
      if (before < count) throw new Error(`Only ${before} ${name} available; requested ${count}`);
      dropping = true;
      try {
        // Toss an entire selected stack directly so clearing a slot needs one call.
        if (item.count === count) await bot.tossStack(item);
        else await bot.toss(item.type, item.metadata ?? null, count);
        const removed = before - matchingCount();
        if (removed !== count || bot.inventory.selectedItem) {
          throw new Error(`Drop not fully confirmed: requested ${count}, inventory decreased by ${removed}`);
        }
        return factory.createResponse(`Dropped ${removed} ${name}; ${matchingCount()} remaining in inventory. Ground items may be picked up again.`);
      } catch (error) {
        throw new Error(`${String(error)}; requested ${count} ${name}, inventory decreased by ${before - matchingCount()}, remaining ${matchingCount()}, cursor holds ${cursorCount()}. Partial changes are not rolled back; inspect inventory before retrying.`);
      } finally {
        dropping = false;
      }
    }
  );

  factory.registerTool(
    "list-inventory",
    "List all items in the bot's inventory",
    {},
    async () => {
      const bot = getBot();
      const items = bot.inventory.items();
      const itemList: InventoryItem[] = items.map((item) => ({
        name: item.name,
        count: item.count,
        slot: item.slot
      }));

      if (items.length === 0) {
        return factory.createResponse("Inventory is empty");
      }

      let inventoryText = `Found ${items.length} items in inventory:\n\n`;
      itemList.forEach(item => {
        inventoryText += `- ${item.name} (x${item.count}) in slot ${item.slot}\n`;
      });

      return factory.createResponse(inventoryText);
    }
  );

  factory.registerTool(
    "find-item",
    "Find a specific item in the bot's inventory",
    {
      nameOrType: z.string().describe("Name or type of item to find")
    },
    async ({ nameOrType }) => {
      const bot = getBot();
      const items = bot.inventory.items();
      const item = items.find((item) =>
        item.name.includes(nameOrType.toLowerCase())
      );

      if (item) {
        return factory.createResponse(`Found ${item.count} ${item.name} in inventory (slot ${item.slot})`);
      } else {
        return factory.createResponse(`Couldn't find any item matching '${nameOrType}' in inventory`);
      }
    }
  );

  factory.registerTool(
    "equip-item",
    "Equip a specific item",
    {
      itemName: z.string().describe("Name of the item to equip"),
      destination: z.string().optional().describe("Where to equip the item (default: 'hand')")
    },
    async ({ itemName, destination = 'hand' }) => {
      const bot = getBot();
      const items = bot.inventory.items();
      const item = items.find((item) =>
        item.name.includes(itemName.toLowerCase())
      );

      if (!item) {
        return factory.createResponse(`Couldn't find any item matching '${itemName}' in inventory`);
      }

      await bot.equip(item, destination as mineflayer.EquipmentDestination);
      return factory.createResponse(`Equipped ${item.name} to ${destination}`);
    }
  );
}
