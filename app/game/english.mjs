import { english } from '../data/knowledge/english.mjs'
import { englishTextbook } from '../data/knowledge/english-textbook.mjs'
import { ENGLISH_AUDIO } from '../data/knowledge/english-audio.mjs'
import { shuffle } from '../knowledge/model.mjs'
export const words = [...english.filter(entry => !entry.id.startsWith('en-pattern-')), ...englishTextbook]
export const wordById = new Map(words.map(entry => [entry.id, entry]))
export const wordTopics = [...new Set(words.map(entry => entry.topic))]
export const wordBooks = [{ id: 'all', label: '全部词汇' }, { id: 'base', label: '基础复习' }, { id: 'upper', label: '外研版四上' }, { id: 'lower', label: '外研版四下' }]
export const bookFor = entry => entry.topic.startsWith('四上M') ? 'upper' : entry.topic.startsWith('四下M') ? 'lower' : 'base'
export const hasWordAudio = id => !!ENGLISH_AUDIO[id]?.word
export function wordPool(topic = '', review = null, { book = 'all', mode = '' } = {}) {
  return words.filter(entry => (!topic || entry.topic === topic) && (review === null || review.includes(entry.id)) &&
    (book === 'all' || bookFor(entry) === book) && (mode !== 'listen' || hasWordAudio(entry.id)))
}
export function buildWordRound(id, mode, random = Math.random) {
  const entry = wordById.get(id)
  if (!entry || !['listen', 'meaning', 'spell', 'write'].includes(mode)) throw new Error('这组英语练习暂时不可用。')
  if (mode === 'listen' && !hasWordAudio(id)) throw new Error('这个课本词尚无内置读音，可以练词义、字母拼装和独立拼写。')
  if (mode === 'listen' || mode === 'meaning') {
    const sameTopic = words.filter(word => word.topic === entry.topic && word.id !== id)
    const others = shuffle(sameTopic, random).slice(0, 2)
    return { id, mode, choices: shuffle([id, ...others.map(word => word.id)], random) }
  }
  if (mode === 'write') return { id, mode }
  // Each occurrence has its own token, so both p's in apple can be used exactly once.
  const tiles = [...entry.title].filter(letter => letter !== ' ').map((letter, index) => ({ id: index, letter }))
  return { id, mode, tiles: shuffle(tiles, random) }
}
export function spellResult(round, selected) {
  const available = new Map(round.tiles.map(tile => [tile.id, tile.letter]))
  if (new Set(selected).size !== selected.length || selected.some(id => !available.has(id))) throw new Error('每块字母只能使用一次。')
  const answer = selected.map(id => available.get(id)).join('')
  const expected = wordById.get(round.id).title.replace(/ /g, '')
  const firstMismatch = [...answer].findIndex((letter, index) => letter !== expected[index])
  return { answer, correct: answer === expected, remaining: expected.length - answer.length, firstMismatch }
}
// Ignore case and sentence-final punctuation, but keep word boundaries and apostrophes.
const normalizeSpelling = text => text.trim().replace(/’/g, "'").replace(/\s+/g, ' ').replace(/[.!?]+$/g, '').toLowerCase()
export function inputResult(id, answer) {
  if (!wordById.has(id) || typeof answer !== 'string') throw new Error('请先输入这个词的英文写法。')
  return { correct: normalizeSpelling(answer) === normalizeSpelling(wordById.get(id).title) }
}
