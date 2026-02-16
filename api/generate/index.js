module.exports = async function (context, req) {
  context.res.headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    context.res.body = {};
    return;
  }

  try {
    const { topic, level } = (req.body || {});

    if (!topic || !level) {
      context.res.status = 400;
      context.res.body = { error: 'Missing topic or level' };
      return;
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      context.res.status = 500;
      context.res.body = { error: 'API key not configured' };
      return;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create an educational explanation about "${topic}" at a ${level} level. 
          
          Structure your response as follows:
          1. Start with a clear, engaging introduction
          2. Cover 3-4 key concepts
          3. Include relevant examples
          4. End with practical takeaways
          
          Adjust depth based on level:
          - Basic: Simple language, everyday analogies
          - Intermediate: More technical terms, deeper explanations
          - Advanced: Technical language, complex concepts
          - Expert: Highly technical, cutting-edge topics
          
          Format as HTML with <h3> headers and <p> paragraphs.`
          }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      context.res.status = response.status;
      context.res.body = { error: data.error?.message || 'API failed' };
      return;
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    context.res.status = 200;
    context.res.body = { content };

  } catch (error) {
    context.log('Error:', error);
    context.res.status = 500;
    context.res.body = { error: error.message };
  }
};
