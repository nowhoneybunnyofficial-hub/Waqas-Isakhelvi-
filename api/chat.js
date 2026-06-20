export default async function handler(req, res) {
  // Allow requests from any origin (so your HTML chatbot can call this)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  try {
    const { messages, searchResults } = req.body;

    let systemPrompt = 'You are a helpful AI assistant who replies in Urdu/Roman Urdu when the user writes in Urdu/Roman Urdu, and in English when the user writes in English. Be friendly, clear, and concise. Always give accurate, well-reasoned answers like a knowledgeable assistant.';

    if (searchResults) {
      systemPrompt += `\n\nHere is up-to-date information from a Google search that may help you answer accurately:\n${searchResults}`;
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await groqResponse.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'Groq API error' });
    }

    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return res.status(200).json({ reply });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
