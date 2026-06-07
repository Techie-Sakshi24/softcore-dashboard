const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Prompts for each content type
const PROMPTS = {
  'ai-trend': {
    system: `You are a social media content creator for Instagram page softcore.n.glow.
Niche: AI trends explained simply for Gen Z.
Tone: calm, human, a little mysterious. Sounds like a smart friend texting you, never like AI.
CRITICAL: Respond ONLY with valid JSON. No markdown. No backticks. Use [NEWLINE] instead of line breaks inside strings.`,
    user: (date) => `Today: ${date}
Pick the most interesting AI trend happening right now.
Return ONLY this JSON. Use [NEWLINE] for line breaks:
{
  "trend": "one line summary of today's AI trend",
  "bgQuery": "dark moody night city technology",
  "slides": {
    "slide1": "short hook max 8 words that makes people stop scrolling",
    "slide2": "- what changed[NEWLINE]- why it matters[NEWLINE]- what it means for you",
    "slide3": "one deep thought-provoking sentence about this AI shift",
    "slide4": "follow for one AI insight every day. no hype."
  },
  "caption": "2-3 short paragraphs. conversational. first person. makes people think. no hashtags.",
  "hashtags": "#aitrends #artificialintelligence #dailyai #learnai #aitools #futureofwork #techmindset #aiupdate #genztechie #contentcreator #aesthetictech #aiforbeginners #indiatechgirl #thoughtsoftheday #softcoreglow"
}`
  },

  'life-quote': {
    system: `You are a content creator for Instagram page softcore.n.glow.
Niche: deep meaningful life quotes that make young people feel seen.
Tone: poetic, raw, honest. Like something you'd save at 2am. Never preachy or motivational-poster-ish.
CRITICAL: Respond ONLY with valid JSON. No markdown. No backticks. Use [NEWLINE] instead of line breaks inside strings.`,
    user: (date) => `Today: ${date}
Create a deep life quote carousel. Something raw and real that Gen Z saves at midnight.
Return ONLY this JSON. Use [NEWLINE] for line breaks:
{
  "trend": "theme of this quote post",
  "bgQuery": "dark moody bedroom window rain night",
  "slides": {
    "slide1": "one short punchy line that stops the scroll. max 7 words.",
    "slide2": "expand the thought in 2-3 raw honest lines. no fluff.",
    "slide3": "the deepest most poetic version of this truth. the line people screenshot.",
    "slide4": "one gentle closing thought. soft. not preachy."
  },
  "caption": "2-3 short paragraphs. raw, honest, first person. like a journal entry. no hashtags.",
  "hashtags": "#lifequotes #deepthoughts #mindset #quotesthatmakeyouthink #aestheticquotes #2amthoughts #journaling #selfgrowth #emotionalintelligence #softcoreglow #mentalhealth #innerpeace #quoteoftheday #wordsofwisdom #rawtruths"
}`
  },

  'dev-life': {
    system: `You are a content creator for Instagram page softcore.n.glow.
Niche: relatable dev and student life content for BCA/CS students in India.
Tone: witty, real, a little self-deprecating. Feels like a meme but hits deeper.
CRITICAL: Respond ONLY with valid JSON. No markdown. No backticks. Use [NEWLINE] instead of line breaks inside strings.`,
    user: (date) => `Today: ${date}
Create a relatable dev/student life carousel. Something CS students laugh at and share.
Return ONLY this JSON. Use [NEWLINE] for line breaks:
{
  "trend": "theme of this dev life post",
  "bgQuery": "dark desk laptop code night programming",
  "slides": {
    "slide1": "relatable hook. max 8 words. makes devs go 'omg same'",
    "slide2": "3 relatable dev struggles or truths[NEWLINE]keep each line short and punchy",
    "slide3": "one unexpectedly deep truth about the dev journey",
    "slide4": "soft encouraging closer. you got this energy."
  },
  "caption": "2-3 short paragraphs. super relatable. like tweeting your feelings at 1am. no hashtags.",
  "hashtags": "#devlife #csstudent #bcastudent #codinglife #programminghumor #techstudent #learntocode #indiadeveloper #frontenddeveloper #fullstackdeveloper #codingmemes #studentlife #techgirl #womenwhocde #softcoreglow"
}`
  },

  'motivation': {
    system: `You are a content creator for Instagram page softcore.n.glow.
Niche: real motivation for Gen Z hustlers — not toxic positivity, actual truth.
Tone: direct, a little tough love, but warm. Like your most honest friend.
CRITICAL: Respond ONLY with valid JSON. No markdown. No backticks. Use [NEWLINE] instead of line breaks inside strings.`,
    user: (date) => `Today: ${date}
Create a motivation carousel that doesn't sound like a motivational poster.
Return ONLY this JSON. Use [NEWLINE] for line breaks:
{
  "trend": "theme of this motivation post",
  "bgQuery": "dark sunrise mountain fog minimal moody",
  "slides": {
    "slide1": "bold uncomfortable truth. max 8 words.",
    "slide2": "3 real honest points about growth or success[NEWLINE]no fluff no cliches",
    "slide3": "the line that makes someone put their phone down and think",
    "slide4": "one action. one sentence. what to do right now."
  },
  "caption": "2-3 short paragraphs. direct. honest. a little tough love. no hashtags.",
  "hashtags": "#motivation #mindset #growthmindset #selfdevelopment #realness #discipline #softcoreglow #hustle #youngandambitious #genzmotivation #focusmode #levelup #successmindset #workinprogress #dailymotivation"
}`
  }
}

// Shared JSON parser
function parseGroqResponse(raw) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found')

  const cleaned = jsonMatch[0]
    .replace(/[\r]/g, '')
    .replace(/\t/g, ' ')
    .replace(/([^\\])\n/g, '$1 ')
    .replace(/^\n/g, ' ')
    .trim()

  const parsed = JSON.parse(cleaned)

  // convert [NEWLINE] to real newlines
  if (parsed.slides) {
    for (const key of Object.keys(parsed.slides)) {
      parsed.slides[key] = parsed.slides[key].replace(/\[NEWLINE\]/g, '\n')
    }
  }
  if (parsed.caption) {
    parsed.caption = parsed.caption.replace(/\[NEWLINE\]/g, '\n')
  }

  return parsed
}

// Route 1 — generate post content (with content type)
app.post('/api/generate', async (req, res) => {
  const contentType = req.body.contentType || 'ai-trend'
  const prompt = PROMPTS[contentType] || PROMPTS['ai-trend']

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1200,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user(new Date().toDateString()) }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const raw = response.data.choices[0].message.content
    console.log(`[${contentType}] RAW:`, raw.slice(0, 200))

    const parsed = parseGroqResponse(raw)
    res.json(parsed)

  } catch (err) {
    console.error('ERROR:', err?.response?.data || err.message)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// Route 2 — fetch background (uses query from content)
app.get('/api/background', async (req, res) => {
  const query = req.query.q || 'dark aesthetic aurora purple teal night minimal'

  try {
    const response = await axios.get(
      'https://api.unsplash.com/photos/random',
      {
        params: { query, orientation: 'squarish' },
        headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
      }
    )
    res.json({ imageUrl: response.data.urls.regular })
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ error: 'Could not fetch image' })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`✦ softcore.n.glow backend running on port ${PORT}`))
