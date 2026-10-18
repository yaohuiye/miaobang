import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { emptyBoard, placeStone, winningLine, boardFull, winningMoves, analyzeStraightLines, chooseGomokuMove, coachMove } from '../game/gomoku.mjs'

const put = (board, stones, player = 1) => stones.reduce((next,[row,col]) => placeStone(next,row,col,player),board)
const legal = (board,move) => assert.ok(move && Number.isInteger(move.row) && Number.isInteger(move.col) && move.row >= 0 && move.col >= 0 && move.row < board.length && move.col < board.length && board[move.row][move.col] === 0)

test('boards default to 15 by 15, support training size, and never share rows', () => {
  const board = emptyBoard()
  assert.equal(board.length,15)
  assert.ok(board.every(row => row.length === 15 && row.every(stone => stone === 0)))
  assert.equal(emptyBoard(9).length,9)
  board[0][0] = 1
  assert.equal(board[1][0],0)
  for (const size of [0,4,8.5,NaN]) assert.throws(() => emptyBoard(size),RangeError)
})

test('placing a stone copies every row, keeps the source intact and rejects illegal coordinates or occupied points', () => {
  const board = emptyBoard(9)
  board.forEach(Object.freeze)
  Object.freeze(board)
  const next = placeStone(board,4,4,1)
  assert.equal(next[4][4],1)
  assert.equal(board[4][4],0)
  assert.ok(next.every((row,index) => row !== board[index]))
  assert.throws(() => placeStone(next,4,4,2),/已经有/)
  for (const [row,col] of [[-1,0],[9,0],[0,9],[1.2,0],[NaN,0]]) assert.throws(() => placeStone(board,row,col,1),RangeError)
  for (const player of [0,3,'1']) assert.throws(() => placeStone(board,0,0,player))
})

test('horizontal, vertical and both diagonal lines win; a missing stone never wins', () => {
  for (const [row,col,dr,dc] of [[2,1,0,1],[1,2,1,0],[1,1,1,1],[1,7,1,-1]]) {
    const stones = Array.from({length:5},(_,index) => [row+index*dr,col+index*dc])
    const board = put(emptyBoard(9),stones)
    assert.equal(winningLine(board,row+2*dr,col+2*dc).length,5)
    assert.deepEqual(winningLine(board,row+2*dr,col+2*dc),stones.map(([r,c]) => ({row:r,col:c})))
    assert.deepEqual(winningLine(put(emptyBoard(9),stones.filter((_,index) => index !== 2)),row,col),[])
  }
})

test('edges do not wrap into false five-in-a-row, and six or more consecutive stones win', () => {
  const wrapped = put(emptyBoard(9),[[0,6],[0,7],[0,8],[1,0],[1,1]])
  for (const [row,col] of [[0,6],[0,8],[1,0]]) assert.deepEqual(winningLine(wrapped,row,col),[])
  const overline = put(emptyBoard(9),Array.from({length:7},(_,col) => [0,col]))
  assert.equal(winningLine(overline,0,3).length,7)
  assert.deepEqual(winningLine(overline,-1,0),[])
  assert.deepEqual(winningLine(overline,8,8),[])
})

test('winning moves include both ends and interior gaps without changing the board', () => {
  const board = put(emptyBoard(9),[[4,2],[4,3],[4,4],[4,5]])
  const before = JSON.stringify(board)
  assert.deepEqual(winningMoves(board,1),[{row:4,col:1},{row:4,col:6}])
  assert.equal(JSON.stringify(board),before)
  const gap = put(emptyBoard(9),[[1,1],[2,2],[4,4],[5,5]],2)
  assert.deepEqual(winningMoves(gap,2),[{row:3,col:3}])
})

test('straight analysis distinguishes open four, closed four, real straight three and cramped or broken threes', () => {
  const openFour = put(emptyBoard(9),[[4,2],[4,3],[4,4],[4,5]])
  assert.equal(analyzeStraightLines(openFour,4,3)[0].kind,'open-four')
  assert.equal(analyzeStraightLines(placeStone(openFour,4,1,2),4,3)[0].kind,'closed-four')
  const openThree = put(emptyBoard(9),[[4,3],[4,4],[4,5]])
  assert.equal(analyzeStraightLines(openThree,4,4)[0].kind,'straight-open-three')
  const cramped = put(openThree,[[4,1],[4,7]],2)
  assert.equal(analyzeStraightLines(cramped,4,4)[0].openEnds,2)
  assert.equal(analyzeStraightLines(cramped,4,4)[0].kind,'other')
  const edge = put(emptyBoard(9),[[4,1],[4,2],[4,3],[4,5]])
  assert.equal(analyzeStraightLines(edge,4,2)[0].kind,'other')
  const broken = put(emptyBoard(9),[[4,2],[4,3],[4,5]])
  assert.ok(analyzeStraightLines(broken,4,3).every(line => line.kind !== 'straight-open-three'))
})

