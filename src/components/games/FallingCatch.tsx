import { useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

const W = 340, H = 480, BASKET_W = 60, DURATION = 20

export default function FallingCatch({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const done = useRef(false)
  const score = useRef(0)
  const timeLeft = useRef(DURATION)
  const basketX = useRef(W / 2 - BASKET_W / 2)
  const items = useRef<{ x: number; y: number; type: '⭐' | '💣'; speed: number }[]>([])
  const keys = useRef<Set<string>>(new Set())
  const pointer = useRef<number | null>(null)

  const finish = useCallback((s: number) => {
    if (done.current) return
    done.current = true
    onComplete(Math.max(0, s))
  }, [onComplete])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let animId: number
    let lastSpawn = 0
    let lastTick = Date.now()

    const onKey = (e: KeyboardEvent) => keys.current.add(e.key)
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.key)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onUp)

    const timer = setInterval(() => {
      timeLeft.current = Math.max(0, timeLeft.current - 1)
      if (timeLeft.current === 0) { clearInterval(timer); finish(score.current) }
    }, 1000)

    function loop(ts: number) {
      if (done.current) return
      const dt = Math.min(ts - lastTick, 50)
      lastTick = ts

      if (pointer.current !== null) {
        basketX.current = Math.max(0, Math.min(W - BASKET_W, pointer.current - BASKET_W / 2))
      }
      if (keys.current.has('ArrowLeft') || keys.current.has('a')) basketX.current = Math.max(0, basketX.current - 6)
      if (keys.current.has('ArrowRight') || keys.current.has('d')) basketX.current = Math.min(W - BASKET_W, basketX.current + 6)

      if (ts - lastSpawn > Math.max(600, 1200 - (DURATION - timeLeft.current) * 30)) {
        lastSpawn = ts
        const type = Math.random() < 0.7 ? '⭐' : '💣'
        items.current.push({ x: Math.random() * (W - 30) + 15, y: -30, type, speed: 2 + Math.random() * 2 })
      }

      items.current.forEach(it => { it.y += it.speed * dt / 16 })

      const bx = basketX.current, by = H - 50
      items.current = items.current.filter(it => {
        if (it.y > H) return false
        if (it.y + 20 >= by && it.x > bx - 10 && it.x < bx + BASKET_W + 10) {
          if (it.type === '⭐') score.current += 100
          else score.current -= 150
          return false
        }
        return true
      })

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(255,255,255,0.03)'
      ctx.fillRect(0, 0, W, H)

      items.current.forEach(it => {
        ctx.font = '28px serif'
        ctx.fillText(it.type, it.x - 14, it.y + 14)
      })

      ctx.fillStyle = '#facc15'
      ctx.beginPath()
      ctx.roundRect(bx, by, BASKET_W, 20, 6)
      ctx.fill()

      ctx.fillStyle = 'white'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText(`🪙 ${Math.max(0, score.current)}`, 10, 28)
      ctx.fillText(`⏱ ${timeLeft.current}s`, W - 70, 28)

      const pct = timeLeft.current / DURATION
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.fillRect(0, 0, W, 6)
      ctx.fillStyle = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#facc15' : '#f87171'
      ctx.fillRect(0, 0, W * pct, 6)

      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animId)
      clearInterval(timer)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onUp)
    }
  }, [finish])

  const onPointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    pointer.current = e.clientX - rect.left
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-2xl border border-white/10 touch-none"
        onPointerMove={onPointerMove}
        onPointerLeave={() => { pointer.current = null }}
      />
      <p className="text-white/30 text-xs mt-3">Move basket with mouse/touch · ⭐ +100 · 💣 -150</p>
    </div>
  )
}
