# Node.js MCP Server

A Model Context Protocol (MCP) server that provides Node.js development and npm management capabilities. This server allows Amazon Q to execute Node.js scripts, manage npm packages, and interact with Node.js projects.

## Features

- **Script Execution**: Run Node.js scripts and commands
- **NPM Management**: Execute npm commands (install, build, test, etc.)
- **Package Information**: Read and analyze package.json files
- **Version Information**: Get Node.js and npm version details
- **Working Directory Support**: Execute commands in specific directories

## Available Tools

### 1. `run_node_script`
Execute a Node.js script or command.

**Parameters:**
- `script` (required): The Node.js script content or file path to execute
- `args` (optional): Arguments to pass to the script
- `cwd` (optional): Working directory for the command

**Examples:**
```
Can you run this Node.js script: console.log("Hello World");
```

```
Can you execute the script at ./scripts/build.js with arguments ["--production"]?
```

### 2. `npm_command`
Execute npm commands.

**Parameters:**
- `command` (required): The npm command to execute (e.g., "install", "run build")
- `cwd` (optional): Working directory for the command

**Examples:**
```
Can you install the dependencies using npm install?
```

```
Can you run the build script using npm run build?
```

### 3. `get_package_info`
Get information about a package.json file.

**Parameters:**
- `path` (optional): Path to the package.json file (defaults to "./package.json")

**Example:**
```
Can you show me the information from the package.json file?
```

### 4. `node_version_info`
Get Node.js and npm version information.

**Parameters:** None

**Example:**
```
What versions of Node.js and npm are installed?
```

## Usage Examples

### Setting Up a New Project
```
I want to create a new Node.js project. Can you:
1. Check the current Node.js and npm versions
2. Initialize a new package.json with npm init -y
3. Install express as a dependency
4. Show me the package.json contents
```

### Running Development Scripts
```
Can you help me with my Node.js project:
1. Install all dependencies
2. Run the test suite using npm test
3. Build the project using npm run build
4. Show me the package information
```

### Executing Custom Scripts
```
I have a script that processes data. Can you run this Node.js code:
```
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
console.log('Processing', data.length, 'items');
```

### Package Management
```
Can you help me manage my project dependencies:
1. Install lodash as a dependency
2. Install jest as a dev dependency
3. Update all packages to their latest versions
4. Show me the updated package.json
```

### Project Analysis
```
Can you analyze my Node.js project:
1. Show me the package.json information
2. Check what scripts are available
3. List all dependencies and devDependencies
4. Run npm audit to check for vulnerabilities
```

## Installation

The server is configured in your MCP setup. Add this configuration to `~/.aws/amazonq/mcp.json`:

```json
{
  "mcpServers": {
    "nodejs": {
      "command": "node",
      "args": ["/path/to/mcp-servers/nodejs/server.js"],
      "env": {},
      "timeout": 60000,
      "disabled": false
    }
  }
}
```

## Script Execution Modes

The server supports two modes for script execution:

1. **File Path Mode**: If the script parameter ends with `.js` or contains `/`, it's treated as a file path
2. **Inline Script Mode**: Otherwise, it's executed as inline JavaScript code

## Working Directory Support

All commands support the `cwd` parameter to specify the working directory. This is useful for:
- Running commands in specific project directories
- Managing multiple projects
- Executing scripts relative to project roots

## Error Handling

The server includes comprehensive error handling for:
- Script execution errors
- NPM command failures
- File system access issues
- Invalid package.json files
- Network connectivity problems

## Security Notes

- Scripts are executed with the same permissions as the MCP server
- Be cautious when executing scripts from untrusted sources
- The server runs in the context of the user who started it
- All file system operations respect the current user's permissions

## Common Use Cases

1. **Project Setup**: Initialize new Node.js projects and install dependencies
2. **Development Workflow**: Run build scripts, tests, and development servers
3. **Package Management**: Install, update, and audit npm packages
4. **Script Automation**: Execute custom Node.js scripts for data processing or automation
5. **Project Analysis**: Examine package.json files and project structure
6. **Debugging**: Run diagnostic scripts and check environment information

## Troubleshooting

If you encounter issues:

1. **Permission errors**: Ensure the server has appropriate file system permissions
2. **Command not found**: Verify Node.js and npm are installed and in PATH
3. **Script errors**: Check script syntax and dependencies
4. **Network issues**: Verify internet connectivity for npm operations
5. **Path issues**: Use absolute paths or ensure correct working directory

## Performance Tips

1. Use the `cwd` parameter to avoid path-related issues
2. Install dependencies once and reuse across script executions
3. Use npm scripts defined in package.json for complex operations
4. Consider using npm ci for faster, reliable dependency installation in CI/CD
