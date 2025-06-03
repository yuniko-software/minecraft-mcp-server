import type { ResourceTemplate } from '@minecraft-mcp-server/types';

/**
 * Redstone contraption templates
 */
export const redstoneTemplates: ResourceTemplate[] = [
    {
        name: 'Simple Door Lock',
        description: 'Basic combination lock for iron doors',
        category: 'security',
        commands: [
            '/setblock ~0 ~0 ~0 iron_door[half=lower]',
            '/setblock ~0 ~1 ~0 iron_door[half=upper]',
            '/setblock ~-1 ~0 ~-1 lever[face=wall,facing=north]',
            '/setblock ~-1 ~0 ~0 redstone_wire',
        ],
        materials: ['iron_door', 'lever', 'redstone_wire'],
        notes: ['Connect lever to door with redstone', 'Add pressure plate for auto-close'],
    },
    {
        name: 'Automatic Farm',
        description: 'Water-based crop harvesting system',
        category: 'automation',
        commands: [
            '/fill ~0 ~0 ~0 ~8 ~0 ~8 farmland',
            '/fill ~1 ~1 ~1 ~7 ~1 ~7 water',
            '/setblock ~4 ~0 ~4 water',
            '/fill ~0 ~-1 ~0 ~8 ~-1 ~8 dirt',
        ],
        materials: ['farmland', 'water', 'dirt', 'seeds'],
        dimensions: '9x9x2',
        notes: ['Central water source', 'Plant crops in farmland'],
    },
];
