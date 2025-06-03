import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * @type {import('eslint').Linter.Config[]}
 */
const config = [
    {
        files: [
            'index.ts',
            'types.d.ts',
            'src/**/*.ts',
            'tests/**/*.ts',
        ],
    },
    {
        ignores: [
            'coverage',
            'node_modules',
            'publish',
        ],
        rules: {
            strict: ['error', 'global'],

            // Style & Formatting
            'max-len': ['error', { code: 120, tabWidth: 4, ignoreUrls: true }],
            'indent': ['error', 4],
            'quotes': ['error', 'single', { avoidEscape: true }],
            'semi': ['error', 'always'],
            'comma-dangle': ['error', 'always-multiline'],
            'eol-last': ['error', 'always'],
            'no-trailing-spaces': 'error',

            // Code Quality
            'no-undef': 'error',
            'no-unused-vars': ['error', { args: 'after-used', ignoreRestSiblings: true }],
            'no-unused-expressions': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-param-reassign': ['error', { props: true }],
            'no-shadow': ['error', { builtinGlobals: true, hoist: 'all' }],
            'no-debugger': 'error',
            'no-alert': 'error',
            'complexity': ['error', 50],
            'max-depth': ['error', 4],
            'max-params': ['error', 5],
            'max-statements': ['error', 20],
            'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
            'max-nested-callbacks': ['error', 3],

            // Best Practices
            'curly': ['error', 'all'],
            'eqeqeq': ['error', 'always', { null: 'ignore' }],
            'consistent-return': 'error',
            'dot-notation': 'error',
            'no-return-await': 'error',
            'no-else-return': ['error', { allowElseIf: false }],
            'no-empty-function': 'error',
            'no-extend-native': 'error',
            'no-lone-blocks': 'error',
            'no-multi-spaces': 'error',
            'no-restricted-syntax': ['error', 'WithStatement'],
            'no-underscore-dangle': ['error', { allowAfterThis: true }],
            'no-var': 'error',
            'prefer-const': 'error',
            'prefer-destructuring': ['error', { object: true, array: false }],
            'prefer-template': 'error',
            'require-await': 'error',
        },
    },
    {
        languageOptions: {
            globals: globals.node,
        },
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
];

export default config;
