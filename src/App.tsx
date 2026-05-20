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
  const socketRef = useRef<PartySocket | null>(null)

  const sendMessage = useCallback((msg: object) => {
    socketRef.current?.send(JSON.stringify(msg))
  }, [])

  const handleJoin = useCallback((room: string, name: string, avatar: string) => {
    const WS_HOST = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001'
    const connId = Math.random().toString(36).slice(2)
    const socket = new WebSocket(`${WS_HOST}?room=${room}`)
    ;(socket as any).id = connId
    socketRef.current = socket as any
    setRoomId(room)
    setMyId(connId)
    setScreen('room')

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ type: 'join', name, avatar }))
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
      setState(prev => ({ ...prev, phase: 'waiting' }))
    })
  }, []) // eslint-disable-line

  useEffect(() => () => { socketRef.current?.close() }, [])

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
    window.addEventListener('keydown', preventKey, { passive: false })
    document.addEventListener('touchmove', preventTouch, { passive: false })
    return () => {
      window.removeEventListener('keydown', preventKey)
      document.removeEventListener('touchmove', preventTouch)
    }
  }, [])

  if (screen === 'lobby') {
    return <Lobby onJoin={handleJoin} />
  }

  return (
    <GameRoom
      myId={myId}
      roomId={roomId}
      state={state}
      onSend={sendMessage}
    />
  )
}
