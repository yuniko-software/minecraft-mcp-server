import type { ResourceTemplate } from '@minecraft-mcp-server/types';

/**
 * Landscape templates
 */
export const landscapeTemplates: ResourceTemplate[] = [
    {
        name: 'Garden Path',
        description: 'Decorative stone path with lighting',
        category: 'decoration',
        commands: [
            '/fill ~0 ~0 ~0 ~2 ~0 ~20 stone_brick_slab[type=top]',
            '/fill ~-1 ~0 ~0 ~3 ~0 ~20 grass_path',
            '/setblock ~0 ~1 ~2 lantern[hanging=false]',
            '/setblock ~2 ~1 ~6 lantern[hanging=false]',
        ],
        materials: ['stone_brick_slab', 'grass_path', 'lantern'],
        dimensions: '4x1x20',
        notes: ['Alternating lantern placement', 'Blend with natural terrain'],
    },
    {
        name: 'Pond with Bridge',
        description: 'Natural water feature with wooden bridge',
        category: 'water',
        commands: [
            '/fill ~0 ~-2 ~0 ~8 ~-1 ~8 water',
            '/fill ~-1 ~-2 ~-1 ~9 ~-3 ~9 dirt',
            '/fill ~3 ~0 ~-1 ~5 ~0 ~9 oak_planks',
            '/fill ~3 ~1 ~0 ~5 ~2 ~0 oak_fence',
        ],
        materials: ['water', 'dirt', 'oak_planks', 'oak_fence'],
        dimensions: '10x3x10',
        notes: ['Natural shoreline shape', 'Add lily pads for detail'],
    },
];
