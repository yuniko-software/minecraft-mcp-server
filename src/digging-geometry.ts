import type { Bot } from 'mineflayer';
import type { Block } from 'prismarine-block';
import pathfinderPkg from 'mineflayer-pathfinder';
import type { Move } from 'mineflayer-pathfinder';
import { Vec3 } from 'vec3';

function eyeHeight(entity: Bot['entity'] & { eyeHeight?: number }): number {
  return entity.eyeHeight ?? entity.height * 0.9;
}

export function hasReachableDigFace(bot: Bot, block: Block, feet = bot.entity.position): boolean {
  if (!block.diggable) return false;
  const eye = feet.offset(0, eyeHeight(bot.entity), 0);
  const center = block.position.offset(0.5, 0.5, 0.5);
  const reach = bot.game.gameMode === 'creative' ? 5 : 4.5;
  if (block.shapes?.length === 0) {
    // Plants have no collision hit. Validate the center sightline before using
    // native center-targeted digging, rather than requiring a shape intersection.
    const ray = center.minus(eye);
    const distance = ray.norm();
    if (distance > reach) return false;
    if (distance === 0) return true;
    const hit = bot.world.raycast(eye, ray.normalize(), distance);
    return !hit || hit.position.equals(block.position);
  }
  const delta = eye.minus(center);
  const side = (distance: number) => Math.abs(distance) > 0.5 ? Math.sign(distance) : 0;
  const faces = [
    new Vec3(side(delta.x), 0, 0),
    new Vec3(0, side(delta.y), 0),
    new Vec3(0, 0, side(delta.z))
  ];
  for (const face of faces) {
    if (face.norm() === 0) continue;
    const target = center.plus(face.scaled(0.5));
    const ray = target.minus(eye);
    if (ray.norm() > reach || ray.norm() === 0) continue;
    const hit = bot.world.raycast(eye, ray.normalize(), reach);
    if (hit?.position.equals(block.position)) return true;
  }
  return false;
}

export class DigApproachGoal extends pathfinderPkg.goals.Goal {
  constructor(private bot: Bot, private target: Vec3) {
    super();
  }

  override isEnd(node: Move): boolean {
    const block = this.bot.blockAt(this.target);
    if (!block) return false;
    const feet = new Vec3(node.x + 0.5, node.y, node.z + 0.5);
    // Match Mineflayer's native center-distance eligibility as well as an
    // exposed face within vanilla reach; pathfinder supplies safe standing nodes.
    if (block.position.offset(0.5, 0.5, 0.5).distanceTo(feet.offset(0, 1.65, 0)) > 5.1) return false;
    return hasReachableDigFace(this.bot, block, feet);
  }

  override heuristic(node: Move): number {
    const eye = new Vec3(node.x + 0.5, node.y + eyeHeight(this.bot.entity), node.z + 0.5);
    const reach = this.bot.game.gameMode === 'creative' ? 5 : 4.5;
    return Math.max(0, eye.distanceTo(this.target.offset(0.5, 0.5, 0.5)) - reach);
  }
}
