export default async function handler(req, res) {
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
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'No search query provided' });
    }

    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query })
    });

    const data = await serperResponse.json();

    // Build a clean text summary from the top results
    let summary = '';

    if (data.answerBox) {
      summary += `Answer: ${data.answerBox.answer || data.answerBox.snippet || ''}\n\n`;
    }

    if (data.organic && data.organic.length > 0) {
      data.organic.slice(0, 5).forEach((item, i) => {
        summary += `${i + 1}. ${item.title}\n${item.snippet}\nSource: ${item.link}\n\n`;
      });
    }

    if (!summary) summary = 'No relevant search results found.';

    return res.status(200).json({ results: summary });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
      }
