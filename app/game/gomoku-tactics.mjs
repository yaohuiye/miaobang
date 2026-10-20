import { emptyBoard, placeStone, winningLine, chooseGomokuMove } from './gomoku.mjs'

const point = (row, col, player) => ({row,col,player})
const stones = (black, white) => [...black.map(([r,c]) => point(r,c,1)), ...white.map(([r,c]) => point(r,c,2))]
const quietWhite = [[0,0],[0,7],[7,0],[8,7]]
const attack = (id, title, topic, black, white, teaching, maxTurns = 3) => ({
  id,title,topic,kind:'attack',size:9,toPlay:1,maxTurns,
  goal:`把连续进攻下到真正连五。参考路线需要 ${maxTurns} 次自己的落子，对手会实际防守。`,
  prompt:'先想“我下这里，对手非挡哪里不可？”再找防守后留下的另一个方向。落子不会直接判过关。',
  hint:'沿一个方向冲四时，留意这颗棋能不能同时帮助另一个方向。',
  stones:stones(black,white),teaching
})

// These are original local positions, not extracted full-game records. All use the
// app's freestyle rules (five or more wins, no forbidden moves).
export const tacticalPuzzles = [
  attack('turn-the-corner','冲四以后，向哪里转？','横线逼防 → 竖线接力',
    [[4,2],[4,3],[4,4],[2,5],[3,5]], [[4,1],...quietWhite],
    {idea:'冲四的价值还在于让对手必须应手。第一颗进攻棋要同时接上另一条线。',trap:'只盯着横线上再加棋，会看不到被挡之后的竖向机会。',reflection:'对手每次为什么不能去别处下？哪一颗棋同时参加了两个方向？'}),
  attack('leave-the-gap','空缺一定要先补吗？','跳冲四 → 保留转向点',
    [[4,1],[4,2],[4,4],[2,5],[3,5]], [[4,0],...quietWhite],
    {idea:'中间有空缺的四颗，也可以迫使对手补那个空位。先比较“补缺口”和“保留缺口”之后的局面。',trap:'看见缺口就填，可能让对手恰好堵在你下一条线需要的位置。',reflection:'如果第一手先补缺口，对手会挡哪里？这与实际走法有什么不同？'}),
  attack('three-directions','第三个方向藏在哪里？','竖 → 横 → 斜，连续换方向',
    [[2,4],[3,4],[4,4],[5,6],[5,5],[3,5]], [[1,4],[5,7],[0,8],[7,8],[0,1],[7,0]],
    {idea:'第二次冲四仍然不是终点。把每次被迫防守后留下的棋子，当成下一条线的材料。',trap:'沿横线走到被封死才停下来，会漏掉早已接起来的斜线。',reflection:'你转了几次方向？每次转向以前，对手有没有不防守的选择？'},4),
  attack('defend-with-tempo','挡住以后，谁来进攻？','先救急，同时夺回先手',
    [[4,6],[4,5],[4,4],[6,3],[5,3]], [[8,7],[7,6],[6,5],[5,4],[4,7]],
    {idea:'对手已经有下一手连五的空位。先守住它，再观察这手防守是否也能迫使对手应手。',trap:'看到自己的三颗就急着进攻，会让对手先连成五。',reflection:'第一手同时解决了哪两个问题？防守为什么也可能是一手进攻？'}),
  {
    id:'stop-the-live-three',title:'活三要挡在哪里？',topic:'横向活三 → 再守冲四',kind:'defense',size:9,toPlay:1,
    goal:'连续作出两次防守决定，封住这条线的连五机会。这里只评化解这段威胁，不代表赢下全盘。',
    prompt:'白棋还没有四颗，为什么现在就需要处理？先比较紧挨三颗的空位与更远的空位。',
    hint:'先从这三颗紧邻的两端比较。防住一端以后，还要计算另一端伸长后的成五点。',
    stones:stones([[1,1],[1,7],[7,1]],[[4,3],[4,4],[4,5]]),
    defenseLine:{start:{row:4,col:3},dr:0,dc:1,length:3},
    teaching:{idea:'活三可以接成两头都能连五的活四。先在紧邻的一端落子，再防对手从另一端伸出的冲四。',trap:'只在远处拦一颗，白棋可能在中间接成活四；等到那时，一手挡不住两个成五点。',reflection:'为什么第一手挡远处来不及？第二次防守与第一次防守的理由一样吗？'}
  },
  {
    id:'stop-the-diagonal',title:'斜着的威胁也要算两步',topic:'斜线活三 → 两轮防守',kind:'defense',size:9,toPlay:1,
    goal:'连续防住斜线活三和随后的冲四，化解这一段威胁。防住这条线不等于已经获胜。',
    prompt:'换到斜线以后，先找三颗紧邻的两端，再预想白棋从另一头延长一格。',
    hint:'沿左上到右下数棋，而不是只看横、竖。第一手挡一头后，下一手还要再挡一次。',
    stones:stones([[1,7],[6,1],[7,6]],[[2,2],[3,3],[4,4]]),
    defenseLine:{start:{row:2,col:2},dr:1,dc:1,length:3},
    teaching:{idea:'棋形换了方向，算路的方法不变：找威胁、想回应、再检查下一手。',trap:'斜线上的空位不醒目，容易误以为离得远；需要沿同一方向逐格数。',reflection:'这道题与横向题相同的地方是什么？如果白棋从另一端伸长，你还会防吗？'}
  }
]

