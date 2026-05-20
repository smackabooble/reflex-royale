import type * as Party from 'partykit/server'
import type { ClientMessage, ServerMessage, Player, GameType, Phase, RoundScore } from '../src/types'

const PLAYER_EMOJIS = ['🦊','🐯','🦁','🐼','🐨','🦋','🐙','🦄','🦈','🐢','🦖','🌈','🔥','⚡','🌊','🎸']

const ALL_GAMES: GameType[] = [
  'whack-mole','dont-click-red','pure-reaction','simon-says',
  'stroop-effect','odd-one-out','number-rush','memory-grid',
  'hot-potato','math-sprint','the-wire','fastest-typist',
  'dodge','balloon-pop','sheep-counter',
]

const POINTS_TABLE = [500, 300, 150, 100, 75, 50, 25, 10, 10, 10]
const TOTAL_ROUNDS = 10
const ROUND_TIMEOUT_MS = 35_000

interface HotPotatoState {
  holderId: string
  bombCount: number
  explodeTimer: ReturnType<typeof setTimeout> | null
}

interface RoomState {
  phase: Phase
  players: Map<string, Player>
  hostId: string
  currentRound: number
  gameOrder: GameType[]
  submissions: Map<string, number>
  totalScores: Map<string, number>
  roundTimeout: ReturnType<typeof setTimeout> | null
  hotPotato: HotPotatoState | null
}

export default class ReflexRoyale implements Party.Server {
  room: Party.Room
  state: RoomState

  constructor(room: Party.Room) {
    this.room = room
    this.state = {
      phase: 'lobby',
      players: new Map(),
      hostId: '',
      currentRound: 0,
      gameOrder: [],
      submissions: new Map(),
      totalScores: new Map(),
      roundTimeout: null,
      hotPotato: null,
    }
  }

  onConnect(conn: Party.Connection) {
    this.sendTo(conn, {
      type: 'room-state',
      players: [...this.state.players.values()],
      hostId: this.state.hostId,
      phase: this.state.phase,
    })
  }

  onMessage(raw: string, sender: Party.Connection) {
    const msg: ClientMessage = JSON.parse(raw)
    if (msg.type === 'join') this.onJoin(sender, msg.name)
    else if (msg.type === 'start') this.onStart(sender)
    else if (msg.type === 'submit') this.onSubmit(sender, msg.score)
    else if (msg.type === 'hot-potato-pass') this.onPass(sender)
  }

  onClose(conn: Party.Connection) {
    this.state.players.delete(conn.id)
    if (this.state.hostId === conn.id) {
      const next = this.state.players.keys().next().value
      if (next) {
        this.state.hostId = next
        const p = this.state.players.get(next)
        if (p) p.isHost = true
      }
    }
    this.broadcastState()
    if (this.state.phase === 'playing') this.checkComplete()
  }

  onJoin(conn: Party.Connection, rawName: string) {
    const name = rawName.slice(0, 20).trim() || 'Player'
    const isFirst = this.state.players.size === 0
    const emoji = PLAYER_EMOJIS[this.state.players.size % PLAYER_EMOJIS.length]
    const player: Player = {
      id: conn.id,
      name,
      score: this.state.totalScores.get(conn.id) ?? 0,
      emoji,
      isHost: isFirst,
    }
    if (isFirst) this.state.hostId = conn.id
    this.state.players.set(conn.id, player)
    if (!this.state.totalScores.has(conn.id)) this.state.totalScores.set(conn.id, 0)
    this.broadcastState()
  }

  onStart(sender: Party.Connection) {
    if (sender.id !== this.state.hostId) return
    if (this.state.players.size < 2) return
    if (this.state.phase !== 'waiting' && this.state.phase !== 'lobby') return

    const shuffled = [...ALL_GAMES].sort(() => Math.random() - 0.5)
    this.state.gameOrder = shuffled.slice(0, TOTAL_ROUNDS)
    this.state.currentRound = 0
    for (const [id, p] of this.state.players) {
      this.state.totalScores.set(id, 0)
      p.score = 0
    }
    this.nextRound()
  }

  onSubmit(sender: Party.Connection, score: number) {
    if (this.state.phase !== 'playing') return
    const game = this.state.gameOrder[this.state.currentRound - 1]
    if (game === 'hot-potato') return
    if (!this.state.submissions.has(sender.id)) {
      this.state.submissions.set(sender.id, score)
      this.checkComplete()
    }
  }

  onPass(sender: Party.Connection) {
    const hp = this.state.hotPotato
    if (!hp || hp.holderId !== sender.id) return
    const others = [...this.state.players.keys()].filter(id => id !== sender.id)
    if (!others.length) return
    hp.holderId = others[Math.floor(Math.random() * others.length)]
    this.broadcast({ type: 'hot-potato-update', holderId: hp.holderId })
  }

  checkComplete() {
    if (this.state.submissions.size >= this.state.players.size) {
      if (this.state.roundTimeout) clearTimeout(this.state.roundTimeout)
      this.endRound()
    }
  }

