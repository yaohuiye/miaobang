import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { privatePortraitPath } from '../family/portraits.mjs'

const source = readFileSync(new URL('../components/family-portrait/family-portrait.vue', import.meta.url), 'utf8')
const template = source.match(/<template>([\s\S]*?)<\/template>/)[1]
const privateImage = template.match(/<image\b[^>]*class="[^"]*\bportrait-private\b[^"]*"[^>]*>/)[0]
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/^import .*$/gm, '').replace('export default', 'const component =')

// Run the real component script and template handlers, as the page tests do.
function fixture(pose = 'ready') {
  const component = runInNewContext(`${script}\ncomponent`, { privatePortraitPath })
  const state = Object.fromEntries(Object.entries(component.props).map(([name, prop]) => [name, prop.default]))
  Object.assign(state, component.data(), { pose })
  for (const [name, method] of Object.entries(component.methods)) state[name] = method.bind(state)
  for (const [name, computed] of Object.entries(component.computed)) {
    Object.defineProperty(state, name, { get: computed.bind(state) })
  }
  return {
    state,
    get loadedClass() { return runInNewContext(`(${template.match(/:class="([^"]+)"/)[1]})`, state)['portrait-loaded'] },
    get imageRendered() { return runInNewContext(privateImage.match(/v-if="([^"]+)"/)[1], state) },
    event(name) {
      const handler = privateImage.match(new RegExp(`@${name}="([^"]+)"`))[1]
      const result = runInNewContext(handler, state)
      if (typeof result === 'function') result()
    },
    setPose(value) {
      const previous = state.source
      state.pose = value
      if (state.source !== previous) component.watch.source.call(state)
    }
  }
}

test('family artwork paths use the eight local poses and safely default to ready', () => {
  for (const pose of ['ready', 'thinking', 'discovery', 'celebrate', 'cheer', 'jump', 'father', 'mother']) {
    assert.equal(privatePortraitPath(pose), `/static/private-family/${pose}-v1.png`)
  }
  for (const pose of ['', null, undefined, '../photo', 'https://example.com/photo']) {
    assert.equal(privatePortraitPath(pose), '/static/private-family/ready-v1.png')
  }
})

test('portrait retains its original image, slot or symbol until the private image loads', () => {
  const f = fixture()
  assert.equal(f.state.fallback, '/static/puzzle/robot-miao.png')
  assert.equal(f.state.loaded, false)
  assert.equal(f.state.failed, false)
  assert.equal(f.loadedClass, false)
  assert.equal(f.imageRendered, true)
  assert.match(template, /<slot>[\s\S]*v-if="fallbackSymbol"[\s\S]*<image v-else :src="fallback"[\s\S]*<\/slot>/)
  assert.match(source, /\.portrait-private\s*\{[^}]*opacity:0/)
  assert.match(source, /\.portrait-loaded \.portrait-fallback\s*\{[^}]*visibility:hidden/)
  assert.match(source, /\.portrait-loaded \.portrait-private\s*\{[^}]*opacity:1/)
  f.event('load')
  assert.equal(f.state.loaded, true)
  assert.equal(f.state.failed, false)
  assert.equal(f.loadedClass, true)
  assert.equal(f.imageRendered, true)
})

test('missing private artwork keeps the fallback visible and removes the failed image', () => {
  const f = fixture()
  f.event('error')
  assert.equal(f.state.loaded, false)
  assert.equal(f.state.failed, true)
  assert.equal(f.loadedClass, false)
  assert.equal(f.imageRendered, false)
})

test('changing pose resets both a successful and failed image before the next load', () => {
  for (const outcome of ['load', 'error']) {
    const f = fixture()
    f.event(outcome)
    f.setPose('thinking')
    assert.equal(f.state.source, '/static/private-family/thinking-v1.png')
    assert.equal(f.state.loaded, false)
    assert.equal(f.state.failed, false)
    assert.equal(f.loadedClass, false)
    assert.equal(f.imageRendered, true)
    f.event('load')
    assert.equal(f.loadedClass, true)
    f.event('error')
    assert.equal(f.loadedClass, false)
    assert.equal(f.imageRendered, false)
    f.setPose('celebrate')
    assert.equal(f.state.source, '/static/private-family/celebrate-v1.png')
    assert.equal(f.loadedClass, false)
    assert.equal(f.imageRendered, true)
  }
})
