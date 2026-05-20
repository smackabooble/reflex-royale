import { useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string; players: Player[]; onSend: (msg: object) => void
}

const COLS = 16, ROWS = 16, CELL = 20, DURATION = 20

type Dir = [number, number]

export default function Snake({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const done = useRef(false)
  const finish = useCallback((s: number) => { if (done.current) return; done.current = true; onComplete(s) }, [onComplete])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }]
    let dir: Dir = [1, 0], nextDir: Dir = [1, 0]
    let food = { x: 4, y: 4 }
    let score = 0
    let timeLeft = DURATION
    let animId: number

    const placeFood = () => {
      do { food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
      } while (snake.some(s => s.x === food.x && s.y === food.y))
    }
    placeFood()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') { if (dir[1] !== 1) nextDir = [0, -1] }
      else if (e.key === 'ArrowDown' || e.key === 's') { if (dir[1] !== -1) nextDir = [0, 1] }
      else if (e.key === 'ArrowLeft' || e.key === 'a') { if (dir[0] !== 1) nextDir = [-1, 0] }
      else if (e.key === 'ArrowRight' || e.key === 'd') { if (dir[0] !== -1) nextDir = [1, 0] }
    }
    window.addEventListener('keydown', onKey)

    const timer = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - 1)
      if (timeLeft === 0) { clearInterval(timer); clearInterval(loop); finish(score) }
    }, 1000)

    const loop = setInterval(() => {
      if (done.current) return
      dir = nextDir
      const head = { x: (snake[0].x + dir[0] + COLS) % COLS, y: (snake[0].y + dir[1] + ROWS) % ROWS }
      if (snake.some(s => s.x === head.x && s.y === head.y)) { clearInterval(loop); clearInterval(timer); finish(score); return }
      snake = [head, ...snake]
      if (head.x === food.x && head.y === food.y) { score += 100; placeFood() } else { snake.pop() }

      ctx.fillStyle = '#0f0f0f'
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)
      ctx.fillStyle = '#facc15'
      ctx.font = '14px serif'
      ctx.fillText('🍎', food.x * CELL + 2, food.y * CELL + 16)
      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? '#4ade80' : `hsl(${140 - i * 3},70%,${50 - i}%)`
        ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2)
      })
      ctx.fillStyle = 'white'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(`🪙 ${score}`, 4, 15)
      ctx.fillText(`⏱ ${timeLeft}s`, COLS * CELL - 50, 15)
      const pct = timeLeft / DURATION
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(0, 0, COLS * CELL, 4)
      ctx.fillStyle = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#facc15' : '#f87171'
      ctx.fillRect(0, 0, COLS * CELL * pct, 4)
    }, 150)

    return () => { clearInterval(loop); clearInterval(timer); window.removeEventListener('keydown', onKey) }
  }, [finish])

  const swipe = (dx: number, dy: number) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: dx > 0 ? 'ArrowRight' : dx < 0 ? 'ArrowLeft' : dy > 0 ? 'ArrowDown' : 'ArrowUp' }))
  }
  let touch = { x: 0, y: 0 }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL}
        className="rounded-2xl border border-white/10"
        onTouchStart={e => { touch = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
        onTouchEnd={e => { const dx = e.changedTouches[0].clientX - touch.x; const dy = e.changedTouches[0].clientY - touch.y; Math.abs(dx) > Math.abs(dy) ? swipe(dx, 0) : swipe(0, dy) }}
      />
      <p className="text-white/30 text-xs mt-3">Arrow keys / WASD · eat 🍎 · avoid yourself!</p>
    </div>
  )
}
