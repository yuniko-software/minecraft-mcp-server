# Minecraft Commands Reference

## Essential Commands

### Building Commands

- `/setblock <pos> <block> [destroy|keep|replace]` - Place a single block
- `/fill <from> <to> <block> [destroy|hollow|keep|outline|replace]` - Fill an area with blocks
- `/clone <begin> <end> <destination> [replace|masked] [force|move|normal]` - Copy structures

### Block States and Properties

- `oak_stairs[facing=north,half=top,shape=straight]` - Stairs with orientation
- `chest[facing=north,type=single,waterlogged=false]` - Chest configuration
- `door[facing=east,half=lower,hinge=left,open=false,powered=false]` - Door states

### World Manipulation

- `/tp <targets> <location>` - Teleport entities
- `/teleport <destination>` - Alternative teleport command
- `/worldborder <add|center|damage|get|set|warning>` - Manage world borders

### Game Management

- `/gamemode <mode> [target]` - Change game mode (survival, creative, adventure, spectator)
- `/difficulty <level>` - Set difficulty (peaceful, easy, normal, hard)
- `/time <add|query|set> <value>` - Manage world time

## Advanced Commands

### Target Selectors

- `@p` - Nearest player
- `@a` - All players
- `@e` - All entities
- `@s` - Command executor
- `@r` - Random player

### Selector Arguments

- `@e[type=zombie,distance=..10,limit=5]` - Zombies within 10 blocks, max 5
- `@a[gamemode=creative,level=30..]` - Creative players level 30+
- `@p[nbt={Inventory:[{id:"minecraft:diamond"}]}]` - Player with diamond

### Data Commands

- `/data get entity @s` - Get entity data
- `/data modify entity @s <path> set value <value>` - Modify entity data
- `/scoreboard objectives add <objective> <criteria>` - Create scoreboard

### Structure Commands

- `/structure save <name> <from> <to>` - Save structure
- `/structure load <name> <pos>` - Load structure
- `/structure place <name> <pos>` - Place structure

## Coordinate Systems

- **Absolute**: `100 64 200` - Exact world coordinates
- **Relative**: `~10 ~5 ~-3` - Relative to current position
- **Local**: `^1 ^0 ^2` - Relative to facing direction

## Block References

Common blocks with their correct IDs:

- Stone variants: `stone`, `granite`, `diorite`, `andesite`
- Wood types: `oak_planks`, `birch_planks`, `spruce_planks`
- Glass: `glass`, `white_stained_glass`, `glass_pane`
- Redstone: `redstone_wire`, `redstone_block`, `repeater`, `comparator`

## Best Practices

1. Always test commands in creative mode first
2. Use relative coordinates for reusable command blocks
3. Save important structures before major modifications
4. Use `/gamerule commandBlockOutput false` to reduce spam
5. Keep backups when using destructive commands
