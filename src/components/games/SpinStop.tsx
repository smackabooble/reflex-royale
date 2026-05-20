import { useEffect, useRef, useCallback, useState } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string; players: Player[]; onSend: (msg: object) => void
}

const ROUNDS = 5, DURATION = 25

export default function SpinStop({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const done = useRef(false)
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [feedback, setFeedback] = useState('')
  const angleRef = useRef(0)
  const speedRef = useRef(3 + Math.random() * 2)
  const animRef = useRef(0)
  const roundRef = useRef(1)
  const scoreRef = useRef(0)
  const stopped = useRef(false)

  const finish = useCallback((s: number) => { if (done.current) return; done.current = true; onComplete(s) }, [onComplete])

  useEffect(() => {
    if (timeLeft === 0) { finish(scoreRef.current); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, finish])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const cx = canvas.width / 2, cy = canvas.height / 2, r = 100

    const draw = () => {
      if (!stopped.current) angleRef.current = (angleRef.current + speedRef.current * Math.PI / 180) % (Math.PI * 2)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Target zone (green arc from -30° to 30°)
      const targetStart = -Math.PI / 6, targetEnd = Math.PI / 6
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, targetStart, targetEnd)
      ctx.closePath()
      ctx.fillStyle = 'rgba(74,222,128,0.3)'
      ctx.fill()
      ctx.strokeStyle = '#4ade80'
      ctx.lineWidth = 2
      ctx.stroke()

      // Spinner needle
      const nx = cx + r * Math.cos(angleRef.current)
      const ny = cy + r * Math.sin(angleRef.current)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(nx, ny)
      ctx.strokeStyle = '#facc15'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(nx, ny, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#facc15'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(cx, cy, 8, 0, Math.PI * 2)
      ctx.fillStyle = 'white'
      ctx.fill()

      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const stop = () => {
    if (done.current || stopped.current) return
    stopped.current = true
    const a = ((angleRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const normalized = a > Math.PI ? a - Math.PI * 2 : a
    const inZone = Math.abs(normalized) < Math.PI / 6
    const accuracy = inZone ? Math.max(0, 1 - Math.abs(normalized) / (Math.PI / 6)) : 0
    const pts = Math.round(accuracy * 200)
    scoreRef.current += pts; setScore(scoreRef.current)
    setFeedback(inZone ? `+${pts} 🎯 ${pts > 150 ? 'Perfect!' : 'Nice!'}` : 'Missed! 😬')
    setTimeout(() => {
      stopped.current = false
      setFeedback('')
      speedRef.current = 3 + Math.random() * 3 + roundRef.current * 0.5
      const next = roundRef.current + 1
      roundRef.current = next; setRound(next)
      if (next > ROUNDS) { finish(scoreRef.current) }
    }, 1000)
  }

  const pct = (timeLeft / DURATION) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs text-center">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>
        <p className="text-white/40 text-sm mb-4">Round {round} / {ROUNDS}</p>
        <canvas ref={canvasRef} width={260} height={260} className="mx-auto rounded-full" />
        {feedback && <p className="text-xl font-black mt-3 text-yellow-400">{feedback}</p>}
        <button onPointerDown={stop}
          className="mt-5 w-full py-4 bg-gradient-to-r from-cyan-400 to-teal-500 text-black font-black text-xl rounded-xl transition active:scale-95">
          STOP!
        </button>
        <p className="text-white/30 text-xs mt-3">Stop the needle in the 🟢 green zone!</p>
      </div>
    </div>
  )
}
