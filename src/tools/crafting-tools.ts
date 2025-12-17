import { z } from "zod";
import mineflayer from 'mineflayer';
import minecraftData from 'minecraft-data';
import { ToolFactory } from '../tool-factory.js';
import { log } from '../logger.js';

interface RecipeIngredient {
  name: string;
  count: number;
}

interface InventoryItem {
  name: string;
  count: number;
}

function parseRecipeIngredients(recipe: unknown): RecipeIngredient[] {
  const ingredients: RecipeIngredient[] = [];

  if (!recipe) return ingredients;

  const r = recipe as Record<string, unknown>;

  // Handle inShape format (2D array)
  if (Array.isArray(r.inShape)) {
    const countMap: Record<string, number> = {};
    for (const row of r.inShape as unknown[]) {
      if (Array.isArray(row)) {
        for (const item of row) {
          if (!item) continue;
          const itemName = typeof item === 'string' ? item : (item as Record<string, unknown>).name as string;
          countMap[itemName] = (countMap[itemName] || 0) + 1;
        }
      }
    }
    for (const [name, count] of Object.entries(countMap)) {
      ingredients.push({ name, count });
    }
  }

  // Handle ingredients array
  if (Array.isArray(r.ingredients)) {
    const countMap: Record<string, number> = {};
    for (const ingredient of r.ingredients as unknown[]) {
      const itemName = typeof ingredient === 'string' ? ingredient : (ingredient as Record<string, unknown>).name as string;
      countMap[itemName] = (countMap[itemName] || 0) + 1;
    }
    for (const [name, count] of Object.entries(countMap)) {
      ingredients.push({ name, count });
    }
  }

  return ingredients;
}

function getRecipeResult(recipe: unknown): { name: string; count: number } | null {
  if (!recipe) return null;

  const r = recipe as Record<string, unknown>;
  const result = r.result;

  if (!result) return null;

  if (typeof result === 'string') {
    return { name: result, count: 1 };
  }

  if (typeof result === 'object' && result !== null) {
    const resultObj = result as Record<string, unknown>;
    return {
      name: resultObj.name as string,
      count: (resultObj.count as number) || 1
    };
  }

  return null;
}

function canCraftRecipe(recipe: unknown, inventory: InventoryItem[]): boolean {
  const ingredients = parseRecipeIngredients(recipe);

  for (const { name, count } of ingredients) {
    const hasItem = inventory.find(item => item.name === name);
    if (!hasItem || hasItem.count < count) {
      return false;
    }
  }

  return true;
}

function getAllRecipes(mcData: unknown): unknown[] {
  const data = mcData as Record<string, unknown>;
  const recipes = data.recipes;

  if (Array.isArray(recipes)) {
    return recipes;
  }

  if (typeof recipes === 'object' && recipes !== null) {
    const recipeObj = recipes as Record<string, unknown>;
    const allRecipes: unknown[] = [];
    for (const recipeList of Object.values(recipeObj)) {
      if (Array.isArray(recipeList)) {
        allRecipes.push(...recipeList);
      }
    }
    return allRecipes;
  }

  return [];
}

