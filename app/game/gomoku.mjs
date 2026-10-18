const directions = [[0,1], [1,0], [1,1], [1,-1]]
const inside = (board, row, col) => row >= 0 && row < board.length && col >= 0 && col < board.length
const vacant = (board, row, col) => inside(board,row,col) && board[row][col] === 0
const validPlayer = player => player === 1 || player === 2

export function emptyBoard(size = 15) {
  if (!Number.isInteger(size) || size < 5) throw new RangeError('棋盘边长需要是至少 5 的整数。')
  return Array.from({length:size}, () => Array(size).fill(0))
}

export function placeStone(board, row, col, player) {
  if (!Number.isInteger(row) || !Number.isInteger(col) || !inside(board,row,col)) throw new RangeError('请落在棋盘的交叉点上。')
  if (!validPlayer(player)) throw new Error('棋子需要是黑子或白子。')
  if (board[row][col] !== 0) throw new Error('这里已经有棋子了，换一个空位吧。')
  return board.map((line,index) => line.map((stone,column) => index === row && column === col ? player : stone))
}

// The center can be an existing stone or a proposed move; only straight runs are counted.
function lineInfo(board, row, col, player, dr, dc) {
  let before = 0, after = 0
  while (inside(board,row-(before+1)*dr,col-(before+1)*dc) && board[row-(before+1)*dr][col-(before+1)*dc] === player) before++
  while (inside(board,row+(after+1)*dr,col+(after+1)*dc) && board[row+(after+1)*dr][col+(after+1)*dc] === player) after++
  const openBefore = vacant(board,row-(before+1)*dr,col-(before+1)*dc)
  const openAfter = vacant(board,row+(after+1)*dr,col+(after+1)*dc)
  const length = before + after + 1, openEnds = Number(openBefore) + Number(openAfter)
  const roomForOpenFour = openEnds === 2 && (vacant(board,row-(before+2)*dr,col-(before+2)*dc) || vacant(board,row+(after+2)*dr,col+(after+2)*dc))
  const kind = length >= 5 ? 'five' : length === 4 && openEnds === 2 ? 'open-four' : length === 4 && openEnds === 1 ? 'closed-four' : length === 3 && roomForOpenFour ? 'straight-open-three' : length === 2 && openEnds === 2 ? 'straight-open-two' : 'other'
  return {dr,dc,before,after,length,openEnds,kind}
}

export function analyzeStraightLines(board, row, col) {
  if (!Number.isInteger(row) || !Number.isInteger(col) || !inside(board,row,col) || !validPlayer(board[row][col])) return []
  return directions.map(([dr,dc]) => {
    const {length,openEnds,kind} = lineInfo(board,row,col,board[row][col],dr,dc)
    return {dr,dc,length,openEnds,kind}
  })
}

export function winningLine(board, row, col) {
  if (!Number.isInteger(row) || !Number.isInteger(col) || !inside(board,row,col) || !validPlayer(board[row][col])) return []
  for (const [dr,dc] of directions) {
    const line = lineInfo(board,row,col,board[row][col],dr,dc)
    if (line.length >= 5) return Array.from({length:line.length}, (_,index) => ({row:row+(index-line.before)*dr,col:col+(index-line.before)*dc}))
  }
  return []
}

export const boardFull = board => board.every(line => line.every(stone => stone !== 0))
const hasWinner = board => board.some((line,row) => line.some((stone,col) => validPlayer(stone) && winningLine(board,row,col).length > 0))
const ended = board => boardFull(board) || hasWinner(board)

function immediateMoves(board, player) {
  const moves = []
  for (let row = 0; row < board.length; row++) for (let col = 0; col < board.length; col++) {
    if (vacant(board,row,col) && directions.some(([dr,dc]) => lineInfo(board,row,col,player,dr,dc).length >= 5)) moves.push({row,col})
  }
  return moves
}

export function winningMoves(board, player) {
  if (!validPlayer(player)) throw new Error('棋子需要是黑子或白子。')
  return ended(board) ? [] : immediateMoves(board,player)
}

