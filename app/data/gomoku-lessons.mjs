// Original short lessons and board positions for this app's family freestyle rules.
// These rules allow five or more in a row and have no forbidden moves.
export const GOMOKU_RULES = {
  title: '家庭自由五子棋',
  description: '黑棋先走，双方轮流落一颗。横、竖或斜着连续五颗及以上就赢；这里不设禁手。',
  reminder: '口诀帮你观察，不能保证每盘都赢。每一步都先找自己的成五点，再看对手的成五点。'
}

export const lessons = [
  {
    id: 'five-line', title: '认出五连', subtitle: '横、竖、斜都要看',
    observe: '先找同色棋子，再沿横线、竖线和两条斜线数一数。',
    formula: '同色相连五颗起，中间不能隔空位。',
    mistake: '棋子挨得很近不一定相连；拐弯的五颗也不算。',
    explanation: '本课按家庭自由规则：连续五颗及以上都算赢。补上缺口后，要能沿一条直线数出至少五颗。',
    puzzleIds: ['five-line-row', 'five-line-column-gap']
  },
  {
    id: 'one-move-win', title: '找到一步赢', subtitle: '先看看现在能不能赢',
    observe: '先看自己的棋：哪里只补一颗就能连成五颗？别忘了两条斜线。',
    formula: '轮到我，先找能成五的地方。',
    mistake: '看到对手的棋就急着挡，可能漏掉自己这一手已经能赢。',
    explanation: '一步赢是这一手落下就成五，不是再走一手才成五。相同棋形可能有不止一个正确落点。',
    puzzleIds: ['one-move-win-diagonal-gap', 'one-move-win-antidiagonal']
  },
  {
    id: 'stop-five', title: '先防对手成五', subtitle: '先检查最紧急的地方',
    observe: '自己不能立刻赢时，找对手下一手就能成五的空位。',
    formula: '我能赢先赢；还不能赢，先挡成五。',
    mistake: '只顾把自己的三变成四，却让对手下一手直接赢。',
    explanation: '本课的防守标准是：落子后，对手下一手没有成五点。若自己这一步已经成五，也是一种正确应对。',
    puzzleIds: ['stop-five-row', 'stop-five-column']
  },
  {
    id: 'rush-four', title: '用冲四催对手', subtitle: '造出一个必须留意的成五点',
    observe: '找自己能补成四的地方，再数补齐成五的空位有几个。',
    formula: '冲四有一个成五点，对手若不能先赢，就得处理。',
    mistake: '冲四还没有赢；对手可以挡住那个点，也可能有更快的成五手。',
    explanation: '这里把只有一个下一手成五点的四叫冲四。四颗可以相连，也可以中间有一个待补的空位；要用实际成五点检查。',
    puzzleIds: ['rush-four-row', 'rush-four-column']
  },
  {
    id: 'open-four', title: '留出活四两头', subtitle: '连续四颗，两端都能成五',
    observe: '先看能否连成四颗，再确认两端都在棋盘里，而且都是空位。',
    formula: '连续四颗两头空，两端各有成五点。',
    mistake: '一端顶着边线或对方棋子就是冲四，不能当成活四。',
    explanation: '本课的活四必须连续四颗、两头都空。对手没有更快获胜威胁时，一颗棋子挡不住两个成五点；每次仍要先看对方能否马上赢。',
    puzzleIds: ['open-four-row', 'open-four-diagonal']
  },
  {
    id: 'straight-three', title: '认准直活三', subtitle: '只学连续的活三',
    observe: '找到连续的两颗，试着变成连续三颗；还要看两端和再外一格有没有空间。',
    formula: '三颗相连，两头空，还能再走成活四。',
    mistake: '中间隔空的跳三不是本课的直活三；两边被挤住、走不成活四的三也不算。',
    explanation: '本课只练直活三：连续三颗，两端为空，并且至少有一种延伸能变成活四。它是在准备威胁，还不能跳过对手的紧急成五点。',
    puzzleIds: ['straight-three-row', 'straight-three-column']
  },
  {
    id: 'attack-defense', title: '进攻也能防守', subtitle: '挡住对手，再给自己机会',
    observe: '先找必须挡的成五点，再看落在那里能否同时给自己造出下一手成五点。',
    formula: '先把急处挡住，再数自己的机会。',
    mistake: '只挡在看起来靠近对手的位置，未必真的消掉了对手的成五点。',
    explanation: '本课要同时完成两件事：对手下一手不能成五，自己出现下一手成五的威胁。自己的本手成五也算正确。',
    puzzleIds: ['attack-defense-cross', 'attack-defense-diagonal']
  },
  {
    id: 'double-threat', title: '一手看两个方向', subtitle: '同时造出两条四的威胁',
    observe: '观察交叉点：同一颗新棋子，能不能在两个不同方向都造出成五点？',
    formula: '一手连两线，再数两个不同的成五点。',
    mistake: '看起来像叉形不一定有威胁；必须真的找得到两个成五点，也别漏看对手马上能赢。',
    explanation: '本课练同时造出两条不同方向的四，且有两个不同的下一手成五点。对手没有更快获胜威胁时，这样的威胁很有力量。本应用的家庭自由规则允许这样走。',
    puzzleIds: ['double-threat-cross', 'double-threat-diagonals']
  }
]

