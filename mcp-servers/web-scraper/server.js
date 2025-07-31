#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { chromium, firefox, webkit } from 'playwright';

class WebScraperServer {
  constructor() {
    this.server = new Server(
      {
        name: 'web-scraper',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
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
          name: 'scrape_page',
          description: 'Scrape content from a web page using Playwright',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to scrape'
              },
              selector: {
                type: 'string',
                description: 'CSS selector to target specific elements (optional)'
              },
              browser: {
                type: 'string',
                enum: ['chromium', 'firefox', 'webkit'],
                default: 'chromium',
                description: 'Browser engine to use'
              },
              waitFor: {
                type: 'string',
                description: 'Wait for specific selector or timeout in ms (e.g., "2000" or "#my-element")'
              },
              screenshot: {
                type: 'boolean',
                default: false,
                description: 'Take a screenshot of the page'
              }
            },
            required: ['url']
          }
        },
        {
          name: 'test_react_app',
          description: 'Test a React app by navigating and interacting with elements',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL of the React app (e.g., http://localhost:3000)'
              },
              actions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['click', 'fill', 'wait', 'screenshot', 'getText', 'getAttribute']
                    },
                    selector: {
                      type: 'string',
                      description: 'CSS selector for the element'
                    },
                    value: {
                      type: 'string',
                      description: 'Value for fill actions or attribute name for getAttribute'
                    },
                    timeout: {
                      type: 'number',
                      default: 5000,
                      description: 'Timeout in milliseconds'
                    }
                  },
                  required: ['type']
                },
                description: 'Array of actions to perform on the page'
              },
              browser: {
                type: 'string',
                enum: ['chromium', 'firefox', 'webkit'],
                default: 'chromium',
                description: 'Browser engine to use'
              }
            },
            required: ['url', 'actions']
          }
        },
        {
          name: 'get_page_info',
          description: 'Get comprehensive information about a web page (title, meta tags, performance metrics)',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to analyze'
              },
              browser: {
                type: 'string',
                enum: ['chromium', 'firefox', 'webkit'],
                default: 'chromium',
                description: 'Browser engine to use'
              },
              includePerformance: {
                type: 'boolean',
                default: false,
                description: 'Include performance metrics'
              }
            },
            required: ['url']
          }
        },
        {
          name: 'wait_for_element',
          description: 'Wait for an element to appear on the page (useful for dynamic React content)',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to monitor'
              },
              selector: {
                type: 'string',
                description: 'CSS selector to wait for'
              },
              timeout: {
                type: 'number',
                default: 10000,
                description: 'Maximum time to wait in milliseconds'
              },
              browser: {
                type: 'string',
                enum: ['chromium', 'firefox', 'webkit'],
                default: 'chromium',
                description: 'Browser engine to use'
              }
            },
            required: ['url', 'selector']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'scrape_page':
            return await this.scrapePage(args);
          case 'test_react_app':
            return await this.testReactApp(args);
          case 'get_page_info':
            return await this.getPageInfo(args);
          case 'wait_for_element':
            return await this.waitForElement(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async getBrowser(browserType = 'chromium') {
    const browsers = { chromium, firefox, webkit };
    return await browsers[browserType].launch({ headless: true });
  }

  async scrapePage(args) {
    const { url, selector, browser: browserType = 'chromium', waitFor, screenshot } = args;
    
    const browser = await this.getBrowser(browserType);
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait for specific condition if provided
      if (waitFor) {
        if (waitFor.match(/^\d+$/)) {
          await page.waitForTimeout(parseInt(waitFor));
        } else {
          await page.waitForSelector(waitFor, { timeout: 10000 });
        }
      }

      let content;
      if (selector) {
        const elements = await page.$$(selector);
        content = await Promise.all(
          elements.map(async (el) => await el.textContent())
        );
      } else {
        content = await page.textContent('body');
      }

      const result = {
        content: [
          {
            type: 'text',
            text: `Scraped content from ${url}:\n\n${Array.isArray(content) ? content.join('\n---\n') : content}`
          }
        ]
      };

      if (screenshot) {
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        const screenshotPath = `/tmp/screenshot-${Date.now()}.png`;
        require('fs').writeFileSync(screenshotPath, screenshotBuffer);
        result.content.push({
          type: 'text',
          text: `Screenshot saved to: ${screenshotPath}`
        });
      }

      return result;
    } finally {
      await browser.close();
    }
  }

  async testReactApp(args) {
    const { url, actions, browser: browserType = 'chromium' } = args;
    
    const browser = await this.getBrowser(browserType);
    const page = await browser.newPage();
    const results = [];
    
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      results.push(`✅ Navigated to ${url}`);

      for (const action of actions) {
        const { type, selector, value, timeout = 5000 } = action;
        
        try {
          switch (type) {
            case 'click':
              await page.click(selector, { timeout });
              results.push(`✅ Clicked: ${selector}`);
              break;
              
            case 'fill':
              await page.fill(selector, value, { timeout });
              results.push(`✅ Filled "${value}" into: ${selector}`);
              break;
              
            case 'wait':
              await page.waitForSelector(selector, { timeout });
              results.push(`✅ Waited for: ${selector}`);
              break;
              
            case 'screenshot':
              const screenshotBuffer = await page.screenshot({ fullPage: true });
              const screenshotPath = `/tmp/react-test-${Date.now()}.png`;
              require('fs').writeFileSync(screenshotPath, screenshotBuffer);
              results.push(`✅ Screenshot saved: ${screenshotPath}`);
              break;
              
            case 'getText':
              const text = await page.textContent(selector);
              results.push(`✅ Text from ${selector}: "${text}"`);
              break;
              
            case 'getAttribute':
              const attr = await page.getAttribute(selector, value);
              results.push(`✅ Attribute "${value}" from ${selector}: "${attr}"`);
              break;
              
            default:
              results.push(`❌ Unknown action type: ${type}`);
          }
        } catch (actionError) {
          results.push(`❌ Failed ${type} on ${selector}: ${actionError.message}`);
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `React App Test Results:\n\n${results.join('\n')}`
          }
        ]
      };
    } finally {
      await browser.close();
    }
  }

  async getPageInfo(args) {
    const { url, browser: browserType = 'chromium', includePerformance } = args;
    
    const browser = await this.getBrowser(browserType);
    const page = await browser.newPage();
    
    try {
      const startTime = Date.now();
      await page.goto(url, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      const info = await page.evaluate(() => ({
        title: document.title,
        url: window.location.href,
        metaTags: Array.from(document.querySelectorAll('meta')).map(meta => ({
          name: meta.name || meta.property,
          content: meta.content
        })).filter(meta => meta.name),
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
          tag: h.tagName.toLowerCase(),
          text: h.textContent.trim()
        })),
        links: Array.from(document.querySelectorAll('a[href]')).length,
        images: Array.from(document.querySelectorAll('img')).length,
        forms: Array.from(document.querySelectorAll('form')).length
      }));

      let performanceInfo = '';
      if (includePerformance) {
        const metrics = await page.evaluate(() => {
          const perf = performance.getEntriesByType('navigation')[0];
          return {
            domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
            loadComplete: perf.loadEventEnd - perf.loadEventStart,
            firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime,
            firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime
          };
        });
        
        performanceInfo = `\n\nPerformance Metrics:
- Page Load Time: ${loadTime}ms
- DOM Content Loaded: ${metrics.domContentLoaded}ms
- Load Complete: ${metrics.loadComplete}ms
- First Paint: ${metrics.firstPaint || 'N/A'}ms
- First Contentful Paint: ${metrics.firstContentfulPaint || 'N/A'}ms`;
      }

      return {
        content: [
          {
            type: 'text',
            text: `Page Information for ${url}:

Title: ${info.title}
URL: ${info.url}

Meta Tags:
${info.metaTags.map(meta => `- ${meta.name}: ${meta.content}`).join('\n')}

Headings:
${info.headings.map(h => `- ${h.tag.toUpperCase()}: ${h.text}`).join('\n')}

Page Elements:
- Links: ${info.links}
- Images: ${info.images}
- Forms: ${info.forms}${performanceInfo}`
          }
        ]
      };
    } finally {
      await browser.close();
    }
  }

  async waitForElement(args) {
    const { url, selector, timeout = 10000, browser: browserType = 'chromium' } = args;
    
    const browser = await this.getBrowser(browserType);
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      
      const startTime = Date.now();
      await page.waitForSelector(selector, { timeout });
      const waitTime = Date.now() - startTime;
      
      const element = await page.$(selector);
      const text = await element.textContent();
      const isVisible = await element.isVisible();

      return {
        content: [
          {
            type: 'text',
            text: `✅ Element found: ${selector}
Wait time: ${waitTime}ms
Visible: ${isVisible}
Text content: "${text}"`
          }
        ]
      };
    } finally {
      await browser.close();
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Web Scraper MCP server running on stdio');
  }
}

const server = new WebScraperServer();
server.run().catch(console.error);