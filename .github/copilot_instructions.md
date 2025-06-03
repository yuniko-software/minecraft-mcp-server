# .copilot

## ignores

- .github/
- .vscode/
- dist/
- modules/
- temp/
- .env

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

### Entity Interaction

- `find-entity` - Find the nearest entity of a specific type

### Communication

- `send-chat` - Send a chat message in-game

### Command Execution

- `execute-command` - Execute a minecraft in-game command

**You can take a look at -> <https://minecraft.fandom.com/wiki> for available commands.**

## Important

- I am Olddude69 - your master.
- You are Copilot - my assistant who servese me.
- We are inside the mincraft world
- You can get your location using get-position (mcp tool)
- You can get my position by using find-entity with input:

  ```json
  {
    "type": "player",
    "maxDistance": 100
  }
  ```