  nextRound() {
    this.state.currentRound++
    if (this.state.currentRound > TOTAL_ROUNDS) { this.endGame(); return }

    const game = this.state.gameOrder[this.state.currentRound - 1]
    this.state.phase = 'countdown'
    this.state.submissions = new Map()

    this.broadcast({
      type: 'round-countdown',
      game,
      roundNumber: this.state.currentRound,
      totalRounds: TOTAL_ROUNDS,
    })

    setTimeout(() => {
      this.state.phase = 'playing'
      this.broadcast({
        type: 'round-start',
        game,
        roundNumber: this.state.currentRound,
        totalRounds: TOTAL_ROUNDS,
        config: this.buildConfig(game),
      })

      if (game === 'hot-potato') {
        this.runHotPotato()
      } else {
        this.state.roundTimeout = setTimeout(() => this.endRound(), ROUND_TIMEOUT_MS)
      }
    }, 3500)
  }

  buildConfig(game: GameType): Record<string, unknown> {
    if (game === 'math-sprint') return { questions: this.genMath(8) }
    if (game === 'sheep-counter') return { animals: this.genSheep(22) }
    if (game === 'stroop-effect') return { questions: this.genStroop(15) }
    if (game === 'simon-says') return { seed: Math.floor(Math.random() * 99999) }
    return {}
  }

  genMath(n: number) {
    return Array.from({ length: n }, () => {
      const ops = ['+','-','×']
      const op = ops[Math.floor(Math.random() * ops.length)]
      let a: number, b: number, answer: number
      if (op === '+') { a = rand(10,60); b = rand(5,40); answer = a+b }
      else if (op === '-') { a = rand(30,90); b = rand(5,25); answer = a-b }
      else { a = rand(2,12); b = rand(2,12); answer = a*b }
      return { a, b, op, answer }
    })
  }

  genSheep(n: number) {
    const pool = ['🐑','🐺','🐄','🐷','🐔','🦆','🦊','🐻']
    return Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)])
  }

  genStroop(n: number) {
    const colors = ['red','blue','green','yellow']
    return Array.from({ length: n }, () => {
      const word = colors[Math.floor(Math.random() * colors.length)]
      const ink = colors[Math.floor(Math.random() * colors.length)]
      return { word, ink, answer: ink }
    })
  }

  runHotPotato() {
    const ids = [...this.state.players.keys()]
    const holder = ids[Math.floor(Math.random() * ids.length)]
    this.state.hotPotato = { holderId: holder, bombCount: 0, explodeTimer: null }
    for (const id of ids) this.state.submissions.set(id, 300)
    this.broadcast({ type: 'hot-potato-update', holderId: holder })
    this.scheduleBomb()
  }

  scheduleBomb() {
    const hp = this.state.hotPotato
    if (!hp) return
    const delay = rand(3000, 8000)
    hp.explodeTimer = setTimeout(() => {
      if (!this.state.hotPotato) return
      const loser = this.state.hotPotato.holderId
      const cur = this.state.submissions.get(loser) ?? 300
      this.state.submissions.set(loser, Math.max(0, cur - 150))
      this.state.hotPotato.bombCount++
      const bombsLeft = 3 - this.state.hotPotato.bombCount

      const players = [...this.state.players.values()].map(p => ({ ...p, score: this.state.totalScores.get(p.id) ?? 0 }))
      this.broadcast({ type: 'hot-potato-explode', loserId: loser, players, bombsLeft })

      if (this.state.hotPotato.bombCount >= 3) {
        setTimeout(() => this.endRound(), 2500)
        return
      }

      const ids = [...this.state.players.keys()]
      const newHolder = ids[Math.floor(Math.random() * ids.length)]
      this.state.hotPotato.holderId = newHolder
      setTimeout(() => {
        this.broadcast({ type: 'hot-potato-update', holderId: newHolder })
        this.scheduleBomb()
      }, 2000)
    }, delay)
  }

  endRound() {
    if (this.state.roundTimeout) clearTimeout(this.state.roundTimeout)
    this.state.phase = 'round-results'

    const sorted = [...this.state.submissions.entries()].sort(([,a],[,b]) => b - a)
    const roundScores: RoundScore[] = []

    for (let i = 0; i < sorted.length; i++) {
      const [id, raw] = sorted[i]
      const pts = POINTS_TABLE[Math.min(i, POINTS_TABLE.length - 1)]
      const cur = this.state.totalScores.get(id) ?? 0
      this.state.totalScores.set(id, cur + pts)
      const p = this.state.players.get(id)
      if (p) p.score = cur + pts
      roundScores.push({ playerId: id, rawScore: raw, points: pts })
    }

    for (const [id, p] of this.state.players) {
      if (!this.state.submissions.has(id)) {
        const pts = POINTS_TABLE[POINTS_TABLE.length - 1]
        const cur = this.state.totalScores.get(id) ?? 0
        this.state.totalScores.set(id, cur + pts)
        p.score = cur + pts
        roundScores.push({ playerId: id, rawScore: 0, points: pts })
      }
    }

    this.broadcast({
      type: 'round-end',
      roundScores,
      players: [...this.state.players.values()],
      roundNumber: this.state.currentRound,
      totalRounds: TOTAL_ROUNDS,
    })

    setTimeout(() => this.nextRound(), 6000)
  }

  endGame() {
    this.state.phase = 'finished'
    const players = [...this.state.players.values()].sort((a,b) => b.score - a.score)
    this.broadcast({ type: 'game-end', players })
  }

  broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg))
  }

  sendTo(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg))
  }

  broadcastState() {
    const phase = this.state.players.size === 0 ? 'lobby' as Phase :
      (this.state.phase === 'lobby' ? 'waiting' as Phase : this.state.phase)
    this.broadcast({
      type: 'room-state',
      players: [...this.state.players.values()],
      hostId: this.state.hostId,
      phase,
    })
  }
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
