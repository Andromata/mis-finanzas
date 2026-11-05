import http from 'node:http';
import {readFile, mkdir, writeFile, rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {validateMovement, candidates} from './finance.js';
const root = path.dirname(fileURLToPath(import.meta.url));
const dir = process.env.DATA_DIR || path.join(root, '.data');
await mkdir(dir, {recursive:true});
const file = path.join(dir, 'finances.json');
let data;
try { data = JSON.parse(await readFile(file, 'utf8')); }
catch (e) { if (e.code !== 'ENOENT') throw e; data = {accounts:[{id:'savings',name:'Caja de ahorro',kind:'Banco'},{id:'credit',name:'Tarjeta de crédito',kind:'Tarjeta'},{id:'wallet',name:'Mercado Pago',kind:'Billetera'},{id:'cash',name:'Efectivo',kind:'Efectivo'}],movements:[]}; }
async function save() { await writeFile(file + '.tmp', JSON.stringify(data)); await rename(file + '.tmp', file); }
let queue = Promise.resolve();
async function body(req) { let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 1_000_000) throw Error('El archivo supera el límite de 1 MB.'); } return JSON.parse(raw || '{}'); }
function movement(input) { const m = {id:randomUUID(),description:String(input.description || '').trim(),amount:input.amount,date:input.date,type:input.type,accountId:input.accountId,category:String(input.category || 'Otros'),installments:input.installments ?? 1,sharedPercent:input.sharedPercent ?? 0,person:String(input.person || '').trim(),settled:false,source:input.source === 'csv' ? 'csv' : 'manual'}; validateMovement(m,data.accounts); return m; }
async function api(req,res,url) {
  const input = req.method === 'POST' ? await body(req) : {};
  if (url === '/api/data' && req.method === 'GET') return data;
  if (url === '/api/movements' && req.method === 'POST') { const m=movement(input); data.movements.push(m); await save(); return m; }
  if (url === '/api/accounts' && req.method === 'POST') { if (!input.name?.trim()) throw Error('Ingresá el nombre de la cuenta.'); const a={id:randomUUID(),name:input.name.trim(),kind:input.kind || 'Banco'}; data.accounts.push(a); await save(); return a; }
  if (url === '/api/settle' && req.method === 'POST') { const m=data.movements.find(m=>m.id===input.id && m.sharedPercent>0); if (!m) throw Error('Deuda inexistente.'); m.settled=!m.settled; await save(); return m; }
  if (url === '/api/import/preview' && req.method === 'POST') { if (!Array.isArray(input.rows) || input.rows.length>500) throw Error('Importá hasta 500 filas por vez.'); return input.rows.map(row=>{const m=movement({...row,source:'csv'});return {movement:m,candidates:candidates(m,data.movements)};}); }
  if (url === '/api/import/confirm' && req.method === 'POST') {
    if (!Array.isArray(input.rows) || input.rows.length>500) throw Error('Importación inválida.');
    const pending = input.rows.map(row=>({m:movement({...row.movement,source:'csv'}),match:row.match}));
    const used=new Set();
    for (const {m,match} of pending) if (match) { if (used.has(match) || !candidates(m,data.movements).some(x=>x.id===match)) throw Error('La coincidencia cambió o está repetida. Volvé a revisar el archivo.'); used.add(match); }
    for (const {m,match} of pending) { if (match) { const old=data.movements.find(x=>x.id===match); old.source='csv'; } else data.movements.push(m); }
    await save(); return {count:pending.length};
  }
  if (url === '/api/demo' && req.method === 'POST') {
    if (data.movements.length) throw Error('Los ejemplos solo se pueden cargar cuando no hay movimientos.');
    const now=new Date(); const date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-05`;
    data.movements=[{description:'Sueldo · ejemplo',amount:180000000,type:'income',accountId:'savings',category:'Sueldo'}, {description:'Supermercado · ejemplo',amount:12600000,type:'expense',accountId:'credit',category:'Supermercado',sharedPercent:50,person:'Mi esposo'}, {description:'Heladera · ejemplo',amount:90000000,type:'expense',accountId:'credit',category:'Hogar',installments:6,sharedPercent:50,person:'Mi esposo'}, {description:'Internet · ejemplo',amount:3500000,type:'expense',accountId:'wallet',category:'Servicios'}].map(m=>movement({...m,date})); await save();return data;
  }
  res.statusCode=404; return {error:'Ruta inexistente'};
}
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost').pathname;
  if (url.startsWith('/api/')) {
    res.setHeader('Content-Type','application/json');
    const run=async()=>{try {res.end(JSON.stringify(await api(req,res,url)));} catch(e) {res.statusCode=400;res.end(JSON.stringify({error:e.message}));}};
    queue=queue.then(run,run); return;
  }
  const routes={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/finance.js':'../finance.js'};
  if (!routes[url]) {res.writeHead(404);res.end();return;}
  try { const content=await readFile(path.join(root,'public',routes[url]));res.setHeader('Content-Type',url.endsWith('.js')?'text/javascript':url.endsWith('.css')?'text/css':'text/html');res.end(content); } catch {res.writeHead(500);res.end('Error al cargar');}
});
server.listen(Number(process.env.PORT || 3000),process.env.HOST || '127.0.0.1',()=>console.log('Mis finanzas iniciado en puerto '+(process.env.PORT || 3000)));
