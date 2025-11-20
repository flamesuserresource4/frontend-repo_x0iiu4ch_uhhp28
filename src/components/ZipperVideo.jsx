import { useEffect, useRef, useState } from 'react'

// Pixel-art zipper loading animation rendered to Canvas with record-to-WebM
export default function ZipperVideo() {
  const canvasRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const rafRef = useRef(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState('')

  // Config
  const WIDTH = 1920
  const HEIGHT = 1080
  const DURATION = 3.0 // seconds
  const FPS = 60

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Ensure crisp pixel art rendering
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    let startTime = 0

    function drawFrame(p) {
      // p: 0..1
      // Colors
      const brightBlue = '#2ea8ff' // bright blue background
      const panelBlue = '#1b6fb8' // darker panels that separate
      const white = '#ffffff'
      const black = '#000000'

      // Clear
      ctx.fillStyle = panelBlue
      ctx.fillRect(0, 0, WIDTH, HEIGHT)

      // Open width (zip opening left->right): ease in-out for smoothness
      const ease = (t) => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2
      const openW = Math.floor(WIDTH * ease(p))

      // Draw bright blue revealed area
      ctx.fillStyle = brightBlue
      ctx.fillRect(0, 0, openW, HEIGHT)

      // Draw the two panels edges (like fabric) with black pixel borders at the opening seam
      // Left edge (already opened): a black vertical line at openW
      ctx.fillStyle = black
      ctx.fillRect(openW - 2, 0, 2, HEIGHT)

      // Right panel covers the rest
      ctx.fillStyle = panelBlue
      ctx.fillRect(openW, 0, WIDTH - openW, HEIGHT)

      // Zipper teeth along the seam, pixel-art style
      const teethSize = 16 // base pixel size
      const teethGap = 8
      const seamX = openW
      // Draw alternating teeth on left and right of seam to mimic interlocking
      for (let y = 100; y < HEIGHT - 100; y += teethSize + teethGap) {
        // Left tooth (on bright side), white with black outline
        drawPixelRect(ctx, seamX - teethSize - 6, y, teethSize, teethSize, white, black)
        // Right tooth (on panel side)
        drawPixelRect(ctx, seamX + 6, y + Math.floor(teethSize/2), teethSize, teethSize, white, black)
      }

      // Zipper slider (puller)
      const sliderW = teethSize * 3
      const sliderH = teethSize * 6
      const sliderX = seamX - Math.floor(sliderW/2)
      const sliderY = Math.floor(HEIGHT/2 - sliderH/2)
      // Body
      drawPixelRect(ctx, sliderX, sliderY, sliderW, sliderH, white, black)
      // Hole
      drawPixelRect(ctx, sliderX + Math.floor(sliderW/4), sliderY + teethSize, Math.floor(sliderW/2), Math.floor(teethSize*1.5), brightBlue, black)
      // Tab
      drawPixelRect(ctx, sliderX + Math.floor(sliderW/4), sliderY + sliderH, Math.floor(sliderW/2), Math.floor(teethSize*1.2), white, black)

      // Optional: subtle pixel shadow to give depth
      ctx.globalAlpha = 0.15
      ctx.fillStyle = black
      ctx.fillRect(sliderX + 8, sliderY + 8, sliderW, sliderH)
      ctx.globalAlpha = 1
    }

    function loop(ts) {
      if (!startTime) startTime = ts
      const elapsed = (ts - startTime) / 1000
      let p = Math.min(elapsed / DURATION, 1)
      setProgress(p)
      drawFrame(p)

      if (p < 1) {
        rafRef.current = requestAnimationFrame(loop)
      } else {
        setIsPlaying(false)
        if (isRecording) {
          stopRecording()
        }
      }
    }

    function startPlayback() {
      cancelAnimationFrame(rafRef.current)
      startTime = 0
      setIsPlaying(true)
      rafRef.current = requestAnimationFrame(loop)
    }

    function startRecording() {
      if (!canvas.captureStream) return
      // Reset previous recording
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
      chunksRef.current = []

      const stream = canvas.captureStream(FPS)
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
      recorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
        setIsRecording(false)
      }
      setIsRecording(true)
      recorder.start()
      // Kick off animation playback synced with recording
      startPlayback()
    }

    function stopRecording() {
      const rec = recorderRef.current
      if (rec && rec.state !== 'inactive') rec.stop()
    }

    // bind handlers on ref for buttons
    ;(canvasRef.current).__startPlayback = startPlayback
    ;(canvasRef.current).__startRecording = startRecording

    // Initial render for preview
    drawFrame(0)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handlePlay = () => {
    canvasRef.current?.__startPlayback?.()
  }

  const handleRecord = () => {
    canvasRef.current?.__startRecording?.()
  }

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="relative rounded-xl overflow-hidden border border-blue-500/30 shadow-2xl">
        <canvas
          ref={canvasRef}
          style={{ width: '960px', height: '540px', imageRendering: 'pixelated', background: '#1b6fb8' }}
        />
        <div className="absolute bottom-3 left-3 bg-black/40 text-white text-xs px-2 py-1 rounded">
          {Math.round(progress * 100)}%
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handlePlay} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition">
          Putar Animasi
        </button>
        <button onClick={handleRecord} disabled={isRecording} className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition">
          Rekam & Unduh (WebM)
        </button>
        {downloadUrl && (
          <a href={downloadUrl} download={`zipper-loading-${Date.now()}.webm`} className="px-4 py-2 rounded bg-slate-700 text-white hover:bg-slate-600 transition">
            Unduh Video
          </a>
        )}
      </div>

      <p className="text-blue-200/80 text-sm text-center max-w-2xl">
        Animasi mem-buka resleting dari kiri ke kanan dengan gaya pixel art. Latar biru cerah, resleting putih dan outline hitam. Klik "Rekam & Unduh" untuk menghasilkan file WebM 1920x1080.
      </p>
    </div>
  )
}

function drawPixelRect(ctx, x, y, w, h, fill, outline) {
  // Outline
  ctx.fillStyle = outline
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4)
  // Fill
  ctx.fillStyle = fill
  ctx.fillRect(x, y, w, h)
}
