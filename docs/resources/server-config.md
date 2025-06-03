# Minecraft Server Configuration Guide

## Server Properties

### Essential Settings

```properties
# Basic server identification
server-name=My Minecraft Server
motd=Welcome to my server!
server-port=25565
max-players=20

# World generation
level-name=world
level-type=default
seed=12345678901234567890
generate-structures=true

# Game rules
difficulty=normal
gamemode=survival
hardcore=false
pvp=true
```

### Performance Settings

```properties
# View distance (impacts performance)
view-distance=10
simulation-distance=10

# Network settings
network-compression-threshold=256
max-tick-time=60000

# Memory management
spawn-protection=16
max-world-size=29999984
```

## Command Block Configuration

### Enable Command Blocks

```properties
enable-command-block=true
broadcast-console-to-ops=false
op-permission-level=4
```

### Game Rules for Commands

```minecraft
/gamerule commandBlockOutput false    # Reduce chat spam
/gamerule sendCommandFeedback true    # Show command results
/gamerule logAdminCommands true       # Log admin commands
/gamerule maxCommandChainLength 65536 # Command block chain limit
```

## RCON Configuration

### Server Props

```ini
enable-rcon=true
rcon.port=25575
rcon.password=your_secure_password
broadcast-rcon-to-ops=false
```

### Security Considerations

- Use strong, unique passwords
- Change default ports if possible
- Restrict RCON access by IP
- Monitor RCON connections in logs

## World Management

### Backup Commands

```minecraft
# Stop auto-saving before backup
/save-off
/save-all flush

# After backup is complete
/save-on
```

### World Optimization

```minecraft
# Reduce lag from entities
/kill @e[type=item]              # Remove dropped items
/kill @e[type=experience_orb]    # Remove XP orbs
/tp @e[type=boat] ~ ~-100 ~      # Remove boats underwater
```

### Data Pack Management

```minecraft
# Install data pack
1. Place in world/datapacks/ folder
2. Use /reload command
3. Verify with /datapack list

# Data Pack Commands
/datapack list                   # List all data packs
/datapack enable "pack_name"     # Enable data pack
/datapack disable "pack_name"    # Disable data pack
```

## Performance Monitoring

### Essential Commands

```minecraft
/debug start                     # Start profiling
/debug stop                      # Stop profiling
/forge tps                       # Check TPS (if using Forge)
/spark profiler start            # Start spark profiler
```

### Log Monitoring

- Check `logs/latest.log` for current session
- Monitor for error patterns
- Watch for memory warnings
- Track player connection issues

## Security Best Practices

### Server Protection

- Keep server software updated
- Use whitelist for private servers
- Regular backup schedules
- Monitor player activity logs
- Limit command block usage

### Admin Guidelines

- Use separate admin accounts
- Log all administrative actions
- Test commands in creative mode first
- Have rollback procedures ready
- Communicate changes to players

## Troubleshooting

### Common Issues

- High memory usage: Reduce view distance, limit entities
- Lag spikes: Check for infinite command block loops
- Connection timeouts: Verify network configuration
- World corruption: Restore from backup

### Debug Information

```minecraft
/debug start                     # Profile server performance
/forge entity list               # List entity counts
/gametest clearall               # Clear running tests
```