const stones = (black, white) => [
  ...black.map(([row, col]) => ({ row, col, player: 1 })),
  ...white.map(([row, col]) => ({ row, col, player: 2 }))
]
const puzzle = (id, lessonId, title, toPlay, objective, black, white, hint, explanation) => ({
  id, lessonId, title, size: 9, toPlay, objective,
  prompt: objective === 'win' ? '落一颗棋，让自己这一手就成五。' :
    objective === 'block' ? '落一颗棋，让对手下一手不能成五。' :
    objective === 'rush-four' ? '造出一个冲四，留下一个下一手成五点。' :
    objective === 'open-four' ? '落一颗棋，造出连续四颗、两头都空的活四。' :
    objective === 'straight-three' ? '造出一个还能继续变成活四的直活三。' :
    objective === 'attack-defense' ? '挡住对手的成五点，同时造出自己的成五威胁。' :
    '用同一颗新棋，在两个不同方向都造出成五威胁。',
  hint, explanation, stones: stones(black, white)
})

export const puzzles = [
  puzzle('five-line-row', 'five-line', '横着数到五', 1, 'win',
    [[4, 2], [4, 3], [4, 4], [4, 5]], [[0, 0], [0, 2], [2, 0], [8, 8]],
    '看中间那一排黑棋。两头的空位都值得试一试。', '四颗已经横着相连，在任意一个可用的端点添一颗就成五。'),
  puzzle('five-line-column-gap', 'five-line', '补上竖线缺口', 1, 'win',
    [[1, 4], [2, 4], [4, 4], [5, 4]], [[0, 0], [0, 2], [2, 0], [8, 8]],
    '沿中间的竖线数，哪里断开了一格？', '补上竖线中间的空位，五颗就连续相连。'),
  puzzle('one-move-win-diagonal-gap', 'one-move-win', '斜线里藏着缺口', 1, 'win',
    [[1, 1], [2, 2], [4, 4], [5, 5]], [[0, 8], [2, 8], [6, 0], [8, 2]],
    '从左上往右下看，找到两段黑棋之间的空位。', '把两段斜线接起来，这一手就能连续数出五颗。'),
  puzzle('one-move-win-antidiagonal', 'one-move-win', '白棋也找一步赢', 2, 'win',
    [[0, 0], [0, 2], [2, 0], [8, 6], [8, 8]], [[1, 7], [2, 6], [3, 5], [4, 4]],
    '从右上往左下数白棋，看看两头。', '这条斜线的白棋已经连成四颗，两端都能补成五。'),
  puzzle('stop-five-row', 'stop-five', '挡住白棋出口', 1, 'block',
    [[4, 1], [0, 0], [0, 2], [2, 0]], [[4, 2], [4, 3], [4, 4], [4, 5]],
    '白棋四颗的一头已经被黑棋堵住，另一头在哪里？', '堵住唯一的成五点后，白棋下一手就不能成五。'),
  puzzle('stop-five-column', 'stop-five', '白棋守住竖线', 2, 'block',
    [[1, 4], [2, 4], [3, 4], [4, 4], [8, 8]], [[0, 4], [0, 0], [0, 2], [2, 0]],
    '黑棋竖着连了四颗，上面已经有白棋，下面呢？', '在黑棋四颗的空端落下白棋，消掉这一手成五的威胁。'),
  puzzle('rush-four-row', 'rush-four', '黑棋造一个冲四', 1, 'rush-four',
    [[4, 3], [4, 4], [4, 5]], [[4, 2], [0, 0], [8, 8]],
    '左边有白棋，向右添一颗，再找下一手补成五的点。', '形成四的威胁后，要能指出唯一的下一手成五点；冲四还不是已经赢。'),
  puzzle('rush-four-column', 'rush-four', '白棋向下冲四', 2, 'rush-four',
    [[2, 4], [0, 0], [8, 0], [8, 8]], [[3, 4], [4, 4], [5, 4]],
    '白棋上面被挡住了，向下寻找补成四的办法。', '连续或留一个缺口的四，都要靠实际的成五点来检查。'),
  puzzle('open-four-row', 'open-four', '黑棋保留两端', 1, 'open-four',
    [[4, 3], [4, 4], [4, 5]], [[0, 0], [0, 2], [2, 0]],
    '在这三颗连续黑棋旁边添一颗，检查新四颗的两端。', '连续四颗两端都有空位，下一手就有两个成五点。仍要先确认对手没有更快的获胜手。'),
  puzzle('open-four-diagonal', 'open-four', '白棋斜着留两头', 2, 'open-four',
    [[0, 8], [2, 8], [6, 0], [8, 2]], [[2, 2], [3, 3], [4, 4]],
    '沿左上到右下的白棋延长，别把一端顶到边线。', '把斜线变成连续四颗，并留下两个能成五的空端。'),
  puzzle('straight-three-row', 'straight-three', '黑棋先造直活三', 1, 'straight-three',
    [[4, 3], [4, 4]], [[0, 0], [8, 8]],
    '让两颗相邻黑棋变成连续三颗，再检查两端外面的空间。', '连续三颗、两端空，而且至少有一侧能继续走成活四，才是本课要找的直活三。'),
  puzzle('straight-three-column', 'straight-three', '白棋竖着准备', 2, 'straight-three',
    [[0, 0], [0, 2], [8, 8]], [[3, 4], [4, 4]],
    '沿白棋竖线添一颗，先数三颗是否连续。', '本课只接受连续的直活三，隔着空位的跳三需要另学，不能混在一起。'),
  puzzle('attack-defense-cross', 'attack-defense', '一挡也一攻', 1, 'attack-defense',
    [[4, 0], [1, 5], [2, 5], [3, 5]], [[4, 1], [4, 2], [4, 3], [4, 4]],
    '先找白棋唯一的成五点，再看那里与竖着的黑棋有什么关系。', '这一步堵住白棋，同时把黑棋竖线变成四，既处理急事又造出自己的威胁。'),
  puzzle('attack-defense-diagonal', 'attack-defense', '白棋边守边连', 2, 'attack-defense',
    [[4, 4], [4, 5], [4, 6], [4, 7], [8, 0]], [[4, 8], [1, 0], [2, 1], [3, 2]],
    '黑棋横线的右边已堵住，左边的空位也在白棋斜线旁。', '堵住黑棋横线的空端，同时让白棋斜线出现下一手成五点。'),
  puzzle('double-threat-cross', 'double-threat', '横竖交点的力量', 1, 'fork',
    [[4, 1], [4, 2], [4, 3], [1, 4], [2, 4], [3, 4]], [[4, 0], [0, 4], [8, 8], [8, 6], [6, 8], [6, 6]],
    '找横着三颗和竖着三颗都能用到的同一个交点。', '同一颗新棋同时接出横、竖两个四，留下两个不同成五点。先确认对手不能马上成五。'),
  puzzle('double-threat-diagonals', 'double-threat', '两条斜线一起发力', 2, 'fork',
    [[0, 0], [0, 8], [8, 0], [8, 2], [8, 6], [6, 0], [6, 8]], [[1, 1], [2, 2], [3, 3], [1, 7], [2, 6], [3, 5]],
    '让两条白棋斜线在同一个空位相接，再各找一个成五点。', '两条不同方向的四各有成五点。家庭自由规则允许这一手；判断时仍先看对手有没有更快的赢法。')
]

export const puzzleById = Object.fromEntries(puzzles.map(item => [item.id, item]))
