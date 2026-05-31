const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Route 1 — generate post content via Groq (free)
app.post('/api/generate', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: `You are a social media content creator for an Instagram page called softcore.n.glow.
The page posts about AI trends, aesthetic vibes, dev life and meaningful quotes.
Tone: calm, human, a little mysterious. Never sounds like AI wrote it.
CRITICAL: Respond ONLY with valid JSON. No markdown. No backticks. No newlines inside string values. Use the literal text [NEWLINE] instead of actual line breaks inside strings.`
          },
          {
            role: 'user',
            content: `Today's date: ${new Date().toDateString()}

Pick the most interesting AI trend happening right now and generate Instagram content.

Return ONLY this JSON structure. Use [NEWLINE] instead of actual line breaks inside string values:
{
  "trend": "one line summary of today's AI trend",
  "slides": {
    "slide1": "short hook max 10 words makes people stop scrolling",
    "slide2": "- point one[NEWLINE]- point two[NEWLINE]- point three",
    "slide3": "one deep poetic quote related to the topic",
    "slide4": "soft CTA max 2 lines"
  },
  "caption": "human conversational caption no hashtags",
  "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10 #tag11 #tag12 #tag13 #tag14 #tag15"
}`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const raw = response.data.choices[0].message.content;
    console.log('RAW RESPONSE:', raw);

    // extract JSON block
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response');
      return res.status(500).json({ error: 'No JSON in response' });
    }

    // clean the extracted JSON
    const cleaned = jsonMatch[0]
      .replace(/[\r]/g, '')           // remove carriage returns
      .replace(/\t/g, ' ')            // tabs to spaces
      .replace(/([^\\])\n/g, '$1 ')   // unescaped newlines to space
      .replace(/^\n/g, ' ')           // leading newlines
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('JSON parse error:', e.message);
      console.error('Cleaned string:', cleaned);
      return res.status(500).json({ error: 'Failed to parse response' });
    }

    // convert [NEWLINE] placeholders to real newlines
    if (parsed.slides) {
      for (const key of Object.keys(parsed.slides)) {
        parsed.slides[key] = parsed.slides[key].replace(/\[NEWLINE\]/g, '\n');
      }
    }
    if (parsed.caption) {
      parsed.caption = parsed.caption.replace(/\[NEWLINE\]/g, '\n');
    }

    res.json(parsed);

  } catch (err) {
    console.error('ERROR:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Route 2 — fetch background from Unsplash
app.get('/api/background', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.unsplash.com/photos/random',
      {
        params: {
          query: 'dark aesthetic aurora purple teal night minimal',
          orientation: 'squarish'
        },
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
        }
      }
    );
    res.json({ imageUrl: response.data.urls.regular });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Could not fetch image' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✦ softcore.n.glow backend running on port ${PORT}`));