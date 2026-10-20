import test from 'node:test'
import assert from 'node:assert/strict'
import { winningLine, winningMoves, placeStone } from '../game/gomoku.mjs'
import { tacticalPuzzles, createTacticalAttempt, playTacticalMove, tacticalHint, markTacticalHelp } from '../game/gomoku-tactics.mjs'

const same = (a,b) => a.row === b.row && a.col === b.col
const vacancies = board => board.flatMap((line,row) => line.flatMap((stone,col) => stone === 0 ? [{row,col}] : []))
const wins = (board,player) => board.some((line,row) => line.some((stone,col) => stone === player && winningLine(board,row,col).length > 0))
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) } return value }

// This proof does not use the model's opponent policy or its private solver.
// At every attacker move it exhausts EVERY legal defender reply. An unblocked
// point may be finished immediately; the unique forced block is followed deeper.
function verifyEveryReply(state, turnsLeft, counters) {
  assert.ok(turnsLeft > 0, 'reference solution exceeded its announced length')
  const hint = tacticalHint(state)
  assert.ok(hint, 'a proven line must have another decision')
  const player = state.turn, opponent = 3-player
  const after = placeStone(state.board,hint.row,hint.col,player)
  if (winningLine(after,hint.row,hint.col).length) return
  assert.ok(turnsLeft > 1, 'the last announced attacker move must really win')
  const threat = winningMoves(after,player)
  assert.ok(threat.length > 0, 'the reference line must actually threaten five')
  for (const reply of vacancies(after)) {
    counters.replies++
    const response = placeStone(after,reply.row,reply.col,opponent)
    assert.equal(winningLine(response,reply.row,reply.col).length,0,'defender can win instead of blocking')
    if (winningMoves(response,player).length) continue
    counters.forcedBlocks++
    assert.ok(threat.some(move => same(move,reply)), 'a non-block unexpectedly stopped all wins')
    verifyEveryReply({...state,board:response,childTurns:state.childTurns+1},turnsLeft-1,counters)
  }
}

test('six original positions are legal, nonterminal and have no one-move child win', () => {
  assert.ok(tacticalPuzzles.length >= 6)
  assert.equal(new Set(tacticalPuzzles.map(p => p.id)).size,tacticalPuzzles.length)
  for (const puzzle of tacticalPuzzles) {
    for (const key of ['title','topic','goal','prompt','hint']) assert.ok(puzzle[key]?.length > 0)
    for (const key of ['idea','trap','reflection']) assert.ok(puzzle.teaching[key]?.length > 0)
    const state = createTacticalAttempt(puzzle.id)
    const black = state.board.flat().filter(stone => stone === 1).length
    const white = state.board.flat().filter(stone => stone === 2).length
    assert.equal(black,white,`${puzzle.id}: black to play must follow equal counts`)
    assert.equal(wins(state.board,1),false)
    assert.equal(wins(state.board,2),false)
    assert.equal(winningMoves(state.board,puzzle.toPlay).length,0,`${puzzle.id}: cannot already finish in one`)
    assert.deepEqual(JSON.parse(JSON.stringify(state)),state)
  }
})

test('every legal defender response to all four reference attacks still permits real five', () => {
  const counters = {replies:0,forcedBlocks:0}
  for (const puzzle of tacticalPuzzles.filter(p => p.kind === 'attack')) {
    verifyEveryReply(createTacticalAttempt(puzzle.id),puzzle.maxTurns,counters)
  }
  assert.ok(counters.replies > 500,`only ${counters.replies} defender replies checked`)
  assert.ok(counters.forcedBlocks >= 5)
})

test('all six tasks require multiple decisions and real opponent stones', () => {
  for (const puzzle of tacticalPuzzles) {
    let state = createTacticalAttempt(puzzle.id)
    const snapshots = []
    while (state.status === 'playing' && state.childTurns < 5) {
      snapshots.push(JSON.stringify(state))
      const hint = tacticalHint(state)
      assert.ok(hint)
      state = playTacticalMove(state,hint.row,hint.col)
      if (state.childTurns === 1) assert.equal(state.status,'playing')
      assert.equal(state.mistakes,0)
    }
    assert.equal(state.status,puzzle.kind === 'attack' ? 'won' : 'defended',puzzle.id)
    assert.equal(state.childTurns,puzzle.kind === 'attack' ? puzzle.maxTurns : 2,puzzle.id)
    assert.equal(state.history.length,state.childTurns*2-1)
    state.history.forEach((move,index) => assert.equal(move.role,index%2 ? 'opponent' : 'child'))
    const last = state.history.at(-1)
    if (puzzle.kind === 'attack') assert.ok(winningLine(state.board,last.row,last.col).length >= 5)
    else {
      assert.equal(wins(state.board,1),false,'defending a local line is not a full-game win')
      assert.equal(wins(state.board,2),false)
      assert.equal(winningMoves(state.board,2).length,0)
      assert.match(state.feedback,/不是全盘胜负/)
    }
    assert.deepEqual(playTacticalMove(state,0,4),state,'a completed task must not continue placing stones')
    assert.equal(tacticalHint(state),null)
    assert.ok(snapshots.every(json => JSON.parse(json).status === 'playing'))
  }
})

