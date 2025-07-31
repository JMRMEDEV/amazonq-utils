#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

class NodeJSMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'nodejs-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'run_node_script',
          description: 'Execute a Node.js script or command',
          inputSchema: {
            type: 'object',
            properties: {
              script: {
                type: 'string',
                description: 'The Node.js script content or command to execute',
              },
              args: {
                type: 'array',
                items: { type: 'string' },
                description: 'Arguments to pass to the script',
                default: [],
              },
              cwd: {
                type: 'string',
                description: 'Working directory for the command',
                default: process.cwd(),
              },
            },
            required: ['script'],
          },
        },
        {
          name: 'npm_command',
          description: 'Execute npm commands',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'The npm command to execute (e.g., "install", "run build")',
              },
              cwd: {
                type: 'string',
                description: 'Working directory for the command',
                default: process.cwd(),
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'get_package_info',
          description: 'Get information about a package.json file',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the package.json file',
                default: './package.json',
              },
            },
          },
        },
        {
          name: 'node_version_info',
          description: 'Get Node.js and npm version information',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'run_node_script':
            return await this.runNodeScript(args);
          case 'npm_command':
            return await this.runNpmCommand(args);
          case 'get_package_info':
            return await this.getPackageInfo(args);
          case 'node_version_info':
            return await this.getNodeVersionInfo();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async runNodeScript(args) {
    const { script, args: scriptArgs = [], cwd = process.cwd() } = args;
    
    // If script looks like a file path, run it directly
    if (script.endsWith('.js') || script.includes('/')) {
      const command = `node ${script} ${scriptArgs.join(' ')}`;
      const { stdout, stderr } = await execAsync(command, { cwd });
      return {
        content: [
          {
            type: 'text',
            text: `Command: ${command}\n\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
          },
        ],
      };
    } else {
      // Execute as inline script
      const command = `node -e "${script.replace(/"/g, '\\"')}" ${scriptArgs.join(' ')}`;
      const { stdout, stderr } = await execAsync(command, { cwd });
      return {
        content: [
          {
            type: 'text',
            text: `Script executed:\n${script}\n\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
          },
        ],
      };
    }
  }

  async runNpmCommand(args) {
    const { command, cwd = process.cwd() } = args;
    const fullCommand = `npm ${command}`;
    const { stdout, stderr } = await execAsync(fullCommand, { cwd });
    
    return {
      content: [
        {
          type: 'text',
          text: `Command: ${fullCommand}\n\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        },
      ],
    };
  }

  async getPackageInfo(args) {
    const { path: packagePath = './package.json' } = args;
    
    try {
      const content = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(content);
      
      return {
        content: [
          {
            type: 'text',
            text: `Package Information from ${packagePath}:\n\n${JSON.stringify(packageJson, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to read package.json: ${error.message}`);
    }
  }

  async getNodeVersionInfo() {
    const { stdout: nodeVersion } = await execAsync('node --version');
    const { stdout: npmVersion } = await execAsync('npm --version');
    
    return {
      content: [
        {
          type: 'text',
          text: `Node.js Version: ${nodeVersion.trim()}\nnpm Version: ${npmVersion.trim()}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Node.js MCP Server running on stdio');
  }
}

const server = new NodeJSMCPServer();
server.run().catch(console.error);
