# Building Patterns & Architectural Techniques

## Basic Structures

### Foundation Patterns

```md
# Stone foundation (15x15)
/fill ~-7 ~-1 ~-7 ~7 ~-1 ~7 stone

# Reinforced foundation with drainage
/fill ~-7 ~-2 ~-7 ~7 ~-2 ~7 cobblestone
/fill ~-6 ~-1 ~-6 ~6 ~-1 ~6 stone_bricks
```

### Wall Structures

```md
# Basic wall frame (corners first)
/fill ~-7 ~0 ~-7 ~-7 ~3 ~7 oak_log
/fill ~7 ~0 ~-7 ~7 ~3 ~7 oak_log
/fill ~-7 ~0 ~-7 ~7 ~3 ~-7 oak_log
/fill ~-7 ~0 ~7 ~7 ~3 ~7 oak_log

# Fill wall sections
/fill ~-6 ~0 ~-7 ~6 ~3 ~-7 oak_planks
/fill ~-6 ~0 ~7 ~6 ~3 ~7 oak_planks
/fill ~-7 ~0 ~-6 ~-7 ~3 ~6 oak_planks
/fill ~7 ~0 ~-6 ~7 ~3 ~6 oak_planks
```

### Roof Patterns

```md
# Simple peaked roof
/fill ~-8 ~4 ~-8 ~8 ~4 ~8 oak_stairs[facing=north]
/fill ~-7 ~5 ~-7 ~7 ~5 ~7 oak_stairs[facing=north]
/fill ~-6 ~6 ~-6 ~6 ~6 ~6 oak_stairs[facing=north]

# Flat roof with detail
/fill ~-7 ~4 ~-7 ~7 ~4 ~7 stone_slabs[type=top]
/fill ~-8 ~4 ~-8 ~8 ~4 ~-7 stone_brick_stairs[facing=south]
```

## Decorative Elements

### Window Designs

```md
# Simple window
/fill ~0 ~1 ~0 ~1 ~2 ~0 glass

# Framed window
/setblock ~0 ~0 ~0 oak_planks
/setblock ~1 ~0 ~0 oak_planks
/setblock ~0 ~3 ~0 oak_planks
/setblock ~1 ~3 ~0 oak_planks
/fill ~0 ~1 ~0 ~1 ~2 ~0 glass_pane
```

### Garden Patterns

```md
# Flower bed
/fill ~0 ~0 ~0 ~4 ~0 ~4 farmland
/setblock ~1 ~1 ~1 rose_bush
/setblock ~3 ~1 ~1 lilac
/setblock ~1 ~1 ~3 peony
/setblock ~3 ~1 ~3 sunflower
```

## Advanced Techniques

### Terraforming

- Use varying heights for natural look
- Mix different soil types
- Add water features strategically
- Create elevation changes gradually

### Lighting Design

- Hidden redstone lamps in walls
- Decorative lanterns on posts
- Under-stair lighting with glowstone
- Pathway lighting with sea lanterns

### Color Coordination

- Stick to 2-3 primary colors
- Use accent colors sparingly
- Consider biome-appropriate palettes
- Test color combinations in different lighting
