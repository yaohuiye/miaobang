import { english } from '../data/knowledge/english.mjs'
import { shuffle } from '../knowledge/model.mjs'
export const words = english.filter(entry => !entry.id.startsWith('en-pattern-'))
export const wordById = new Map(words.map(entry => [entry.id, entry]))
export const wordTopics = [...new Set(words.map(entry => entry.topic))]
export function wordPool(topic = '', review = null) {
  return words.filter(entry => (!topic || entry.topic === topic) && (review === null || review.includes(entry.id)))
}
export function buildWordRound(id, mode, random = Math.random) {
  const entry = wordById.get(id)
  if (!entry || !['listen', 'spell'].includes(mode)) throw new Error('这组英语游戏暂时不可用。')
  if (mode === 'listen') {
    const others = shuffle(words.filter(word => word.topic === entry.topic && word.id !== id), random).slice(0, 2)
    return { id, mode, choices: shuffle([id, ...others.map(word => word.id)], random) }
  }
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
