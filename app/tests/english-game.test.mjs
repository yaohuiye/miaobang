import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { english } from '../data/knowledge/english.mjs'
import { ENGLISH_AUDIO } from '../data/knowledge/english-audio.mjs'
import { words, wordPool, hasWordAudio, buildWordRound, spellResult, inputResult } from '../game/english.mjs'
import { createLessonPlayer } from '../knowledge/audio.mjs'

test('all 300 cards have matching, bundled AAC word and example clips', () => {
  const files = new Set()
  assert.equal(Object.keys(ENGLISH_AUDIO).length, english.length)
  for (const entry of english) {
    for (const [kind,text] of [['word',entry.title],['example',entry.example.split('\n')[0]]]) {
      const clip = ENGLISH_AUDIO[entry.id][kind]
      assert.equal(clip.text,text)
      const hash = createHash('sha256').update(`piper-1.8.0:en_US-ljspeech-high:5d4f08ba6a2a48c44592eed3ce56bf85e9de3dd4e20df90541ae68a8310c029a:1.1:${text}`).digest('hex').slice(0,16)
      assert.equal(clip.src,`/static/english/${hash}.m4a`)
      const bytes = readFileSync(new URL(`..${clip.src}`,import.meta.url))
      assert.equal(bytes.toString('ascii',4,8),'ftyp')
      assert.ok(bytes.includes(Buffer.from('mdat')) && bytes.length>1000,clip.src)
      files.add(`${hash}.m4a`)
    }
  }
  assert.equal(files.size,596)
  assert.deepEqual([...files].sort(),readdirSync(new URL('../static/english/',import.meta.url)).sort())
})
test('games use vocabulary only and intersect topic with the actual review shelf', () => {
  assert.equal(words.length,461)
  assert.equal(wordPool('学校与学习').length,12)
  assert.deepEqual(wordPool('',[]),[])
  assert.deepEqual(wordPool('学校与学习',['en-apple','en-library','math-1']).map(e=>e.id),['en-library'])
  assert.equal(wordPool('', ['en-pattern-1']).length,0)
})
test('every listening round offers three distinct words including its target', () => {
  for (const entry of words.filter(entry=>hasWordAudio(entry.id))) {
    const round=buildWordRound(entry.id,'listen',()=>.4)
    assert.equal(round.choices.length,3)
    assert.equal(new Set(round.choices).size,3)
    assert.equal(round.choices.filter(id=>id===entry.id).length,1)
    assert.ok(round.choices.every(id=>words.some(e=>e.id===id && e.topic===entry.topic)))
  }
  assert.throws(()=>buildWordRound('math-1','spell'))
  assert.throws(()=>buildWordRound('en-apple','unknown'))
})
test('every spelling puzzle can be solved using each actual tile exactly once', () => {
  for (const entry of words) {
    const round=buildWordRound(entry.id,'spell',()=>.1)
    assert.equal(new Set(round.tiles.map(t=>t.id)).size,round.tiles.length)
    const ordered=round.tiles.map(t=>t.id).sort((a,b)=>a-b)
    assert.equal(spellResult(round,ordered).correct,true,entry.title)
  }
})
test('repeated letters are independent; spaces are fixed and weekday capitals preserved', () => {
  const apple=buildWordRound('en-apple','spell',()=>0)
  assert.equal(apple.tiles.filter(t=>t.letter==='p').length,2)
  assert.throws(()=>spellResult(apple,[0,1,1,3,4]),/只能使用一次/)
  assert.throws(()=>spellResult(apple,[99]))
  const phrase=buildWordRound('en-next-to','spell',()=>0)
  assert.equal(phrase.tiles.length,6)
  assert.equal(spellResult(phrase,[0,1,2,3,4,5]).answer,'nextto')
  assert.ok(buildWordRound('en-Monday','spell').tiles.some(t=>t.letter==='M'))
})
test('an unfinished spelling is not complete; a wrong order points to first mismatch', () => {
  const round=buildWordRound('en-apple','spell',()=>0)
  assert.deepEqual(spellResult(round,[0,1]),{answer:'ap',correct:false,remaining:3,firstMismatch:-1})
  assert.deepEqual(spellResult(round,[1,0,2,3,4]),{answer:'paple',correct:false,remaining:0,firstMismatch:0})
  assert.equal(spellResult(round,[0,2,1,3,4]).correct,true)
})
function audioFixture() {
  const contexts=[], states=[]
  const player=createLessonPlayer(()=>{
    const handlers={}
    const ctx={calls:[], handlers, onPlay:fn=>handlers.play=fn,onEnded:fn=>handlers.end=fn,onError:fn=>handlers.error=fn,
      play(){this.calls.push('play')},stop(){this.calls.push('stop')},destroy(){this.calls.push('destroy')}}
    contexts.push(ctx); return ctx
  },state=>states.push(state))
  return {player,contexts,states}
}
test('audio starts on request and reports actual playback/end events', () => {
  const {player,contexts,states}=audioFixture()
  assert.equal(contexts.length,0)
  player.play('/static/a.m4a','a')
  assert.equal(states.at(-1).phase,'loading')
  assert.equal(contexts[0].autoplay,false)
  assert.equal(contexts[0].src,'/static/a.m4a')
  contexts[0].handlers.play()
  assert.equal(states.at(-1).phase,'playing')
  contexts[0].handlers.end()
  assert.equal(states.at(-1).phase,'idle')
})
test('switching clips destroys old playback and ignores stale callbacks', () => {
  const {player,contexts,states}=audioFixture()
  player.play('a'); player.play('b')
  assert.deepEqual(contexts[0].calls,['play','stop','destroy'])
  contexts[1].handlers.play()
  const count=states.length
  contexts[0].handlers.error(); contexts[0].handlers.end(); contexts[0].handlers.play()
  assert.equal(states.length,count)
  assert.equal(states.at(-1).key,'b')
  player.stop(); player.stop()
  assert.deepEqual(contexts[1].calls,['play','stop','destroy'])
  assert.equal(states.at(-1).phase,'idle')
  contexts[1].handlers.play()
  assert.equal(states.at(-1).phase,'idle')
})
test('audio load failures show an error and a retry creates fresh playback', () => {
  const {player,contexts,states}=audioFixture()
  player.play('a'); contexts[0].handlers.error()
  assert.equal(states.at(-1).phase,'error')
  assert.match(states.at(-1).error,/没能播放/)
  player.play('a'); contexts[1].handlers.play()
  assert.equal(states.at(-1).phase,'playing')
  const failures=[]
  createLessonPlayer(()=>{throw new Error('unavailable')},s=>failures.push(s)).play('a')
  assert.equal(failures.at(-1).phase,'error')
})