const puzzleById = Object.fromEntries(tacticalPuzzles.map(puzzle => [puzzle.id,puzzle]))
const directions = [[0,1],[1,0],[1,1],[1,-1]]
const inBoard = (board,row,col) => row >= 0 && col >= 0 && row < board.length && col < board.length
const empty = (board,row,col) => Number.isInteger(row) && Number.isInteger(col) && inBoard(board,row,col) && board[row][col] === 0
const coordinate = move => `${String.fromCharCode(65+move.col)}${move.row+1}`
const color = player => player === 1 ? '黑棋' : '白棋'
const windowsBySize = new Map()

function fiveWindows(size) {
  if (!windowsBySize.has(size)) {
    const result = []
    for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) for (const [dr,dc] of directions) {
      if (row+4*dr < 0 || row+4*dr >= size || col+4*dc < 0 || col+4*dc >= size) continue
      result.push(Array.from({length:5},(_,i) => ({row:row+i*dr,col:col+i*dc})))
    }
    windowsBySize.set(size,result)
  }
  return windowsBySize.get(size)
}

// Enumerating five-cell windows is bounded (140 windows on a 9×9 board). It
// includes broken fours and overlines without scanning an unbounded game tree.
function matchingWindows(board, player, count) {
  const result = new Map()
  for (const line of fiveWindows(board.length)) {
    let own = 0, blocked = false
    const vacant = []
    for (const move of line) {
      const value = board[move.row][move.col]
      if (value === player) own++
      else if (value === 0) vacant.push(move)
      else { blocked = true; break }
    }
    if (!blocked && own === count) for (const move of vacant) result.set(`${move.row},${move.col}`,move)
  }
  return [...result.values()]
}
const winPoints = (board, player) => matchingWindows(board,player,4)
const forcingCandidates = (board, player) => matchingWindows(board,player,3)

// A deliberately narrow proof: only continuous fours, at most four attacker
// turns and 800 candidate evaluations per request. Exhausting the budget only
// omits unproved routes; it cannot create a positive proof. A sole winning point forces that exact block; two distinct winning
// points cannot both be occupied by one reply. We check the defender cannot win
// immediately first. No heuristic score is treated as a proof of a forced win.
function forcingSolutions(board, player, turnsLeft, cache = new Map(), budget = {remaining:800}) {
  if (turnsLeft <= 0) return []
  const key = `${player}/${turnsLeft}/${board.flat().join('')}`
  if (cache.has(key)) return cache.get(key)
  const finish = winPoints(board,player)
  if (finish.length) return finish.map(move => ({...move,turns:1}))
  if (turnsLeft === 1) return []
  const opponent = 3-player, danger = winPoints(board,opponent)
  if (danger.length > 1) return []
  const candidates = danger.length ? danger : forcingCandidates(board,player)
  const solutions = []
  for (const move of candidates) {
    if (budget.remaining-- <= 0) break
    const next = placeStone(board,move.row,move.col,player)
    if (winPoints(next,opponent).length) continue
    const threats = winPoints(next,player)
    if (threats.length > 1) solutions.push({...move,turns:2})
    else if (threats.length === 1) {
      const reply = threats[0], afterReply = placeStone(next,reply.row,reply.col,opponent)
      const follow = forcingSolutions(afterReply,player,turnsLeft-1,cache,budget)
      if (follow.length) solutions.push({...move,turns:1+Math.min(...follow.map(item => item.turns))})
    }
  }
  solutions.sort((a,b) => a.turns-b.turns || a.row-b.row || a.col-b.col)
  cache.set(key,solutions)
  return solutions
}

