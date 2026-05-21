import type { Player } from '../types'

interface Props {
  p: Player
  size?: 'sm' | 'md' | 'lg'
}

export default function PlayerAvatar({ p, size = 'sm' }: Props) {
  const cls = size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-9 h-9' : 'w-12 h-12'
  const txtCls = size === 'sm' ? 'text-base' : size === 'md' ? 'text-xl' : 'text-3xl'
  const borderCls = p.border === 'gold' ? 'ring-gold'
    : p.border === 'purple' ? 'ring-purple-pulse'
    : p.border === 'rainbow' ? 'ring-rainbow-anim'
    : ''

  if (!p.avatar) return <span className={txtCls}>{p.emoji}</span>

  return (
    <img
      src={p.avatar}
      className={`${cls} rounded-full object-cover flex-shrink-0 ${borderCls}`}
      alt=""
    />
  )
}