test('textbook vocabulary is available by book and Module without invented audio', () => {
  const upper = wordPool('',null,{book:'upper'})
  const lower = wordPool('',null,{book:'lower'})
  assert.equal(upper.length+lower.length,173)
  assert.equal(wordPool('',null,{book:'base'}).length,288)
  assert.ok(upper.every(entry=>entry.topic.startsWith('四上M')))
  assert.ok(lower.every(entry=>entry.topic.startsWith('四下M')))
  assert.equal(wordPool('四上M1 问路与方位',null,{book:'upper'}).length,10)
  assert.equal(wordPool('四上M1 问路与方位',null,{book:'lower'}).length,0)
  assert.equal(wordPool('',null,{book:'upper',mode:'listen'}).length,0)
  assert.equal(wordPool('',null,{mode:'listen'}).length,288)
  for (const entry of [...upper,...lower]) {
    assert.equal(hasWordAudio(entry.id),false)
    assert.throws(()=>buildWordRound(entry.id,'listen'),/暂无|尚无/)
    const round = buildWordRound(entry.id,'meaning',()=>.2)
    assert.equal(new Set(round.choices).size,3)
    assert.ok(round.choices.includes(entry.id))
    assert.ok(round.choices.every(id=>words.find(word=>word.id===id).topic===entry.topic))
    assert.equal(buildWordRound(entry.id,'write').mode,'write')
    assert.equal(inputResult(entry.id,entry.title).correct,true)
  }
})
test('independent spelling accepts case and final punctuation but requires actual phrase boundaries', () => {
  assert.equal(inputResult('en-apple','  APPLE! ').correct,true)
  assert.equal(inputResult('en-next-to','next to').correct,true)
  assert.equal(inputResult('en-next-to','nextto').correct,false)
  assert.equal(inputResult('en-next-to','next   to').correct,true)
  assert.equal(inputResult('en-apple','apple orange').correct,false)
  assert.throws(()=>inputResult('no-word','apple'))
})
