import type { ResourceTemplate } from '@minecraft-mcp-server/types';

import { buildingTemplates } from './building';
import { redstoneTemplates } from './redstone';
import { landscapeTemplates } from './landscape';

/**
 * Get template by name and category
 */
export function getTemplate(name: string, category?: string): ResourceTemplate | undefined {
    const allTemplates = [...buildingTemplates, ...redstoneTemplates, ...landscapeTemplates];
    return allTemplates.find(template =>
        template.name.toLowerCase() === name.toLowerCase() &&
        (!category || template.category === category),
    );
}

/**
 * Get all templates by category
 */
export function getTemplatesByCategory(category: string): ResourceTemplate[] {
    const allTemplates = [...buildingTemplates, ...redstoneTemplates, ...landscapeTemplates];
    return allTemplates.filter(template => template.category === category);
}

/**
 * Get all available template categories
 */
export function getTemplateCategories(): string[] {
    const allTemplates = [...buildingTemplates, ...redstoneTemplates, ...landscapeTemplates];
    return [...new Set(allTemplates.map(template => template.category))];
}

/**
 * Get all available templates
 */
export function getAllTemplates(): ResourceTemplate[] {
    return [...buildingTemplates, ...redstoneTemplates, ...landscapeTemplates];
}

/**
 * Search templates by keyword
 */
export function searchTemplates(keyword: string): ResourceTemplate[] {
    const allTemplates = [...buildingTemplates, ...redstoneTemplates, ...landscapeTemplates];
    const searchTerm = keyword.toLowerCase();

    return allTemplates.filter(template =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm) ||
        template.category.toLowerCase().includes(searchTerm) ||
        template.materials.some(material => material.toLowerCase().includes(searchTerm)),
    );
}

/**
 * Export template as executable command sequence
 */
export function exportTemplateCommands(templateName: string): string[] | null {
    const template = getTemplate(templateName);
    if (!template) {
        return null;
    }

    return [
        `# ${template.name} - ${template.description}`,
        ...template.commands,
        `# Materials needed: ${template.materials.join(', ')}`,
        ...(template.notes ? template.notes.map(note => `# Note: ${note}`) : []),
    ];
}

/**
 * Validate template structure
 */
export function validateTemplate(template: ResourceTemplate): string[] {
    const errors: string[] = [];

    if (!template.name || template.name.trim() === '') {
        errors.push('Template name is required');
    }

    if (!template.description || template.description.trim() === '') {
        errors.push('Template description is required');
    }

    if (!template.category || template.category.trim() === '') {
        errors.push('Template category is required');
    }

    if (!template.commands || template.commands.length === 0) {
        errors.push('Template must have at least one command');
    }

    if (!template.materials || template.materials.length === 0) {
        errors.push('Template must specify required materials');
    }

    // Validate commands start with /
    template.commands?.forEach((command, index) => {
        if (!command.startsWith('/')) {
            errors.push(`Command ${index + 1} should start with /`);
        }
    });

    return errors;
}