test('both ends of the vertical attacking continuation are accepted, rather than a fixed answer script', () => {
  for (const id of ['turn-the-corner','leave-the-gap']) for (const continuation of [{row:1,col:5},{row:5,col:5}]) {
    let state = playTacticalMove(createTacticalAttempt(id),4,5)
    state = playTacticalMove(state,continuation.row,continuation.col)
    assert.equal(state.status,'playing','a live four must still be finished on the board')
    assert.equal(state.mistakes,0)
    const finish = winningMoves(state.board,1)
    assert.equal(finish.length,1,'the opponent actually blocked one of the two winning points')
    state = playTacticalMove(state,finish[0].row,finish[0].col)
    assert.equal(state.status,'won')
    assert.equal(state.childTurns,3)
  }
})

test('both adjacent endpoints work for each live-three defense, followed by a different forced second block', () => {
  for (const puzzle of tacticalPuzzles.filter(p => p.kind === 'defense')) {
    const {start,dr,dc,length} = puzzle.defenseLine
    const ends = [{row:start.row-dr,col:start.col-dc},{row:start.row+length*dr,col:start.col+length*dc}]
    for (const first of ends) {
      let state = playTacticalMove(createTacticalAttempt(puzzle.id),first.row,first.col)
      assert.equal(state.status,'playing')
      const reply = state.history.at(-1)
      assert.ok(ends.some(move => !same(move,first) && same(move,reply)),'opponent extends the other end')
      const danger = winningMoves(state.board,2)
      assert.equal(danger.length,1)
      state = playTacticalMove(state,danger[0].row,danger[0].col)
      assert.equal(state.status,'defended')
      assert.equal(state.childTurns,2)
      assert.equal(state.mistakes,0)
    }
  }
})

test('filling the tempting gap shows the opponent taking the turning point, without falsely claiming the whole game is lost', () => {
  const state = playTacticalMove(createTacticalAttempt('leave-the-gap'),4,3)
  assert.equal(state.status,'playing')
  assert.equal(state.mistakes,1)
  assert.deepEqual(state.history.map(({row,col}) => ({row,col})),[{row:4,col:3},{row:4,col:5}])
  assert.equal(state.board[4][5],2)
  assert.equal(tacticalHint(state),null,'no heuristic should masquerade as a verified winning line')
  const continued = playTacticalMove(state,3,4)
  assert.equal(continued.childTurns,2,'a nonforcing move must allow actual continuation')
  assert.equal(continued.history.length,4)
})

test('ignoring an urgent winning point causes an actual opponent five', () => {
  const state = playTacticalMove(createTacticalAttempt('defend-with-tempo'),0,4)
  assert.equal(state.status,'lost')
  assert.equal(state.childTurns,1)
  assert.equal(state.mistakes,1)
  assert.equal(state.history.length,2)
  assert.ok(winningLine(state.board,4,3).length >= 5)
  assert.match(state.feedback,/连五/)
})

test('late defense visibly creates two threats, and blocking one still lets the opponent win at the other', () => {
  let state = playTacticalMove(createTacticalAttempt('stop-the-live-three'),0,4)
  assert.equal(state.status,'playing','the failure is demonstrated on the board, not preemptively marked lost')
  assert.equal(winningMoves(state.board,2).length,2)
  assert.equal(tacticalHint(state),null)
  const danger = winningMoves(state.board,2)
  state = playTacticalMove(state,danger[0].row,danger[0].col)
  assert.equal(state.status,'lost')
  assert.equal(state.childTurns,2)
  assert.equal(state.history.length,4)
  const last = state.history.at(-1)
  assert.equal(last.role,'opponent')
  assert.ok(winningLine(state.board,last.row,last.col).length >= 5)
})

test('a correct first defense does not waive the second decision', () => {
  let state = playTacticalMove(createTacticalAttempt('stop-the-diagonal'),1,1)
  state = playTacticalMove(state,0,4)
  assert.equal(state.status,'lost')
  assert.equal(state.childTurns,2)
  assert.equal(state.mistakes,1)
  const last = state.history.at(-1)
  assert.ok(winningLine(state.board,last.row,last.col).length >= 5)
})

test('hints, help markers, illegal clicks and valid turns preserve input snapshots and survive JSON round trips', () => {
  const state = freeze(createTacticalAttempt('turn-the-corner'))
  const json = JSON.stringify(state)
  const hint = tacticalHint(state)
  assert.ok(hint)
  assert.equal(JSON.stringify(state),json)
  const helped = markTacticalHelp(state)
  assert.equal(helped.assisted,true)
  assert.equal(state.assisted,false)
  for (const [row,col] of [[4,2],[-1,0],[9,0],[0,.5],[NaN,0]]) {
    const rejected = playTacticalMove(state,row,col)
    assert.equal(rejected.board,state.board)
    assert.equal(rejected.childTurns,0)
    assert.equal(rejected.mistakes,0)
    assert.equal(rejected.history,state.history)
  }
  const next = playTacticalMove(helped,hint.row,hint.col)
  assert.equal(next.assisted,true)
  assert.equal(next.childTurns,1)
  assert.equal(next.board[hint.row][hint.col],1)
  assert.equal(state.board[hint.row][hint.col],0)
  assert.equal(JSON.stringify(state),json)
  assert.deepEqual(JSON.parse(JSON.stringify(next)),next)
  assert.deepEqual(playTacticalMove(JSON.parse(JSON.stringify(helped)),hint.row,hint.col),next)
})
