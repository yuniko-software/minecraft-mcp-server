import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    clearMocks: true,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    coverageReporters: ['lcov', 'text', 'html', 'cobertura'],
    reporters: [
        'default',
        [ 'jest-junit', {
            outputDirectory: './',
            outputName: 'test-results.xml',
        }],
    ],
    moduleNameMapper: pathsToModuleNameMapper(
        { '@minecraft-mcp-server/*': ['src/*'] },
        { prefix: '<rootDir>/' },
    ),
};

export default config;