function nearbyMoves(board) {
  const moves = []
  let occupied = false
  for (let row = 0; row < board.length; row++) for (let col = 0; col < board.length; col++) {
    if (board[row][col] !== 0) { occupied = true; continue }
    let near = false
    for (let dr = -2; dr <= 2 && !near; dr++) for (let dc = -2; dc <= 2; dc++) {
      if (inside(board,row+dr,col+dc) && board[row+dr][col+dc] !== 0) { near = true; break }
    }
    if (near) moves.push({row,col})
  }
  return occupied ? moves : [{row:Math.floor(board.length/2),col:Math.floor(board.length/2)}]
}

function shapeScore(board, row, col, player) {
  let score = 0
  for (const [dr,dc] of directions) {
    const line = lineInfo(board,row,col,player,dr,dc)
    score += line.kind === 'open-four' ? 18000 : line.kind === 'closed-four' ? 6000 : line.kind === 'straight-open-three' ? 1400 : line.kind === 'straight-open-two' ? 120 : line.length === 3 && line.openEnds ? 170 : 0
    // Five-cell windows also notice gaps, without labelling every broken shape a live three.
    for (let start = -4; start <= 0; start++) {
      let stones = 0, blocked = false
      for (let step = start; step < start+5; step++) {
        const r = row+step*dr, c = col+step*dc
        if (!inside(board,r,c) || (step !== 0 && board[r][c] !== 0 && board[r][c] !== player)) { blocked = true; break }
        if (step === 0 || board[r][c] === player) stones++
      }
      if (!blocked) score += stones === 4 ? 900 : stones === 3 ? 60 : stones === 2 ? 8 : 0
    }
  }
  return score
}

function centerScore(board, move) {
  const center = (board.length-1)/2
  return 30 - Math.abs(move.row-center) - Math.abs(move.col-center)
}

function pick(moves, score, random, gentle = false) {
  const ranked = moves.map(move => ({...move,score:score(move)})).sort((a,b) => b.score-a.score || a.row-b.row || a.col-b.col)
  const best = ranked[0]
  if (!best) return null
  const choices = ranked.filter(move => gentle ? move.score >= best.score * .94 : move.score === best.score).slice(0,gentle ? 3 : ranked.length)
  const sample = typeof random === 'function' ? random() : 0
  const value = Number.isFinite(sample) ? Math.max(0,Math.min(.999999999,sample)) : 0
  const chosen = choices[Math.floor(value*choices.length)]
  return {row:chosen.row,col:chosen.col}
}

export function chooseGomokuMove(board, player = 2, {level = 'gentle', random = Math.random} = {}) {
  if (!validPlayer(player)) throw new Error('棋子需要是黑子或白子。')
  if (ended(board)) return null
  const finish = immediateMoves(board,player)
  if (finish.length) return {...pick(finish,move => centerScore(board,move),random),kind:'win',reason:'这里落下一子，就能把这条线连成至少五颗。先找找这样的机会吧。'}
  const threats = immediateMoves(board,3-player)
  if (threats.length) return {...pick(threats,move => centerScore(board,move),random),kind:'block',reason:threats.length > 1 ? '对手有不止一个下一步连五的空位。先挡住这里，另一处仍有威胁。' : '对手下一步能在这里连成五颗，先占住这个空位。'}
  const moves = nearbyMoves(board)
  const move = pick(moves, spot => shapeScore(board,spot.row,spot.col,player) + shapeScore(board,spot.row,spot.col,3-player)*(level === 'thoughtful' ? 1 : .65) + centerScore(board,spot),random,level !== 'thoughtful')
  if (!move) return null
  const lines = directions.map(([dr,dc]) => lineInfo(board,move.row,move.col,player,dr,dc))
  const reason = lines.some(line => line.kind === 'open-four') ? '这里能连出两头都有空位的四颗。落子后，再看看对手怎样回应。' : lines.some(line => line.kind === 'straight-open-three') ? '这里能连出直活三，下一步有机会继续接成活四。也要留意对手的新棋。' : lines.some(line => line.length >= 2) ? '试着在这里把自己的棋子连起来，同时观察横、竖和两个斜方向。' : '先靠近棋盘中间和已有棋子，给接下来的连线留些空间。'
  return {...move,kind:moves.length === 1 && board.every(line => line.every(stone => stone === 0)) ? 'center' : 'shape',reason}
}

export const coachMove = (board, player = 1) => chooseGomokuMove(board,player,{level:'thoughtful',random:() => 0})
