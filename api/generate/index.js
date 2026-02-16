module.exports = async function (context, req) {
  context.log('HTTP trigger function processed a request.');

  // Add CORS headers
  context.res.headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  const { topic, level } = req.body || {};

  if (!topic || !level) {
    context.res = {
      status: 400,
      body: { error: 'Topic and level are required' }
    };
    return;
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    context.res = {
      status: 500,
      body: { error: 'API key not configured' }
    };
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
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
      context.res = {
        status: response.status,
        body: { error: data.error?.message || 'API request failed' }
      };
      return;
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    context.res = {
      status: 200,
      body: { content }
    };
  } catch (error) {
    context.log('Error:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to generate content' }
    };
  }
};
