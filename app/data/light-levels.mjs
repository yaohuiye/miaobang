const mirror = (x,y,face) => ({x,y,face})
export const lightLevels = [
  {id:'light-1',name:'第一束光',place:'月牙湾',note:'转动一面镜子，让光向上走。',source:{x:0,y:4,direction:'E'},target:{x:3,y:1},mirrors:[mirror(3,4,'\\')],rocks:[]},
  {id:'light-2',name:'拐两个弯',place:'星沙码头',note:'光经过第一面镜子以后，会往哪里去？',source:{x:0,y:4,direction:'E'},target:{x:5,y:1},mirrors:[mirror(2,4,'\\'),mirror(2,1,'\\')],rocks:[{x:4,y:4}]},
  {id:'light-3',name:'绕过小礁石',place:'蓝雾海峡',note:'先绕到上面，再把光送回来。',source:{x:0,y:4,direction:'E'},target:{x:4,y:4},mirrors:[mirror(1,4,'\\'),mirror(1,1,'/'),mirror(4,1,'/')],rocks:[{x:3,y:4},{x:3,y:3}]},
  {id:'light-4',name:'谁在帮忙',place:'双子星港',note:'有一面镜子可以不经过，试着找出有用的路线。',source:{x:0,y:5,direction:'E'},target:{x:5,y:0},mirrors:[mirror(2,5,'/'),mirror(2,2,'\\'),mirror(5,2,'\\'),mirror(1,2,'\\')],rocks:[{x:2,y:0},{x:4,y:5}]},
  {id:'light-5',name:'先往下走',place:'珊瑚小岛',note:'有时，先离灯塔远一点，反而能找到路。',source:{x:0,y:3,direction:'E'},target:{x:1,y:1},mirrors:[mirror(2,3,'/'),mirror(2,5,'/'),mirror(5,5,'\\'),mirror(5,1,'/')],rocks:[{x:3,y:3},{x:2,y:0}]},
  {id:'light-6',name:'点亮远方',place:'极光灯塔',note:'把前面发现的转弯办法连起来。慢慢试就好。',source:{x:0,y:5,direction:'E'},target:{x:5,y:0},mirrors:[mirror(1,5,'\\'),mirror(1,1,'\\'),mirror(4,1,'/'),mirror(4,4,'/'),mirror(5,4,'\\')],rocks:[{x:3,y:5},{x:2,y:3},{x:4,y:0}]}
].map(level=>({...level,size:6}))
