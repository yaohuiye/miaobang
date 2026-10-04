import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyState, begin, reconcile, changePhase, finish, readState, clockText } from '../focus/model.mjs'
import { createFocusService } from '../focus/service.mjs'
const initialClock = { boot: 'boot-1', monoMs: 1000, wallMs: 100000 }
const start = (minutes = 1) => begin(emptyState(), '完成两道数学题', minutes, initialClock, 'focus-one')
const later = (ms, extra = {}) => ({ ...initialClock, monoMs: initialClock.monoMs + ms, wallMs: initialClock.wallMs + ms, ...extra })

test('默认 10 分钟；任务和自定义分钟必须有效', () => {
  assert.equal(emptyState().defaultMinutes, 10)
  for (const minutes of [0, -1, 1.5, 121, NaN, '10']) assert.throws(() => begin(emptyState(), '写两题', minutes, initialClock, 'focus-one'))
  for (const task of ['', '  ', '字'.repeat(81)]) assert.throws(() => begin(emptyState(), task, 10, initialClock, 'focus-one'))
  assert.equal(start(120).active.plannedMs, 7200000)
})
test('同一时刻只允许一轮未结束任务', () => {
  assert.throws(() => begin(start(), '另一件事', 5, later(100), 'focus-two'))
})
test('单调时间恢复：切页面或进程重开后不重新开始', () => {
  const restored = readState(JSON.parse(JSON.stringify(start())))
  const state = reconcile(restored, later(15000))
  assert.equal(state.active.elapsedMs, 15000)
  assert.equal(state.active.phase, 'running')
})
test('暂停不计时，继续保留已经发生的时间', () => {
  const paused = changePhase(start(), 'focus-one', 'pause', later(10000))
  assert.equal(reconcile(paused, later(40000)).active.elapsedMs, 10000)
  const resumed = changePhase(paused, 'focus-one', 'resume', later(40000))
  assert.equal(reconcile(resumed, later(50000)).active.elapsedMs, 20000)
})
test('时间到只进入待确认，超时不累计、不自动完成', () => {
  const state = reconcile(start(), later(90000))
  assert.equal(state.active.phase, 'review')
  assert.equal(state.active.reason, 'due')
  assert.equal(state.active.elapsedMs, 60000)
  assert.equal(state.history.length, 0)
  assert.deepEqual(reconcile(state, later(120000)), state)
})
test('调整系统日期不影响同次开机的计时时长', () => {
  assert.equal(reconcile(start(), later(15000, { wallMs: -999999 })).active.elapsedMs, 15000)
})
test('重启或单调时钟回退，只保留已保存时长，暂停记录也转待确认', () => {
  const checkpoint = reconcile(start(), later(12000))
  for (const clock of [later(600000, { boot: 'boot-2' }), later(100)]) {
    const result = reconcile(checkpoint, clock)
    assert.equal(result.active.phase, 'review')
    assert.equal(result.active.reason, 'interrupted')
    assert.equal(result.active.elapsedMs, 12000)
  }
  const paused = changePhase(checkpoint, 'focus-one', 'pause', later(14000))
  assert.equal(reconcile(paused, later(18000, { boot: 'boot-2' })).active.phase, 'review')
})
test('提前结束保留计时，需要明确选择结果', () => {
  assert.throws(() => finish(start(), 'focus-one', 'completed', later(10000)))
  const state = changePhase(start(), 'focus-one', 'end', later(16000))
  const ended = finish(state, 'focus-one', 'needs_more', later(20000))
  assert.equal(ended.active, null)
  assert.equal(ended.history[0].elapsedMs, 16000)
  assert.equal(ended.history[0].result, 'needs_more')
})
test('重复确认只存一条，不会覆盖后续新任务', () => {
  const ended = finish(reconcile(start(), later(60000)), 'focus-one', 'completed', later(65000))
  const next = begin(ended, '读书', 10, later(70000), 'focus-two')
  const repeated = finish(next, 'focus-one', 'completed', later(80000))
  assert.equal(repeated.history.length, 1)
  assert.equal(repeated.active.id, 'focus-two')
})
test('重置保存中断记录，不删除已经发生的运行时间', () => {
  const state = finish(start(), 'focus-one', 'interrupted', later(14000), true)
  assert.equal(state.history[0].elapsedMs, 14000)
  assert.equal(state.history[0].reason, 'reset')
  assert.equal(state.active, null)
})
test('坏记录和不支持的版本拒绝读取，原值不改动', () => {
  for (const value of [{ ...emptyState(), version: 2 }, { ...start(), active: { ...start().active, elapsedMs: -1 } }, { ...emptyState(), active: undefined }]) {
    const before = JSON.stringify(value)
    assert.throws(() => readState(value))
    assert.equal(JSON.stringify(value), before)
  }
})
test('剩余秒数向上取整，末尾不足一秒不提前显示零', () => {
  assert.equal(clockText(59999), '01:00')
  assert.equal(clockText(1), '00:01')
  assert.equal(clockText(0), '00:00')
})

