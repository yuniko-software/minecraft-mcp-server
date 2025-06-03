import { registerTools } from '@/src/tools';
import * as toolsModule from '@/src/tools';

// Mock the mcrcon command execution
jest.mock('node:child_process', () => ({
    execSync: jest.fn(),
}));

describe('Tools', () => {
    it('should export registerTools function', () => {
        expect(typeof registerTools).toBe('function');
    });

    it('should have proper module structure', () => {
        expect(toolsModule).toBeDefined();
        expect(toolsModule.registerTools).toBeDefined();
    });
});
