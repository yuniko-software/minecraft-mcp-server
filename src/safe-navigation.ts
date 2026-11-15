import type { Bot } from 'mineflayer';
import pathfinderPkg from 'mineflayer-pathfinder';
import type { Movements, Move, goals } from 'mineflayer-pathfinder';
import type { Block } from 'prismarine-block';
import { Vec3 } from 'vec3';

class SafeMovements extends pathfinderPkg.Movements {
  private doorAllowsPassage(block: Block, dx: number, dz: number): boolean {
    const properties = block.getProperties();
    if (properties.open !== true) return false;
    const otherHalf = this.bot.blockAt(block.position.offset(0, properties.half === 'lower' ? 1 : -1, 0));
    if (!otherHalf || otherHalf.type !== block.type || otherHalf.getProperties().open !== true) return false;
    const radius = this.bot.entity.width / 2;
    const clearCenter = (candidate: Block) => candidate.shapes.every(shape =>
      shape[3] <= Math.min(0.5, 0.5 + dx) - radius || shape[0] >= Math.max(0.5, 0.5 + dx) + radius ||
      shape[5] <= Math.min(0.5, 0.5 + dz) - radius || shape[2] >= Math.max(0.5, 0.5 + dz) + radius);
    return clearCenter(block) && clearCenter(otherHalf);
  }

  override getBlock(pos: Vec3, dx: number, dy: number, dz: number) {
    const block = super.getBlock(pos, dx, dy, dz);
    if (!block.position || !block.name.endsWith('_door') || this.blocksToAvoid.has(block.type)) return block;
    if (!this.doorAllowsPassage(block, -dx, -dz)) return block;
    // Open doors retain boundingBox='block'; their side panels clear the
    // player body along this approach but the upstream classifier treats them as walls.
    block.safe = true;
    block.physical = false;
    return block;
  }

  private canLeaveDoor(node: Move, direction: { x: number; z: number }): boolean {
    const block = this.bot.blockAt(new Vec3(node.x, node.y, node.z));
    return !block?.name.endsWith('_door') || this.doorAllowsPassage(block, direction.x, direction.z);
  }

  override getMoveForward(node: Move, direction: { x: number; z: number }, neighbors: Move[]): void {
    if (this.canLeaveDoor(node, direction)) super.getMoveForward(node, direction, neighbors);
  }

  override getMoveDiagonal(node: Move, direction: { x: number; z: number }, neighbors: Move[]): void {
    if (this.canLeaveDoor(node, direction)) super.getMoveDiagonal(node, direction, neighbors);
  }
}

export function configureSafeMovements(movements: Movements): Movements {
  movements.canDig = false;
  movements.allow1by1towers = false;
  movements.scafoldingBlocks = [];
  return movements;
}

export function initializeSafeNavigation(bot: Bot): void {
  bot.pathfinder.setMovements(configureSafeMovements(new SafeMovements(bot)));
}

export function safeGoto(bot: Bot, goal: goals.Goal): Promise<void> {
  configureSafeMovements(bot.pathfinder.movements);
  return bot.pathfinder.goto(goal);
}
