// Optional, local-only artwork. The public app falls back to its original illustrations.
const poses = new Set(['ready', 'thinking', 'discovery', 'celebrate', 'cheer', 'jump', 'father', 'mother'])
export function privatePortraitPath(pose) {
  return `/static/private-family/${poses.has(pose) ? pose : 'ready'}-v1.png`
}
