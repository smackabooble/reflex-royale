import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'

const PORT = process.env.PORT || 3001
const server = createServer((req, res) => {
  res.writeHead(200)
  res.end('Reflex Royale Server')
})
const wss = new WebSocketServer({ server })

const PLAYER_EMOJIS = ['🦊','🐯','🦁','🐼','🐨','🦋','🐙','🦄','🦈','🐢','🦖','🌈','🔥','⚡','🌊','🎸']
const ALL_GAMES = ['whack-mole','dont-click-red','pure-reaction','simon-says','stroop-effect','odd-one-out','number-rush','memory-grid','hot-potato','math-sprint','the-wire','fastest-typist','dodge','balloon-pop','sheep-counter']
const POINTS_TABLE = [500,300,150,100,75,50,25,10,10,10]
const TOTAL_ROUNDS = 10
const ROUND_TIMEOUT_MS = 35000

const rooms = new Map()

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

function genMath(n) {
  return Array.from({ length: n }, () => {
    const ops = ['+','-','×']
    const op = ops[Math.floor(Math.random() * ops.length)]
    let a, b, answer
    if (op === '+') { a = rand(10,60); b = rand(5,40); answer = a+b }
    else if (op === '-') { a = rand(30,90); b = rand(5,25); answer = a-b }
    else { a = rand(2,12); b = rand(2,12); answer = a*b }
    return { a, b, op, answer }
  })
}

function genSheep(n) {
  const pool = ['🐑','🐺','🐄','🐷','🐔','🦆','🦊','🐻']
  return Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)])
}

function genStroop(n) {
  const colors = ['red','blue','green','yellow']
  return Array.from({ length: n }, () => {
    const word = colors[Math.floor(Math.random() * colors.length)]
    const ink = colors[Math.floor(Math.random() * colors.length)]
    return { word, ink, answer: ink }
  })
}

function buildConfig(game) {
  if (game === 'math-sprint') return { questions: genMath(8) }
  if (game === 'sheep-counter') return { animals: genSheep(22) }
  if (game === 'stroop-effect') return { questions: genStroop(15) }
  if (game === 'simon-says') return { seed: Math.floor(Math.random() * 99999) }
  return {}
}

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      phase: 'lobby',
      players: new Map(),
      hostId: '',
      currentRound: 0,
      gameOrder: [],
      submissions: new Map(),
      totalScores: new Map(),
      roundTimeout: null,
      hotPotato: null,
      sockets: new Map(),
    })
  }
  return rooms.get(roomId)
}

function broadcast(room, msg) {
  const data = JSON.stringify(msg)
  for (const [, ws] of room.sockets) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data)
  }
}

function sendTo(ws, msg) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
}

function broadcastState(room) {
  const phase = room.players.size === 0 ? 'lobby' :
    (room.phase === 'lobby' ? 'waiting' : room.phase)
  broadcast(room, {
    type: 'room-state',
    players: [...room.players.values()],
    hostId: room.hostId,
    phase,
  })
}

function endRound(room) {
  if (room.roundTimeout) clearTimeout(room.roundTimeout)
  room.phase = 'round-results'
  const sorted = [...room.submissions.entries()].sort(([,a],[,b]) => b - a)
  const roundScores = []
  for (let i = 0; i < sorted.length; i++) {
    const [id, raw] = sorted[i]
    const pts = POINTS_TABLE[Math.min(i, POINTS_TABLE.length - 1)]
    const cur = room.totalScores.get(id) ?? 0
    room.totalScores.set(id, cur + pts)
    const p = room.players.get(id)
    if (p) p.score = cur + pts
    roundScores.push({ playerId: id, rawScore: raw, points: pts })
  }
  for (const [id, p] of room.players) {
    if (!room.submissions.has(id)) {
      const pts = POINTS_TABLE[POINTS_TABLE.length - 1]
      const cur = room.totalScores.get(id) ?? 0
      room.totalScores.set(id, cur + pts)
      p.score = cur + pts
      roundScores.push({ playerId: id, rawScore: 0, points: pts })
    }
  }
  broadcast(room, { type: 'round-end', roundScores, players: [...room.players.values()], roundNumber: room.currentRound, totalRounds: TOTAL_ROUNDS })
  setTimeout(() => nextRound(room), 6000)
}

function checkComplete(room) {
  if (room.submissions.size >= room.players.size) {
    if (room.roundTimeout) clearTimeout(room.roundTimeout)
    endRound(room)
  }
}

