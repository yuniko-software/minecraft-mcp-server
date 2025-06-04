# Welcome to Minecraft-MCP-Server Contributing Guide

## Prerequisites
- Git
- Node.js (>=16.0.0)
- A running Minecraft game (tested with Minecraft 1.21.4 Java Edition)
- Claude Desktop (or another MCP-compatible client)

### 1. Fork and Clone the Repository

1. Fork this repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/minecraft-mcp-server.git
   cd minecraft-mcp-server
   ```

### 2. Create a Feature Branch

Create a new branch for your feature or bug fix:
```bash
git checkout -b your-feature-name
```

### 3. Setup Minecraft Server

Create a singleplayer world and open it to LAN (ESC -> Open to LAN). The bot will connect using port 25565 and hostname localhost by default.

For a more detailed setup guide, see the [README](README.md).

### 4. Configure Your MCP Client

#### For Claude Desktop Users

Make sure [Claude Desktop](https://claude.ai/download) is installed. Open your desktop config file via Claude Desktop: `File -> Settings -> Developer -> Edit Config`

Alternatively, you can edit the config file directly:

**MacOS/Linux**
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows**
```bash
code $env:AppData\Claude\claude_desktop_config.json
```

#### For Other MCP Clients

If you're using a different MCP client, configure it according to your client's documentation to point to the npx command and arguments shown below.

### 5. Point Your Client to Your Development Branch

Update your MCP configuration to use your fork and branch:

**For Claude Desktop (`claude_desktop_config.json`):**
```json
{
  "mcpServers": {
    "minecraft": {
      "command": "npx",
      "args": [
        "-y",
        "github:YOUR_USERNAME/minecraft-mcp-server#your-feature-branch-name",
        "--host",
        "localhost",
        "--port",
        "25565",
        "--username",
        "ClaudeBot"
      ]
    }
  }
}
```

### 6. Development Workflow

1. Make your changes and commit them to your feature branch
2. Push your branch to your fork:
   ```bash
   git push origin your-feature-name
   ```
3. Restart your MCP client completely (for Claude Desktop, close from system tray)
4. Open your MCP client - it will automatically pull and run your latest changes
5. Test your changes through your client's chat interface

## Submitting Changes

Once you're happy with your changes:
1. Push your feature branch to your fork
2. Create a Pull Request from your fork to the main repository
3. Others can test your changes by pointing their config to your fork/branch