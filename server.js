// Optional development server. Production runs as static files on GitHub Pages.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
const types={'.svg':'image/svg+xml','.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.m4a':'audio/mp4','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;const relative=pathname.replace(/^\/redstring(?=\/|$)/,'').replace(/^\//,'')||'index.html';if(relative.includes('..')||!/^[-a-zA-Z0-9_./]+$/.test(relative)){res.writeHead(404);return res.end('Not found')}const data=await readFile(new URL('./public/'+relative,import.meta.url));const ext=relative.slice(relative.lastIndexOf('.'));res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}});
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Redstring static server on '+(process.env.PORT||3000)));
