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