function fixture() {
  let stored = ''
  let now = { ...initialClock }
  let sequence = 0
  let alarm = { supported: true, notificationAllowed: true, exactAllowed: true, active: {} }
  const events = []
  const flags = { writeFail: false, scheduleFail: false, cancelFail: false }
  const service = createFocusService({
    read: () => structuredClone(stored),
    write: value => { events.push('write'); if (flags.writeFail) throw new Error('存储已满'); stored = structuredClone(value) },
    environment: () => ({ clock: { ...now }, reminder: structuredClone(alarm) }),
    id: () => 'focus-' + ++sequence,
    schedule: (seconds, ownerId) => {
      events.push(['schedule', seconds, ownerId])
      if (flags.scheduleFail) throw new Error('系统拒绝安排')
      alarm.active = { phase: 'scheduled', ownerId }; return structuredClone(alarm)
    },
    cancel: ownerId => {
      events.push(['cancel', ownerId])
      if (flags.cancelFail) throw new Error('撤销失败')
      if (alarm.active.ownerId === ownerId) alarm.active.phase = 'cancelled'
      return structuredClone(alarm)
    }
  })
  return { service, events, flags, advance: ms => { now = later(ms) }, clock: value => { now = value },
    stored: () => stored, alarm: () => alarm, permissions: allowed => { alarm.notificationAllowed = allowed } }
}

test('开始先保存再安排提醒；暂停撤销，继续只安排剩余时间', () => {
  const f = fixture()
  const result = f.service.start('写两题', 1)
  assert.deepEqual(f.events, ['write', ['schedule', 60, 'focus-1']])
  assert.equal(result.reminder.active.ownerId, 'focus-1')
  f.advance(15000); f.service.transition('focus-1', 'pause')
  assert.equal(f.alarm().active.phase, 'cancelled')
  f.advance(30000); f.service.transition('focus-1', 'resume')
  assert.deepEqual(f.events.at(-1), ['schedule', 45, 'focus-1'])
})
test('开始保存失败，不安排任何通知，也不假装开始', () => {
  const f = fixture(); f.flags.writeFail = true
  assert.throws(() => f.service.start('写两题', 1), /存储/)
  assert.equal(f.stored(), '')
  assert.deepEqual(f.events, ['write'])
})
test('系统调度失败，任务保留且明确返回提醒失败', () => {
  const f = fixture(); f.flags.scheduleFail = true
  const result = f.service.start('写两题', 1)
  assert.equal(result.state.active.phase, 'running')
  assert.match(result.warning, /未安排成功/)
  assert.notEqual(result.reminder.active.phase, 'scheduled')
})
test('通知未授权可仅页面计时，授权后按剩余时间开启', () => {
  const f = fixture(); f.permissions(false)
  f.service.start('写两题', 1)
  assert.deepEqual(f.events, ['write'])
  f.advance(17000); f.permissions(true); f.service.enableReminder('focus-1')
  assert.deepEqual(f.events.at(-1), ['schedule', 43, 'focus-1'])
})
test('每次读状态不重新调度；到点不自动关闭未送达的提醒或保存完成记录', () => {
  const f = fixture(); f.service.start('写两题', 1)
  f.advance(20000); f.service.snapshot(); f.service.snapshot()
  assert.equal(f.events.length, 2)
  f.advance(61000); const due = f.service.snapshot()
  assert.equal(due.state.active.phase, 'review')
  assert.equal(due.state.history.length, 0)
  assert.equal(f.events.filter(event => Array.isArray(event) && event[0] === 'cancel').length, 0)
})
test('结束结果写入失败可重试，当前活动仍保留，不重复生成历史', () => {
  const f = fixture(); f.service.start('写两题', 1)
  f.advance(60000); f.service.snapshot(); f.flags.writeFail = true
  assert.throws(() => f.service.complete('focus-1', 'completed'))
  assert.equal(f.stored().active.phase, 'review')
  assert.equal(f.stored().history.length, 0)
  f.flags.writeFail = false
  f.service.complete('focus-1', 'completed'); f.service.complete('focus-1', 'completed')
  assert.equal(f.stored().history.length, 1)
})
test('暂停保存失败，仍显示旧运行状态且能观察到提醒已撤销', () => {
  const f = fixture(); f.service.start('写两题', 1); f.advance(12000)
  f.flags.writeFail = true
  assert.throws(() => f.service.transition('focus-1', 'pause'))
  f.flags.writeFail = false
  const snapshot = f.service.snapshot()
  assert.equal(snapshot.state.active.phase, 'running')
  assert.equal(snapshot.reminder.active.phase, 'cancelled')
})
test('撤销提醒失败，不把活动错误标成已暂停或已结束', () => {
  const f = fixture(); f.service.start('写两题', 1); f.flags.cancelFail = true
  assert.throws(() => f.service.transition('focus-1', 'pause'))
  assert.equal(f.stored().active.phase, 'running')
})
test('检查点后重启会转中断待确认，只保留检查点时间', () => {
  const f = fixture(); f.service.start('写两题', 1); f.advance(13000); f.service.snapshot(true)
  f.clock(later(999999, { boot: 'boot-2' }))
  assert.equal(f.service.snapshot().state.active.elapsedMs, 13000)
  assert.equal(f.stored().active.reason, 'interrupted')
  assert.equal(f.alarm().active.phase, 'cancelled')
})
test('旧轮重复确认不会撤销新轮的提醒', () => {
  const f = fixture(); f.service.start('写两题', 1); f.advance(60000); f.service.snapshot(); f.service.complete('focus-1', 'completed')
  f.service.start('读两页', 5); const count = f.events.length
  f.service.complete('focus-1', 'completed')
  assert.equal(f.events.length, count)
  assert.equal(f.alarm().active.ownerId, 'focus-2')
  assert.equal(f.alarm().active.phase, 'scheduled')
})

test('已收尾的提醒不在每次读取时重复撤销或写入', () => {
  const f = fixture(); f.service.start('写两题', 1); f.advance(60000); f.service.snapshot(); f.service.complete('focus-1', 'completed')
  const count = f.events.length
  f.service.snapshot(); f.service.snapshot()
  assert.equal(f.events.length, count)
})
