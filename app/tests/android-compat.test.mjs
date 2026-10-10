import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

test('dictionary startup, spelling, routes and saved focus work without newer Android JS APIs', () => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict'
    String.prototype.replaceAll = undefined
    Object.hasOwn = undefined
    const { entries } = await import('./data/knowledge/index.mjs')
    const { searchEntries } = await import('./knowledge/model.mjs')
    const { buildWordRound, spellResult } = await import('./game/english.mjs')
    const { parseMap, runRoute } = await import('./game/route.mjs')
    const { readProgress } = await import('./game/progress.mjs')
    const { emptyState, begin, finish, readState } = await import('./focus/model.mjs')
    const { EXPERIMENTS, defaults, observe } = await import('./lab/experiments.mjs')
    const { createPlane, stepPlane } = await import('./game/plane.mjs')
    assert.equal(EXPERIMENTS.length, 13)
    assert.equal(observe('shadow', defaults(EXPERIMENTS[0])).value, 2)
    const flight = createPlane(); flight.status = 'running'; stepPlane(flight, .03, () => .9)
    assert.ok(flight.bullets.length)
    assert.equal(entries.length, 723)
    assert.ok(searchEntries({ query: 'library' }).some(entry => entry.id === 'en-library'))
    const word = entries.find(entry => entry.subject === 'english' && entry.title.includes(' ') && !entry.id.startsWith('en-pattern-'))
    assert.equal(word.id, 'en-' + word.title.replace(/ /g, '-'))
    const round = buildWordRound(word.id, 'spell')
    assert.equal(spellResult(round, round.tiles.slice().sort((a,b) => a.id-b.id).map(tile => tile.id)).correct, true)
    const map = parseMap(['......', '......', '.S..G.', '......', '......', '......'])
    assert.equal(runRoute(map, ['R','R','R']).outcome, 'success')
    assert.throws(() => runRoute(map, ['toString']))
    const progress = { version: 1, levels: { 'route-01': { completed: true, commands: ['R','R','R'] } } }
    assert.deepEqual(readProgress(progress, ['route-01']), progress.levels)
    const clock = { boot: 'test', monoMs: 0, wallMs: 1 }
    const active = begin(emptyState(), '读一页书', 1, clock, 'focus-compat')
    const done = finish(active, 'focus-compat', 'completed', { ...clock, monoMs: 60000, wallMs: 60001 })
    assert.equal(readState(done).history[0].result, 'completed')
  `], { cwd: new URL('..', import.meta.url), encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr || result.stdout)
})
