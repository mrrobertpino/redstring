import {bounds,dimensions} from './geometry.js';
export function timeValue(value){if(!value)return null;if(typeof value.toMillis==='function')return value.toMillis();if(Number.isFinite(value.seconds))return value.seconds*1000;if(typeof value==='string'){const n=Date.parse(value);return Number.isFinite(n)?n:null}return null}
export function additionEvents(board){return [...board.items.map(i=>({type:'item',id:i.id,time:timeValue(i.createdAt)||timeValue(i.date)})),...board.strings.map(s=>({type:'string',id:s.id,time:timeValue(s.createdAt)}))].filter(e=>e.time!==null).sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id))}
export function atAddition(board,events,count){const visible=new Set(events.slice(0,count).map(e=>e.type+':'+e.id));const dated=new Set(events.map(e=>e.type+':'+e.id));const items=board.items.filter(i=>!dated.has('item:'+i.id)||visible.has('item:'+i.id));const ids=new Set(items.map(i=>i.id));const strings=board.strings.filter(s=>ids.has(s.from)&&ids.has(s.to)&&(!dated.has('string:'+s.id)||visible.has('string:'+s.id)));return {...board,items,strings,pins:board.pins.filter(p=>ids.has(p.itemId)),clusters:board.clusters.map(c=>({...c,members:c.members.filter(id=>ids.has(id))})).filter(c=>c.members.length>=2),connections:strings.map(s=>[s.from,s.to])}}
// Fan cluster groups outward without changing the saved board or their internal arrangement.
export function splayBoard(board){
 const center={x:700,y:350},groups=[],taken=new Set();
 for(const cluster of board.clusters){const items=board.items.filter(i=>cluster.members.includes(i.id)&&!taken.has(i.id));if(items.length){groups.push(items);items.forEach(i=>taken.add(i.id))}}
 for(const item of board.items)if(!taken.has(item.id))groups.push([item]);
 const nodes=groups.map(items=>{const b=bounds(items),x=(b.left+b.right)/2,y=(b.top+b.bottom)/2;return {items,x,y,w:b.right-b.left,h:b.bottom-b.top,r:Math.hypot(x-center.x,y-center.y),angle:Math.atan2(y-center.y,x-center.x)}});
 const hub=[...nodes].sort((a,b)=>a.r-b.r)[0];
 const spokes=nodes.filter(n=>n!==hub).sort((a,b)=>a.angle-b.angle||a.r-b.r);
 // Separate coincident directions so even a stack of images can open into a fan.
 const used=[],angleGap=Math.min(.12,Math.PI/(spokes.length+1));
 for(const n of spokes){let angle=n.angle,attempt=0;while(used.some(a=>Math.abs(Math.atan2(Math.sin(angle-a),Math.cos(angle-a)))<angleGap)&&attempt<500){attempt++;angle=n.angle+Math.ceil(attempt/2)*angleGap*1.17*(attempt%2?1:-1)}n.angle=angle;used.push(angle);n.r=Math.max(n.r,180,(hub?Math.hypot(hub.w,hub.h)/2:0)+Math.hypot(n.w,n.h)/2+60)}
 const position=(n,factor)=>n===hub?{x:n.x,y:n.y}:{x:center.x+Math.cos(n.angle)*n.r*factor,y:center.y+Math.sin(n.angle)*n.r*factor};
 let factor=1.15;
 for(let attempt=0;attempt<80;attempt++){const positions=nodes.map(n=>position(n,factor));let overlap=false;for(let a=0;a<nodes.length;a++)for(let b=a+1;b<nodes.length;b++)if(Math.abs(positions[a].x-positions[b].x)<(nodes[a].w+nodes[b].w)/2+60&&Math.abs(positions[a].y-positions[b].y)<(nodes[a].h+nodes[b].h)/2+60)overlap=true;if(!overlap)break;factor*=1.12}
 const moved=new Map();for(const n of nodes){const p=position(n,factor);for(const item of n.items)moved.set(item.id,{...item,x:item.x+p.x-n.x,y:item.y+p.y-n.y})}
 return {...board,splayCenter:center,items:board.items.map(i=>moved.get(i.id))};
}
export function fitSplay(viewport,items,center={x:700,y:350}){const b=items.length?bounds(items):{left:center.x,right:center.x,top:center.y,bottom:center.y};const halfWidth=Math.max(100,center.x-b.left,b.right-center.x)+70,halfHeight=Math.max(100,center.y-b.top,b.bottom-center.y)+70;const scale=Math.min(2,viewport.clientWidth/(halfWidth*2),viewport.clientHeight/(halfHeight*2));return {scale,tx:viewport.clientWidth/2-center.x*scale,ty:viewport.clientHeight/2-center.y*scale}}
