import test from 'node:test';
import assert from 'node:assert/strict';
import {installment,summary,candidates,validateMovement} from '../finance.js';
const m={id:'one',description:'Compra',date:'2026-12-20',amount:10000,type:'expense',accountId:'credit',installments:3,sharedPercent:50,person:'Pareja'};
test('las cuotas cruzan de año y conservan exactamente el total en centavos',()=>{assert.deepEqual(['2026-11','2026-12','2027-01','2027-02','2027-03'].map(month=>installment(m,month)),[0,3334,3333,3333,0]);});
test('proyección y deuda completa son independientes; cobro salda la deuda',()=>{const d={movements:[m]};assert.equal(summary(d,'2027-01').expense,3333);assert.equal(summary(d,'2027-01').receivable,5000);assert.equal(summary({movements:[{...m,settled:true}]},'2027-01').receivable,0);});
test('la conciliación exige cuenta, importe, tipo y fecha cercana',()=>{assert.equal(candidates({...m,date:'2026-12-23'},[m]).length,1);for(const change of [{date:'2026-12-24'},{accountId:'other'},{amount:9999},{type:'income'}])assert.equal(candidates({...m,...change},[m]).length,0);});
test('se rechazan cuotas fraccionarias e ingresos compartidos',()=>{assert.throws(()=>validateMovement({...m,installments:1.5},[{id:'credit'}]));assert.throws(()=>validateMovement({...m,type:'income'},[{id:'credit'}]));});
