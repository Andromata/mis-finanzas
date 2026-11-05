import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
test('API: persistencia, conciliación sin duplicar, cobro e importación inválida atómica',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'finanzas-test-'));let child;
 async function start(){child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'3198',DATA_DIR:dir},stdio:['ignore','pipe','inherit']});await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('El servidor no inició');})]);}
 async function stop(){child.kill();await once(child,'exit');}
 const call=async(route,body)=>{const r=await fetch('http://127.0.0.1:3198/api/'+route,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});return {status:r.status,body:await r.json()};};
 try{await start();const m={description:'Super',amount:150005,date:'2026-11-05',type:'expense',accountId:'credit',sharedPercent:50,person:'Pareja',installments:3};const created=await call('movements',m);assert.equal(created.status,200);let preview=await call('import/preview',{rows:[m]});assert.equal(preview.body[0].candidates[0].id,created.body.id);assert.equal((await call('import/confirm',{rows:[{movement:m,match:created.body.id}]})).status,200);let d=(await call('data')).body;assert.equal(d.movements.length,1);assert.equal(d.movements[0].source,'csv');assert.equal(d.movements[0].installments,3);await call('settle',{id:created.body.id});await stop();await start();d=(await call('data')).body;assert.equal(d.movements[0].settled,true);assert.equal((await call('import/confirm',{rows:[{movement:m},{movement:{...m,amount:-1}}]})).status,400);assert.equal((await call('data')).body.movements.length,1);const page=await fetch('http://127.0.0.1:3198');assert.match(await page.text(),/Mis finanzas/);
 }finally{if(child?.exitCode===null)await stop();await rm(dir,{recursive:true,force:true});}
});
