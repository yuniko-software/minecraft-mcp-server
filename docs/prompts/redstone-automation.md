# I'll teach you essential redstone automation! Let's start with practical contraptions

## Beginner Contraptions

### 1. Automatic Door

```minecraft
/setblock ~0 ~0 ~0 oak_door[half=lower]
/setblock ~0 ~1 ~0 oak_door[half=upper]
/setblock ~-1 ~0 ~0 stone_pressure_plate
/setblock ~-1 ~-1 ~0 redstone_wire
/setblock ~0 ~-1 ~0 redstone_wire
```

### 2. Hidden Lighting

- `/setblock ~0 ~1 ~0 redstone_lamp`
- `/setblock ~0 ~0 ~0 lever`
- Connect with redstone wire

### 3. Item Sorter (Basic)

```minecraft
/setblock ~0 ~0 ~0 chest
/setblock ~0 ~0 ~1 hopper[facing=north]
/setblock ~0 ~0 ~2 chest
```

## Intermediate Projects

### 4. Automatic Farm

- Water + farmland + hoppers below
- Use dispensers for bone meal
- Collect items with hopper minecarts

### 5. Security System

- Tripwire hooks + TNT dispensers
- Hidden entrances with piston doors
- Pressure plate alarms

## Advanced Concepts

### 6. Clock Circuits

- Repeater loops for timing
- Hopper clocks for item-based timing
- Observer-based clocks

### 7. Memory Circuits

- RS latches for state storage
- T flip-flops for toggles
- Pulse circuits for timing

Which type of contraption interests you most? I can provide detailed building instructions!
