export const BORDER_ITEMS = [
  { id: '', label: 'Default', price: 0 },
  { id: 'gold', label: '✨ Gold', price: 200 },
  { id: 'purple', label: '💜 Purple Pulse', price: 400 },
  { id: 'rainbow', label: '🌈 Rainbow', price: 800 },
]

export const TITLE_ITEMS = [
  { id: 'speed', label: '⚡ Speed Demon', price: 300 },
  { id: 'brain', label: '🧠 Big Brain', price: 300 },
  { id: 'fire', label: '🔥 On Fire', price: 300 },
  { id: 'royale', label: '👑 Royale', price: 500 },
  { id: 'goat', label: '🐐 GOAT', price: 800 },
]

export const EMOTE_ITEMS = [
  { id: 'thumbs', emoji: '👍', label: 'Thumbs Up', price: 0 },
  { id: 'laugh', emoji: '😂', label: 'Laugh', price: 0 },
  { id: 'fire', emoji: '🔥', label: 'Fire', price: 100 },
  { id: 'crown', emoji: '👑', label: 'Crown', price: 150 },
  { id: 'skull', emoji: '💀', label: 'Skull', price: 200 },
  { id: 'angry', emoji: '😤', label: 'Angry', price: 150 },
]

export function getCoins(): number {
  return parseInt(localStorage.getItem('coins') ?? '0', 10)
}

export function addCoins(amount: number): number {
  const n = getCoins() + amount
  localStorage.setItem('coins', String(n))
  return n
}

export function spendCoins(amount: number): boolean {
  const cur = getCoins()
  if (cur < amount) return false
  localStorage.setItem('coins', String(cur - amount))
  return true
}

export function getOwned(): string[] {
  try { return JSON.parse(localStorage.getItem('ownedItems') ?? '[]') } catch { return [] }
}

export function own(itemId: string): void {
  const arr = getOwned()
  if (!arr.includes(itemId)) { arr.push(itemId); localStorage.setItem('ownedItems', JSON.stringify(arr)) }
}

export function isOwned(itemId: string): boolean {
  const freeIds = ['', ...EMOTE_ITEMS.filter(e => e.price === 0).map(e => e.id)]
  return freeIds.includes(itemId) || getOwned().includes(itemId)
}

export function getEquipped(slot: 'border' | 'title'): string {
  return localStorage.getItem(`equipped_${slot}`) ?? ''
}

export function equip(slot: 'border' | 'title', id: string): void {
  localStorage.setItem(`equipped_${slot}`, id)
}

export function getEquippedEmotes(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem('equippedEmotes') ?? 'null')
    if (Array.isArray(saved) && saved.length > 0) return saved
  } catch {}
  return ['thumbs', 'laugh']
}

export function setEquippedEmotes(emotes: string[]): void {
  localStorage.setItem('equippedEmotes', JSON.stringify(emotes))
}

export function getEmoteEmoji(id: string): string {
  return EMOTE_ITEMS.find(e => e.id === id)?.emoji ?? ''
}

export function getTitleLabel(id: string): string {
  return TITLE_ITEMS.find(t => t.id === id)?.label ?? ''
}
