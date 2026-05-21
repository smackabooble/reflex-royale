import { useState, useEffect, useCallback, useRef } from 'react'
import type { Player, Phase, GameType, ServerMessage, RoundScore } from './types'
import Lobby from './components/Lobby'
import GameRoom from './components/GameRoom'

export interface RoomState {
  phase: Phase
  players: Player[]
  hostId: string
  currentGame: GameType | null
  roundNumber: number
  totalRounds: number
  gameConfig: Record<string, unknown>
  roundScores: RoundScore[]
}

const INITIAL_STATE: RoomState = {
  phase: 'lobby',
  players: [],
  hostId: '',
  currentGame: null,
  roundNumber: 0,
  totalRounds: 10,
  gameConfig: {},
  roundScores: [],
}

export default function App() {
  const [screen, setScreen] = useState<'lobby' | 'room'>('lobby')
  const [myId, setMyId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [state, setState] = useState<RoomState>(INITIAL_STATE)
  const [reconnecting, setReconnecting] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const rejoiningRef = useRef(false)
  const savedRoom = useRef('')
  const savedName = useRef('')
  const savedAvatar = useRef('')

  const sendMessage = useCallback((msg: object) => {
    socketRef.current?.send(JSON.stringify(msg))
  }, [])

  const connect = useCallback((room: string, name: string, avatar: string) => {
    const WS_HOST = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001'
    const socket = new WebSocket(`${WS_HOST}?room=${room}`)
    socketRef.current = socket

    // Persistent ID so score survives reconnects
    let clientId = localStorage.getItem('clientId')
    if (!clientId) { clientId = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); localStorage.setItem('clientId', clientId) }

    socket.addEventListener('open', () => {
      rejoiningRef.current = false
      setReconnecting(false)
      socket.send(JSON.stringify({ type: 'join', name, avatar, clientId }))
      // Keepalive ping every 25s — Render free tier kills idle WS after ~55s
      pingRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }))
        }
      }, 25000)
    })

    socket.addEventListener('message', (ev) => {
      const msg: ServerMessage = JSON.parse(ev.data as string)
      switch (msg.type) {
        case 'room-state':
          if (msg.yourId) setMyId(msg.yourId)
          setState(prev => ({ ...prev, phase: msg.phase, players: msg.players, hostId: msg.hostId }))
          break
        case 'round-countdown':
          setState(prev => ({ ...prev, phase: 'countdown', currentGame: msg.game, roundNumber: msg.roundNumber, totalRounds: msg.totalRounds }))
          break
        case 'round-start':
          setState(prev => ({ ...prev, phase: 'playing', currentGame: msg.game, roundNumber: msg.roundNumber, totalRounds: msg.totalRounds, gameConfig: msg.config }))
          break
        case 'round-end':
          setState(prev => ({ ...prev, phase: 'round-results', players: msg.players, roundScores: msg.roundScores, roundNumber: msg.roundNumber, totalRounds: msg.totalRounds }))
          break
        case 'game-end':
          setState(prev => ({ ...prev, phase: 'finished', players: msg.players }))
          break
        case 'hot-potato-update':
          window.dispatchEvent(new CustomEvent('hp', { detail: msg }))
          break
        case 'hot-potato-explode':
          setState(prev => ({ ...prev, players: msg.players }))
          window.dispatchEvent(new CustomEvent('hp', { detail: msg }))
          break
        case 'player-move':
          window.dispatchEvent(new CustomEvent('move', { detail: msg }))
          break
      }
    })

    socket.addEventListener('close', () => {
      if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null }
      if (rejoiningRef.current) return
      rejoiningRef.current = true
      setReconnecting(true)
      // Auto-reconnect after 2s — preserves room state visually while reconnecting
      setTimeout(() => {
        connect(savedRoom.current, savedName.current, savedAvatar.current)
      }, 2000)
    })
  }, []) // eslint-disable-line

  const handleJoin = useCallback((room: string, name: string, avatar: string) => {
    savedRoom.current = room
    savedName.current = name
    savedAvatar.current = avatar
    setRoomId(room)
    setScreen('room')
    connect(room, name, avatar)
  }, [connect])

  useEffect(() => () => {
    rejoiningRef.current = true // prevent auto-reconnect on intentional unmount
    socketRef.current?.close()
    if (pingRef.current) clearInterval(pingRef.current)
  }, [])

  useEffect(() => {
    const preventKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }
    }
    const preventTouch = (e: TouchEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      e.preventDefault()
    }
    const preventWheel = (e: WheelEvent) => { e.preventDefault() }
    window.addEventListener('keydown', preventKey, { passive: false })
    document.addEventListener('touchmove', preventTouch, { passive: false })
    document.addEventListener('wheel', preventWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', preventKey)
      document.removeEventListener('touchmove', preventTouch)
      document.removeEventListener('wheel', preventWheel)
    }
  }, [])

  if (screen === 'lobby') {
    return <Lobby onJoin={handleJoin} />
  }

  return (
    <>
      {reconnecting && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="text-4xl animate-spin">⚡</div>
          <p className="text-white font-bold text-lg">Reconnecting…</p>
          <p className="text-white/40 text-sm">Connection dropped, rejoining room</p>
        </div>
      )}
      <GameRoom
        myId={myId}
        roomId={roomId}
        state={state}
        onSend={sendMessage}
      />
    </>
  )
}
