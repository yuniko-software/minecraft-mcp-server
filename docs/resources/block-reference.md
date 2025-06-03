# Minecraft Block & Item Reference

## Building Blocks

### Stone Types

```md
stone, granite, diorite, andesite
polished_granite, polished_diorite, polished_andesite
cobblestone, mossy_cobblestone
stone_bricks, mossy_stone_bricks, cracked_stone_bricks, chiseled_stone_bricks
```

### Wood Types

```md
# Logs
oak_log, birch_log, spruce_log, jungle_log, acacia_log, dark_oak_log

# Planks
oak_planks, birch_planks, spruce_planks, jungle_planks, acacia_planks, dark_oak_planks

# Stairs and Slabs
oak_stairs, oak_slab
birch_stairs, birch_slab
spruce_stairs, spruce_slab
```

### Glass and Transparent

```md
glass, tinted_glass
white_stained_glass, orange_stained_glass, magenta_stained_glass
light_blue_stained_glass, yellow_stained_glass, lime_stained_glass
pink_stained_glass, gray_stained_glass, light_gray_stained_glass
cyan_stained_glass, purple_stained_glass, blue_stained_glass
brown_stained_glass, green_stained_glass, red_stained_glass, black_stained_glass

# Panes
glass_pane, iron_bars
white_stained_glass_pane, orange_stained_glass_pane
```

## Redstone Components

### Basic Redstone

```md
redstone_wire, redstone_block, redstone_torch
lever, stone_button, oak_button
stone_pressure_plate, oak_pressure_plate, heavy_weighted_pressure_plate
tripwire_hook, observer
```

### Logic Gates

```md
repeater, comparator
piston, sticky_piston
dispenser, dropper
hopper, hopper_minecart
```

## Functional Blocks

### Storage

```md
chest, trapped_chest, ender_chest
barrel, shulker_box
white_shulker_box, orange_shulker_box, magenta_shulker_box
```

### Utility

```md
crafting_table, furnace, blast_furnace, smoker
anvil, grindstone, stonecutter
enchanting_table, brewing_stand
bed, respawn_anchor
```

## Decorative Blocks

### Wool and Carpet

```md
white_wool, orange_wool, magenta_wool, light_blue_wool
yellow_wool, lime_wool, pink_wool, gray_wool
light_gray_wool, cyan_wool, purple_wool, blue_wool
brown_wool, green_wool, red_wool, black_wool

# Corresponding carpets
white_carpet, orange_carpet, magenta_carpet...
```

### Plants and Nature

```md
# Flowers
poppy, dandelion, blue_orchid, allium
azure_bluet, red_tulip, orange_tulip, white_tulip, pink_tulip
oxeye_daisy, cornflower, lily_of_the_valley

# Tall flowers
sunflower, lilac, rose_bush, peony

# Crops
wheat, carrots, potatoes, beetroots
pumpkin, melon, sugar_cane, cactus
```

## Food Items

### Raw Food

```md
beef, pork, chicken, cod, salmon
potato, carrot, beetroot, wheat
apple, golden_apple, enchanted_golden_apple
bread, cookie, cake, pumpkin_pie
cooked_beef, cooked_pork, cooked_chicken, cooked_fish
milk_bucket, honey_bottle, suspicious_stew
```

## NBT Data Examples

### Common NBT Tags

```md
# Item with custom name
/give @p diamond_sword{display:{Name:'{"text":"Excalibur","color":"gold"}'}}

# Enchanted item
/give @p diamond_sword{Enchantments:[{id:"sharpness",lvl:5}]}

# Chest with items
/setblock ~ ~ ~ chest{Items:[{Slot:0,id:"diamond",Count:64}]}

# Sign with text
/setblock ~ ~ ~ oak_sign{Text1:'{"text":"Welcome"}',Text2:'{"text":"To My Base"}'}
```

## Block Placement Tips

### Orientation Basics

- Most blocks face the player when placed
- Use F3 debug screen to see current facing direction
- `facing` property uses cardinal directions (north, south, east, west)
- `rotation` property uses 0-15 values (0=south, 4=west, 8=north, 12=east)

### Common Mistakes

- Wrong property names: `direction` vs `facing`
- Invalid property values: `up` vs `top`
- Missing required properties for complex blocks
- Forgetting waterlogged state near water
