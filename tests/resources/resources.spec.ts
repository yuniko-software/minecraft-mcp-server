import { buildingTemplates } from '@/src/resources/templates/building';
import { generateTemplateDocumentation } from '@/src/resources/templates/documentation';
import { landscapeTemplates } from '@/src/resources/templates/landscape';
import { redstoneTemplates } from '@/src/resources/templates/redstone';
import {
    getTemplate,
    getTemplatesByCategory,
    getTemplateCategories,
    searchTemplates,
    getAllTemplates,
    exportTemplateCommands,
    validateTemplate,
} from '@/src/resources/templates/utils';

describe('Resource Templates', () => {
    describe('Template Collections', () => {
        it('should have building templates', () => {
            expect(buildingTemplates).toBeDefined();
            expect(buildingTemplates.length).toBeGreaterThan(0);
        });

        it('should have redstone templates', () => {
            expect(redstoneTemplates).toBeDefined();
            expect(redstoneTemplates.length).toBeGreaterThan(0);
        });

        it('should have landscape templates', () => {
            expect(landscapeTemplates).toBeDefined();
            expect(landscapeTemplates.length).toBeGreaterThan(0);
        });
    });

    describe('Template Retrieval', () => {
        it('should get template by name', () => {
            const template = getTemplate('Basic House Foundation');
            expect(template).toBeDefined();
            expect(template?.name).toBe('Basic House Foundation');
            expect(template?.category).toBe('foundation');
        });

        it('should return undefined for non-existent template', () => {
            const template = getTemplate('Non-existent Template');
            expect(template).toBeUndefined();
        });

        it('should get templates by category', () => {
            const foundationTemplates = getTemplatesByCategory('foundation');
            expect(foundationTemplates.length).toBeGreaterThan(0);
            expect(foundationTemplates[0].category).toBe('foundation');
        });

        it('should get all template categories', () => {
            const categories = getTemplateCategories();
            expect(categories).toContain('foundation');
            expect(categories).toContain('walls');
            expect(categories).toContain('security');
        });
    });

    describe('Template Search', () => {
        it('should search templates by name', () => {
            const results = searchTemplates('house');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].name).toContain('House');
        });

        it('should search templates by material', () => {
            const results = searchTemplates('stone');
            expect(results.length).toBeGreaterThan(0);

            let foundStone = false;
            for (const template of results) {
                if (template.materials.includes('stone')) {
                    foundStone = true;
                    break;
                }
            }
            expect(foundStone).toBe(true);
        });

        it('should return empty array for no matches', () => {
            const results = searchTemplates('nonexistent');
            expect(results).toEqual([]);
        });
    });

    describe('Template Export', () => {
        it('should export template commands', () => {
            const commands = exportTemplateCommands('Basic House Foundation');
            expect(commands).toBeDefined();
            expect(commands!.length).toBeGreaterThan(0);
            expect(commands![0]).toContain('Basic House Foundation');
        });

        it('should return null for non-existent template', () => {
            const commands = exportTemplateCommands('Non-existent');
            expect(commands).toBeNull();
        });
    });

    describe('Template Validation', () => {
        it('should validate correct template', () => {
            const template = getTemplate('Basic House Foundation');
            const errors = validateTemplate(template!);
            expect(errors).toEqual([]);
        });

        it('should detect missing name', () => {
            const invalidTemplate = {
                name: '',
                description: 'Test',
                category: 'test',
                commands: ['/test'],
                materials: ['test'],
            };
            const errors = validateTemplate(invalidTemplate);
            expect(errors).toContain('Template name is required');
        });

        it('should detect invalid commands', () => {
            const invalidTemplate = {
                name: 'Test',
                description: 'Test',
                category: 'test',
                commands: ['invalid command'],
                materials: ['test'],
            };
            const errors = validateTemplate(invalidTemplate);
            expect(errors).toContain('Command 1 should start with /');
        });
    });

    describe('Documentation Generation', () => {
        it('should generate template documentation', () => {
            const doc = generateTemplateDocumentation();
            expect(doc).toContain('# Minecraft Resource Templates');
            expect(doc).toContain('Basic House Foundation');
            expect(doc).toContain('**Commands:**');
            expect(doc).toContain('**Required Materials:**');
        });
    });

    describe('Get All Templates', () => {
        it('should return all templates', () => {
            const allTemplates = getAllTemplates();
            const expectedCount = buildingTemplates.length + redstoneTemplates.length + landscapeTemplates.length;
            expect(allTemplates.length).toBe(expectedCount);
        });
    });
});
