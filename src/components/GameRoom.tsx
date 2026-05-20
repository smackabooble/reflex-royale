import type { RoomState } from '../App'
import type { GameType } from '../types'
import { GAME_NAMES, GAME_DESCRIPTIONS } from '../types'
import WaitingRoom from './WaitingRoom'
import RoundResults from './RoundResults'
import Leaderboard from './Leaderboard'
import WhackMole from './games/WhackMole'
import DontClickRed from './games/DontClickRed'
import PureReaction from './games/PureReaction'
import SimonSays from './games/SimonSays'
import StroopEffect from './games/StroopEffect'
import OddOneOut from './games/OddOneOut'
import NumberRush from './games/NumberRush'
import MemoryGrid from './games/MemoryGrid'
import HotPotato from './games/HotPotato'
import MathSprint from './games/MathSprint'
import TheWire from './games/TheWire'
import FastestTypist from './games/FastestTypist'
import Dodge from './games/Dodge'
import BalloonPop from './games/BalloonPop'
import SheepCounter from './games/SheepCounter'
import CoinRush from './games/CoinRush'
import Snake from './games/Snake'
import TargetShoot from './games/TargetShoot'
import RPSDuel from './games/RPSDuel'
import PasswordMemory from './games/PasswordMemory'
import SpinStop from './games/SpinStop'
import EmojiSort from './games/EmojiSort'
import ColorMemory from './games/ColorMemory'
import NumberMemory from './games/NumberMemory'
import FingerRace from './games/FingerRace'
import ReactionColor from './games/ReactionColor'
import WordScramble from './games/WordScramble'
import FallingCatch from './games/FallingCatch'
import SpeedTrivia from './games/SpeedTrivia'
import ColorTap from './games/ColorTap'
import TileFlip from './games/TileFlip'
import RapidTap from './games/RapidTap'
import EmojiDecode from './games/EmojiDecode'
import MathChain from './games/MathChain'
import PatternCopy from './games/PatternCopy'

export interface GameProps {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: import('../types').Player[]
  onSend: (msg: object) => void
}

interface Props {
  myId: string
  roomId: string
  state: RoomState
  onSend: (msg: object) => void
}

const GAMES: Record<GameType, React.ComponentType<any>> = {
  'whack-mole': WhackMole,
  'dont-click-red': DontClickRed,
  'pure-reaction': PureReaction,
  'simon-says': SimonSays,
  'stroop-effect': StroopEffect,
  'odd-one-out': OddOneOut,
  'number-rush': NumberRush,
  'memory-grid': MemoryGrid,
  'hot-potato': HotPotato,
  'math-sprint': MathSprint,
  'the-wire': TheWire,
  'fastest-typist': FastestTypist,
  'dodge': Dodge,
  'balloon-pop': BalloonPop,
  'sheep-counter': SheepCounter,
  'coin-rush': CoinRush,
  'word-scramble': WordScramble,
  'falling-catch': FallingCatch,
  'speed-trivia': SpeedTrivia,
  'color-tap': ColorTap,
  'tile-flip': TileFlip,
  'rapid-tap': RapidTap,
  'emoji-decode': EmojiDecode,
  'math-chain': MathChain,
  'pattern-copy': PatternCopy,
  'snake': Snake,
  'target-shoot': TargetShoot,
  'rps-duel': RPSDuel,
  'password-memory': PasswordMemory,
  'spin-stop': SpinStop,
  'emoji-sort': EmojiSort,
  'color-memory': ColorMemory,
  'number-memory': NumberMemory,
  'finger-race': FingerRace,
  'reaction-color': ReactionColor,
}

function PlayerIcon({ p, size = 'sm' }: { p: import('../types').Player, size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-6 h-6 text-sm' : 'w-8 h-8 text-xl'
  return p.avatar
    ? <img src={p.avatar} className={`${cls} rounded-full object-cover flex-shrink-0`} alt="" />
    : <span className={size === 'sm' ? 'text-base' : 'text-xl'}>{p.emoji}</span>
}

function ScoreBar({ players, myId, roundNumber, totalRounds }: { players: RoomState['players'], myId: string, roundNumber: number, totalRounds: number }) {
  const sorted = [...players].sort((a,b) => b.score - a.score)
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10 px-4 py-2">
      <div className="max-w-2xl mx-auto flex items-center gap-3 overflow-x-auto">
        <span className="text-white/40 text-xs shrink-0">{roundNumber}/{totalRounds}</span>
        {sorted.map(p => (
          <div key={p.id} className={`flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-lg ${p.id === myId ? 'bg-yellow-400/20' : ''}`}>
            <PlayerIcon p={p} size="sm" />
            <span className={`font-bold text-sm ${p.id === myId ? 'text-yellow-400' : 'text-white/80'}`}>{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GameRoom({ myId, roomId, state, onSend }: Props) {
  const isHost = state.hostId === myId

  const handleComplete = (score: number) => {
    onSend({ type: 'submit', score })
  }

  const handleStart = () => onSend({ type: 'start' })

  if (state.phase === 'waiting' || state.phase === 'lobby') {
    return (
      <WaitingRoom
        roomId={roomId}
        players={state.players}
        myId={myId}
        isHost={isHost}
        onStart={handleStart}
      />
    )
  }

  if (state.phase === 'countdown' && state.currentGame) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="slide-up">
          <p className="text-white/40 text-sm mb-4 uppercase tracking-widest">Round {state.roundNumber} of {state.totalRounds}</p>
          <div className="text-6xl mb-4">{GAME_NAMES[state.currentGame].split(' ')[0]}</div>
          <h2 className="text-4xl font-black mb-3">{GAME_NAMES[state.currentGame].slice(3)}</h2>
          <p className="text-white/60 text-lg mb-8 max-w-xs mx-auto">{GAME_DESCRIPTIONS[state.currentGame]}</p>
          <div className="text-white/30 text-sm animate-pulse">Get ready…</div>
        </div>
      </div>
    )
  }

  if (state.phase === 'playing' && state.currentGame) {
    const GameComponent = GAMES[state.currentGame]
    return (
      <div className="pt-12">
        <ScoreBar players={state.players} myId={myId} roundNumber={state.roundNumber} totalRounds={state.totalRounds} />
        <GameComponent
          config={state.gameConfig}
          onComplete={handleComplete}
          myId={myId}
          players={state.players}
          onSend={onSend}
        />
      </div>
    )
  }

  if (state.phase === 'round-results') {
    return (
      <RoundResults
        roundScores={state.roundScores}
        players={state.players}
        roundNumber={state.roundNumber}
        totalRounds={state.totalRounds}
      />
    )
  }

  if (state.phase === 'finished') {
    return (
      <Leaderboard
        players={state.players}
        myId={myId}
        onPlayAgain={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-white/40">
      Connecting…
    </div>
  )
}
