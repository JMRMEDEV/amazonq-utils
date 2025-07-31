# Web Scraper MCP Server

A Model Context Protocol (MCP) server that provides web scraping and React app testing capabilities using Playwright. This server allows Amazon Q to interact with web pages, scrape content, and test React applications.

## Features

- **Web Scraping**: Extract content from any web page
- **React App Testing**: Interact with React applications (click, fill forms, wait for elements)
- **Page Analysis**: Get comprehensive page information including meta tags, performance metrics
- **Multi-browser Support**: Works with Chromium, Firefox, and WebKit
- **Screenshots**: Capture screenshots of pages or during testing
- **Dynamic Content**: Wait for elements to load (perfect for React apps)

## Available Tools

### 1. `scrape_page`
Scrape content from a web page.

**Parameters:**
- `url` (required): URL to scrape
- `selector` (optional): CSS selector to target specific elements
- `browser` (optional): Browser engine ('chromium', 'firefox', 'webkit')
- `waitFor` (optional): Wait condition (timeout in ms or CSS selector)
- `screenshot` (optional): Take a screenshot

**Example:**
```
Can you scrape the content from https://example.com and look for all h1 headings?
```

### 2. `test_react_app`
Test a React application by performing actions.

**Parameters:**
- `url` (required): URL of the React app
- `actions` (required): Array of actions to perform
- `browser` (optional): Browser engine to use

**Action Types:**
- `click`: Click an element
- `fill`: Fill a form field
- `wait`: Wait for an element to appear
- `screenshot`: Take a screenshot
- `getText`: Get text content from an element
- `getAttribute`: Get an attribute value

**Example:**
```
Can you test my React app at http://localhost:3000? 
1. Click the login button
2. Fill in the username field with "testuser"
3. Fill in the password field with "password123"
4. Click submit
5. Wait for the dashboard to load
6. Take a screenshot
```

### 3. `get_page_info`
Get comprehensive information about a web page.

**Parameters:**
- `url` (required): URL to analyze
- `browser` (optional): Browser engine to use
- `includePerformance` (optional): Include performance metrics

**Example:**
```
Can you analyze the page information for my React app at http://localhost:3000 including performance metrics?
```

### 4. `wait_for_element`
Wait for a specific element to appear on the page.

**Parameters:**
- `url` (required): URL to monitor
- `selector` (required): CSS selector to wait for
- `timeout` (optional): Maximum wait time in milliseconds
- `browser` (optional): Browser engine to use

**Example:**
```
Can you check if the loading spinner disappears on my React app at http://localhost:3000? Wait for the element with class "loading-complete".
```

## Usage Examples

### Testing a React App Login Flow
```
I need to test the login flow of my React app. Can you:
1. Navigate to http://localhost:3000
2. Click the "Sign In" button
3. Fill the email field with "test@example.com"
4. Fill the password field with "testpass"
5. Click the "Login" button
6. Wait for the user dashboard to load (look for element with id "dashboard")
7. Take a screenshot of the result
```

### Scraping Dynamic Content
```
Can you scrape the product listings from https://example-store.com? 
Wait for the products to load (look for .product-card elements) and then extract all the product titles and prices.
```

### Performance Analysis
```
Can you analyze the performance of my React app at http://localhost:3000? 
I want to see load times, first paint, and other performance metrics.
```

### Debugging React Components
```
My React component isn't rendering properly. Can you:
1. Navigate to http://localhost:3000/components/my-component
2. Wait for 3 seconds for any async data to load
3. Take a screenshot
4. Get the text content of the error message (if any) from .error-message
5. Check if the submit button is disabled by getting its "disabled" attribute
```

## Installation

The server is already installed and configured in your MCP setup. The configuration is in `~/.aws/amazonq/mcp.json`:

```json
{
  "mcpServers": {
    "web-scraper": {
      "command": "node",
      "args": ["/home/jmrmedev/mcp-servers/web-scraper/server.js"],
      "env": {},
      "timeout": 120000,
      "disabled": false
    }
  }
}
```

## Browser Support

- **Chromium** (default): Best for modern web apps and React testing
- **Firefox**: Good alternative, useful for cross-browser testing
- **WebKit**: Safari engine, useful for testing Safari-specific issues

## Screenshots

Screenshots are automatically saved to `/tmp/` with timestamps. You can request screenshots during testing or page analysis.

## Error Handling

The server includes comprehensive error handling:
- Network timeouts
- Element not found errors
- Browser launch failures
- Invalid selectors

## Performance Tips

1. Use `waitFor` parameter to ensure dynamic content loads
2. Specify selectors to target specific content instead of scraping entire pages
3. Use Chromium for best performance with React apps
4. Set appropriate timeouts for slow-loading applications

## Troubleshooting

If you encounter issues:

1. **Browser not launching**: Ensure Playwright browsers are installed
2. **Element not found**: Check your CSS selectors are correct
3. **Timeout errors**: Increase timeout values or check if the page is loading slowly
4. **Permission errors**: Ensure the server script is executable

## Security Notes

- The server runs browsers in headless mode for security
- Screenshots are saved locally in `/tmp/`
- No sensitive data is logged or stored
- All browser instances are properly cleaned up after use