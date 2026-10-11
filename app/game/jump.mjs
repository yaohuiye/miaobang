const clamp=(n,a,b)=>Math.max(a,Math.min(b,n))
export function jumpDistance(seconds){return 45+clamp(seconds,0,1.2)*180}
export function createJump(random=Math.random){const s={status:'ready',score:0,landings:0,player:{x:70,y:280},camera:0,current:{x:70,width:80},next:null,flight:null};nextPlatform(s,random);return s}
function nextPlatform(s,random){s.next={x:s.current.x+110+random()*80,width:Math.max(48,78-s.landings*3)}}
export function launchJump(s,seconds){if(s.status!=='running'||s.flight)return false;s.flight={from:s.player.x,to:s.player.x+jumpDistance(seconds),elapsed:0};return true}
export function stepJump(s,dt,random=Math.random){if(s.status!=='running'||!s.flight)return s;const f=s.flight;f.elapsed+=clamp(dt,0,.05);const t=Math.min(1,f.elapsed/.75);s.player.x=f.from+(f.to-f.from)*t;s.player.y=280-Math.sin(Math.PI*t)*130;s.camera=Math.max(0,s.player.x-100);if(t===1){const offset=Math.abs(s.player.x-s.next.x);s.flight=null;if(offset>s.next.width/2){s.status='over';return s}s.score+=offset<=10?20:10;s.landings++;s.current=s.next;if(s.landings===10)s.status='complete';else nextPlatform(s,random)}return s}
