import fs from 'node:fs';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import worker from '../server/worker.ts';import {questionDefinition} from '../app/learning-data.ts';
import {reviewSchedule,learningRegions} from '../app/learning-review.ts';
const sqlite=new DatabaseSync(':memory:');for(const file of fs.readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync('drizzle/'+file,'utf8'));
const DB={prepare(sql){const statement=sqlite.prepare(sql);let params=[];return{bind(...values){params=values;return this;},async all(){return{results:statement.all(...params)};},async run(){return statement.run(...params);}}}};
const call=async(user,body)=>worker.fetch(new Request('https://atlas.test/api/learning'+(body?'/answer':''),{method:body?'PUT':'GET',headers:{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test','Content-Type':'application/json',Origin:'https://atlas.test'},...(body?{body:JSON.stringify(body)}:{})}),{DB});
const q=questionDefinition('biceps brachii-nerve'),wrong=q.options.find(x=>x!==q.answer),now=1800000000000,day=86400000;
const originalNow=Date.now;Date.now=()=>now;
try{
 const first={questionId:'biceps brachii-nerve',choice:wrong,attemptId:'zzzz_wrong'},second={...first,choice:q.answer,attemptId:'aaaa_correct'};
 const responses=await Promise.all([call('student-a',first),call('student-a',second)]);for(const r of responses)assert.equal(r.status,200);
 let data=await(await call('student-a')).json();assert.equal(data.history.length,2);assert.equal(data.history[0].attemptId,second.attemptId,'concurrent same-millisecond answers retain their stored order');assert(data.history[0].answeredAt>data.history[1].answeredAt);assert(data.answers[0].correct);
 assert.equal((await call('student-a',first)).status,200);data=await(await call('student-a')).json();assert.equal(data.history.length,2,'retries are idempotent');assert(data.answers[0].correct,'old retry must not restore an older incorrect answer');
 assert.equal((await call('student-a',{...first,choice:q.answer})).status,409,'one attempt cannot change its choice');
 let plan=reviewSchedule(data,now);assert.equal(plan[0].streak,1);assert.equal(plan[0].days,1);assert.equal(plan[0].due,false);assert.equal(reviewSchedule(data,now+day+2)[0].due,true);
 for(let i=0;i<4;i++)assert.equal((await call('student-a',{...second,attemptId:'correct_'+i})).status,200);
 data=await(await call('student-a')).json();assert.equal(reviewSchedule(data,now)[0].days,30);assert.equal(learningRegions(data).find(r=>r.key==='elbow').correct,1);
 assert.equal((await call('student-a',{...first,attemptId:'wrong_again'})).status,200);data=await(await call('student-a')).json();plan=reviewSchedule(data,now+20);assert.equal(plan[0].streak,0);assert.equal(plan[0].due,true);
 assert.equal((await call('student-b',second)).status,200);assert.equal((await(await call('student-b')).json()).history.length,1,'identical attempt IDs in different accounts remain independent');
}finally{Date.now=originalNow;sqlite.close();}
console.log('PASS: concurrent answer order, retry idempotency, stale retry protection, immutable attempts, review reset and account isolation.');
