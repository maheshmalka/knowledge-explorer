module.exports = async function (context, req) {
  context.log('HTTP trigger function processed a request.');

  // Add CORS headers
  context.res.headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  // Check for required environment variable
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: { error: 'API key not configured' }
    };
    return;
  }

  const { topic, level } = req.body;

  if (!topic || !level) {
    context.res = {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: { error: 'Topic and level are required' }
    };
    return;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Create an educational explanation about "${topic}" at a ${level} level. 
          
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
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      context.res = {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: { error: data.error?.message || 'API request failed' }
      };
      return;
    }

    const content = data.content
      .map(item => item.type === 'text' ? item.text : '')
      .join('\n');

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: { content }
    };
  } catch (error) {
    context.log('Error:', error);
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: { error: 'Failed to generate content' }
    };
  }
};
