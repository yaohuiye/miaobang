const vectors = {N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]}
const turns = {'/':{N:'E',E:'N',S:'W',W:'S'},'\\':{N:'W',W:'N',S:'E',E:'S'}}
const same = (a,b) => a.x===b.x && a.y===b.y

export function traceLight(level,faces) {
  if(faces.length!==level.mirrors.length || faces.some(face=>!turns[face])) throw new Error('镜子方向不正确。')
  let point={x:level.source.x,y:level.source.y}, direction=level.source.direction
  const segments=[], visited=new Set(), touched=[]
  while(true) {
    const key=`${point.x},${point.y},${direction}`
    if(visited.has(key)) return {status:'loop',segments,touched}
    visited.add(key)
    const [dx,dy]=vectors[direction], next={x:point.x+dx,y:point.y+dy}
    if(next.x<0 || next.y<0 || next.x>=level.size || next.y>=level.size) {
      segments.push({from:point,to:{x:point.x+dx/2,y:point.y+dy/2}})
      return {status:'edge',segments,touched}
    }
    segments.push({from:point,to:next})
    if(level.rocks.some(rock=>same(rock,next))) return {status:'rock',segments,touched}
    if(same(level.target,next)) return {status:'lit',segments,touched}
    const index=level.mirrors.findIndex(mirror=>same(mirror,next))
    if(index>=0) { direction=turns[faces[index]][direction]; if(!touched.includes(index)) touched.push(index) }
    point=next
  }
}

// At most five mirrors in the bundled levels; choose a solution needing the fewest changes.
export function lightHint(level,faces) {
  let best=null, distance=Infinity
  for(let mask=0;mask<2**level.mirrors.length;mask++) {
    const candidate=level.mirrors.map((_,index)=>mask & (1<<index) ? '/' : '\\')
    const changes=candidate.reduce((count,face,index)=>count+(face!==faces[index]),0)
    if(changes>=distance || traceLight(level,candidate).status!=='lit') continue
    best=candidate; distance=changes
  }
  if(!best) return null
  const index=best.findIndex((face,i)=>face!==faces[i])
  return index<0 ? {ready:true} : {ready:false,index,face:best[index]}
}
