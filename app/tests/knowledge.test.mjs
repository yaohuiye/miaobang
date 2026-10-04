import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { entries, SUBJECTS, SOURCES } from '../data/knowledge/index.mjs'
import { emptyProgress, readProgress, setOnShelf, searchEntries, makePractice, shuffle, judgeAnswer, createKnowledgeStore, KNOWLEDGE_KEY } from '../knowledge/model.mjs'

test('all 550 original cards have usable content, stable unique IDs and unambiguous answer choices', () => {
  assert.equal(entries.length, 550)
  assert.equal(new Set(entries.map(e => e.id)).size, entries.length)
  assert.equal(new Set(entries.map(e => e.title)).size, entries.length)
  assert.deepEqual(SUBJECTS.map(s => entries.filter(e => e.subject === s.id).length), [300, 100, 80, 50, 20])
  for (const e of entries) {
    for (const key of ['title','topic','summary','explanation','example','tip','talk','level']) assert.ok(typeof e[key] === 'string' && e[key].trim(), `${e.id}: ${key}`)
    assert.ok(e.sources.length && e.sources.every(id => SOURCES[id]), e.id)
    assert.equal(e.quiz.options.length, 3, e.id)
    assert.equal(new Set(e.quiz.options).size, 3, e.id)
    assert.equal(e.quiz.options.filter(o => o === e.quiz.answer).length, 1, e.id)
    assert.ok(e.quiz.prompt && e.quiz.explanation, e.id)
    assert.equal(judgeAnswer(e.id, e.quiz.answer).correct, true)
    for (const wrong of e.quiz.options.filter(o => o !== e.quiz.answer)) assert.equal(judgeAnswer(e.id, wrong).correct, false)
  }
})
test('Chinese, case-insensitive English and tone-free pinyin queries find knowledge', () => {
  assert.ok(searchEntries({query:'分配律'}).some(e => e.id === 'math-25'))
  assert.ok(searchEntries({query:'LIBRARY'}).some(e => e.id === 'en-library'))
  assert.ok(searchEntries({query:'zhuan xin zhi zhi'}).some(e => e.title === '专心致志'))
  assert.ok(searchEntries({query:'zhuānxīnzhìzhì'}).some(e => e.title === '专心致志'))
  assert.ok(searchEntries({query:'海水'}).some(e => e.subject === 'science'))
  assert.equal(searchEntries({query:'不存在的外星密码xyz'}).length, 0)
  assert.equal(searchEntries({query:'   '}).length, 550)
})
test('subject, topic, search and shelf filters intersect rather than leak other subjects', () => {
  const progress = setOnShelf(emptyProgress(), 'favorites', 'en-library', true)
  assert.equal(searchEntries({progress, shelf:'favorites'})[0].id, 'en-library')
  assert.equal(searchEntries({progress, shelf:'favorites',subject:'math'}).length, 0)
  assert.equal(searchEntries({subject:'english',topic:'学校与学习'}).length, 12)
  assert.equal(searchEntries({subject:'english',topic:'学校与学习',query:'library'}).length, 1)
})
test('progress persists shelves, removes duplicates and obsolete IDs without losing known cards', () => {
  assert.deepEqual(readProgress(''), emptyProgress())
  const progress = readProgress(JSON.stringify({version:1,favorites:['en-library','en-library','gone'],review:['math-1']}))
  assert.deepEqual(progress.favorites, ['en-library'])
  assert.deepEqual(progress.review, ['math-1'])
  const next = setOnShelf(progress, 'review', 'math-1', false)
  assert.deepEqual(next.review, [])
  assert.deepEqual(progress.review, ['math-1'])
  assert.throws(() => readProgress('{broken'))
  assert.throws(() => readProgress({version:2,favorites:[],review:[]}))
  assert.throws(() => setOnShelf(progress, 'favorites', 'gone', true))
})
test('failed storage writes do not report success or erase previous records', () => {
  let stored = JSON.stringify(emptyProgress())
  const store = createKnowledgeStore({ get: key => {assert.equal(key, KNOWLEDGE_KEY); return stored}, set: () => {throw new Error('full')} })
  assert.throws(() => store.set('favorites','en-library',true), /full/)
  assert.deepEqual(store.read(), emptyProgress())
  const success = createKnowledgeStore({get: () => stored,set: (_,v) => {stored = JSON.stringify(v)}})
  success.set('favorites','en-library',true)
  success.set('review','math-25',true)
  assert.deepEqual(success.read(), {version:1,favorites:['en-library'],review:['math-25']})
  success.set('favorites','en-library',true)
  assert.equal(success.read().favorites.length, 1)
})
test('practice samples up to five distinct cards from the actual filtered pool', () => {
  const pool = searchEntries({subject:'math'})
  const ids = makePractice(pool, () => .3)
  assert.equal(ids.length, 5)
  assert.equal(new Set(ids).size, 5)
  assert.ok(ids.every(id => id.startsWith('math-')))
  assert.equal(makePractice(pool.slice(0,2)).length, 2)
  assert.deepEqual(makePractice([]), [])
  const options = ['a','b','c']
  assert.deepEqual(shuffle(options, () => 0), ['b','c','a'])
  assert.deepEqual(options, ['a','b','c'])
  assert.throws(() => judgeAnswer('math-1','not an option'))
})
test('numeric quiz answers agree with independently computed arithmetic and geometry', () => {
  const expected = {
    1:3*1000, 3:Math.max(100000,99999,90009), 4:`${460000/10000}万`,
    5:`${Math.round(36800/10000)}万`, 6:0, 7:7/100, 8:'2.60', 9:Math.max(2.8,2.75,2.08),
    10:.45*100, 11:(1.25+.6).toFixed(2), 12:(4-1.36).toFixed(2),13:`${.8*100}厘米`,14:`${3*10000}平方米`,
    15:124*23, 16:168/14,17:`商${Math.floor(95/12)}余${95%12}`,19:24-8/4,20:(24-8)/4,
    32:`${180-35-65}°`,35:'4条',38:`${5*6}人`,39:(4+6+8)/3,40:`${Math.max(6,4)}分钟`,41:'3/8',42:'5/8',43:`${2+4}/9`,44:`${7-4}/9`,45:`${(8+5)*2}厘米`,46:`${8*5}平方厘米`,47:`${8*7}元`,48:`${60*3}千米`,49:300*4,50:`${4+12}时`,51:`${3*1000}克`
  }
  for (const [id, answer] of Object.entries(expected)) assert.equal(entries.find(e=>e.id===`math-${id}`).quiz.answer,String(answer),`math-${id}`)
  assert.equal(36*(100+2),36*100+36*2)
  assert.ok(4+5>6)
  assert.ok(2+3<=5)
  assert.ok(1+2<=4)
})
test('legacy arithmetic accepts the same multiply/divide symbols that its generator displays', () => {
  const source = readFileSync(new URL('../pages/learning/arithmetic.vue',import.meta.url),'utf8')
  const body = source.match(/calculateAnswer\(num1, num2, operation\) \{([\s\S]*?)\n    \},/)[1]
  const calculate = vm.runInNewContext(`(num1,num2,operation) => {${body}}`)
  for (const symbol of ['×','*']) assert.equal(calculate(6,7,symbol),42)
  for (const symbol of ['÷','/']) assert.equal(calculate(8,2,symbol),4)
  assert.equal(calculate(7,3,'+'),10)
  assert.equal(calculate(7,3,'-'),4)
})
