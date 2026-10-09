import { english } from './english.mjs'
// 外研版（三年级起点）四年级上、下册 Module 1–10 课本词表同步；与上面的基础复习卡互补。
// 已有卡片保留原 ID 和音频映射，这里只收录课本新词，避免标题重复。
const modules = {
  '四上M1 问路与方位': `straight|直线地；成直线地|Walk straight to the gate.|一直朝大门走。
go straight on|一直往前走|Go straight on and you can see the park.|一直往前走，你就能看到公园。
lost|迷路的|The little boy is lost.|这个小男孩迷路了。
live|居住|Where do you live?|你住在哪里？
turn left|向左转|Turn left at the school.|在学校那儿向左转。
turn right|向右转|Turn right to go home.|回家要向右转。
beside|在……旁边|The cat is beside the door.|猫在门旁边。
so much|十分；非常|Thank you so much.|非常感谢你。
hill|小山，山丘|The hill is green in spring.|春天的小山是绿色的。
house|房屋，住宅|My house is near the school.|我家在学校附近。`,
  '四上M2 正在做的动作': `running|跑步（run 的 -ing 形式）|Look! The boy is running.|看！那个男孩正在跑步。
these|这些|These photos are nice.|这些照片很好看。
take|拍摄；拿|Can you take a photo for me?|你能帮我拍张照片吗？
take pictures|拍照|We take pictures in the park.|我们在公园里拍照。
children|孩子们|The children are playing football.|孩子们正在踢足球。
talk|说话，交谈|Please talk about your picture.|请说说你的画。
talk to|和……交谈|Dad is talking to his friend.|爸爸正在和他的朋友交谈。
China|中国|China is a big country.|中国是个大国。`,
  '四上M3 户外活动与动作': `kid|小孩，小孩子|The kids are rowing a boat.|孩子们正在划船。
get on|上（车）|Get on the bus, please.|请上公共汽车。
see|看见，看到|I can see many boats.|我能看到许多小船。
lots of|许多|There are lots of people in the park.|公园里有很多人。
interesting|有趣的|This book is interesting.|这本书很有趣。
thing|东西，物品|What is that thing on the desk?|桌上那个东西是什么？
people|人们|The people are drinking tea.|人们正在喝茶。
row|划（船）|Can you row fast?|你能划得快吗？
dragon|龙|We can see a dragon boat on the lake.|我们能看到湖上有一条龙舟。
dragon boat|龙舟|The dragon boat is long.|这条龙舟很长。
men|男人（man 的复数）|The men are playing chess.|这些男人正在下国际象棋。
chess|国际象棋|I want to learn chess.|我想学国际象棋。
play chess|下国际象棋|Grandpa plays chess every day.|爷爷每天都下国际象棋。
soya milk|豆浆|I drink soya milk in the morning.|我早上喝豆浆。`,
  '四上M4 食物与点餐': `want|要；想要|Do you want some rice?|你想要一些米饭吗？
some|一些|I want some juice, please.|我想要一些果汁。
ice|冰|There is ice in my drink.|我的饮料里有冰。
also|也；还|Mum also wants some soup.|妈妈也想要一些汤。
food|食物|Noodles are my favourite food.|面条是我最喜欢的食物。
fast food|快餐|We eat fast food on Saturday.|我们星期六吃快餐。
how much|多少钱|How much is the dumpling?|这个饺子多少钱？
dumpling|饺子|I can make dumplings with Mum.|我能和妈妈一起包饺子。`,
  '四上M5 运动与能力': `high|高的；高高地|The bird flies high.|鸟飞得很高。
winner|胜利者，优胜者|You are the winner!|你是胜利者！
far|远的；远地|The school is not far from my home.|学校离我家不远。`,
  '四上M6 食物与中秋': `sweets|糖果（常用复数）|Do you want some sweets?|你想要一些糖果吗？
sorry|抱歉的，对不起的|Sorry, I can't go with you.|对不起，我不能和你一起去。
dark|黑暗的|The room is dark. Turn on the light.|房间很暗，把灯打开吧。
well|嗯；好吧|Well, let's read the book.|好吧，我们读这本书吧。
turn on|打开（电灯、电器）|Please turn on the TV.|请打开电视。
light|灯，电灯|The light is on the desk.|电灯在桌子上。
The Mid-Autumn Festival|中秋节|We eat moon cakes at the Mid-Autumn Festival.|中秋节我们吃月饼。
moon cake|月饼|This moon cake is sweet.|这块月饼很甜。`,
  '四上M7 动物与农场': `have a look|看一看|Let me have a look at your photo.|让我看一看你的照片。
vegetable|蔬菜|Eat more vegetables every day.|每天多吃蔬菜。
fruit|水果|Apples are my favourite fruit.|苹果是我最喜欢的水果。
bear|熊|The bear is very strong.|这头熊很强壮。`,
  '四上M8 出行与计划': `get up|起床|I get up at seven o'clock.|我七点起床。
o'clock|……点钟|It's nine o'clock now.|现在是九点钟。
from|从；来自|We fly from Beijing to Hainan.|我们从北京飞往海南。
swimsuit|游泳衣|Take your swimsuit to the sea.|带上你的游泳衣去海边。
hooray|好哇！（欢呼声）|Hooray! We win the game.|好哇！我们赢了这场比赛。`,
  '四上M9 运动会': `sports day|运动日，运动会|Our sports day is in October.|我们的运动会在十月。
win|赢，获胜|I want to win the race.|我想赢这场比赛。
hundred|一百（的）|Run one hundred metres.|跑一百米。
metre|米（长度单位）|This pool is fifty metres long.|这个泳池长五十米。
every|每一个|I run every day.|我每天都跑步。
luck|运气|Good luck to you!|祝你好运！
Good luck!|祝你好运！|Good luck on sports day!|运动会祝你好运！
come on|加油|Come on! You can run fast.|加油！你能跑得快的。
high jump|跳高|I like the high jump best.|我最喜欢跳高。
long jump|跳远|Sam is in the long jump.|萨姆参加跳远。
How about...?|……怎么样？|How about you?|你呢？
subject|学科，科目|What is your favourite subject?|你最喜欢的科目是什么？`,
  '四上M10 家庭与节日': `New Year|新年|Happy New Year to you!|祝你新年快乐！
Chinese|中国的；中文的|We have a big Chinese dinner.|我们吃一顿丰盛的中式晚餐。
festival|节日|The Spring Festival is a big festival in China.|春节是中国的一个大节日。
the Spring Festival|春节|We visit our family at the Spring Festival.|春节时我们走亲访友。
peanut|花生|I like peanuts very much.|我非常喜欢花生。
merry|快乐的，愉快的|Merry Christmas, Grandma!|圣诞快乐，奶奶！
Christmas|圣诞节|We sing songs at Christmas.|圣诞节我们唱歌。
Merry Christmas!|圣诞快乐！|Merry Christmas! Here is a card for you.|圣诞快乐！这是给你的卡片。`,
  '四下M1 描述人物': `nice|友好的，亲切的|My teacher is nice.|我的老师很亲切。
clever|聪明的|This clever girl is my sister.|这个聪明的女孩是我妹妹。
naughty|淘气的|The naughty cat plays all day.|这只淘气的猫整天玩。
a bit|稍微，有点儿|She is a bit shy.|她有点儿害羞。
shy|害羞的|Don't be shy. Say hello.|别害羞，打个招呼吧。
answer|接（电话）|I answer the phone for Mum.|我帮妈妈接电话。
call|电话；（给……）打电话|Give me a call tonight.|今晚给我打个电话。
bad|不好的，坏的|That is a bad idea.|那是个坏主意。
little|幼小的，年幼的|The little bird can't fly.|这只小鸟还不会飞。
cute|可爱的|What a cute baby!|多可爱的宝宝呀！`,
  '四下M2 伦敦景点': `city|城市|London is a big city.|伦敦是个大城市。
whose|谁的|Whose book is this?|这是谁的书？
queen|女王|The queen lives in London.|女王住在伦敦。
famous|著名的|Big Ben is famous.|大本钟很有名。`,
  '四下M3 机器人与计划': `robot|机器人|The robot can walk.|这个机器人会走路。
will|将，将会|Robots will help us.|机器人将会帮助我们。
everything|所有事情|Robots will do everything.|机器人将做所有事情。
one day|（将来）有一天|One day I will fly to London.|有一天我会飞去伦敦。
housework|家务活|Robots will do the housework.|机器人将会做家务活。
learn|学习|We learn English at school.|我们在学校学习英语。
our|我们的|This is our classroom.|这是我们的教室。
homework|家庭作业|I do my homework after dinner.|我晚饭后做家庭作业。
won't|将不会（will not 的缩写）|Robots won't do our homework.|机器人不会替我们做作业。
have|有，拥有|We have a new teacher.|我们有了一位新老师。
next|下一个的|Next week is my birthday.|下周是我的生日。
holiday|假期|We will fly to Hainan for our holiday.|假期我们将飞去海南。`,
  '四下M4 野餐与天气': `take|带，拿|Will you take your ball?|你要带上你的球吗？
picnic|野餐|We will have a picnic on Saturday.|我们星期六要去野餐。
great|太好了，好极了|Great! Let's go!|太好了！我们走吧！
why|为什么|Why not?|为什么不呢？
because|因为|I like summer because I can swim.|我喜欢夏天，因为我能游泳。
so|所以|It is hot, so I drink lots of water.|天气很热，所以我喝很多水。
cloudy|多云的|It will be cloudy in Beijing.|北京将会是多云的。
weather|天气|What will the weather be like?|天气将会怎么样？`,
  '四下M5 过去与现在': `was|（am、is 的过去式）是|I was two then.|那时我两岁。
then|当时，那时|You were so cute then.|你那时那么可爱。
grandparent|祖父母|My grandparents live in the village.|我的祖父母住在乡村。
were|（are 的过去式）是|They were young then.|他们那时很年轻。
young|年轻的|My mum was young then.|妈妈那时很年轻。
old|年老的|Grandma is old now.|奶奶现在老了。
wasn't|不是（was not 的缩写）|It wasn't sunny yesterday.|昨天不是晴天。
weren't|不是（were not 的缩写）|We weren't at home then.|我们那时不在家。
dirty|脏的|Your hands are dirty. Wash them!|你的手脏了，去洗洗吧！`,
  '四下M6 问候与乡村': `out|不在家（的）|Dad was out yesterday.|爸爸昨天不在家。
thanks|谢谢（用于回应问候）|—How are you? —Fine, thanks.|——你好吗？——很好，谢谢。
lesson|一堂课|We have an English lesson today.|我们今天有一节英语课。
village|乡村|The village is small and beautiful.|这个乡村小而美。`,
  '四下M7 帮妈妈做家务': `had|度过（have 的过去式）|I had a nice day yesterday.|我昨天过得很好。
really|真的|It was really fun.|那真的很有趣。
did|（do 的过去式）助动词|What did you do on Sunday?|你星期天做什么了？
didn't|没有（did not 的缩写）|I didn't walk to school.|我没有步行去学校。
love|爱，喜欢|I love my family.|我爱我的家人。
him|他（宾格）|Mum helped him with his homework.|妈妈帮他做作业。
Mrs|太太|Mrs Smart is our English teacher.|斯马特太太是我们的英语老师。
Miss|小姐|Miss White is very kind.|怀特小姐很和善。`,
  '四下M8 昨天的活动': `sang|唱歌（sing 的过去式）|We sang songs at the party.|我们在晚会上唱了歌。
beautifully|优美地，动听地|Amy sang beautifully.|埃米唱得动听。
saw|看见（see 的过去式）|I saw many birds in the park.|我在公园里看见了许多鸟。
last|最近过去的，上一个|Last week we went to the zoo.|上周我们去了动物园。
fun|有趣的事|The game was great fun.|这个游戏非常有趣。
went|去（go 的过去式）|We went there by bus.|我们乘公共汽车去了那里。
there|在那儿，往那里|Go there and have a look.|去那儿看一看。
ate|吃（eat 的过去式）|We ate lots of food.|我们吃了许多食物。
drank|喝，饮（drink 的过去式）|Sam drank all the juice.|萨姆把果汁都喝了。
time|一段时间|We had a good time at school.|我们在学校过得很开心。
have a good time|玩得开心|Did you have a good time?|你们玩得开心吗？
busy|忙的|Mum was busy yesterday.|妈妈昨天很忙。
took|拍摄（take 的过去式）|I took some pictures of the lake.|我拍了几张湖的照片。
tell|告诉，告知|Tell me about your picnic.|跟我说说你们的野餐吧。
delicious|美味的|Grandma cooked fish. It was delicious.|奶奶做了鱼，很好吃。
made|制作（make 的过去式）|Daming made a poster.|大明做了一张海报。
poster|海报，招贴画|This poster is about our school.|这张海报是关于我们学校的。`,
  '四下M9 假期与明信片': `welcome|欢迎|Welcome to our school!|欢迎来到我们学校！
postcard|明信片|I sent you a postcard.|我给你寄了一张明信片。
dear|亲爱的|Dear Daming, how are you?|亲爱的大明，你好吗？
on holiday|在休假，在度假|They are on holiday in Beijing.|他们在北京度假。
travel|旅行|Did you travel by train?|你是坐火车旅行的吗？
came|来（come 的过去式）|My cousin came to see me.|我表哥来看我了。
pop|流行音乐|We listened to pop music.|我们听了流行音乐。
concert|音乐会|The concert was wonderful.|音乐会很精彩。
earth|地球|The earth goes around the sun.|地球绕着太阳转。`,
  '四下M10 骑车与看病': `fall|掉下，跌落|Did you fall off your bike?|你从自行车上摔下来了吗？
fall off|跌落，从……掉下|The book fell off the desk.|书从桌子上掉下去了。
fell|掉下（fall 的过去式）|I fell down and bumped my head.|我摔倒了，撞到了头。
fall down|摔倒，跌倒|Be careful! Don't fall down.|小心！别摔倒。
found|发现，找到（find 的过去式）|I found my watermelon.|我找到了我的西瓜。
town|城镇，市镇|We went to the town by bike.|我们骑自行车去了镇上。
happen|发生|What happened to your arm?|你的胳膊怎么了？
bought|买（buy 的过去式）|Mum bought some chocolate.|妈妈买了一些巧克力。
carried|拿，搬（carry 的过去式）|Sam carried the big watermelon.|萨姆搬着那个大西瓜。
bump|撞伤，碰撞|I bumped my leg on the desk.|我的腿在桌上撞了一下。
chocolate|巧克力|The chocolate is sweet.|这块巧克力很甜。
stomach ache|胃痛，肚子疼|Sam has got a stomach ache.|萨姆肚子疼。
headache|头疼|I have got a headache today.|我今天头疼。
fever|发烧|The boy has got a fever.|这个男孩发烧了。`
}
// 与基础复习卡去重：知识库要求全部卡片标题唯一；已有卡片还带音频，不能在这里重复出现。
const seen = new Set(english.map(entry => entry.title.trim().toLowerCase()))
const words = Object.entries(modules).flatMap(([topic, lines]) => lines.split('\n').map(line => {
  const [title, meaning, example, translation] = line.split('|')
  return { title, meaning, example, translation, topic }
})).filter(word => {
  const key = word.title.trim().toLowerCase()
  if (seen.has(key)) return false
  seen.add(key)
  return true
}).map(({ title, meaning, example, translation, topic }) => ({
  id: `enb-${title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`,
  subject: 'english',
  topic,
  title,
  pronunciation: '',
  level: '课本同步',
  summary: meaning,
  explanation: `外研版四年级${topic.startsWith('四下') ? '下' : '上'}册课本词。常用意思：${meaning}。先结合句子理解，再换成自己的生活来说一说。`,
  example: `${example}\n${translation}`,
  tip: '课本词表按单元整理，以孩子手里的课本为准；放进不同句子时意思可能略有变化。',
  talk: `和家长轮流用“${title}”说一句话，也可以画出它的意思。`,
  sources: ['curriculum', 'fltrp']
}))
// 干扰项保持同一模块内、意思互不相同；页面会打乱选项顺序。
for (const entry of words) {
  const others = words.filter(item => item.topic === entry.topic && item.id !== entry.id).slice(0, 2)
  entry.quiz = { prompt: `“${entry.title}”的常用中文意思是？`, options: [entry.summary, ...others.map(item => item.summary)], answer: entry.summary, explanation: entry.example }
}
export const englishTextbook = words
