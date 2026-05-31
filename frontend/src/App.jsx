import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:5000'

const slideLabels = {
  slide1: 'Hook',
  slide2: 'Insight',
  slide3: 'Quote',
  slide4: 'CTA'
}

export default function App() {
  const [loading, setLoading] = useState(false)
  const [bgLoading, setBgLoading] = useState(false)
  const [data, setData] = useState(null)
  const [bgUrl, setBgUrl] = useState(null)
  const [activeSlide, setActiveSlide] = useState('slide1')
  const [copied, setCopied] = useState(false)
  const [editedSlides, setEditedSlides] = useState({})

  const generate = async () => {
    setLoading(true)
    setData(null)
    setBgUrl(null)
    setEditedSlides({})
    try {
      const [postRes, bgRes] = await Promise.all([
        axios.post(`${API}/api/generate`),
        axios.get(`${API}/api/background`)
      ])
      setData(postRes.data)
      setBgUrl(bgRes.data.imageUrl)
      setActiveSlide('slide1')
    } catch (e) {
      alert('Something went wrong. Is the backend running?')
    }
    setLoading(false)
  }

  const refreshBg = async () => {
    setBgLoading(true)
    try {
      const res = await axios.get(`${API}/api/background`)
      setBgUrl(res.data.imageUrl)
    } catch (e) {}
    setBgLoading(false)
  }

  const copyCaption = () => {
    const full = `${data.caption}\n.\n.\n${data.hashtags}`
    navigator.clipboard.writeText(full)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getSlideText = (key) =>
    editedSlides[key] !== undefined ? editedSlides[key] : data?.slides?.[key] || ''

  const downloadSlide = async (slideKey, index) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1080
    const ctx = canvas.getContext('2d')

    if (bgUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((res) => { img.onload = res; img.src = bgUrl })
      ctx.drawImage(img, 0, 0, 1080, 1080)
    }

    // dark overlay
    ctx.fillStyle = 'rgba(8,8,16,0.62)'
    ctx.fillRect(0, 0, 1080, 1080)

    // slide number
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = '300 26px DM Sans'
    ctx.textAlign = 'right'
    ctx.fillText(`0${index + 1} / 04`, 1020, 1040)

    const text = getSlideText(slideKey)
    const lines = text.split('\n')

    // pick font based on slide
    const isQuote = slideKey === 'slide3'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'

    if (slideKey === 'slide1') {
      ctx.font = 'italic bold 72px DM Serif Display'
      wrapText(ctx, lines[0], 540, 460, 900, 90)
    } else if (slideKey === 'slide2') {
      ctx.font = '400 38px DM Sans'
      lines.forEach((line, i) => {
        ctx.fillText(line, 540, 420 + i * 72)
      })
    } else if (isQuote) {
      ctx.font = 'italic 58px DM Serif Display'
      wrapText(ctx, lines[0], 540, 440, 860, 78)
    } else {
      ctx.font = '300 40px DM Sans'
      wrapText(ctx, lines[0], 540, 460, 860, 60)
    }

    const link = document.createElement('a')
    link.download = `softcore_slide_${index + 1}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const downloadAll = async () => {
    const keys = ['slide1', 'slide2', 'slide3', 'slide4']
    for (let i = 0; i < keys.length; i++) {
      await downloadSlide(keys[i], i)
      await new Promise(r => setTimeout(r, 400))
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'DM Serif Display', fontSize: 32, fontStyle: 'italic', color: '#c4b5fd', marginBottom: 8 }}>
          softcore.n.glow
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' }}>
          content dashboard
        </p>
      </div>

      {/* Generate Button */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <button onClick={generate} disabled={loading} style={{
          background: loading ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.15)',
          border: '1px solid rgba(139,92,246,0.5)',
          color: loading ? 'rgba(255,255,255,0.4)' : '#c4b5fd',
          padding: '14px 40px',
          borderRadius: 50,
          fontSize: 15,
          letterSpacing: 2,
          textTransform: 'uppercase',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s'
        }}>
          {loading ? 'generating today\'s post...' : '✦ generate today\'s post'}
        </button>
      </div>

      {/* Trend pill */}
      {data?.trend && (
        <div style={{
          background: 'rgba(139,92,246,0.1)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 12,
          padding: '12px 20px',
          marginBottom: 32,
          textAlign: 'center'
        }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>today's trend  </span>
          <span style={{ color: '#e2d9f3', fontSize: 14 }}>{data.trend}</span>
        </div>
      )}

      {data && bgUrl && (
        <>
          {/* Slide tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.keys(slideLabels).map(key => (
              <button key={key} onClick={() => setActiveSlide(key)} style={{
                background: activeSlide === key ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activeSlide === key ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
                color: activeSlide === key ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
                padding: '8px 20px',
                borderRadius: 50,
                fontSize: 13,
                cursor: 'pointer',
                letterSpacing: 1
              }}>
                {slideLabels[key]}
              </button>
            ))}
          </div>

          {/* Preview + Edit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

            {/* Preview */}
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: '1/1' }}>
              <img src={bgUrl} alt="bg" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,16,0.62)' }} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                flexDirection: 'column', justifyContent: 'center',
                alignItems: 'center', padding: 24, textAlign: 'center'
              }}>
                <p style={{
                  fontFamily: activeSlide === 'slide3' || activeSlide === 'slide1' ? 'DM Serif Display' : 'DM Sans',
                  fontStyle: activeSlide === 'slide3' || activeSlide === 'slide1' ? 'italic' : 'normal',
                  fontSize: activeSlide === 'slide1' ? 22 : activeSlide === 'slide3' ? 20 : 15,
                  fontWeight: activeSlide === 'slide1' ? 700 : 300,
                  color: '#fff',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line'
                }}>
                  {getSlideText(activeSlide)}
                </p>
              </div>
              <div style={{ position: 'absolute', bottom: 12, right: 16, color: 'rgba(255,255,255,0.2)', fontSize: 11, letterSpacing: 2 }}>
                0{Object.keys(slideLabels).indexOf(activeSlide) + 1} / 04
              </div>
            </div>

            {/* Edit panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>edit slide text</p>
              <textarea
                value={getSlideText(activeSlide)}
                onChange={e => setEditedSlides(prev => ({ ...prev, [activeSlide]: e.target.value }))}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 14,
                  padding: 16,
                  lineHeight: 1.7,
                  resize: 'none',
                  flex: 1,
                  minHeight: 160,
                  fontFamily: 'DM Sans',
                  outline: 'none'
                }}
              />
              <button onClick={refreshBg} disabled={bgLoading} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: bgLoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
                padding: '10px 16px',
                borderRadius: 10,
                fontSize: 12,
                cursor: 'pointer',
                letterSpacing: 1
              }}>
                {bgLoading ? 'fetching...' : '↻ different background'}
              </button>
            </div>
          </div>

          {/* Caption box */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>caption + hashtags</p>
              <button onClick={copyCaption} style={{
                background: copied ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(139,92,246,0.3)',
                color: copied ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                padding: '6px 16px',
                borderRadius: 50,
                fontSize: 11,
                cursor: 'pointer',
                letterSpacing: 1
              }}>
                {copied ? '✓ copied!' : 'copy'}
              </button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {data.caption}{'\n.\n.\n'}{data.hashtags}
            </p>
          </div>

          {/* Download buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={downloadAll} style={{
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.4)',
              color: '#c4b5fd',
              padding: '12px 28px',
              borderRadius: 50,
              fontSize: 13,
              cursor: 'pointer',
              letterSpacing: 1.5,
              textTransform: 'uppercase'
            }}>
              ↓ download all 4 slides
            </button>
            {Object.keys(slideLabels).map((key, i) => (
              <button key={key} onClick={() => downloadSlide(key, i)} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.45)',
                padding: '12px 20px',
                borderRadius: 50,
                fontSize: 12,
                cursor: 'pointer',
                letterSpacing: 1
              }}>
                slide {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let currentY = y
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY)
      line = words[n] + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
}