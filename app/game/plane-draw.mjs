import { FIELD } from './plane.mjs'
export function drawPlane(c,s){
  const line=(x,y,xx,yy,color,width=1)=>{c.setStrokeStyle(color);c.setLineWidth(width);c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke()}
  const circle=(x,y,r,color,fill=true)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.setFillStyle(color);c.fill()}else{c.setStrokeStyle(color);c.setLineWidth(2);c.stroke()}}
  const ship=(x,y,r,color,down)=>{const d=down?1:-1;c.setFillStyle(color);c.setStrokeStyle('#234b61');c.setLineWidth(1.5);c.beginPath();c.moveTo(x,y+d*r*1.4);c.lineTo(x+r*.25,y);c.lineTo(x+r,y-d*r*.3);c.lineTo(x+r*.35,y-d*r*.55);c.lineTo(x+r*.3,y-d*r);c.lineTo(x-r*.3,y-d*r);c.lineTo(x-r*.35,y-d*r*.55);c.lineTo(x-r,y-d*r*.3);c.lineTo(x-r*.25,y);c.closePath();c.fill();c.stroke();circle(x,y,r*.2,'#e9f5f5')}
  c.setFillStyle('#e6eff0');c.fillRect(0,0,FIELD.width,FIELD.height)
  const offset=s.time*20%32
  for(let x=0;x<320;x+=32)line(x,0,x,480,'#d6e4e6')
  for(let y=offset;y<480;y+=32)line(0,y,320,y,'#d6e4e6')
  c.setFontSize(10);c.setFillStyle('#7898a0');c.setTextAlign('left');c.fillText('MIAO AIR · 01',14,24)
  s.bullets.forEach(b=>line(b.x,b.y,b.x,b.y+9,'#368e96',3));s.shots.forEach(b=>circle(b.x,b.y,3,'#df896d'))
  s.enemies.forEach(e=>{ship(e.x,e.y,e.r,e.maxHp>1?'#b7bec2':'#cad8da',true);if(e.maxHp>1){line(e.x-15,e.y-e.r-6,e.x+15,e.y-e.r-6,'#c2d1d4',3);line(e.x-15,e.y-e.r-6,e.x-15+30*e.hp/e.maxHp,e.y-e.r-6,'#b77761',3)}})
  s.gifts.forEach(g=>{circle(g.x,g.y,10,g.type==='shield'?'#7bbaad':'#eac276');c.setFontSize(11);c.setFillStyle('#234b61');c.setTextAlign('center');c.fillText(g.type==='shield'?'盾':'三',g.x,g.y+4)})
  if(s.invincible===0||Math.floor(s.invincible*12)%2===0)ship(s.player.x,s.player.y,19,'#4b9b9e',false)
  if(s.shield)circle(s.player.x,s.player.y,28,'#559d8b',false)
  s.sparks.forEach(e=>{circle(e.x,e.y,6+e.age*45,'#dba36b',false);circle(e.x,e.y,2+e.age*25,'#f4ca80',false)})
}
