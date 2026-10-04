export function combine(a, b, operator) {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) throw new Error('请使用非负整数。')
  if (operator === '÷' && (b === 0 || a % b !== 0)) throw new Error(b === 0 ? '0 不能作除数，换个顺序或运算吧。' : '这一版只做整除，换个顺序或运算吧。')
  const result = operator === '+' ? a + b : operator === '−' ? a - b : operator === '×' ? a * b : operator === '÷' ? a / b : NaN
  if (!Number.isInteger(result) || result < 0 || result > 999) throw new Error('这一步需要得到 0 到 999 的整数，换个组合试试。')
  return result
}
export const initialTiles = numbers => numbers.map((value, index) => ({ id: `n${index}`, value, expression: String(value) }))
export function mergeTiles(tiles, first, second, operator, allowed) {
  const a = tiles.find(tile => tile.id === first), b = tiles.find(tile => tile.id === second)
  if (!a || !b || first === second || !allowed.includes(operator)) throw new Error('依次选择两张不同的数字牌和一种运算。')
  const value = combine(a.value, b.value, operator)
  return [...tiles.filter(tile => tile.id !== first && tile.id !== second), { id: `(${first}${operator}${second})`, value, expression: `(${a.expression} ${operator} ${b.expression})` }]
}
export const reachedTarget = (tiles, target) => tiles.length === 1 && tiles[0].value === target
// At most three initial cards: exhaustive search stays small and hints follow current cards.
export function solveNumbers(tiles, target, operators) {
  if (tiles.length === 1) return reachedTarget(tiles, target) ? [] : null
  for (const a of tiles) for (const b of tiles) {
    if (a.id === b.id) continue
    for (const operator of operators) {
      let next
      try { next = mergeTiles(tiles, a.id, b.id, operator, operators) } catch { continue }
      const rest = solveNumbers(next, target, operators)
      if (rest !== null) return [{ first:a.id, second:b.id, operator, text:`${a.value} ${operator} ${b.value} = ${combine(a.value,b.value,operator)}` }, ...rest]
    }
  }
  return null
}
