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
  | 'coin-rush'
  | 'word-scramble'
  | 'falling-catch'
  | 'speed-trivia'
  | 'color-tap'
  | 'tile-flip'
  | 'rapid-tap'
  | 'emoji-decode'
  | 'math-chain'
  | 'pattern-copy'
  | 'snake'
  | 'target-shoot'
  | 'rps-duel'
  | 'password-memory'
  | 'spin-stop'
  | 'emoji-sort'
  | 'color-memory'
  | 'number-memory'
  | 'finger-race'
  | 'reaction-color'

export interface Player {
  id: string
  name: string
  score: number
  emoji: string
  isHost: boolean
  avatar?: string
  border?: string
  title?: string
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
  'coin-rush': '🪙 Coin Rush',
  'word-scramble': '🔀 Word Scramble',
  'falling-catch': '⭐ Falling Catch',
  'speed-trivia': '🧩 Speed Trivia',
  'color-tap': '🎨 Color Tap',
  'tile-flip': '🃏 Tile Flip',
  'rapid-tap': '👆 Rapid Tap',
  'emoji-decode': '🤔 Emoji Decode',
  'math-chain': '🔗 Math Chain',
  'pattern-copy': '📋 Pattern Copy',
  'snake': '🐍 Snake',
  'target-shoot': '🎯 Target Shoot',
  'rps-duel': '🪨 RPS Duel',
  'password-memory': '🔐 Password Memory',
  'spin-stop': '🌀 Spin Stop',
  'emoji-sort': '🔀 Emoji Sort',
  'color-memory': '🌈 Color Memory',
  'number-memory': '🔢 Number Memory',
  'finger-race': '👆 Finger Race',
  'reaction-color': '🎨 Reaction Color',
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
  'coin-rush': 'Walk around, collect coins, see other players!',
  'word-scramble': 'Unscramble the word as fast as you can!',
  'falling-catch': 'Catch stars, dodge bombs falling from the sky!',
  'speed-trivia': 'Answer trivia questions as fast as possible!',
  'color-tap': 'Tap only the circles matching the target color!',
  'tile-flip': 'Flip tiles to find matching pairs!',
  'rapid-tap': 'Tap the button as many times as you can!',
  'emoji-decode': 'What word do these emojis represent?',
  'math-chain': 'Solve chained math problems rapidly!',
  'pattern-copy': 'Memorize and recreate the dot pattern!',
  'snake': 'Eat food, grow longer, avoid hitting yourself!',
  'target-shoot': 'Click targets before they disappear — smaller = more points!',
  'rps-duel': 'Beat the CPU at Rock Paper Scissors as many times as you can!',
  'password-memory': 'Memorize the password, then type it from memory!',
  'spin-stop': 'Stop the spinning needle inside the green zone!',
  'emoji-sort': 'Sort emojis into the correct category as fast as possible!',
  'color-memory': 'Watch the color sequence, then repeat it!',
  'number-memory': 'Memorize the number sequence, then type it back!',
  'finger-race': 'Alternate tapping left and right as fast as you can!',
  'reaction-color': 'Click only when the target color appears!',
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
  | { type: 'player-move'; playerId: string; x: number; y: number }
  | { type: 'player-emote'; playerId: string; emoji: string }
  | { type: 'error'; message: string }

// Client → Server
export type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'start' }
  | { type: 'submit'; score: number }
  | { type: 'hot-potato-pass' }
