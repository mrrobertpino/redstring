import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {validateSubmission,mergeBoard,validContent} from './public/model.js';
const item={id:'student',title:'New idea',name:'A student',reason:'Connects to AI',kind:'note',content:'A question',cluster:'AI systems',date:'2026-10-06',links:['hal'],x:500,y:400};
test('submission validation rejects unsafe links and oversized content',()=>{
 assert.equal(validateSubmission(item),item);
 for(const content of ['javascript:alert(1)','data:text/html,test','https://user:password@example.com'])assert.equal(validContent('link',content),false);
 assert.equal(validContent('link','https://example.com'),true);
 assert.throws(()=>validateSubmission({...item,name:''}));
 assert.throws(()=>validateSubmission({...item,content:'a'.repeat(4001)}));
 assert.throws(()=>validateSubmission({...item,x:NaN}));
 assert.throws(()=>validateSubmission({...item,links:Array(21).fill('hal')}));
 assert.equal(validContent('image','data:image/svg+xml;base64,AAAA'),false);
});
test('published contributions merge with seed and add valid connections',async()=>{
 const seed=JSON.parse(await readFile(new URL('./public/board.json',import.meta.url)));
 const merged=mergeBoard(seed,[item]);assert.equal(merged.items.length,seed.items.length+1);assert.ok(merged.connections.some(pair=>pair.includes('student')&&pair.includes('hal')));
 const edited=mergeBoard(seed,[{...item,id:'hal',title:'Updated HAL',links:[]}]);assert.equal(edited.items.length,seed.items.length);assert.equal(edited.items.find(i=>i.id==='hal').title,'Updated HAL');
});
test('GitHub Pages subpath serves the board with relative assets and no API',async()=>{
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'3198'}});
 try{await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',()=>reject(Error('Server exited early')))});
 const base='http://localhost:3198/redstring/';const page=await fetch(base);assert.equal(page.status,200);const html=await page.text();assert.ok(html.includes('href="./style.css"'));assert.ok(html.includes('src="./app.js"'));
 for(const file of ['app.js','firebase.js','firebase-config.js','model.js','style.css','board.json'])assert.equal((await fetch(base+file)).status,200,file);
 const board=await (await fetch(base+'board.json')).json();assert.equal(board.items.length,8);
 const app=await (await fetch(base+'app.js')).text();assert.ok(!app.includes('/api/'));
 assert.equal((await fetch(base+'../firestore.rules')).status,404);
 }finally{child.kill();await new Promise(r=>child.once('exit',r))}
});
import {edgeAnchor,anchorPoint,bounds,applyLayout,makeLayout,validateLayout} from './public/geometry.js';
test('edge strings track image rotation and scale',()=>{const item={x:300,y:200,width:200,height:100,rotation:90};const anchor=edgeAnchor(item,{x:300,y:400});assert.ok(Math.abs(anchor.x-.5)<.00001);const point=anchorPoint(item,anchor);assert.ok(Math.abs(point.x-300)<.00001);assert.ok(Math.abs(point.y-300)<.00001);const scaled=anchorPoint({...item,width:400},anchor);assert.ok(Math.abs(scaled.y-400)<.00001);const box=bounds([item]);assert.ok(Math.abs(box.right-box.left-100)<.00001)});
test('layout preserves exact strings, clusters and hidden seed items',async()=>{const seed=JSON.parse(await readFile(new URL('./public/board.json',import.meta.url)));let board=applyLayout(mergeBoard(seed,[]),null);board.items=board.items.filter(i=>i.id!=='belief');board.clusters=[{id:'group',title:'AI',reason:'Shared context',members:['claude','hal']}];board.strings=[{id:'edge',from:'claude',to:'hal',a:{x:.5,y:0},b:{x:-.5,y:0}}];const layout=makeLayout(board,seed.items.map(i=>i.id));validateLayout(layout);const restored=applyLayout(mergeBoard(seed,[]),layout);assert.ok(!restored.items.some(i=>i.id==='belief'));assert.equal(restored.strings.length,1);assert.deepEqual(restored.strings[0].a,{x:.5,y:0});assert.equal(restored.clusters[0].reason,'Shared context');assert.throws(()=>validateLayout({...layout,transforms:{bad:{x:0,y:0,width:20,height:20,rotation:NaN}}}));const newBoard=applyLayout(mergeBoard(seed,[item]),layout);assert.ok(newBoard.strings.some(s=>s.from==='student'&&s.to==='hal'))});
