const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle API requests
  if (pathname === '/api/generate' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { topic, level } = JSON.parse(body);

        if (!topic || !level) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Topic and level are required' }));
          return;
        }

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'GOOGLE_API_KEY environment variable not set' }));
          return;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Create an educational explanation about "${topic}" at a ${level} level. 
              
              Structure your response as follows:
              1. Start with a clear, engaging introduction appropriate for the ${level} level
              2. Cover 3-4 key concepts or aspects
              3. Include relevant examples
              4. End with practical takeaways or next steps
              
              Adjust the depth, vocabulary, and technical detail based on the level:
              - Basic: Simple language, everyday analogies, foundational concepts only
              - Intermediate: More technical terms, assumes basic knowledge, deeper explanations
              - Advanced: Technical language, complex concepts, assumes strong foundation
              - Expert: Highly technical, cutting-edge topics, assumes expert background
              
              Format your response in clean HTML with appropriate headings and paragraphs. Use <h3> for section headers and <p> for paragraphs.`
              }]
            }]
          })
        });

        const data = await response.json();

        if (!response.ok) {
          res.writeHead(response.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: data.error?.message || 'API request failed' }));
          return;
        }

        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ content }));
      } catch (error) {
        console.error('Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to generate content' }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - File Not Found</h1>');
    } else {
      const ext = path.extname(filePath);
      let contentType = 'text/html';
      if (ext === '.js') contentType = 'text/javascript';
      if (ext === '.css') contentType = 'text/css';
      if (ext === '.json') contentType = 'application/json';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`
🚀 Development server running at http://localhost:${PORT}
📖 Open Chrome and navigate to http://localhost:${PORT}

Make sure to set your Google API key:
  export GOOGLE_API_KEY='YOUR_GOOGLE_API_KEY'

Get a free key at: https://ai.google.dev/

Then reload the page in Chrome.
  `);
});
