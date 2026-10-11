import {parseQuizSession} from '../app/quiz-session';
import {parseNotebookEntry} from '../app/notebook-data';
import {parseCourseRecord} from '../app/course-record';
import {parseCaseProgress} from '../app/case-progress';
import {isFavoriteKey} from '../app/learning-data';
import {questionDefinition} from '../app/learning-data';
import {learningSnapshot,resetLearning,type Database} from './db';
export interface Env {DB?:Database;ASSETS?:{fetch(request:Request):Promise<Response>}}
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
function readRow(row:{payload:string;updated_at:number;revision:number}|undefined,parse:(value:unknown)=>unknown){if(!row)return null;try{const p=parse(JSON.parse(row.payload));return p?{...p as object,updatedAt:row.updated_at,revision:row.revision}:null;}catch{return null;}}
function readRows(rows:{payload:string;updated_at:number;revision:number}[],parse:(value:unknown)=>unknown){const values=rows.map(row=>readRow(row,parse));const warnings=values.filter(v=>!v).length;if(warnings)console.error('Stored study records could not be decoded:',warnings);return {values:values.filter(v=>!!v),warnings};}
export default {async fetch(request:Request,env:Env):Promise<Response>{const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/')){if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});if(!env.ASSETS)return new Response('Atlas şu anda yüklenemiyor.',{status:503});return env.ASSETS.fetch(request);}
 if(!['/api/learning','/api/learning/favorite','/api/learning/answer','/api/learning/reset','/api/cases','/api/notebook','/api/courses','/api/quiz-sessions'].includes(url.pathname))return json({error:'Bölüm bulunamadı.'},404);
 const user=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');
 if(!user||!email)return json({authenticated:false,favorites:[],answers:[]},401);
 if(!env.DB)return json({error:'Kayıt alanı şu anda kullanılamıyor.'},503);
 try{
 if(request.method==='GET'&&['/api/courses','/api/notebook','/api/cases'].includes(url.pathname)){
 const course=url.pathname==='/api/courses',book=url.pathname==='/api/notebook',table=course?'course_progress':book?'study_notebook':'case_progress';
 const rows=await env.DB.prepare(`SELECT payload, updated_at, revision FROM ${table} WHERE user_id = ? ORDER BY updated_at DESC`).bind(user).all<{payload:string;updated_at:number;revision:number}>();const result=readRows(rows.results,course?parseCourseRecord:book?parseNotebookEntry:parseCaseProgress);return json({authenticated:true,[book?'entries':'progress']:result.values,warnings:result.warnings});}
 if(url.pathname==='/api/quiz-sessions'&&request.method==='GET'){const key=url.searchParams.get('key');if(!key||!/^[a-zA-Z0-9_-]{1,120}$/.test(key))return json({error:'Test anahtarı geçersiz.'},400);const rows=await env.DB.prepare('SELECT payload, updated_at, revision FROM quiz_sessions WHERE user_id = ? AND session_key = ?').bind(user,key).all<{payload:string;updated_at:number;revision:number}>();const session=readRow(rows.results[0],parseQuizSession);if(rows.results.length&&!session)return json({error:'Test kaydı okunamadı. Diğer kayıtların korunuyor.'},503);return json({authenticated:true,session});}
 if(url.pathname==='/api/learning'&&request.method==='GET')return json(await learningSnapshot(env.DB,user));
 if(request.method!=='PUT')return json({error:'İşlem desteklenmiyor.'},405);
 if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'İstek kaynağı doğrulanamadı.'},403);
 if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return json({error:'JSON gerekli.'},415);
 const limit=url.pathname==='/api/quiz-sessions'?524288:url.pathname==='/api/notebook'?16000:4096;
 if(Number(request.headers.get('Content-Length')??0)>limit)return json({error:'İstek çok büyük.'},413);
 const body=await request.text();if(body.length>limit)return json({error:'İstek çok büyük.'},413);let input;try{input=JSON.parse(body);}catch{return json({error:'Geçersiz istek.'},400);}if(!input||typeof input!=='object'||Array.isArray(input))return json({error:'Geçersiz istek.'},400);
 if(['/api/courses','/api/notebook','/api/cases','/api/quiz-sessions'].includes(url.pathname)){
 const course=url.pathname==='/api/courses',book=url.pathname==='/api/notebook',quiz=url.pathname==='/api/quiz-sessions';
 const p=course?parseCourseRecord(input):book?parseNotebookEntry(input):quiz?parseQuizSession(input):parseCaseProgress(input);
 if(!p||input.revision!==undefined&&(!Number.isSafeInteger(input.revision)||input.revision<0))return json({error:'Çalışma kaydı geçersiz.'},400);
 const table=course?'course_progress':book?'study_notebook':quiz?'quiz_sessions':'case_progress',column=course?'course_id':book?'entry_id':quiz?'session_key':'case_id',id='courseId'in p?p.courseId:'id'in p&&book?p.id:'key'in p?p.key:'caseId'in p?p.caseId:'';
 const isCase=!course&&!book&&!quiz,mode=isCase&&'mode'in p?p.mode:'',updatedAt=Date.now(),expected=Number(input.revision??0),payload=JSON.stringify(p);
 const columns=isCase?`${column}, mode`:column,marks=isCase?'?, ?':'?',keys=isCase?`user_id, ${column}, mode`:`user_id, ${column}`;
 const values=isCase?[user,id,mode,payload,updatedAt,expected]:[user,id,payload,updatedAt,expected];
 const result=await env.DB.prepare(`INSERT INTO ${table} (user_id, ${columns}, payload, updated_at, revision) VALUES (?, ${marks}, ?, ?, 1) ON CONFLICT(${keys}) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at, revision = ${table}.revision + 1 WHERE ${table}.revision = ? RETURNING revision`).bind(...values).all<{revision:number}>();
 if(!result.results.length){const where=isCase?`user_id = ? AND ${column} = ? AND mode = ?`:`user_id = ? AND ${column} = ?`;const rows=await env.DB.prepare(`SELECT payload, updated_at, revision FROM ${table} WHERE ${where}`).bind(...(isCase?[user,id,mode]:[user,id])).all<{payload:string;updated_at:number;revision:number}>();const latest=readRow(rows.results[0],course?parseCourseRecord:book?parseNotebookEntry:quiz?parseQuizSession:parseCaseProgress);return json({error:'Kayıt başka bir yerde değişti. Değişikliklerin korunuyor.',[book?'entry':quiz?'session':'progress']:latest},409);}
 return json({[book?'entry':quiz?'session':'progress']:{...p,updatedAt,revision:result.results[0].revision}});
 }
 if(url.pathname==='/api/learning/reset'){
 if(input.confirm!==true)return json({error:'Sıfırlama onayı gerekli.'},400);
 return json(await resetLearning(env.DB,user));
 }
 if(url.pathname==='/api/learning/favorite'){
 if(typeof input.key!=='string'||!isFavoriteKey(input.key)||typeof input.favorite!=='boolean')return json({error:'Yapı seçimi geçersiz.'},400);
 if(input.favorite)await env.DB.prepare('INSERT INTO learning_favorites (user_id, muscle_key) VALUES (?, ?) ON CONFLICT(user_id, muscle_key) DO NOTHING').bind(user,input.key).run();
 else await env.DB.prepare('DELETE FROM learning_favorites WHERE user_id = ? AND muscle_key = ?').bind(user,input.key).run();
 }else if(url.pathname==='/api/learning/answer'){
 const q=typeof input.questionId==='string'?questionDefinition(input.questionId):undefined;if(!q||typeof input.choice!=='string'||!q.options.includes(input.choice))return json({error:'Yanıt geçersiz.'},400);
 if(input.attemptId!==undefined&&(typeof input.attemptId!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(input.attemptId)))return json({error:'Deneme kimliği geçersiz.'},400);
 const attemptId=input.attemptId??crypto.randomUUID(),correct=input.choice===q.answer?1:0;
 // Allocate a question's next timestamp inside the insertion statement so
 // concurrent requests cannot get the same order. Retries keep their old time.
 await env.DB.prepare('INSERT INTO learning_attempts (user_id, attempt_id, question_id, correct, answered_at) VALUES (?, ?, ?, ?, MAX(?, COALESCE((SELECT MAX(answered_at) + 1 FROM learning_attempts WHERE user_id = ? AND question_id = ?), 0))) ON CONFLICT(user_id, attempt_id) DO NOTHING').bind(user,attemptId,input.questionId,correct,Date.now(),user,input.questionId).run();
 const stored=(await env.DB.prepare('SELECT question_id, correct, answered_at FROM learning_attempts WHERE user_id = ? AND attempt_id = ?').bind(user,attemptId).all<{question_id:string;correct:number;answered_at:number}>()).results[0];
 if(!stored||stored.question_id!==input.questionId||stored.correct!==correct)return json({error:'Deneme kimliği başka bir yanıta ait.'},409);
 await env.DB.prepare('INSERT INTO learning_answers (user_id, question_id, correct, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, question_id) DO UPDATE SET correct = excluded.correct, updated_at = excluded.updated_at WHERE excluded.updated_at >= learning_answers.updated_at').bind(user,stored.question_id,stored.correct,stored.answered_at).run();
 }else return json({error:'İşlem desteklenmiyor.'},405);
 return json(await learningSnapshot(env.DB,user));
 }catch{console.error('Learning storage request failed');return json({error:'Kaydedilemedi. Yanıtın ekranda korunuyor; yeniden deneyebilirsin.'},503);}
}};
