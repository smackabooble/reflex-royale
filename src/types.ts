export type GameType =
  | 'whack-mole'
  | 'dont-click-red'
  | 'pure-reaction'
  | 'simon-says'
  | 'stroop-effect'
  | 'odd-one-out'
  | 'number-rush'
  | 'memory-grid'
  | 'hot-potato'
  | 'math-sprint'
  | 'the-wire'
  | 'fastest-typist'
  | 'dodge'
  | 'balloon-pop'
  | 'sheep-counter'

export interface Player {
  id: string
  name: string
  score: number
  emoji: string
  isHost: boolean
}

export type Phase =
  | 'lobby'
  | 'waiting'
  | 'countdown'
  | 'playing'
  | 'round-results'
  | 'finished'

export interface RoundScore {
  playerId: string
  rawScore: number
  points: number
}

export const GAME_NAMES: Record<GameType, string> = {
  'whack-mole': '🔨 Whack-a-Mole',
  'dont-click-red': '🚫 Don\'t Click Red',
  'pure-reaction': '⚡ Pure Reaction',
  'simon-says': '🎨 Simon Says',
  'stroop-effect': '🧠 Stroop Effect',
  'odd-one-out': '🔍 Odd One Out',
  'number-rush': '🔢 Number Rush',
  'memory-grid': '💡 Memory Grid',
  'hot-potato': '🥔 Hot Potato',
  'math-sprint': '➕ Math Sprint',
  'the-wire': '🎯 The Wire',
  'fastest-typist': '⌨️ Fastest Typist',
  'dodge': '💨 Dodge!',
  'balloon-pop': '🎈 Balloon Pop',
  'sheep-counter': '🐑 Sheep Counter',
}

export const GAME_DESCRIPTIONS: Record<GameType, string> = {
  'whack-mole': 'Smash moles as fast as they appear!',
  'dont-click-red': 'Click green & blue — but NEVER red!',
  'pure-reaction': 'Click the INSTANT the screen turns green!',
  'simon-says': 'Remember and repeat the color pattern!',
  'stroop-effect': 'Click the COLOR of the text, not the word!',
  'odd-one-out': 'Find the one that doesn\'t belong!',
  'number-rush': 'Click numbers 1→15 in order as fast as you can!',
  'memory-grid': 'Memorize the lit tiles, then recreate them!',
  'hot-potato': 'Pass it quick before it blows!',
  'math-sprint': 'Solve equations faster than everyone else!',
  'the-wire': 'Stop the bar as close to the target as possible!',
  'fastest-typist': 'Type the phrase fast and accurately!',
  'dodge': 'Dodge the incoming circles with your cursor!',
  'balloon-pop': 'Pop as many balloons as you can!',
  'sheep-counter': 'Count only the sheep in the herd!',
}

// Server → Client
export type ServerMessage =
  | { type: 'room-state'; players: Player[]; hostId: string; phase: Phase; yourId?: string }
  | { type: 'round-countdown'; game: GameType; roundNumber: number; totalRounds: number }
  | { type: 'round-start'; game: GameType; roundNumber: number; totalRounds: number; config: Record<string, unknown> }
  | { type: 'round-end'; roundScores: RoundScore[]; players: Player[]; roundNumber: number; totalRounds: number }
  | { type: 'game-end'; players: Player[] }
  | { type: 'hot-potato-update'; holderId: string }
  | { type: 'hot-potato-explode'; loserId: string; players: Player[]; bombsLeft: number }
  | { type: 'error'; message: string }

// Client → Server
export type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'start' }
  | { type: 'submit'; score: number }
  | { type: 'hot-potato-pass' }
