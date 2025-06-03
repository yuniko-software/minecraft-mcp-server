# Minecraft MCP Server

This project is configured to use GitHub Packages as an npm registry for scoped packages under `@olddude`.

## Configuration

### .npmrc files

- Root `.npmrc`: Configures the registry for the `@olddude` scope
- Module `.npmrc`: Local configuration for the minecraft-mcp-server package

### GitHub Actions

- `ci.yml`: Runs tests and builds on pull requests and pushes
- `publish.yml`: Publishes packages to GitHub Packages on releases

## Installing packages

To install packages from GitHub Packages, you need to authenticate:

1. Create a Personal Access Token (PAT) with `read:packages` permission
2. Configure npm authentication:

   ```bash
   npm login --scope=@olddude --registry=https://npm.pkg.github.com
   ```

   Or add to your local `.npmrc`:

   ```text
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
   ```

3. Install the package:

   ```bash
   npm install @olddude/minecraft-mcp-server
   ```

## Publishing packages

Packages are automatically published to GitHub Packages when:

1. A new release is created on GitHub
2. The publish workflow is manually triggered

### Manual publishing

To publish manually:

1. Ensure you're authenticated with GitHub Packages
2. Update the version in `package.json`
3. Run:

   ```bash
   cd modules/minecraft-mcp-server
   npm publish
   ```

## Permissions

The repository needs the following permissions for GitHub Actions:

- `contents: read` - To checkout code
- `packages: write` - To publish packages

## Environment Variables

The following secrets/tokens are used:

- `GITHUB_TOKEN` - Automatically provided by GitHub Actions for authentication

## JSON RPC

```bash
echo '{"jsonrpc": "2.0", "id": "test-1", "method": "tools/call", "params": {"name": "execute-command", "arguments": {"command": "time query daytime"}}}' | node -r dotenv/config dist/index.js
```

## Git

### Squash local master history

```sh
# DO THIS ONLY WHEN FULLY UNDERSTOOD WHAT IT DOES
# THIS WILL SQUASH THE LOCAL MASTER INTO 1 COMMIT
# THIS IS IRREVERSIBLE AND WILL WIPE THE HISTORY LOCALY
git reset $(git commit-tree HEAD^{tree} -m "stuff")
```

### Purge remote master history

```sh
# DO THIS ONLY WHEN FULLY UNDERSTOOD WHAT IT DOES
# THIS WILL FORCE PUSH THE LOCAL SQUASHED HISTORY INTO THE REMOTE
# THIS IS IRREVERSIBLE AND WILL WIPE THE HISTORY IN THE REMOTE
git push origin HEAD --force
```
