#!/usr/bin/env node

const http = require('http');
const https = require('https');

// Parse command line arguments
const args = process.argv.slice(2);
let tokenIndex = args.indexOf('--token');
let baseIndex = args.indexOf('--base');

if (tokenIndex === -1 || baseIndex === -1) {
  console.error('Usage: node airtable_simple.js --token YOUR_TOKEN --base YOUR_BASE_ID');
  process.exit(1);
}

const token = args[tokenIndex + 1];
const baseId = args[baseIndex + 1];

console.log(`Starting Airtable MCP server with token ${token.slice(0, 5)}...${token.slice(-5)} and base ${baseId}`);

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Only handle POST requests to /mcp
  if (req.method !== 'POST' || !req.url.endsWith('/mcp')) {
    res.writeHead(404);
    res.end();
    return;
  }
  
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const request = JSON.parse(body);
      
      // Handle JSON-RPC methods
      if (request.method === 'resources/list') {
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            resources: [
              {
                id: 'airtable_tables',
                name: 'Airtable Tables',
                description: 'Tables in your Airtable base'
              }
            ]
          }
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        return;
      }
      
      if (request.method === 'prompts/list') {
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            prompts: [
              {
                id: 'tables_prompt',
                name: 'List Tables',
                description: 'List all tables'
              }
            ]
          }
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        return;
      }
      
      // Handle tool calls
      if (request.method === 'tools/call') {
        const toolName = request.params.name;
        
        if (toolName === 'list_tables') {
          // Call Airtable API to list tables
          const result = await callAirtableAPI(`meta/bases/${baseId}/tables`);
          const tables = result.tables || [];
          
          const tableList = tables.map((table, i) => 
            `${i+1}. ${table.name} (ID: ${table.id})`
          ).join('\n');
          
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: tables.length > 0 
                    ? `Tables in this base:\n${tableList}` 
                    : 'No tables found in this base.'
                }
              ]
            }
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          return;
        }
        
        if (toolName === 'list_records') {
          const tableName = request.params.arguments.table_name;
          const maxRecords = request.params.arguments.max_records || 100;
          
          // Call Airtable API to list records
          const result = await callAirtableAPI(`${baseId}/${tableName}`, { maxRecords });
          const records = result.records || [];
          
          const recordList = records.map((record, i) => {
            const fields = Object.entries(record.fields || {})
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ');
            return `${i+1}. ID: ${record.id} - ${fields}`;
          }).join('\n');
          
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: records.length > 0 
                    ? `Records:\n${recordList}` 
                    : 'No records found in this table.'
                }
              ]
            }
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          return;
        }
        
        // Tool not found
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Tool ${toolName} not found`
          }
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        return;
      }
      
      // Method not found
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Method ${request.method} not found`
        }
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
      
    } catch (error) {
      console.error('Error processing request:', error);
      const response = {
        jsonrpc: '2.0',
        id: request.id || null,
        error: {
          code: -32000,
          message: error.message || 'Unknown error'
        }
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    }
  });
});

// Helper function to call Airtable API
function callAirtableAPI(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams(params).toString();
    const url = `https://api.airtable.com/v0/${endpoint}${queryParams ? '?' + queryParams : ''}`;
    
    const options = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    https.get(url, options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse Airtable response: ${e.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Airtable API request failed: ${error.message}`));
    });
  });
}

// Start the server on port 8010
const PORT = 8010;
server.listen(PORT, () => {
  console.log(`Airtable MCP server running at http://localhost:${PORT}/mcp`);
  console.log(`For Claude, use this URL: http://localhost:${PORT}/mcp`);
}); 