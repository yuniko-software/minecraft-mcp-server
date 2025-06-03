import type { ResourceTemplate } from '@minecraft-mcp-server/types';

import { getTemplateCategories, getTemplatesByCategory } from './utils';

/**
 * Generate template documentation for a single template
 */
function generateSingleTemplateDoc(template: ResourceTemplate): string {
    let doc = `### ${template.name}\n`;
    doc += `**Description:** ${template.description}\n\n`;

    if (template.dimensions) {
        doc += `**Dimensions:** ${template.dimensions}\n\n`;
    }

    doc += '**Commands:**\n```\n';
    template.commands.forEach(command => {
        doc += `${command}\n`;
    });
    doc += '```\n\n';

    doc += `**Required Materials:** ${template.materials.join(', ')}\n\n`;

    if (template.notes && template.notes.length > 0) {
        doc += '**Notes:**\n';
        template.notes.forEach(note => {
            doc += `- ${note}\n`;
        });
        doc += '\n';
    }

    doc += '---\n\n';
    return doc;
}

/**
 * Generate template documentation
 */
export function generateTemplateDocumentation(): string {
    const categories = getTemplateCategories();

    let documentation = '# Minecraft Resource Templates\n\n';
    documentation += 'This document contains pre-built templates for common Minecraft structures and contraptions.\n\n';

    for (const category of categories) {
        const categoryTemplates = getTemplatesByCategory(category);
        documentation += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Templates\n\n`;

        for (const template of categoryTemplates) {
            documentation += generateSingleTemplateDoc(template);
        }
    }

    return documentation;
}
