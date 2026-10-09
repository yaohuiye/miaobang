import test from 'node:test'
import assert from 'node:assert/strict'
import poems from '../data/poems.js'
import { compositions, compositionById } from '../data/compositions.mjs'
import { englishTextbook } from '../data/knowledge/english-textbook.mjs'
import { english } from '../data/knowledge/english.mjs'

const allPoems = poems.flat(2)
const added = allPoems.filter(poem => poem.id.startsWith('mb-'))
const PINYIN = /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+$/

test('poetry library holds 127 pieces including the grade-4 classics texts', () => {
  assert.equal(allPoems.length, 127)
  assert.equal(added.length, 13)
  const titles = added.map(poem => poem.title)
  for (const title of ['精卫填海', '王戎不取道旁李', '囊萤夜读', '铁杵成针', '竹里馆', '相思', '杂诗（其二）', '山中送别', '秋浦歌（其十五）', '七步诗', '逢雪宿芙蓉山主人', '赠花卿', '秋夕']) assert.ok(titles.includes(title), title)
  const jingwei = added.find(poem => poem.title === '精卫填海')
  const wangrong = added.find(poem => poem.title === '王戎不取道旁李')
  const nangying = added.find(poem => poem.title === '囊萤夜读')
  const tiechu = added.find(poem => poem.title === '铁杵成针')
  assert.equal(jingwei.author, '《山海经·北山经》')
  assert.equal(wangrong.author, '《世说新语·雅量》')
  assert.equal(nangying.author, '《晋书·车胤传》')
  assert.equal(tiechu.author, '《方舆胜览》')
  assert.equal(jingwei.keywords.includes('四年级上册'), true)
  assert.equal(wangrong.keywords.includes('四年级上册'), true)
  assert.equal(nangying.keywords.includes('四年级下册'), true)
  assert.equal(tiechu.keywords.includes('四年级下册'), true)
  for (const poem of added.filter(item => item !== jingwei && item !== wangrong)) assert.ok(['唐', '三国魏', '宋'].includes(poem.dynasty), poem.title)
})
test('every poem line aligns characters with pinyins, one pinyin per character', () => {
  const misaligned = allPoems.flatMap(poem => poem.lines.filter(line => line.characters.length !== line.pinyins.length).map(line => poem.title))
  assert.deepEqual(misaligned, [])
})
test('added pieces carry complete, lowercase tone-marked pinyin and unique titles', () => {
  for (const poem of added) {
    for (const line of poem.lines) {
      assert.equal(line.pinyins.length, line.characters.length, poem.title)
      for (const pinyin of line.pinyins) assert.match(pinyin, PINYIN, `${poem.title}: ${line.characters.join('')}`)
    }
    assert.ok(poem.annotations.length && poem.annotations[0].translation.length && poem.annotations[0].annotation.length, poem.title)
  }
  const titles = added.map(poem => poem.title)
  assert.equal(new Set(titles).size, titles.length)
})
test('added pinyin spot checks match the expected readings', () => {
  const qibushi = added.find(poem => poem.title === '七步诗')
  assert.equal(qibushi.lines[0].characters.join(''), '煮豆燃豆萁')
  assert.deepEqual(qibushi.lines[0].pinyins, ['zhǔ', 'dòu', 'rán', 'dòu', 'qí'])
  const jingwei = added.find(poem => poem.title === '精卫填海')
  assert.equal(jingwei.lines[0].characters.join(''), '炎帝之少女')
  assert.deepEqual(jingwei.lines[0].pinyins, ['yán', 'dì', 'zhī', 'shào', 'nǚ'])
  const wangrong = added.find(poem => poem.title === '王戎不取道旁李')
  assert.equal(wangrong.lines.find(line => line.characters.join('') === '唯戎不动').pinyins.join(' '), 'wéi róng bú dòng')
  const nangying = added.find(poem => poem.title === '囊萤夜读')
  assert.equal(nangying.lines.find(line => line.characters.join('') === '胤恭勤不倦').pinyins.join(' '), 'yìn gōng qín bú juàn')
  assert.equal(nangying.lines.find(line => line.characters.join('') === '夏月则练囊盛数十萤火').pinyins[5], 'chéng')
  const tiechu = added.find(poem => poem.title === '铁杵成针')
  assert.equal(tiechu.lines.find(line => line.characters.join('') === '逢老媪方磨铁杵').pinyins.join(' '), 'féng lǎo ǎo fāng mó tiě chǔ')
  assert.equal(tiechu.lines.find(line => line.characters.join('') === '还卒业').pinyins.join(' '), 'huán zú yè')
})

test('compositions cover the eight textbook writing units of grade 4 volume 1', () => {
  assert.equal(compositions.length, 8)
  assert.deepEqual(compositions.map(item => item.unit), Array.from({ length: 8 }, (_, index) => `第${['一', '二', '三', '四', '五', '六', '七', '八'][index]}单元`))
  assert.deepEqual(compositions.map(item => item.topic), ['推荐一个好地方', '小小"动物园"', '写观察日记', '我和____过一天', '生活万花筒', '记一次游戏', '写信', '我的心儿怦怦跳'])
  assert.equal(new Set(compositions.map(item => item.id)).size, 8)
  for (const item of compositions) {
    assert.equal(compositionById.get(item.id), item)
    assert.ok(item.genre && item.words > 0, item.id)
    assert.ok(item.tips.length >= 3, item.id)
    assert.ok(item.prompts.length >= 2, item.id)
    assert.ok(item.sample.title, item.id)
    assert.ok(item.sample.paragraphs.length >= 4, item.id)
    assert.ok(item.sample.paragraphs.join('').length >= 250, item.id)
    for (const paragraph of item.sample.paragraphs) assert.ok(typeof paragraph === 'string' && paragraph.trim(), item.id)
  }
})

test('textbook words cover all twenty modules of FLTRP grade 4 without reusing reviewed words', () => {
  assert.equal(englishTextbook.length, 173)
  const topics = [...new Set(englishTextbook.map(entry => entry.topic))]
  assert.equal(topics.length, 20)
  for (const volume of ['四上', '四下']) {
    for (let module = 1; module <= 10; module += 1) {
      const topic = topics.find(name => name.startsWith(`${volume}M${module} `))
      assert.ok(topic, `${volume}M${module}`)
      assert.ok(englishTextbook.filter(entry => entry.topic === topic).length >= 3, topic)
    }
  }
  const ids = englishTextbook.map(entry => entry.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const entry of englishTextbook) {
    assert.ok(entry.id.startsWith('enb-'), entry.id)
    assert.equal(entry.subject, 'english')
    assert.equal(entry.level, '课本同步')
    for (const key of ['title', 'summary', 'explanation', 'example', 'tip', 'talk']) assert.ok(typeof entry[key] === 'string' && entry[key].trim(), entry.id)
    assert.ok(entry.example.includes('\n'), entry.id)
    assert.equal(entry.quiz.options.length, 3, entry.id)
    assert.equal(new Set(entry.quiz.options).size, 3, entry.id)
    assert.equal(entry.quiz.options.filter(option => option === entry.quiz.answer).length, 1, entry.id)
  }
  const lower = title => title.trim().toLowerCase()
  const existing = new Set(english.map(entry => lower(entry.title)))
  const overlap = englishTextbook.filter(entry => existing.has(lower(entry.title))).map(entry => entry.title)
  assert.deepEqual(overlap, [])
  assert.equal(english.length + englishTextbook.length, 473)
})
