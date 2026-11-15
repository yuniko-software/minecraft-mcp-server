import type { Bot } from 'mineflayer';
import pathfinderPkg from 'mineflayer-pathfinder';
import type { Movements, goals } from 'mineflayer-pathfinder';

export function configureSafeMovements(movements: Movements): Movements {
  movements.canDig = false;
  movements.allow1by1towers = false;
  movements.scafoldingBlocks = [];
  return movements;
}

export function initializeSafeNavigation(bot: Bot): void {
  bot.pathfinder.setMovements(configureSafeMovements(new pathfinderPkg.Movements(bot)));
}

export function safeGoto(bot: Bot, goal: goals.Goal): Promise<void> {
  configureSafeMovements(bot.pathfinder.movements);
  return bot.pathfinder.goto(goal);
}
