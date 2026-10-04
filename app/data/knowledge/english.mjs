import { extraEnglishGroups } from './english-extra.mjs'
// Original examples; foundation review, not a publisher's word list.
const groups = {
  '学校与学习': `book|书|This book is about the sea.|这本书讲的是大海。
pen|钢笔；圆珠笔|I have a blue pen.|我有一支蓝色的笔。
pencil|铅笔|Use a pencil to draw a tree.|用铅笔画一棵树。
ruler|尺子|My ruler is on the desk.|我的尺子在书桌上。
bag|包|Put the book in your bag.|把书放进你的包里。
desk|书桌；课桌|The desk is near the window.|书桌在窗户附近。
chair|椅子|This chair is small.|这把椅子很小。
school|学校|We walk to school.|我们走路去学校。
classroom|教室|Our classroom is clean.|我们的教室很干净。
teacher|老师|Our teacher likes books.|我们的老师喜欢书。
student|学生|I am a student.|我是一名学生。
library|图书馆|We read in the library.|我们在图书馆读书。`,
  '家人与朋友': `mother|妈妈|My mother likes music.|我妈妈喜欢音乐。
father|爸爸|My father can cook.|我爸爸会做饭。
sister|姐姐；妹妹|My sister has a red bag.|我的姐姐有一个红色的包。
brother|哥哥；弟弟|My brother is ten.|我的弟弟十岁了。
grandma|奶奶；外婆|Grandma is reading.|奶奶正在读书。
grandpa|爷爷；外公|Grandpa likes walking.|爷爷喜欢散步。
family|家庭；家人|I love my family.|我爱我的家人。
friend|朋友|My friend can swim.|我的朋友会游泳。
name|名字|My name is Lin.|我的名字是林。
happy|快乐的|I am happy today.|我今天很快乐。
kind|友善的|She is kind to me.|她对我很友善。
help|帮助|Can you help me?|你能帮我吗？`,
  '日常行动': `read|阅读|I read after dinner.|我晚饭后阅读。
write|写|Write your name here.|把你的名字写在这里。
listen|听|Listen to the birds.|听听鸟的声音。
speak|说；讲|I can speak English.|我会讲英语。
run|跑|We run in the park.|我们在公园里跑步。
walk|走；步行|Let's walk to the shop.|我们走路去商店吧。
swim|游泳|Can you swim?|你会游泳吗？
play|玩；参加运动|I play football on Sunday.|我星期日踢足球。
draw|画|Draw a small boat.|画一条小船。
sing|唱歌|We sing together.|我们一起唱歌。
dance|跳舞|She can dance.|她会跳舞。
make|制作|Let's make a card.|我们做张卡片吧。`,
  '食物与购物': `apple|苹果|I have an apple.|我有一个苹果。
banana|香蕉|This banana is yellow.|这根香蕉是黄色的。
bread|面包|I like bread.|我喜欢面包。
rice|米饭；稻米|We eat rice for lunch.|我们午餐吃米饭。
noodles|面条|These noodles are hot.|这些面条很烫。
egg|鸡蛋|There is an egg on the plate.|盘子上有一个鸡蛋。
milk|牛奶|I drink milk in the morning.|我早上喝牛奶。
water|水|Please give me some water.|请给我一些水。
hungry|饥饿的|I am hungry now.|我现在饿了。
thirsty|口渴的|Are you thirsty?|你口渴吗？
buy|买|I want to buy a pencil.|我想买一支铅笔。
money|钱|Keep your money in your bag.|把钱放在你的包里。`,
  '时间与天气': `Monday|星期一|We have English on Monday.|我们星期一有英语课。
Tuesday|星期二|I draw on Tuesday.|我星期二画画。
Wednesday|星期三|We read together on Wednesday.|我们星期三一起阅读。
Thursday|星期四|I play football on Thursday.|我星期四踢足球。
Friday|星期五|We sing on Friday.|我们星期五唱歌。
Saturday|星期六|I visit Grandma on Saturday.|我星期六看望奶奶。
Sunday|星期日|We go to the park on Sunday.|我们星期日去公园。
today|今天|Today is a sunny day.|今天是晴天。
tomorrow|明天|I will read this book tomorrow.|我明天要读这本书。
sunny|晴朗的|It is sunny today.|今天天气晴朗。
rainy|下雨的|It is a rainy day.|这是一个雨天。
windy|有风的|It is windy outside.|外面有风。`,
  '位置与出行': `left|左边；向左|Turn left here.|在这里向左转。
right|右边；向右|The shop is on your right.|商店在你的右边。
near|在……附近|The park is near my home.|公园在我家附近。
behind|在……后面|The cat is behind the door.|猫在门后面。
between|在……之间|The ball is between the two boxes.|球在两个盒子之间。
under|在……下面|My bag is under the desk.|我的包在书桌下面。
next to|紧挨着|I sit next to my friend.|我坐在朋友旁边。
bus|公共汽车|We go there by bus.|我们乘公共汽车去那里。
train|火车|The train is long.|这列火车很长。
bike|自行车|I have a new bike.|我有一辆新自行车。
park|公园|There are trees in the park.|公园里有树。
hospital|医院|The hospital is near the station.|医院在车站附近。`,
  '描述与能力': `big|大的|That is a big ship.|那是一艘大船。
small|小的|I can see a small bird.|我能看见一只小鸟。
tall|高的|This tree is tall.|这棵树很高。
short|矮的；短的|The pencil is short.|这支铅笔很短。
long|长的|The bridge is long.|这座桥很长。
old|年老的；旧的|This is an old photo.|这是一张旧照片。
new|新的|I have a new book.|我有一本新书。
fast|快的；快地|The train is fast.|这列火车很快。
slow|慢的|This bus is slow.|这辆公共汽车很慢。
strong|强壮的|The horse is strong.|这匹马很强壮。
can|能；会|I can make a paper boat.|我会做纸船。
beautiful|美丽的|The flowers are beautiful.|这些花很美丽。`
}
const words = Object.entries({ ...groups, ...extraEnglishGroups }).flatMap(([topic, lines]) => lines.split('\n').map(line => {
  const [title, meaning, example, translation] = line.split('|')
  return { id: `en-${title.replace(/ /g, '-')}`, subject: 'english', topic, title, pronunciation: '', level: '基础复习', summary: meaning, explanation: `常用意思：${meaning}。先结合句子理解，再换成自己的生活来说一说。`, example: `${example}\n${translation}`, tip: '这里收录的是常用意思，放进不同句子时含义可能变化。', talk: `和家长轮流用“${title}”说一句话，也可以画出它的意思。`, sources: ['curriculum', 'fltrp'] }
}))
// Distractors stay within a topic and have distinct meanings; the UI shuffles their order.
for (const entry of words) {
  const others = words.filter(item => item.topic === entry.topic && item.id !== entry.id).slice(0, 2)
  entry.quiz = { prompt: `“${entry.title}”的常用中文意思是？`, options: [entry.summary, ...others.map(item => item.summary)], answer: entry.summary, explanation: entry.example }
}
const patterns = `询问正在做什么|What are you doing?|你正在做什么？|用 am / is / are 加动词的 -ing 形式，说正在进行的动作。|What are you doing? I am drawing a boat.|你正在做什么？我正在画一条船。|“她正在读书”应选哪句？|She is reading.|She reading.|She can reading.|主语 she 后用 is，再接 reading。
询问能力|Can you swim?|你会游泳吗？|can 后接动词原形；问句把 can 放到主语前。|Can you swim? Yes, I can.|你会游泳吗？是的，我会。|“我会唱歌”应选哪句？|I can sing.|I can singing.|I can sings.|can 后用原形 sing。
描述位置|Where is the library?|图书馆在哪里？|问一个人或物的位置可用 Where is…? 回答时说明方位。|Where is the library? It is next to the park.|图书馆在哪里？它紧挨着公园。|想问书包在哪里，应选哪句？|Where is my bag?|How old is my bag?|What colour is my bag?|where 问地点；how old 问年龄；what colour 问颜色。
表达喜好|I like reading.|我喜欢阅读。|说喜欢某项活动，可用 I like 加动词的 -ing 形式。|I like reading. What about you?|我喜欢阅读。你呢？|哪句表示喜欢跳舞？|I like dancing.|I am dancing now.|I can dance.|like 表示喜欢；am dancing 表示正在跳舞；can dance 表示会跳舞。
礼貌请求|Can I have some water, please?|请问我可以喝些水吗？|Can I…? 可以用于请求许可，加 please 更礼貌。|Can I have some water, please? Here you are.|请给我一些水好吗？给你。|哪句适合向家长礼貌地要一个苹果？|Can I have an apple, please?|I am an apple.|Where is Monday?|请求一个苹果，用 Can I have an apple, please?
描述数量|There are three birds.|有三只鸟。|There is 后接单数名词或不可数名词；There are 后接复数名词。|There are three birds in the tree.|树上有三只鸟。|“桌上有一本书”应选哪句？|There is a book on the desk.|There are a book on the desk.|There is three books.|a book 是单数，所以用 There is。
询问价格|How much is it?|它多少钱？|问一个物品的价格可用 How much is it? 回答时说价格和货币单位。|How much is the pen? It is five yuan.|这支笔多少钱？五元。|想问一只书包的价格，用哪句？|How much is the bag?|How old is the bag?|Where is the bag?|How much 在这个情境中问价格。
询问年龄|How old are you?|你几岁了？|年龄用 How old 提问；可以用 I am ten. 回答。|How old are you? I am ten.|你几岁了？我十岁了。|“我九岁了”应选哪句？|I am nine.|I have nine bags.|It is nine yuan.|I am nine 表示年龄；另两句分别说数量和价格。
谈论计划|I am going to read.|我打算阅读。|am / is / are going to 后接动词原形，表达计划。|I am going to read with Dad tonight.|我今晚打算和爸爸一起阅读。|“她打算唱歌”应选哪句？|She is going to sing.|She are going to sing.|She is going to singing.|she 配 is，going to 后用原形 sing。
谈论过去|I was at home yesterday.|我昨天在家。|说过去的状态：I / he / she 常配 was，you / we / they 常配 were。|I was at home yesterday. We were happy.|我昨天在家。我们很快乐。|“我们昨天在公园”应选哪句？|We were in the park yesterday.|We was in the park yesterday.|We are tomorrow.|we 的过去状态用 were。
谈论天气|What is the weather like?|天气怎么样？|用 It is 加表示天气的词描述天气，如 sunny、rainy、windy。|What is the weather like? It is windy.|天气怎么样？有风。|哪句表示晴天？|It is sunny.|It is Sunday.|I am hungry.|sunny 是晴朗的；Sunday 是星期日。
发出邀请|Let's play a game.|我们玩个游戏吧。|Let's 后接动词原形，用来提出一起做某事的建议。|Let's make a card for Grandma.|我们给奶奶做张卡片吧。|哪句是邀请一起阅读？|Let's read together.|I read yesterday.|Where is the book?|Let's read together 是“我们一起读吧”。`
export const english = [...words, ...patterns.split('\n').map((line, i) => {
  const [topic, title, summary, explanation, example, translation, prompt, answer, wrong1, wrong2, reason] = line.split('|')
  return { id: `en-pattern-${i + 1}`, subject: 'english', topic: '生活句型', title, summary, explanation, example: `${example}\n${translation}`, tip: reason, talk: `和家长演一段小对话，试着用这个句型${topic}。`, level: '句型巩固', sources: ['curriculum', 'fltrp'], quiz: { prompt, options: [answer, wrong1, wrong2], answer, explanation: reason } }
})]
