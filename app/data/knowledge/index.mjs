import { english } from './english.mjs'
import { englishTextbook } from './english-textbook.mjs'
import { idioms, reading } from './chinese.mjs'
import { math } from './math.mjs'
import { science } from './science.mjs'
export const SUBJECTS = [
  { id: 'english', name: '英语', icon: 'Aa', note: '课本同步 · 词汇 · 句型', scope: '外研版（三年级起点）四年级上、下册课本词表同步，加基础复习与通用句型。课本词按 Module 整理，以孩子手里的课本为准；基础复习部分不标教材单元。' },
  { id: 'idiom', name: '成语', icon: '言', note: '懂意思 · 会运用', scope: '人教版语文学习方向；常用成语积累与情境运用，不代表课本必背清单。' },
  { id: 'math', name: '数学', icon: '＋', note: '概念 · 方法 · 易错点', scope: '人教版数学学习方向；整理数与运算、图形、统计、生活应用，含基础复习。公顷、三角形内角和与三边关系先列拓展，多位小数运算列进阶；具体册次以实际课本为准。' },
  { id: 'science', name: '十万个为什么', icon: '？', note: '太空 · 天气 · 厦门海边', scope: '亲子好奇拓展。包含太阳系、天气观察、光、水与海洋主题；不是十万条内容，也不是教材必考范围。' },
  { id: 'reading', name: '阅读与表达', icon: '文', note: '会读 · 会想 · 会表达', scope: '依据三至四年级语文学段方向，练习理解、提问、复述和表达。例文与练习为原创。' }
]
export const entries = [...english, ...englishTextbook, ...idioms, ...math, ...science, ...reading]
export const entryById = new Map(entries.map(entry => [entry.id, entry]))
export const sourceDate = '2026-10-06'
const source = (title, url, role = '科学解释核对') => ({ title, url, role })
export const SOURCES = {
  curriculum: source('教育部 · 义务教育课程方案和课程标准（2022年版）', 'https://hudong.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html', '学段范围参考；非逐条释义来源'),
  'math-standard': source('教育部 · 数学课程标准（2022年版，5月9日替换版）', 'https://hudong.moe.gov.cn/srcsite/A26/s8001/202204/W020220510531636118932.pdf', '数学学习领域参考；非教材单元映射'),
  fltrp: source('外研社 · 英语新标准配套资源', 'https://www.unischool.cn/xbzyycpfw/tape/', '起点版本说明；非教材词表来源'),
  planets: source('NASA · About the Planets', 'https://science.nasa.gov/solar-system/planets/'),
  mercury: source('NASA · Mercury Facts', 'https://science.nasa.gov/mercury/facts/'),
  venus: source('NASA · Venus Facts', 'https://science.nasa.gov/venus/venus-facts/'),
  mars: source('NASA · Mars Facts', 'https://science.nasa.gov/mars/facts/'),
  jupiter: source('NASA · Jupiter Facts', 'https://science.nasa.gov/jupiter/jupiter-facts/'),
  saturn: source('NASA · Saturn Facts', 'https://science.nasa.gov/saturn/facts/'),
  uranus: source('NASA · Uranus Facts', 'https://science.nasa.gov/uranus/facts/'),
  neptune: source('NASA · Neptune Facts', 'https://science.nasa.gov/neptune/neptune-facts/'),
  asteroids: source('NASA · What Is an Asteroid?', 'https://spaceplace.nasa.gov/asteroid/en/'),
  comets: source('NASA · Comet Facts', 'https://science.nasa.gov/solar-system/comets/facts/'),
  meteors: source('NASA · Meteors and Meteorites', 'https://science.nasa.gov/solar-system/meteors-meteorites/'),
  'earth-motion': source('NASA · Facts About Earth', 'https://science.nasa.gov/earth/facts/'),
  rainbow: source('NOAA · What Causes a Rainbow?', 'https://www.nesdis.noaa.gov/about/k-12-education/optical-phenomena/what-causes-rainbow'),
  'climate-weather': source('NOAA · Climate vs. Weather', 'https://www.noaa.gov/jetstream/global/climate-vs-weather'),
  wind: source('NWS · Prevailing Winds / Land and Sea Breezes', 'https://www.weather.gov/source/zhu/ZHU_Training_Page/winds/Wx_Terms/Flight_Environment.htm'),
  lightning: source('NWS · Understanding Lightning Science', 'https://www.weather.gov/safety/lightning-science-overview'),
  'snow-crystals': source('NOAA · How do snowflakes form?', 'https://www.noaa.gov/stories/how-do-snowflakes-form-science-behind-snow'),
  sky: source('NASA · Why Is the Sky Blue?', 'https://spaceplace.nasa.gov/blue-sky/en/'),
  moon: source('NASA · What Are the Moon’s Phases?', 'https://spaceplace.nasa.gov/moon-phases/en/'),
  seasons: source('NASA · What Causes the Seasons?', 'https://spaceplace.nasa.gov/seasons/en/'),
  sun: source('NASA · All About the Sun', 'https://spaceplace.nasa.gov/all-about-the-sun/en/'),
  gravity: source('NASA · What Is Gravity?', 'https://spaceplace.nasa.gov/what-is-gravity/en/'),
  eclipse: source('NASA StarChild · What is an eclipse?', 'https://starchild.gsfc.nasa.gov/docs/StarChild/questions/question6.html'),
  clouds: source('NOAA · Clouds', 'https://www.noaa.gov/jetstream/clouds'),
  fog: source('USGS · Water Cycle for Kids', 'https://water.usgs.gov/edu/watercycle-kids-int.html'),
  condensation: source('USGS · Condensation and the Water Cycle', 'https://www.usgs.gov/water-science-school/science/condensation-and-water-cycle'),
  evaporation: source('USGS · Evaporation and the Water Cycle', 'https://www.usgs.gov/water-science-school/science/evaporation-and-water-cycle'),
  cycle: source('USGS · Water cycle', 'https://www.usgs.gov/special-topics/water-science-school/water-cycle'),
  salt: source('NOAA · Why is the ocean salty?', 'https://oceanservice.noaa.gov/facts/whysalty.html'),
  tides: source('NOAA · What are tides?', 'https://oceanservice.noaa.gov/facts/tides.html'),
  density: source('USGS · Water Density', 'https://www.usgs.gov/water-science-school/science/water-density')
}