export function registerCraftingTools(factory: ToolFactory, getBot: () => mineflayer.Bot): void {
  factory.registerTool(
    "list-recipes",
    "List all available crafting recipes the bot can make with current inventory",
    {
      outputItem: z.string().optional().describe("Optional: filter recipes by output item name")
    },
    async ({ outputItem }) => {
      const bot = getBot();
      const mcData = minecraftData(bot.version);
      const recipes = getAllRecipes(mcData);
      const inventory = bot.inventory.items().map(item => ({ name: item.name, count: item.count }));

      if (!recipes || recipes.length === 0) {
        return factory.createResponse("No recipes available for this Minecraft version");
      }

      const availableRecipes: Array<{ name: string; count: number; ingredients: RecipeIngredient[] }> = [];

      for (const recipe of recipes) {
        const result = getRecipeResult(recipe);
        if (!result) continue;

        if (outputItem && !result.name.includes(outputItem.toLowerCase())) {
          continue;
        }

        if (canCraftRecipe(recipe, inventory)) {
          const ingredients = parseRecipeIngredients(recipe);
          availableRecipes.push({
            name: result.name,
            count: result.count,
            ingredients
          });
        }
      }

      if (availableRecipes.length === 0) {
        return factory.createResponse(`No craftable recipes found${outputItem ? ` for ${outputItem}` : ''} with current inventory`);
      }

      let output = `Found ${availableRecipes.length} craftable recipe(s):\n\n`;
      availableRecipes.forEach((recipe, index) => {
        output += `${index + 1}. ${recipe.name} (x${recipe.count})\n`;
        output += `   Ingredients: ${recipe.ingredients.map(i => `${i.name} x${i.count}`).join(", ")}\n\n`;
      });

      return factory.createResponse(output);
    }
  );

  factory.registerTool(
    "craft-item",
    "Craft an item using a crafting recipe",
    {
      outputItem: z.string().describe("Name of the item to craft"),
      amount: z.number().optional().describe("Number of times to craft (default: 1)")
    },
    async ({ outputItem, amount = 1 }) => {
      const bot = getBot();
      const mcData = minecraftData(bot.version);
      const recipes = getAllRecipes(mcData);

      if (!recipes || recipes.length === 0) {
        return factory.createErrorResponse("No recipes available");
      }

      let craftedCount = 0;
      let lastError = "";

      for (let attempt = 0; attempt < amount; attempt++) {
        let found = false;

        for (const recipe of recipes) {
          const result = getRecipeResult(recipe);
          if (!result) continue;

          if (!result.name.includes(outputItem.toLowerCase())) {
            continue;
          }

          const currentInventory = bot.inventory.items().map(item => ({ name: item.name, count: item.count }));

          if (canCraftRecipe(recipe, currentInventory)) {
            try {
              await bot.craft(recipe as Parameters<typeof bot.craft>[0], 1);
              craftedCount++;
              found = true;
              log('info', `Crafted ${result.name}`);
              break;
            } catch (err) {
              lastError = err instanceof Error ? err.message : String(err);
              log('warn', `Failed to craft ${outputItem}: ${lastError}`);
              continue;
            }
          }
        }

        if (!found && attempt === 0) {
          return factory.createErrorResponse(`Recipe for ${outputItem} not found or missing ingredients`);
        }

        if (!found) {
          break;
        }
      }

      if (craftedCount === 0) {
        return factory.createErrorResponse(`Failed to craft ${outputItem}: ${lastError || "Missing ingredients or recipe not found"}`);
      }

      return factory.createResponse(`Successfully crafted ${outputItem} ${craftedCount} time(s)`);
    }
  );

  factory.registerTool(
    "get-recipe",
    "Get detailed information about a specific recipe",
    {
      itemName: z.string().describe("Name of the item to get recipe for")
    },
    async ({ itemName }) => {
      const bot = getBot();
      const mcData = minecraftData(bot.version);
      const recipes = getAllRecipes(mcData);

      if (!recipes || recipes.length === 0) {
        return factory.createErrorResponse("No recipes available");
      }

      const matchingRecipes = [];

      for (const recipe of recipes) {
        const result = getRecipeResult(recipe);
        if (!result) continue;

        if (result.name.includes(itemName.toLowerCase())) {
          const ingredients = parseRecipeIngredients(recipe);
          matchingRecipes.push({
            result: result.name,
            resultCount: result.count,
            ingredients
          });
        }
      }

      if (matchingRecipes.length === 0) {
        return factory.createResponse(`No recipes found for ${itemName}`);
      }

      let output = `Recipe(s) for ${itemName}:\n\n`;

      matchingRecipes.forEach((recipe, index) => {
        output += `${index + 1}. Output: ${recipe.result} (x${recipe.resultCount})\n`;
        output += `   Ingredients:\n`;

        for (const ingredient of recipe.ingredients) {
          output += `   - ${ingredient.name} x${ingredient.count}\n`;
        }
        output += '\n';
      });

      return factory.createResponse(output);
    }
  );

  factory.registerTool(
    "can-craft",
    "Check if the bot can craft a specific item with current inventory",
    {
      itemName: z.string().describe("Name of the item to check")
    },
    async ({ itemName }) => {
      const bot = getBot();
      const mcData = minecraftData(bot.version);
      const recipes = getAllRecipes(mcData);
      const inventory = bot.inventory.items().map(item => ({ name: item.name, count: item.count }));

      if (!recipes || recipes.length === 0) {
        return factory.createErrorResponse("No recipes available");
      }

      for (const recipe of recipes) {
        const result = getRecipeResult(recipe);
        if (!result) continue;

        if (!result.name.includes(itemName.toLowerCase())) {
          continue;
        }

        const ingredients = parseRecipeIngredients(recipe);

        let canCraft = true;
        const missing: RecipeIngredient[] = [];

        for (const { name, count } of ingredients) {
          const hasItem = inventory.find(item => item.name === name);
          const have = hasItem ? hasItem.count : 0;

          if (have < count) {
            canCraft = false;
            missing.push({ name, count: count - have });
          }
        }

        if (canCraft) {
          return factory.createResponse(`Yes, can craft ${result.name}. Have all required ingredients.`);
        } else {
          let output = `Cannot craft ${result.name}. Missing:\n`;
          for (const { name, count } of missing) {
            output += `- ${name} x${count}\n`;
          }
          return factory.createResponse(output);
        }
      }

      return factory.createResponse(`No recipe found for ${itemName}`);
    }
  );
}
