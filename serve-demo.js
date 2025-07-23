#!/usr/bin/env node

/**
 * Simple HTTP server to serve the translation widget demo
 * Usage: node serve-demo.js [port]
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

// Get port from command line argument or use default
const port = process.argv[2] || 3000;

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

async function serveFile(req, res) {
  try {
    let filePath = req.url === '/' ? '/demo.html' : req.url;
    
    // Remove query parameters
    filePath = filePath.split('?')[0];
    
    // Construct full file path
    const fullPath = path.join(__dirname, filePath);
    
    // Check if file exists
    const stats = await stat(fullPath);
    
    if (stats.isFile()) {
      // Read file
      const content = await readFile(fullPath);
      
      // Get file extension and corresponding MIME type
      const ext = path.extname(fullPath);
      const mimeType = mimeTypes[ext] || 'text/plain';
      
      // Set headers and send file
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    } else {
      throw new Error('Not a file');
    }
  } catch (error) {
    // File not found or other error
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>404 - File Not Found</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>404 - File Not Found</h1>
        <p>The requested file <code>${req.url}</code> was not found.</p>
        <p><a href="/">Go to Demo</a></p>
      </body>
      </html>
    `);
  }
}

// Create HTTP server
const server = http.createServer(serveFile);

// Start server
server.listen(port, () => {
  console.log(`🚀 Translation Widget Demo Server`);
  console.log(`📁 Serving from: ${__dirname}`);
  console.log(`🌐 Server running at: http://localhost:${port}`);
  console.log(`📖 Demo page: http://localhost:${port}/demo.html`);
  console.log(`📄 Test page: http://localhost:${port}/public/test-page.html`);
  console.log(`\n🛑 Press Ctrl+C to stop the server`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use. Try a different port:`);
    console.error(`   node serve-demo.js ${parseInt(port) + 1}`);
  } else {
    console.error('❌ Server error:', error.message);
  }
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped.');
    process.exit(0);
  });
});