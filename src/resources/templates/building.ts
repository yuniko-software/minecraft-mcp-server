import type { ResourceTemplate } from '@minecraft-mcp-server/types';

/**
 * Collection of building templates
 */
export const buildingTemplates: ResourceTemplate[] = [
    {
        name: 'Basic House Foundation',
        description: 'Standard 15x15 stone foundation with reinforcement',
        category: 'foundation',
        commands: [
            '/fill ~-7 ~-1 ~-7 ~7 ~-1 ~7 stone',
            '/fill ~-7 ~-2 ~-7 ~7 ~-2 ~7 cobblestone',
            '/fill ~-6 ~-1 ~-6 ~6 ~-1 ~6 stone_bricks',
        ],
        materials: ['stone', 'cobblestone', 'stone_bricks'],
        dimensions: '15x15x2',
        notes: ['Place on level ground', 'Includes drainage layer'],
    },
    {
        name: 'Medieval Castle Wall',
        description: 'Stone brick defensive wall with battlements',
        category: 'walls',
        commands: [
            '/fill ~0 ~0 ~0 ~20 ~8 ~2 stone_bricks',
            '/fill ~0 ~9 ~0 ~20 ~10 ~2 stone_brick_stairs[facing=south]',
            '/fill ~1 ~9 ~1 ~19 ~9 ~1 air',
        ],
        materials: ['stone_bricks', 'stone_brick_stairs'],
        dimensions: '20x8x2',
        notes: ['Crenellated top', 'Hollow interior for walkway'],
    },
    {
        name: 'Modern Glass Tower',
        description: 'Contemporary glass and steel structure',
        category: 'modern',
        commands: [
            '/fill ~0 ~0 ~0 ~10 ~20 ~10 glass',
            '/fill ~0 ~0 ~0 ~0 ~20 ~10 iron_block',
            '/fill ~10 ~0 ~0 ~10 ~20 ~10 iron_block',
            '/fill ~0 ~0 ~0 ~10 ~20 ~0 iron_block',
            '/fill ~0 ~0 ~10 ~10 ~20 ~10 iron_block',
        ],
        materials: ['glass', 'iron_block'],
        dimensions: '10x20x10',
        notes: ['Steel frame construction', 'Floor every 4 blocks'],
    },
];
