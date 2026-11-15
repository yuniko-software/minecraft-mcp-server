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

## Available Commands

Once connected to a Minecraft server, Claude can use these commands:

### Movement
- `get-position` - Get the current position of the bot
- `move-to-position` - Move to specific coordinates
- `look-at` - Make the bot look at specific coordinates
- `jump` - Make the bot jump
- `move-in-direction` - Move in a specific direction for a duration

Pathfinding is non-destructive: navigation and implicit dig/place approaches do
not break blocks, build towers or place scaffolding. Unreachable routes return
MCP errors instead of breaking through walls. Open doors or provide an accessible
route explicitly. Intentional `dig-block` and `place-block` remain available.
Before an explicit dig, the bot selects the fastest available eligible harvesting
tool after approaching (for example, iron axe before stone axe for logs); stone is
a fallback when iron is absent. Valid hand mining remains supported, and missing
required harvesting tools or native equip/dig failures return errors.
Already-open doors are traversable only when both halves are loaded/open and
their collision shapes clear the centered player body; navigation never opens or
closes them automatically. Timeout cancellation clears the path immediately.
`move-to-position` uses floored block coordinates and a block-grid goal radius,
not an exact body-position tolerance; a radius below 1 selects the target block.

### Flight
- `fly-to` - Make the bot fly directly to specific coordinates

### Inventory
- `list-inventory` - List all items in the bot's inventory
- `find-item` - Find a specific item in inventory
- `equip-item` - Equip a specific item
- `drop-item` - Drop exact `itemName` and positive integer `count` in one call, up to the item's full stack size (64 for ordinary materials, 16 or 1 for other items)

For example, `drop-item` with `itemName: "cobblestone", count: 64` drops a full
stack in one call. Availability is checked before dropping; missing items,
insufficient quantities, native failures and unconfirmed/partial transfers return
MCP errors with inventory changes. A full matching stack is selected when available
to clear its slot directly; otherwise the quantity can come from matching inventory
stacks. Smaller drops use Mineflayer's native toss API and may involve multiple
inventory clicks, but still require only one tool call. The bot does not turn or
move automatically. Ground items may be picked up again; inventory changes do not
guarantee that another player received the items.

### Survival
- `eat` - Consume one inventory food item using its exact `itemName` (for example, `bread`); equips it in the main hand and leaves it equipped
- `sleep` - Enter the nearby bed at explicit `x`, `y`, `z` coordinates in the overworld; returns upon entering, not after the night
- `wake` - Wake from bed, waiting up to 3 seconds for confirmation
- `status` - JSON health, food (out of 20), saturation and oxygen (`null` when unavailable), sleeping, position, gamemode, dimension, held item, vehicle and other current state

Eating, sleeping and boarding retain Mineflayer/server restrictions (including hunger,
time, bed occupancy, monsters and available vehicle seats). Failures return MCP errors.
These tools do not automatically move, alter game rules or select a different target.

### Block Interaction
- `place-block` - Place a block at specified coordinates
- `dig-block` - Dig a block at specified coordinates
- `get-block-info` - Get a block's name/type, state ID, properties and collision shapes for read-only inspection
- `find-blocks` - Find one or more nearby blocks of a specific type
- `interact-block` - Right-click the visible block at `x`, `y`, `z` within normal reach; use `sleep` for beds

### Furnace
- `smelt-item` - Smelt items using a furnace-like block

### Entity Interaction
- `find-entity` - Find the nearest entity of a specific type, including its entity ID
- `interact-entity` - Right-click a nearby unobstructed entity using its `entityId`
- `mount` - Try boarding an entity by `entityId` (for example, a boat), waiting up to 3 seconds for confirmation
- `dismount` - Leave the current vehicle, waiting up to 3 seconds for confirmation

Interactions use the currently equipped main-hand item, which may feed a mob, place
an item, open a container or activate a block. They report a **sent request**, not a
guaranteed server-side result; inspect the world or `status` afterward. Local checks
use vanilla reach (4.5 blocks for blocks, 3 for entities; 5 in creative) and do not
override server rules. Mounting may still be rejected by the server; timeout is an error.

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