function defenseEnds(puzzle) {
  const {start,dr,dc,length} = puzzle.defenseLine
  return [
    {row:start.row-dr,col:start.col-dc},
    {row:start.row+length*dr,col:start.col+length*dc}
  ]
}

function defensiveChoices(state, puzzle) {
  const danger = winPoints(state.board,3-puzzle.toPlay)
  if (danger.length) return danger.length === 1 ? danger : []
  return state.childTurns === 0 ? defenseEnds(puzzle).filter(move => empty(state.board,move.row,move.col)) : []
}

function lineDefended(board, puzzle) {
  const {start,dr,dc,length} = puzzle.defenseLine
  const opponent = 3-puzzle.toPlay
  let before = 0, after = length-1
  while (inBoard(board,start.row+(before-1)*dr,start.col+(before-1)*dc) && board[start.row+(before-1)*dr][start.col+(before-1)*dc] === opponent) before--
  while (inBoard(board,start.row+(after+1)*dr,start.col+(after+1)*dc) && board[start.row+(after+1)*dr][start.col+(after+1)*dc] === opponent) after++
  const caps = [before-1,after+1].map(index => ({row:start.row+index*dr,col:start.col+index*dc}))
  return caps.every(move => !inBoard(board,move.row,move.col) || board[move.row][move.col] === puzzle.toPlay) && !winPoints(board,opponent).length
}

function opponentMove(board, puzzle) {
  const opponent = 3-puzzle.toPlay
  const finish = winPoints(board,opponent)
  if (finish.length) return {...finish[0],reason:`${color(opponent)}在 ${coordinate(finish[0])} 连五。上一手还需要处理这个成五点。`}
  const threats = winPoints(board,puzzle.toPlay)
  if (threats.length) return {...threats[0],reason:`你下一手能在 ${coordinate(threats[0])} 连五，${color(opponent)}先占住这里。${threats.length > 1 ? '但另一个成五点仍然存在。' : '现在需要重新检查其他方向。'}`}
  const preferred = puzzle.kind === 'defense' ? defenseEnds(puzzle) : []
  const forcing = forcingCandidates(board,opponent).map(move => {
    const next = placeStone(board,move.row,move.col,opponent)
    return {...move,count:winPoints(next,opponent).length,adjacent:preferred.some(end => end.row === move.row && end.col === move.col)}
  }).filter(move => move.count > 0).sort((a,b) => b.count-a.count || Number(b.adjacent)-Number(a.adjacent) || a.row-b.row || a.col-b.col)
  if (forcing.length) {
    const move = forcing[0]
    return {...move,reason:`${color(opponent)}落在 ${coordinate(move)}，形成${move.count > 1 ? '两处不同的成五点，一手已经挡不住' : '下一手就能成五的冲四'}。请检查这一手之后的威胁。`}
  }
  const move = chooseGomokuMove(board,opponent,{level:'thoughtful',random:() => 0})
  return move ? {...move,reason:`${color(opponent)}落在 ${coordinate(move)}。${move.reason}`} : null
}

export function createTacticalAttempt(id) {
  const puzzle = puzzleById[id]
  if (!puzzle) throw new Error('没有找到这道攻防训练。')
  let board = emptyBoard(puzzle.size)
  for (const stone of puzzle.stones) board = placeStone(board,stone.row,stone.col,stone.player)
  return {puzzleId:id,board,turn:puzzle.toPlay,status:'playing',history:[],feedback:puzzle.prompt,childTurns:0,assisted:false,mistakes:0}
}

