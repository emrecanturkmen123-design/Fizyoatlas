import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {registerHooks} from 'node:module';
import React from 'react';
import {create,act} from 'react-test-renderer';
import worker from '../server/worker.ts';
import {questionDefinition} from '../app/learning-data.ts';
import {useLearning} from '../app/use-learning.ts';
import {Button} from '../components/ui/button.tsx';
const sqlite=new DatabaseSync(':memory:');for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync('drizzle/'+file,'utf8'));
let batchFail=false,batches=0;
const DB={prepare(sql){const statement=sqlite.prepare(sql);let args=[];return {bind(...v){args=v;return this;},async all(){return {results:statement.all(...args)};},async run(){return statement.run(...args);}};},async batch(statements){batches++;sqlite.exec('BEGIN');try{const results=[];for(const [i,s] of statements.entries()){if(batchFail&&i===1)throw Error('storage failure');results.push(await s.run());}sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
const call=(path,user='a',body,origin='https://atlas.test',env={DB})=>worker.fetch(new Request('https://atlas.test'+path,{method:body===undefined?'GET':'PUT',headers:{Origin:origin,'Content-Type':'application/json',...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@test.dev'}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
const qid='biceps brachii-nerve',q=questionDefinition(qid);
for(const user of ['a','b']){
 await call('/api/learning/favorite',user,{key:'deltoid',favorite:true});await call('/api/learning/answer',user,{questionId:qid,choice:q.answer,attemptId:'reset-attempt-'+user});
 for(const [table,column] of [['quiz_sessions','session_key'],['course_progress','course_id'],['study_notebook','entry_id']])sqlite.prepare(`INSERT INTO ${table} (user_id,${column},payload,updated_at,revision) VALUES (?,?,?,1,1)`).run(user,'record-'+user,'preserve-'+user);
 sqlite.prepare('INSERT INTO case_progress (user_id,case_id,mode,payload,updated_at,revision) VALUES (?,?,?, ?,1,1)').run(user,'case-'+user,'learn','preserve-'+user);
}
const count=(table,user)=>sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ?`).get(user).n;
assert.equal((await call('/api/learning/reset','',{confirm:true})).status,401);
assert.equal((await call('/api/learning/reset','a',{confirm:true},'https://bad.test')).status,403);
assert.equal((await call('/api/learning/reset','a',{confirm:false})).status,400);assert.equal((await call('/api/learning/reset','a')).status,405);
assert.equal((await call('/api/learning/reset','a',{confirm:true},'https://atlas.test',{})).status,503);
batchFail=true;assert.equal((await call('/api/learning/reset','a',{confirm:true})).status,503);assert.equal(count('learning_answers','a'),1);assert.equal(count('learning_attempts','a'),1);assert.equal(count('quiz_sessions','a'),1,'failed batch rolled back every delete');batchFail=false;
const result=await call('/api/learning/reset','a',{confirm:true,userId:'b'}),snapshot=await result.json();assert.equal(result.status,200);assert.deepEqual(snapshot.answers,[]);assert.deepEqual(snapshot.history,[]);assert.deepEqual(snapshot.favorites,['deltoid']);
for(const table of ['learning_answers','learning_attempts','quiz_sessions']){assert.equal(count(table,'a'),0);assert.equal(count(table,'b'),1,'other account unaffected');}
for(const table of ['course_progress','study_notebook','case_progress'])assert.equal(count(table,'a'),1,table+' retained');assert.equal((await call('/api/learning/reset','a',{confirm:true})).status,200,'reset can be retried');
assert.equal(result.headers.get('Cache-Control'),'private, no-store');assert.equal((await(await call('/api/learning','a')).json()).answers.length,0,'reload remains empty');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.window={addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}})};globalThis.document={activeElement:null,addEventListener(){},removeEventListener(){}};
const items=new Map();globalThis.localStorage={fail:false,get length(){return items.size;},key:i=>[...items.keys()][i]??null,getItem:k=>items.get(k)??null,setItem(k,v){if(this.fail)throw Error('quota');items.set(k,v);},removeItem(k){if(this.fail)throw Error('quota');items.delete(k);}};
const localKey='fizyo-atlas-learning-v2';items.set(localKey,JSON.stringify({authenticated:false,favorites:['deltoid'],answers:[{questionId:qid,correct:true}],history:[{attemptId:'guest-attempt',questionId:qid,correct:true,answeredAt:1}]}));items.set('atlas-quiz-session-v1:general','old quiz');items.set('atlas-quiz-session-v1:scope-abc','old scoped quiz');for(const key of ['course-draft','fizyo-atlas-cases-v1','notebook-draft'])items.set(key,'retained');
let controller,root;function Probe(){controller=useLearning();return null;}
globalThis.fetch=async()=>new Response('{}',{status:401});await act(async()=>{root=create(React.createElement(Probe));});assert(controller.canWork);localStorage.fail=true;let ok;await act(async()=>{ok=await controller.reset();});assert(!ok&&controller.retryPending);assert.equal(controller.data.answers.length,1);localStorage.fail=false;await act(async()=>{ok=await controller.retry();});assert(ok);assert.deepEqual(controller.data.answers,[]);assert.deepEqual(controller.data.history,[]);assert.deepEqual(controller.data.favorites,['deltoid']);assert(!items.has('atlas-quiz-session-v1:general'));assert(!items.has('atlas-quiz-session-v1:scope-abc'));for(const key of ['course-draft','fizyo-atlas-cases-v1','notebook-draft'])assert.equal(items.get(key),'retained');await act(async()=>root.unmount());
await act(async()=>{root=create(React.createElement(Probe));});assert.equal(controller.data.answers.length,0);await act(async()=>root.unmount());
// Account mode uses authenticated storage; it never falls back after a failed reset.
let failAccount=true;globalThis.fetch=async(url,options)=>url==='/api/learning/reset'&&failAccount?new Response('{}',{status:401}):call(url,'b',options?.body?JSON.parse(options.body):undefined);
await act(async()=>{root=create(React.createElement(Probe));});assert(controller.data.authenticated);const beforeLocal=items.get(localKey);await act(async()=>{ok=await controller.reset();});assert(!ok&&controller.data.answers.length===1);assert.equal(items.get(localKey),beforeLocal);failAccount=false;await act(async()=>{ok=await controller.retry();});assert(ok&&controller.data.authenticated);assert.equal(controller.data.answers.length,0);assert.equal(count('learning_answers','b'),0);assert.equal(count('course_progress','b'),1);await act(async()=>root.unmount());
// Test the actual confirmation controller, with dialog DOM/portal primitives stubbed.
registerHooks({load(url,context,next){if(url.endsWith('/components/ui/alert-dialog.tsx'))return {format:'module',shortCircuit:true,source:`import React from 'react';const Context=React.createContext(false);export function AlertDialog({open,children}){return React.createElement(Context.Provider,{value:open},children);}export function AlertDialogContent({children}){return React.useContext(Context)?React.createElement('div',{role:'alertdialog'},children):null;}export const AlertDialogTitle=({children})=>React.createElement('h2',{},children);export const AlertDialogDescription=({children})=>React.createElement('p',{},children);export const AlertDialogFooter=({children})=>React.createElement('div',{},children);export const AlertDialogCancel=({children})=>React.createElement('button',{},children);`};return next(url,context);}});
const {default:Reset}=await import('../app/learning-reset.tsx');let resetCalls=0;const learning={data:{authenticated:true,favorites:['deltoid'],answers:[{questionId:qid,correct:true}],history:[]},loading:false,pending:false,canWork:true,retryPending:false,error:'',reset:async()=>{resetCalls++;return true;}};
const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n?.props?text(n.props.children):'';
await act(async()=>{root=create(React.createElement(Reset,{learning}));});const button=label=>root.root.findAllByType(Button).find(b=>text(b)===label);
assert(!button('Evet, soru kayıtlarını sıfırla'));await act(async()=>button('Soru kayıtlarını sıfırla').props.onClick());assert.equal(resetCalls,0);assert(root.root.findByProps({role:'alertdialog'}));await act(async()=>button('Evet, soru kayıtlarını sıfırla').props.onClick());assert.equal(resetCalls,1);assert(!button('Evet, soru kayıtlarını sıfırla'));assert(root.root.findAllByProps({role:'status'}).some(n=>text(n)==='Soru kayıtların sıfırlandı.'));await act(async()=>root.unmount());
sqlite.close();console.log(`PASS: atomic account reset (${batches} batches), authentication/CSRF/confirmation/idempotency, account isolation and retained favorites/notebook/case/course; actual guest/account hooks, storage failure/retry/reload, expired session protection, quiz resume removal and confirmation controller. Dialog DOM focus is not browser-tested.`);
