import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import { defineConfig } from "eslint/config";

const avaPlugin = await import("eslint-plugin-ava");

export default defineConfig([
    js.configs.recommended,

    {
        files: ["src/**/*.ts", "tests/**/*.ts"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: process.cwd(),
            },
            sourceType: "module",
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            ava: avaPlugin.default,
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "no-console": "off",
            "ava/no-only-test": "error",
            "ava/no-skip-test": "warn",
        },
    },
]);
