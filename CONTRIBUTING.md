# Welcome to Minecraft-MCP-Server contributing guide

## Prerequisites
- Git
- Node.js (>=16.0.0)
- A running Minecraft game (the setup below was tested with Minecraft 1.21.4 Java Edition included in Microsoft Game Pass)
- Claude Desktop

## Getting Started
This bot is designed to be used with Claude Desktop through the Model Context Protocol (MCP).

### 1. Setup Minecraft Server
Create a singleplayer world and open it to LAN (ESC -> Open to LAN). Bot will try to connect using port 25565 and hostname localhost. These parameters could be configured in claude_desktop_config.json on a next step.

### 2. MCP Configuration

Make sure that [Claude Desktop](https://claude.ai/download) is installed. 

You can open your desktop config file via Claude Desktop by clicking `File -> Settings -> Developer -> Edit Config`.

You can also open your Claude for Desktop App configuration via text editor by typing in the command line:

**MacOS/Linux**
```
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows**
```
code $env:AppData\Claude\claude_desktop_config.json
```

Update your `claude_desktop_config.json` by adding the minecraft mcp server in the mcpServers key, or adding if there is none. For this project, you can copy and paste the following code:

If you're running from this github repository, you can add this:

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

If you're running from your local repository:

Install npm dependecies
```
npm install
```

Build the Typescript
```
npm run build
```

There should be an javascript file in `dist/` called `bot.js`. 

You can have Claude run this multiple ways.

#### Running with npx
Help needed


#### Running with nvm
There is an [ongoing issue](https://github.com/modelcontextprotocol/servers/issues/64) with MCP servers and Node Version Manager, where Claude seems to use an incompatible version when hosting this codebase.

To bypass this, you can run this command and use the specified path for the command field.
```
which node
```

Be sure to copy and paste the path of `/dist/bot.js`.

```json
{
  "mcpServers": {
    "minecraft": {
      "command": "/Users/[username]/.nvm/versions/node/v23.3.0/bin/node",
      "args": [
        "/PATH/TO/YOUR/FORKED/REPOSITORY/dist/bot.js",
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

Once you open Claude, the MCP server should start automatically and your bot should connect to the configured Minecraft server (if it's running). You'll then be able to control the bot through Claude's chat interface.