function scheduleBomb(room) {
  const hp = room.hotPotato
  if (!hp) return
  const delay = rand(3000, 8000)
  hp.explodeTimer = setTimeout(() => {
    if (!room.hotPotato) return
    const loser = room.hotPotato.holderId
    const cur = room.submissions.get(loser) ?? 300
    room.submissions.set(loser, Math.max(0, cur - 150))
    room.hotPotato.bombCount++
    const bombsLeft = 3 - room.hotPotato.bombCount
    broadcast(room, { type: 'hot-potato-explode', loserId: loser, players: [...room.players.values()], bombsLeft })
    if (room.hotPotato.bombCount >= 3) { setTimeout(() => endRound(room), 2500); return }
    const ids = [...room.players.keys()]
    const newHolder = ids[Math.floor(Math.random() * ids.length)]
    room.hotPotato.holderId = newHolder
    setTimeout(() => {
      broadcast(room, { type: 'hot-potato-update', holderId: newHolder })
      scheduleBomb(room)
    }, 2000)
  }, delay)
}

function nextRound(room) {
  room.currentRound++
  if (room.currentRound > TOTAL_ROUNDS) {
    room.phase = 'finished'
    broadcast(room, { type: 'game-end', players: [...room.players.values()].sort((a,b) => b.score - a.score) })
    return
  }
  const game = room.gameOrder[room.currentRound - 1]
  room.phase = 'countdown'
  room.submissions = new Map()
  broadcast(room, { type: 'round-countdown', game, roundNumber: room.currentRound, totalRounds: TOTAL_ROUNDS })
  setTimeout(() => {
    room.phase = 'playing'
    broadcast(room, { type: 'round-start', game, roundNumber: room.currentRound, totalRounds: TOTAL_ROUNDS, config: buildConfig(game) })
    if (game === 'hot-potato') {
      const ids = [...room.players.keys()]
      const holder = ids[Math.floor(Math.random() * ids.length)]
      room.hotPotato = { holderId: holder, bombCount: 0, explodeTimer: null }
      for (const id of ids) room.submissions.set(id, 300)
      broadcast(room, { type: 'hot-potato-update', holderId: holder })
      scheduleBomb(room)
    } else {
      room.roundTimeout = setTimeout(() => endRound(room), ROUND_TIMEOUT_MS)
    }
  }, 3500)
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost')
  const roomId = url.searchParams.get('room') || url.pathname.split('/').pop() || 'default'
  const connId = Math.random().toString(36).slice(2)
  ws.connId = connId

  const room = getRoom(roomId)
  room.sockets.set(connId, ws)

  sendTo(ws, { type: 'room-state', players: [...room.players.values()], hostId: room.hostId, phase: room.phase, yourId: connId })

  ws.on('message', (data) => {
    let msg
    try { msg = JSON.parse(data.toString()) } catch { return }

    if (msg.type === 'join') {
      const name = (msg.name || 'Player').slice(0, 20).trim()
      const isFirst = room.players.size === 0
      const emoji = PLAYER_EMOJIS[room.players.size % PLAYER_EMOJIS.length]
      const player = { id: connId, name, score: room.totalScores.get(connId) ?? 0, emoji, isHost: isFirst }
      if (isFirst) room.hostId = connId
      room.players.set(connId, player)
      if (!room.totalScores.has(connId)) room.totalScores.set(connId, 0)
      broadcastState(room)

    } else if (msg.type === 'start') {
      if (connId !== room.hostId || room.players.size < 2) return
      if (room.phase !== 'waiting' && room.phase !== 'lobby') return
      const shuffled = [...ALL_GAMES].sort(() => Math.random() - 0.5)
      room.gameOrder = shuffled.slice(0, TOTAL_ROUNDS)
      room.currentRound = 0
      for (const [id, p] of room.players) { room.totalScores.set(id, 0); p.score = 0 }
      nextRound(room)

    } else if (msg.type === 'submit') {
      if (room.phase !== 'playing') return
      const game = room.gameOrder[room.currentRound - 1]
      if (game === 'hot-potato') return
      if (!room.submissions.has(connId)) { room.submissions.set(connId, msg.score); checkComplete(room) }

    } else if (msg.type === 'hot-potato-pass') {
      const hp = room.hotPotato
      if (!hp || hp.holderId !== connId) return
      const others = [...room.players.keys()].filter(id => id !== connId)
      if (!others.length) return
      hp.holderId = others[Math.floor(Math.random() * others.length)]
      broadcast(room, { type: 'hot-potato-update', holderId: hp.holderId })
    }
  })

  ws.on('close', () => {
    room.sockets.delete(connId)
    room.players.delete(connId)
    if (room.hostId === connId) {
      const next = room.players.keys().next().value
      if (next) { room.hostId = next; const p = room.players.get(next); if (p) p.isHost = true }
    }
    broadcastState(room)
    if (room.sockets.size === 0) rooms.delete(roomId)
    else if (room.phase === 'playing') checkComplete(room)
  })
})

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
