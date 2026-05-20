import { useState, useEffect, useCallback, useRef } from 'react'
import PartySocket from 'partysocket'
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

  const handleJoin = useCallback((room: string, name: string) => {
    const socket = new PartySocket({
      host: process.env.PARTYKIT_HOST ?? 'localhost:1999',
      room,
    })
    socketRef.current = socket
    setRoomId(room)
    setMyId(socket.id)
    setScreen('room')

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ type: 'join', name }))
    })

    socket.addEventListener('message', (ev) => {
      const msg: ServerMessage = JSON.parse(ev.data as string)
      switch (msg.type) {
        case 'room-state':
          setMyId(socket.id)
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
      }
    })

    socket.addEventListener('close', () => {
      setState(prev => ({ ...prev, phase: 'waiting' }))
    })
  }, [])

  useEffect(() => () => { socketRef.current?.close() }, [])

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
