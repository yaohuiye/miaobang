// 固定 600×360 的实验坐标，页面只按比例缩放，不改变实验结果。
export function drawExperiment(ctx, e, p, result, progress = 0) {
  const line=(x1,y1,x2,y2,color='#547487',width=3)=>{ctx.setStrokeStyle(color);ctx.setLineWidth(width);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
  const circle=(x,y,r,color)=>{ctx.setFillStyle(color);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
  const box=(x,y,w,h,color)=>{ctx.setFillStyle(color);ctx.fillRect(x,y,w,h)}
  const label=(s,x,y,color='#23485d',size=17)=>{ctx.setFillStyle(color);ctx.setFontSize(size);ctx.setTextAlign('center');ctx.fillText(s,x,y)}
  const arrow=(x,y,dir)=>{line(x,y,x+dir*48,y,'#e47d56',4);line(x+dir*48,y,x+dir*36,y-8,'#e47d56');line(x+dir*48,y,x+dir*36,y+8,'#e47d56')}
  ctx.setFillStyle('#edf6f4');ctx.fillRect(0,0,600,360)
  ctx.setStrokeStyle('#d9e9e5');ctx.setLineWidth(1)
  for(let x=20;x<600;x+=30)line(x,20,x,340,'#dfede9',1)
  switch(e.id) {
    case 'shadow': {
      const x=65+p.distance*4.8,h=18*result.value
      box(550,50,10,260,'#bdced4');circle(65,180,15,'#f7c867')
      line(65,180,550,180-h,'#efbd5d',2);line(65,180,550,180+h,'#efbd5d',2)
      box(x-7,162,14,36,'#39958c');box(550,180-h,10,2*h,'#436071')
      label('灯',65,240);label('物体',x,240);label('屏幕',550,335);break
    }
    case 'float': {
      box(30,180,540,150,'#b0dbe8');line(30,180,570,180,'#5697b5',3)
      const w=100+p.volume*.8,h=72,y=result.sunk?250:180-h*(1-result.value)
      box(300-w/2,y,w,h,'#d59562');box(300-w/2+8,y+8,w-16,h-16,'#fff3cf');box(278,y-20,44,30,'#738da6')
      label(`${p.mass} 克`,300,y+45);label('淡水',500,300);break
    }
    case 'circuit': {
      box(95,110,55,120,'#234f65');label('+',122,145,'#fff',24);label('−',122,208,'#fff',24)
      const paths=[[150,120,440,120],[450,140,450,270],[450,270,120,270]]
      paths.forEach((v,i)=>{line(...v,'#afc4cd',5);if(p[['a','b','c'][i]])line(...v,'#349d8e',5);else{const x=(v[0]+v[2])/2,y=(v[1]+v[3])/2;circle(x,y,10,'#edf6f4');label('断',x,y-17,'#ad6357',14)}})
      line(120,230,120,270);circle(450,120,27,result.value?'#ffd467':'#ccd9dd');label('灯泡',450,78);break
    }
    case 'materials': {
      box(95,140,65,80,'#df745f');box(160,140,65,80,'#467aa1');label('N',127,188,'#fff',26);label('S',193,188,'#fff',26)
      box(result.value?240:385,155,70,50,result.value?'#718c9c':'#cda273');label(e.labels[p.material],420,245)
      if(result.value)arrow(320,180,-1);label(result.value?'靠近磁铁':'留在原处',300,310);break
    }
    case 'poles': {
      box(90,140,70,80,'#467aa1');box(160,140,70,80,'#df745f');label('S',125,188,'#fff',26);label('N',195,188,'#fff',26)
      box(370,140,70,80,p.flip?'#467aa1':'#df745f');box(440,140,70,80,p.flip?'#df745f':'#467aa1');label(p.flip?'S':'N',405,188,'#fff',26);label(p.flip?'N':'S',475,188,'#fff',26)
      arrow(245,180,p.flip?1:-1);arrow(355,180,p.flip?-1:1);break
    }
    case 'sound': {
      line(40,180,560,180,'#c3d5db',2);ctx.setStrokeStyle('#319c8f');ctx.setLineWidth(4);ctx.beginPath()
      for(let x=40;x<=560;x+=2){const y=180+Math.sin((x-40)/520*Math.PI*2*[2,4,8][p.tone])*p.volume*22;if(x===40)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke()
      label('左右越密 → 音调越高',300,300);break
    }
    case 'ramp': {
      const top=270-p.height*2,end=500,t=progress
      line(80,top,end,270,'#61899b',8);line(60,280,550,280,'#aac4ce',3)
      const x=95+(end-95)*t,y=top+(270-top)*t-13;box(x-20,y-17,40,20,'#e4ad5e');circle(x-12,y+5,7,'#345368');circle(x+12,y+5,7,'#345368');label('忽略摩擦的斜坡',300,325);break
    }
    case 'friction': {
      line(50,265,550,265,'#7998a7',8)
      for(let x=55;x<550;x+=25)line(x,269,x+8,269+p.rough*4,'#7998a7',2)
      const x=75+Math.min(460,result.value*190)*progress;box(x-20,226,40,25,'#e4ad5e');circle(x-12,258,7,'#345368');circle(x+12,258,7,'#345368');label('起始速度相同',300,320);break
    }
    case 'parachute': {
      const y=70+170*progress,r=35+p.area
      ctx.setFillStyle('#eead6f');ctx.beginPath();ctx.arc(300,y,r,Math.PI,2*Math.PI);ctx.fill();line(300-r,y,300,y+80);line(300+r,y,300,y+80);circle(300,y+84,12,'#527c95');line(300,y+96,300,y+122,'#527c95',6);label('稳定下降示意',460,320);break
    }
    case 'lever': {
      const tilt=result.value===0?0:result.value>0?-.16:.16
      const y=x=>205+Math.sin(tilt)*(x-300)
      ctx.setFillStyle('#86afa9');ctx.beginPath();ctx.moveTo(300,206);ctx.lineTo(275,275);ctx.lineTo(325,275);ctx.closePath();ctx.fill();line(80,y(80),520,y(520),'#688e9f',9)
      const l=300-p.left*40,r=300+p.right*40;box(l-20,y(l)-45,40,40,'#df9266');box(r-15,y(r)-30,30,25,'#6ca8a1');label('2 份',l,y(l)-60);label('1 份',r,y(r)-45);label('支点',300,305);break
    }
    case 'color': {
      box(65,70,470,220,'#193543');circle(160,180,38,`rgb(${p.red},0,0)`);circle(300,180,38,`rgb(0,${p.green},0)`);circle(440,180,38,`rgb(0,0,${p.blue})`)
      circle(300,180,85,result.value);label('叠加后的光色',300,330);break
    }
    case 'pressure': {
      box(75,50,100,255,'#c4e0e9');box(80,250-p.height*3,90,p.height*3,'#76b9d0');line(75,50,75,305,'#628e9f',3);line(175,50,175,240,'#628e9f',3);line(175,260,175,305,'#628e9f',3);line(75,305,175,305,'#628e9f',3)
      ctx.setStrokeStyle('#58a6c4');ctx.setLineWidth(4);ctx.beginPath();ctx.moveTo(175,250)
      for(let t=0;t<=1;t+=.02)ctx.lineTo(175+t*result.value*380,250+55*t*t);ctx.stroke();line(30,308,570,308,'#aac4ce',3);label('孔的位置保持不变',365,335);break
    }
    case 'moon': {
      circle(70,155,40,'#f5c867');label('太阳',70,230)
      ctx.setStrokeStyle('#a8c7cf');ctx.setLineWidth(2);ctx.beginPath();ctx.arc(330,155,105,0,Math.PI*2);ctx.stroke();circle(330,155,23,'#5d9eae');label('地球',330,196,undefined,14)
      const a=p.angle*Math.PI/180,x=330-Math.cos(a)*105,y=155-Math.sin(a)*105
      circle(x,y,15,'#465969');ctx.setFillStyle('#f4eac8');ctx.beginPath();ctx.arc(x,y,15,Math.PI/2,3*Math.PI/2);ctx.fill()
      circle(510,155,38,'#465969')
      // 对每条水平扫描线画亮区，正确区分上弦、下弦；新月为零，满月全亮。
      const waxing=p.angle<=180,cos=Math.cos(a)
      for(let dy=-37;dy<=37;dy++){const half=Math.sqrt(38*38-dy*dy),edge=cos*half;box(waxing?510+edge:510-half,155+dy,waxing?half-edge:half-edge,1.2,'#f4eac8')}
      label('地球上看到的月亮',495,245,undefined,14);break
    }
  }
}