test('both practice levels and coach finish their own five before blocking an opponent', () => {
  let board = put(emptyBoard(9),[[2,1],[2,2],[2,3],[2,4]],2)
  board = put(board,[[6,2],[6,3],[6,4],[6,5]],1)
  for (const level of ['gentle','thoughtful']) {
    const move = chooseGomokuMove(board,2,{level,random:() => .5})
    assert.equal(move.kind,'win')
    assert.equal(move.row,2)
    assert.ok(winningLine(placeStone(board,move.row,move.col,2),move.row,move.col).length >= 5)
  }
  assert.equal(coachMove(board,2).kind,'win')
})

test('practice blocks a single immediate win and admits a second threat when it cannot block both', () => {
  const threat = put(emptyBoard(9),[[4,2],[4,3],[4,4],[4,5]])
  const single = placeStone(threat,4,1,2)
  for (const level of ['gentle','thoughtful']) {
    const move = chooseGomokuMove(single,2,{level,random:() => 1})
    assert.deepEqual({row:move.row,col:move.col},{row:4,col:6})
    assert.equal(move.kind,'block')
  }
  const move = chooseGomokuMove(threat,2,{random:() => 0})
  assert.equal(move.kind,'block')
  assert.match(move.reason,/另一处仍有威胁/)
  assert.equal(winningMoves(placeStone(threat,move.row,move.col,2),1).length,1)
})

test('practice starts at the center, stays legal with bounded or malformed random samples, and never mutates input', () => {
  for (const size of [9,15]) {
    const board = emptyBoard(size)
    const move = chooseGomokuMove(board)
    assert.deepEqual({row:move.row,col:move.col},{row:Math.floor(size/2),col:Math.floor(size/2)})
    assert.equal(move.kind,'center')
    const midgame = put(board,[[4,4],[4,5]],1)
    const before = JSON.stringify(midgame)
    for (const sample of [-8,0,.5,1,Infinity,NaN,'0.5']) for (const level of ['gentle','thoughtful']) legal(midgame,chooseGomokuMove(midgame,2,{level,random:() => sample}))
    legal(midgame,chooseGomokuMove(midgame,2,{random:null}))
    legal(midgame,coachMove(midgame))
    assert.equal(JSON.stringify(midgame),before)
  }
})

test('finished games and drawn boards receive no more suggestions', () => {
  const winner = put(emptyBoard(9),[[0,0],[0,1],[0,2],[0,3],[0,4]])
  assert.equal(boardFull(winner),false)
  for (const player of [1,2]) {
    assert.deepEqual(winningMoves(winner,player),[])
    assert.equal(chooseGomokuMove(winner,player),null)
    assert.equal(coachMove(winner,player),null)
  }
  const draw = emptyBoard(9).map((line,row) => line.map((_,col) => (Math.floor(row/2)+col)%2+1))
  assert.equal(boardFull(draw),true)
  assert.ok(draw.every((line,row) => line.every((_,col) => winningLine(draw,row,col).length === 0)))
  assert.equal(chooseGomokuMove(draw),null)
  assert.deepEqual(winningMoves(draw,1),[])
})

test('the offline engine works with older Android JavaScript APIs', () => {
  const result = spawnSync(process.execPath,['--input-type=module','-e',`
    String.prototype.replaceAll = undefined
    Object.hasOwn = undefined
    const { emptyBoard, placeStone, chooseGomokuMove, coachMove } = await import('./game/gomoku.mjs')
    const board = placeStone(emptyBoard(15),7,7,1)
    if (!chooseGomokuMove(board) || !coachMove(board)) process.exit(1)
  `],{cwd:new URL('..',import.meta.url),encoding:'utf8'})
  assert.equal(result.status,0,result.stderr || result.stdout)
})
