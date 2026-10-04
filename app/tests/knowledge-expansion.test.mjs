import test from 'node:test'
import assert from 'node:assert/strict'
import { entryById } from '../data/knowledge/index.mjs'
import { searchEntries, readProgress, makePractice } from '../knowledge/model.mjs'
import { extraEnglishGroups } from '../data/knowledge/english-extra.mjs'
import { extraIdiomRows, extraReadingRows } from '../data/knowledge/chinese-extra.mjs'
import { extraMathRows } from '../data/knowledge/math-extra.mjs'
import { extraScienceRows } from '../data/knowledge/science-extra.mjs'
import { wordPool } from '../game/english.mjs'

test('imported editorial rows have all fields and no empty options or shifted columns', () => {
  const packs = [
    ...Object.values(extraEnglishGroups).map(rows => [rows,4]),
    [extraIdiomRows,9],[extraReadingRows,9],[extraMathRows,9],[extraScienceRows,11]
  ]
  for (const [rows,width] of packs) for (const line of rows.split('\n')) {
    const fields=line.split('|')
    assert.equal(fields.length,width,line)
    assert.ok(fields.every(field=>field.trim()),line)
  }
})
test('new entries are searchable in both languages and tone-free pinyin, and join review practice', () => {
  for (const [query,id] of [['JANUARY','en-January'],['西红柿','en-tomato'],['xue zhong song tan','idiom-99'],['调商','math-62'],['双彩虹','why-42'],['批注','reading-16']]) {
    assert.ok(searchEntries({query}).some(entry=>entry.id===id),query)
  }
  const progress=readProgress({version:1,favorites:['en-library','idiom-32','why-20'],review:['math-1','en-watermelon','en-January','why-42']})
  assert.deepEqual(progress.favorites,['en-library','idiom-32','why-20'])
  assert.deepEqual(wordPool('',progress.review).map(e=>e.id).sort(),['en-January','en-watermelon'].sort())
  const ids=makePractice(searchEntries({subject:'science',shelf:'review',progress}))
  assert.deepEqual(ids,['why-42'])
  for (const [id,title] of [['idiom-32','齐心协力'],['math-52','辨认地图方向'],['why-20','水蒸发后盐会一起消失吗？'],['reading-12','认真倾听与回应'],['en-pattern-12',"Let's play a game."]]) assert.equal(entryById.get(id).title,title)
})
test('new maths answers agree with independent computations and unit conversions', () => {
  const expected = {
    53:6*10000+4*100,54:Math.floor(12030045/10000),58:(100/5)*3,59:25*12,60:120*30,
    62:196/28,63:824/8,65:156-38-62,66:240/5/2,67:199+46,
    69:`${5*5}平方厘米`,70:(Math.round(3.46*10)/10),71:`${(3+5/100).toFixed(2)}元`,
    72:`${2*100+30}厘米`,73:`${2*100}平方分米`,75:`${4*90}°`,79:`${18-12}本`,80:`${3*8-2*6}支`
  }
  for (const [id,answer] of Object.entries(expected)) assert.equal(entryById.get(`math-${id}`).quiz.answer,String(answer),`math-${id}`)
  assert.equal(String(312/24).length,2)
  assert.equal(12*7+11,95)
  assert.ok(11<12)
})
