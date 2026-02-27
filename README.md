# Minecraft MCP Server

<a href="https://github.com/yuniko-software/minecraft-mcp-server/actions">
  <img alt="CI" src="https://github.com/yuniko-software/minecraft-mcp-server/actions/workflows/build.yml/badge.svg">
</a>
<a href="https://github.com/yuniko-software">
  <img alt="Contribution Welcome" src="https://img.shields.io/badge/Contribution-Welcome-blue">
</a>
<a href="https://github.com/yuniko-software/minecraft-mcp-server/releases/latest">
  <img alt="Latest Release" src="https://img.shields.io/github/v/release/yuniko-software/minecraft-mcp-server?label=Latest%20Release">
</a>

<img width="2063" height="757" alt="image" src="https://github.com/user-attachments/assets/3f0f0438-f079-4226-90bd-87b9e1311d19" />

___

> [!IMPORTANT]
> Currently supports Minecraft version 1.21.11. Newer versions may not work with this MCP server, but we will add support as soon as possible.

https://github.com/user-attachments/assets/6f17f329-3991-4bc7-badd-7cde9aacb92f

A Minecraft bot powered by large language models and [Mineflayer API](https://github.com/PrismarineJS/mineflayer). This bot uses the [Model Context Protocol](https://github.com/modelcontextprotocol) (MCP) to enable Claude and other supported models to control a Minecraft character.

<a href="https://glama.ai/mcp/servers/@yuniko-software/minecraft-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@yuniko-software/minecraft-mcp-server/badge" alt="mcp-minecraft MCP server" />
</a>

## Prerequisites

- Git
- Node.js (>= 20.10.0)
- A running Minecraft game (the setup below was tested with Minecraft 1.21.8 Java Edition included in Microsoft Game Pass)
- An MCP-compatible client. Claude Desktop will be used as an example, but other MCP clients are also supported

## Getting started

This bot is designed to be used with Claude Desktop through the Model Context Protocol (MCP).

### Run Minecraft

Create a singleplayer world and open it to LAN (`ESC -> Open to LAN`). Bot will try to connect using port `25565` and hostname `localhost`. These parameters could be configured in `claude_desktop_config.json` on a next step. 

### MCP Configuration

Make sure that [Claude Desktop](https://claude.ai/download) is installed. Open `File -> Settings -> Developer -> Edit Config`. It should open installation directory. Find file with a name `claude_desktop_config.json` and insert the following code:

```json
{
  "mcpServers": {
    "minecraft": {
      "command": "npx",
      "args": [
        "-y",
        "github:yuniko-software/minecraft-mcp-server",
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

Double-check that right `--port` and `--host` parameters were used. Make sure to completely reboot the Claude Desktop application (should be closed in OS tray). 

## Running

Make sure Minecraft game is running and the world is opened to LAN. Then start Claude Desktop application and the bot should join the game. 

**It could take some time for Claude Desktop to boot the MCP server**. The marker that the server has booted successfully:

<img width="885" height="670" alt="image" src="https://github.com/user-attachments/assets/ccbb42f8-6544-462c-8ac1-8af13ddfcddd" />

You can give bot any commands through any active Claude Desktop chat. You can also upload images of buildings and ask bot to build them 😁

Don't forget to mention that bot should do something in Minecraft in your prompt. Because saying this is a trigger to run MCP server. It will ask for your permissions.

Using Claude Sonnet could give you some interesting results. The bot-agent would be really smart 🫡

Example usage: [shared Claude chat](https://claude.ai/share/535d5f69-f102-4cdb-9801-f74ea5709c0b)

## Configuration

The server supports both inline CLI arguments and environment variables:

- `--host` or `MINECRAFT_HOST` (default: `localhost`)
- `--port` or `MINECRAFT_PORT` (default: `25565`)
- `--username` or `MINECRAFT_USERNAME` (default: `LLMBot`)
- `--keep-alive-without-client` or `MCP_KEEP_ALIVE_WITHOUT_CLIENT` (default: `false`)
- `--transport` or `MCP_TRANSPORT` (`stdio` or `http`, default: `stdio`)
- `--mcp-http-host` or `MCP_HTTP_HOST` (default: `0.0.0.0`)
- `--mcp-http-port` or `MCP_HTTP_PORT` (default: `3001`)
- `--mcp-http-path` or `MCP_HTTP_PATH` (default: `/mcp`)

Inline CLI arguments take precedence over environment variables. This keeps Claude Desktop `args` configuration fully compatible while allowing easier container deployments.

### Container Build and Runtime Variables

Build-time:

- No Minecraft-specific environment variables are required to build the image.
- For the GitHub Release workflow, no extra secrets are required beyond the default `GITHUB_TOKEN` (used for GHCR publish).

Runtime (optional):

- `MINECRAFT_HOST` (default: `localhost`)
- `MINECRAFT_PORT` (default: `25565`)
- `MINECRAFT_USERNAME` (default: `LLMBot`)
- `MCP_KEEP_ALIVE_WITHOUT_CLIENT` (default: `false`)
- `MCP_TRANSPORT` (default: `stdio`)
- `MCP_HTTP_HOST` (default: `0.0.0.0`)
- `MCP_HTTP_PORT` (default: `3001`)
- `MCP_HTTP_PATH` (default: `/mcp`)

Example container run with env vars:

```bash
docker run --rm -i \
  -e MINECRAFT_HOST=host.docker.internal \
  -e MINECRAFT_PORT=25565 \
  -e MINECRAFT_USERNAME=LLMBot \
  -e MCP_KEEP_ALIVE_WITHOUT_CLIENT=true \
  ghcr.io/yuniko-software/minecraft-mcp-server:latest
```

You can still pass inline args instead (and they will override env vars):

```bash
docker run --rm -i ghcr.io/yuniko-software/minecraft-mcp-server:latest \
  --host host.docker.internal --port 25565 --username ClaudeBot
```

Run as remote MCP server over HTTP:

```bash
docker run -d --name minecraft-mcp-remote \
  -p 3001:3001 \
  -e MCP_TRANSPORT=http \
  -e MCP_HTTP_HOST=0.0.0.0 \
  -e MCP_HTTP_PORT=3001 \
  -e MCP_HTTP_PATH=/mcp \
  -e MINECRAFT_HOST=host.docker.internal \
  -e MINECRAFT_PORT=25565 \
  -e MINECRAFT_USERNAME=ClaudeBot \
  ghcr.io/yuniko-software/minecraft-mcp-server:latest
```

Example MCP client configuration for remote mode:

```json
{
  "mcp": {
    "minecraft_remote": {
      "type": "remote",
      "url": "http://127.0.0.1:3001/mcp",
      "enabled": true,
      "timeout": 15000
    }
  }
}
```

## Available Commands

Once connected to a Minecraft server, Claude can use these commands:

### Movement
- `get-position` - Get the current position of the bot
- `move-to-position` - Move to specific coordinates
- `look-at` - Make the bot look at specific coordinates
- `jump` - Make the bot jump
- `move-in-direction` - Move in a specific direction for a duration

### Flight
- `fly-to` - Make the bot fly directly to specific coordinates

### Inventory
- `list-inventory` - List all items in the bot's inventory
- `find-item` - Find a specific item in inventory
- `equip-item` - Equip a specific item

### Block Interaction
- `place-block` - Place a block at specified coordinates
- `dig-block` - Dig a block at specified coordinates
- `get-block-info` - Get information about a block
- `find-block` - Find the nearest block of a specific type

### Furnace
- `smelt-item` - Smelt items using a furnace-like block

### Entity Interaction
- `find-entity` - Find the nearest entity of a specific type

### Communication
- `send-chat` - Send a chat message in-game
- `read-chat` - Get recent chat messages from players

### Game State
- `detect-gamemode` - Detect the gamemode on game

## Contributing

Feel free to submit pull requests or open issues for improvements. All refactoring commits, functional and test contributions, issues and discussion are greatly appreciated!

To get started with contributing, please see [CONTRIBUTING.md](CONTRIBUTING.md).

---

⭐ If you find this project useful, please consider giving it a star on GitHub! ⭐

Your support helps make this project more visible to other people who might benefit from it.
