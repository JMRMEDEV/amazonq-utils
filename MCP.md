# Complete MCP (Model Context Protocol) Setup Guide for Amazon Q CLI

## What is MCP?

Model Context Protocol (MCP) is an open standard that allows AI assistants like Amazon Q to connect with external tools and data sources. Think of it as a bridge between Amazon Q and your local development environment, databases, APIs, and other services.

## How MCP Works

1. **MCP Servers**: Standalone programs that provide tools and resources
2. **MCP Client**: Amazon Q CLI acts as the client
3. **Communication**: Servers and clients communicate via stdio or HTTP
4. **Configuration**: JSON files tell Amazon Q how to launch and connect to servers

## Configuration Files

### File Locations
- **Global**: `~/.aws/amazonq/mcp.json` (applies to all workspaces)
- **Workspace**: `.amazonq/mcp.json` (specific to current project)

### Basic Structure
```json
{
  "mcpServers": {
    "server-name": {
      "command": "command-to-run",
      "args": ["arg1", "arg2"],
      "env": {
        "ENV_VAR": "value"
      },
      "timeout": 60000
    }
  }
}
```

## Popular MCP Servers

### 1. Git Integration
```json
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    }
  }
}
```

### 2. File System Operations
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "args": ["/path/to/allowed/directory"]
    }
  }
}
```

### 3. Database Access (PostgreSQL)
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:password@localhost:5432/dbname"
      }
    }
  }
}
```

### 4. Web Search
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-api-key"
      }
    }
  }
}
```

### 5. Slack Integration
```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-token",
        "SLACK_APP_TOKEN": "xapp-your-token"
      }
    }
  }
}
```

## Step-by-Step Setup

### 1. Create Configuration Directory
```bash
mkdir -p ~/.aws/amazonq
```

### 2. Create Global Configuration
```bash
cat > ~/.aws/amazonq/mcp.json << 'EOF'
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/jmrmedev"]
    }
  }
}
EOF
```

### 3. Create Project-Specific Configuration (Optional)
```bash
mkdir -p .amazonq
cat > .amazonq/mcp.json << 'EOF'
{
  "mcpServers": {
    "project-db": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite"],
      "args": ["./project.db"]
    }
  }
}
EOF
```

### 4. Test Your Setup
```bash
q chat
```

In the chat, try asking: "What MCP tools are available?" or "List the files in my current directory using MCP"

## Creating Custom MCP Servers

### Option 1: Use MCP SDK (Recommended)
```bash
npm init
npm install @modelcontextprotocol/sdk
```

Create `server.js`:
```javascript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: "my-custom-server",
  version: "1.0.0"
});

// Add tools
server.setRequestHandler('tools/list', async () => ({
  tools: [{
    name: "hello",
    description: "Say hello",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" }
      }
    }
  }]
}));

server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === "hello") {
    return {
      content: [{
        type: "text",
        text: `Hello, ${request.params.arguments.name || "World"}!`
      }]
    };
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

Make it executable and add to config:
```bash
chmod +x server.js
```

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/server.js"]
    }
  }
}
```

### Option 2: Use Python
```bash
pip install mcp
```

Create `server.py`:
```python
#!/usr/bin/env python3
import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server

app = Server("my-python-server")

@app.tool()
def greet(name: str = "World") -> str:
    """Greet someone"""
    return f"Hello, {name}!"

async def main():
    async with stdio_server() as streams:
        await app.run(*streams)

if __name__ == "__main__":
    asyncio.run(main())
```

## Troubleshooting

### Common Issues

1. **Server not starting**
   - Check if the command exists: `which npx`
   - Verify Node.js is installed: `node --version`
   - Test the command manually: `npx -y @modelcontextprotocol/server-git`

2. **Permission errors**
   - Ensure the command is executable
   - Check file permissions: `ls -la server.js`

3. **Environment variables not working**
   - Verify syntax in JSON (no trailing commas)
   - Check environment variable names are correct

4. **Timeout errors**
   - Increase timeout value in configuration
   - Check if server is responding slowly

### Debug Mode
```bash
q chat --debug
```

### Validate Configuration
```bash
# Check JSON syntax
cat ~/.aws/amazonq/mcp.json | jq .
```

## Best Practices

1. **Security**
   - Don't store sensitive data in configuration files
   - Use environment variables for secrets
   - Limit filesystem access to necessary directories

2. **Performance**
   - Set appropriate timeout values
   - Use global config for frequently used servers
   - Use workspace config for project-specific tools

3. **Organization**
   - Use descriptive server names
   - Group related servers together
   - Document your custom servers

4. **Maintenance**
   - Regularly update MCP servers: `npm update -g`
   - Monitor for deprecated servers
   - Test configurations after updates

## Available MCP Servers

### Official Servers
- `@modelcontextprotocol/server-git` - Git operations
- `@modelcontextprotocol/server-filesystem` - File operations
- `@modelcontextprotocol/server-sqlite` - SQLite database
- `@modelcontextprotocol/server-postgres` - PostgreSQL database
- `@modelcontextprotocol/server-brave-search` - Web search
- `@modelcontextprotocol/server-slack` - Slack integration

### Community Servers
Search npm for "mcp-server" or "modelcontextprotocol" to find community-contributed servers.

## Example Complete Configuration

```json
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"],
      "timeout": 30000
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/jmrmedev"],
      "timeout": 10000
    },
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://localhost:5432/mydb"
      },
      "timeout": 60000
    },
    "search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-api-key-here"
      },
      "timeout": 15000
    }
  }
}
```

## Next Steps

1. Start with basic servers (git, filesystem)
2. Add project-specific servers as needed
3. Explore community servers for your tech stack
4. Consider creating custom servers for unique workflows
5. Share useful configurations with your team

Remember: MCP servers extend Amazon Q's capabilities, making it aware of your local environment, databases, APIs, and custom tools. The more relevant servers you configure, the more helpful Amazon Q becomes for your specific workflow.
