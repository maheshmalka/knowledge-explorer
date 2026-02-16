export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { topic, level } = req.body;

  if (!topic || !level) {
    res.status(400).json({ error: 'Topic and level are required' });
    return;
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'API key not configured' });
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
      res.status(response.status).json({ error: data.error?.message || 'API request failed' });
      return;
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    res.status(200).json({ content });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
}
