# Resource Templates System

The Minecraft MCP Server now includes a comprehensive resource templates system that provides pre-built command sequences for common structures, redstone contraptions, and landscape features.

## Overview

Resource templates are structured patterns that include:

- **Name**: Descriptive identifier for the template
- **Description**: What the template builds/creates
- **Category**: Grouping for organization (foundation, walls, security, etc.)
- **Commands**: Minecraft command sequences to execute
- **Materials**: Required blocks and items
- **Dimensions**: Size specifications (when applicable)
- **Notes**: Additional tips and requirements

## Available Template Categories

### Building Templates

- **Foundation**: Basic house foundations with reinforcement
- **Walls**: Medieval castle walls with defensive features
- **Modern**: Contemporary glass and steel structures

### Redstone Templates

- **Security**: Door locks and access control systems
- **Automation**: Automatic farms and harvesting systems

### Landscape Templates

- **Decoration**: Garden paths and decorative elements
- **Water**: Ponds, bridges, and water features

## Using Templates

### Through MCP Resources

Templates are available as MCP resources at:

```minecraft
minecraft://resource-templates
```

### Programmatic Access

```typescript
import { 
    getTemplate, 
    getTemplatesByCategory, 
    searchTemplates,
    exportTemplateCommands 
} from './src/resources';

// Get a specific template
const foundation = getTemplate('Basic House Foundation');

// Get all templates in a category
const wallTemplates = getTemplatesByCategory('walls');

// Search templates by keyword
const stoneTemplates = searchTemplates('stone');

// Export as executable commands
const commands = exportTemplateCommands('Basic House Foundation');
```

## Example Template Usage

### Basic House Foundation

This template creates a 15x15 stone foundation with drainage:

```minecraft
/fill ~-7 ~-1 ~-7 ~7 ~-1 ~7 stone
/fill ~-7 ~-2 ~-7 ~7 ~-2 ~7 cobblestone
/fill ~-6 ~-1 ~-6 ~6 ~-1 ~6 stone_bricks
```

**Materials needed**: stone, cobblestone, stone_bricks
**Notes**:

- Place on level ground
- Includes drainage layer

### Medieval Castle Wall

Creates a defensive wall with battlements:

```minecraft
/fill ~0 ~0 ~0 ~20 ~8 ~2 stone_bricks
/fill ~0 ~9 ~0 ~20 ~10 ~2 stone_brick_stairs[facing=south]
/fill ~1 ~9 ~1 ~19 ~9 ~1 air
```

**Materials needed**: stone_bricks, stone_brick_stairs
**Notes**:

- Crenellated top
- Hollow interior for walkway

## Template Validation

Templates are automatically validated to ensure:

- Required fields are present (name, description, category, commands, materials)
- Commands start with forward slash (/)
- Materials list is not empty

## Extending Templates

To add new templates, update the respective arrays in `src/resources/index.ts`:

```typescript
export const buildingTemplates: ResourceTemplate[] = [
    // existing templates...
    {
        name: 'Your Template Name',
        description: 'What it builds',
        category: 'appropriate-category',
        commands: [
            '/fill command here',
            '/setblock command here',
        ],
        materials: ['required', 'materials'],
        dimensions: 'WxHxD',
        notes: ['helpful', 'tips'],
    },
];
```

## Integration with Tools

The template system integrates with the MCP tools to allow AI assistants to:

1. Discover available templates
2. Apply templates to build structures
3. Modify templates for specific needs
4. Combine multiple templates for complex builds

This creates a powerful building assistant that can help users create complex Minecraft structures quickly and efficiently.
