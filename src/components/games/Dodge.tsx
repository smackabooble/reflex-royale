import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

interface Circle { id: number; x: number; y: number; vx: number; vy: number; r: number }

const DURATION = 15
const PLAYER_R = 18
let cid = 0

export default function Dodge({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerPos = useRef({ x: 150, y: 200 })
  const circles = useRef<Circle[]>([])
  const alive = useRef(true)
  const startTime = useRef(Date.now())
  const lastSpawn = useRef(Date.now())
  const done = useRef(false)
  const rafId = useRef(0)
  const [survived, setSurvived] = useState(0)
  const [dead, setDead] = useState(false)

  const finish = useCallback((score: number) => {
    if (done.current) return
    done.current = true
    cancelAnimationFrame(rafId.current)
    onComplete(score)
  }, [onComplete])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = Math.min(window.innerWidth - 32, 400)
      canvas.height = Math.min(window.innerHeight - 200, 500)
      playerPos.current = { x: canvas.width / 2, y: canvas.height / 2 }
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      playerPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
    canvas.addEventListener('pointermove', onMove)

    const spawnCircle = () => {
      const w = canvas.width, h = canvas.height
      const side = Math.floor(Math.random() * 4)
      let x: number, y: number
      if (side === 0) { x = Math.random() * w; y = -30 }
      else if (side === 1) { x = w + 30; y = Math.random() * h }
      else if (side === 2) { x = Math.random() * w; y = h + 30 }
      else { x = -30; y = Math.random() * h }
      const px = playerPos.current.x, py = playerPos.current.y
      const dx = px - x, dy = py - y
      const dist = Math.sqrt(dx*dx + dy*dy)
      const speed = 1.5 + Math.random() * 2
      circles.current.push({ id: cid++, x, y, vx: (dx/dist)*speed, vy: (dy/dist)*speed, r: 15 + Math.random() * 15 })
    }

    const loop = () => {
      if (!alive.current) return
      const now = Date.now()
      const elapsed = (now - startTime.current) / 1000

      if (elapsed >= DURATION) {
        alive.current = false
        const score = Math.round(elapsed * 50)
        setSurvived(Math.round(elapsed * 10) / 10)
        setTimeout(() => finish(score), 1000)
        return
      }

      setSurvived(Math.round(elapsed * 10) / 10)

      if (now - lastSpawn.current > Math.max(600, 1400 - elapsed * 60)) {
        spawnCircle()
        lastSpawn.current = now
      }

      const px = playerPos.current.x, py = playerPos.current.y

      for (const c of circles.current) {
        c.x += c.vx; c.y += c.vy
        const dx = px - c.x, dy = py - c.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist < PLAYER_R + c.r - 4) {
          alive.current = false
          setDead(true)
          const score = Math.round(elapsed * 50)
          setTimeout(() => finish(score), 1500)
          return
        }
      }

      circles.current = circles.current.filter(c =>
        c.x > -100 && c.x < canvas.width + 100 &&
        c.y > -100 && c.y < canvas.height + 100
      )

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#0f0f1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const c of circles.current) {
        ctx.beginPath()
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(239,68,68,0.7)`
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(px, py, PLAYER_R, 0, Math.PI * 2)
      ctx.fillStyle = '#facc15'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(px, py, PLAYER_R - 5, 0, Math.PI * 2)
      ctx.fillStyle = '#fef08a'
      ctx.fill()

      const barW = ((DURATION - elapsed) / DURATION) * canvas.width
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(0, 0, canvas.width, 4)
      ctx.fillStyle = '#4ade80'
      ctx.fillRect(0, 0, barW, 4)

      rafId.current = requestAnimationFrame(loop)
    }

    rafId.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafId.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointermove', onMove)
    }
  }, [finish])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full flex flex-col items-center">
        <div className="flex justify-between w-full max-w-sm mb-2 px-1">
          <span className="text-yellow-400 font-bold">{survived}s survived</span>
          {dead && <span className="text-red-400 font-bold shake">💥 Hit!</span>}
        </div>
        <canvas
          ref={canvasRef}
          className="rounded-2xl border border-white/10 touch-none"
          style={{ cursor: 'none' }}
        />
        <p className="text-white/30 text-xs mt-2">Move your cursor/finger to dodge!</p>
      </div>
    </div>
  )
}
