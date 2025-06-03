import { cwd, env } from 'node:process';
import { join } from 'node:path';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync, cpSync } from 'node:fs';

import esbuild from 'esbuild';

/**
 * Creates a 'dist' directory by removing any existing one,
 * and then creates a new one.
 */
function createDistDirectory() {
    const workDir = cwd();
    const serverOutputDirectory = join(workDir, 'dist');
    rmSync(serverOutputDirectory, { recursive: true, force: true });
    mkdirSync(serverOutputDirectory, { recursive: true });
    console.debug('Prepared dist directory:', serverOutputDirectory);
}

/**
 * Publish the package.json file by reading it from the 'dist' directory,
 * removing devDependencies and scripts, and setting the type to 'commonjs'.
 * The modified package.json is then written back to the 'dist' directory.
 * It also logs the output file path and the modified content.
 * This is useful for preparing the package for distribution without development dependencies.
 */
function publishPackageJson() {
    const workDir = cwd();
    const serverOutputDirectory = join(workDir, 'dist');
    const packageJsonInputFile = join(workDir, 'package.json');
    console.debug('Package json input file', packageJsonInputFile);
    const packageJsonOutputFile = join(serverOutputDirectory, 'package.json');
    console.debug('Package json output file', packageJsonOutputFile);
    const packageJsonOutputText = readFileSync(packageJsonInputFile, { encoding: 'utf-8' });
    const packageJsonOutput = JSON.parse(packageJsonOutputText);
    const packageJsonOutputTextWithoutDevDeps = JSON.stringify(
        {
            ...packageJsonOutput,
            devDependencies: undefined,
            scripts: undefined,
            type: 'commonjs',
        },
        null,
        2,
    );
    writeFileSync(packageJsonOutputFile, packageJsonOutputTextWithoutDevDeps, { encoding: 'utf-8' });
    console.debug('Published package.json to', packageJsonOutputFile);
    console.debug('Published package.json content:', packageJsonOutputTextWithoutDevDeps);
}

/**
 * Copies the types.d.ts file from the current working directory to the 'dist' directory.
 * This is useful for making type definitions available in the distribution package.
 * It ensures that the types are included in the build output for consumers of the package.
 */
function copyTypes() {
    const workDir = cwd();
    const serverOutputDirectory = join(workDir, 'dist');
    copyFileSync(join(workDir, 'types.d.ts'), join(serverOutputDirectory, 'types.d.ts'));
    console.debug('Copied types to', serverOutputDirectory);
}

/**
 * Copies the docs directory from the current working directory to the 'dist' directory.
 * This is useful for including documentation in the distribution package.
 * Recursively copies all files and directories from 'docs' to 'dist/docs'.
 */
function copyDocs() {
    const workDir = cwd();
    const outDir = join(workDir, 'dist', 'docs');
    const srcDir = join(workDir, 'docs');

    mkdirSync(outDir, { recursive: true });
    cpSync(srcDir, outDir, { recursive: true, dereference: true }); // follow symlinks
    console.debug('Copied docs to', outDir);
}

/**
 * Copies the README.md file from the current working directory to the 'dist' directory.
 * This is useful for providing documentation in the distribution package.
 * It ensures that users of the package have access to the README file, which typically contains
 * information about the package, how to use it, and other relevant details.
 */
function copyReadme() {
    const workDir = cwd();
    const serverOutputDirectory = join(workDir, 'dist');
    copyFileSync(join(workDir, 'README.md'), join(serverOutputDirectory, 'README.md'));
    console.debug('Copied README.md to', serverOutputDirectory);
}

/**
 * Build the application using esbuild.
 * It specifies the entry point, output directory, and various build options.
 * The build is configured for a Node.js environment with CommonJS format.
 * It also enables minification and sourcemaps based on the environment.
 * The build process includes tree shaking and generates a metafile for analysis.
 */
function buildApplication() {
    const workingDirectory = cwd();
    const serverOutputDirectory = join(workingDirectory, 'dist');
    esbuild.build({
        entryPoints: [
            'index.ts',
        ],
        bundle: true,
        platform: 'node',
        target: 'node20',
        format: 'cjs',
        outdir: serverOutputDirectory,
        minify: true,
        sourcemap: env.NODE_ENV !== 'production',
        sourceRoot: workingDirectory,
        treeShaking: true,
        splitting: false, // only works with esm
        legalComments: 'none',
        logLevel: 'info',
        metafile: true,
        tsconfig: 'tsconfig.app.json',
    });
}

/**
 * Entry function to build the application.
 */
function build() {
    createDistDirectory();
    publishPackageJson();
    copyTypes();
    copyDocs();
    copyReadme();
    buildApplication();
}

build();