export function tacticalHint(state) {
  const puzzle = puzzleById[state.puzzleId]
  if (!puzzle || state.status !== 'playing') return null
  const finish = winPoints(state.board,puzzle.toPlay)
  if (finish.length) return {...finish[0],reason:'这是实际能连成五的空位。沿这条线逐格数一遍，再决定落子。'}
  const choices = puzzle.kind === 'attack' ? forcingSolutions(state.board,puzzle.toPlay,puzzle.maxTurns) : defensiveChoices(state,puzzle)
  if (choices.length) {
    const move = choices[0], danger = winPoints(state.board,3-puzzle.toPlay)
    const reason = puzzle.kind === 'defense'
      ? danger.length ? '白棋下一手能在这里连五。这次要挡的是成五点，挡完再确认这条线两端都被封住。' : '先挡在三颗棋紧邻的一端。还没有结束：想一想白棋从另一端伸长后，你第二次要守哪里。'
      : danger.length ? '先挡住对手的成五点，同时观察这颗棋在另一条线上形成的冲四，争取让对手转为防守。' : '这手能产生必须防守的成五点。先想对手挡完后，你刚落的棋还能在哪个方向继续帮忙。'
    return {row:move.row,col:move.col,reason}
  }
  return null
}

export const markTacticalHelp = state => ({...state,assisted:true})

export function playTacticalMove(state, row, col) {
  const puzzle = puzzleById[state.puzzleId]
  if (!puzzle || state.status !== 'playing') return state
  if (!empty(state.board,row,col)) return {...state,feedback:'请选择一个还没有棋子的交叉点。'}
  const player = puzzle.toPlay, opponent = 3-player
  const choices = puzzle.kind === 'attack' ? forcingSolutions(state.board,player,puzzle.maxTurns) : defensiveChoices(state,puzzle)
  const followsRoute = choices.some(move => move.row === row && move.col === col)
  const board = placeStone(state.board,row,col,player)
  const childTurns = state.childTurns+1
  const history = [...state.history,{row,col,player,role:'child',reason:`你落在 ${coordinate({row,col})}。`}]
  const next = {...state,board,turn:opponent,childTurns,history,mistakes:state.mistakes+Number(!followsRoute)}
  if (winningLine(board,row,col).length) {
    return {...next,status:childTurns >= 2 ? 'won' : 'playing',feedback:childTurns >= 2 ? `这次下到了真正连五。回看每一轮，对手怎样回应，你又怎样决定下一手。${puzzle.teaching.reflection}` : '已经连五，但这道连续训练需要至少两次自己的决定。请重新开始这题。'}
  }
  if (puzzle.kind === 'defense' && childTurns >= 2 && lineDefended(board,puzzle)) {
    return {...next,status:'defended',feedback:`这条线两端已被封住，本段威胁化解了。这不是全盘胜负；继续下棋仍要检查别的方向。${puzzle.teaching.reflection}`}
  }
  const reply = opponentMove(board,puzzle)
  if (!reply) return {...next,turn:player,feedback:'棋盘没有可继续的回应。请重开这题，回看目标中的连续攻防。'}
  const afterReply = placeStone(board,reply.row,reply.col,opponent)
  const replied = {...next,board:afterReply,turn:player,history:[...history,{row:reply.row,col:reply.col,player:opponent,role:'opponent',reason:reply.reason}]}
  if (winningLine(afterReply,reply.row,reply.col).length) return {...replied,status:'lost',feedback:`${reply.reason} 可以退回上一轮，先找出两个方向里的紧急威胁。`}
  const routeFeedback = followsRoute ? '' : puzzle.kind === 'attack' ? '这一步没有接上本题要练的连续冲四路线，先看对手怎样回应。' : '这个位置没有完整守住本题的威胁，先看看白棋实际下在哪里。'
  return {...replied,feedback:`${routeFeedback}${reply.reason}`}
}
