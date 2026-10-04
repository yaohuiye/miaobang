import test from 'node:test'
import assert from 'node:assert/strict'
import { LEVELS } from '../data/puzzle-levels.mjs'
import { parseMap, move, runRoute, findRoute, validCommands } from '../game/route.mjs'
import { readProgress, updateProgress } from '../game/progress.mjs'

const open = parseMap(['S..G..', '......', '......', '......', '......', '......'])

test('12 个关卡的编号独立，三个分组各四关', () => {
  assert.equal(LEVELS.length, 12)
  assert.equal(new Set(LEVELS.map(level => level.id)).size, 12)
  assert.deepEqual([...new Set(LEVELS.map(level => level.group))].map(group => LEVELS.filter(level => level.group === group).length), [4, 4, 4])
})

for (const level of LEVELS) {
  test(`${level.id} ${level.name}：提示路线有效且不超过 64 步`, () => {
    const map = parseMap(level.rows)
    const route = findRoute(map)
    assert.ok(route?.length > 0 && route.length <= 64)
    assert.equal(runRoute(map, route).outcome, 'success')
  })
}

test('换种走法的四关都有不同的可行路径', () => {
  for (const level of LEVELS.slice(8)) {
    const map = parseMap(level.rows)
    const result = runRoute(map, findRoute(map))
    const alternatives = result.steps.filter(step => step.position !== map.goal).some(step => {
      const cells = [...map.cells]
      cells[step.position] = '#'
      return findRoute({ ...map, cells }) !== null
    })
    assert.ok(alternatives, level.id)
  }
})

test('接受较长但有效的路线，不要求匹配参考答案', () => {
  assert.equal(runRoute(open, ['D', 'R', 'R', 'R', 'U']).outcome, 'success')
  assert.equal(runRoute(open, ['D', 'U', 'R', 'R', 'R']).outcome, 'success')
})

test('到达终点即结束，不执行后续指令', () => {
  const result = runRoute(open, ['R', 'R', 'R', 'U'])
  assert.equal(result.outcome, 'success')
  assert.equal(result.steps.length, 3)
})

test('边缘不能跨行，越界停在最后有效位置并指出步骤', () => {
  assert.equal(move(open, 5, 'R').error, 'edge')
  assert.equal(move(open, 6, 'L').error, 'edge')
  assert.equal(move(open, 35, 'D').error, 'edge')
  const result = runRoute(open, ['R', 'U', 'R'])
  assert.equal(result.outcome, 'edge')
  assert.equal(result.position, 1)
  assert.equal(result.failedStep, 2)
  assert.equal(result.steps.length, 2)
})

test('碰到障碍停止，不跳过错误步骤', () => {
  const map = parseMap(['S.#G..', '......', '......', '......', '......', '......'])
  const result = runRoute(map, ['R', 'R', 'D'])
  assert.equal(result.outcome, 'wall')
  assert.equal(result.position, 1)
  assert.equal(result.failedStep, 2)
})

test('指令走完和成功分开，空路线不移动', () => {
  assert.equal(runRoute(open, ['R']).outcome, 'unfinished')
  assert.deepEqual(runRoute(open, []), { steps: [], position: 0, outcome: 'unfinished' })
})

test('64 步边界与非法指令', () => {
  assert.ok(validCommands(Array(64).fill('R')))
  assert.equal(validCommands(Array(65).fill('R')), false)
  for (const commands of [['X'], ['toString'], 'RRR', [null]]) assert.equal(validCommands(commands), false)
  assert.throws(() => runRoute(open, ['X']))
})

test('坏地图与无解地图明确区分', () => {
  for (const rows of [[], ['S....G'], ['S....G', '......', '......', '......', '......', '.....?'], ['SS...G', '......', '......', '......', '......', '......']]) {
    assert.throws(() => parseMap(rows))
  }
  assert.equal(findRoute(parseMap(['S#...G', '##....', '......', '......', '......', '......'])), null)
})

test('提示可以从有效的中途位置寻路', () => {
  const route = findRoute(open, 6)
  let position = 6
  for (const command of route) {
    const step = move(open, position, command)
    assert.equal(step.error, null)
    position = step.position
  }
  assert.equal(position, open.goal)
})

test('重开恢复路线和通过标记，修改或再次失败不抹去已通过', () => {
  const commands = ['R', 'R', 'R']
  const passed = updateProgress({}, 'route-01', commands, true)
  commands.pop()
  assert.equal(passed['route-01'].commands.length, 3)
  const edited = updateProgress(passed, 'route-01', ['U'], false)
  const loaded = readProgress(JSON.parse(JSON.stringify({ version: 1, levels: edited })), ['route-01'])
  assert.deepEqual(loaded['route-01'], { commands: ['U'], completed: true })
  assert.deepEqual(passed['route-01'].commands, ['R', 'R', 'R'])
})

test('首次无记录正常开始；未知版本或坏记录拒绝载入且不修改原值', () => {
  assert.deepEqual(readProgress('', ['route-01']), {})
  for (const value of [{ version: 2, levels: {} }, { version: 1, levels: { 'route-01': { completed: true, commands: ['X'] } } }]) {
    const before = JSON.stringify(value)
    assert.throws(() => readProgress(value, ['route-01']))
    assert.equal(JSON.stringify(value), before)
  }
})
