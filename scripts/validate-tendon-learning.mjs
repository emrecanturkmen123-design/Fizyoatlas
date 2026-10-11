import {CLINICAL_STRUCTURES} from '../app/clinical-structures.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {DatabaseSync} from 'node:sqlite';
import worker from '../server/worker.ts';
import {TENDON_QUESTIONS,tendonQuestionIds} from '../app/tendon-questions.ts';
import {TENDON_COMPARISONS} from '../app/tendon-comparisons.ts';
import TendonStudyPanel from '../app/tendon-study-panel.tsx';
import {CASE_FOLLOWUPS,caseStep,FOLLOWUP_QUESTION_IDS} from '../app/case-followup.ts';
import {CASE_JOURNEYS,caseScore} from '../app/case-journeys.ts';
import {questionDefinition,QUESTION_IDS,parseLearning} from '../app/learning-data.ts';
import {reviewQuestions} from '../app/quiz-data.ts';
import {reviewSchedule} from '../app/learning-review.ts';
import {freshProgress,parseCaseProgress} from '../app/case-progress.ts';
import {parseWorkspaceRoute,workspaceHash} from '../app/workspace-route.ts';
import {connectiveSelection} from '../app/connective-study.ts';
import {attachmentTargets} from '../app/attachments.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
assert.equal(TENDON_QUESTIONS.length,CLINICAL_STRUCTURES.length*5);
for(const key of new Set(TENDON_QUESTIONS.map(q=>q.key))){const ids=tendonQuestionIds(key);assert.equal(ids.length,5);for(const id of ids){assert(QUESTION_IDS.includes(id));const def=questionDefinition(id),quiz=reviewQuestions(atlas,[id])[0];assert(def&&quiz);assert.equal(quiz.topic,'tendon');assert.equal(quiz.elements.length,0);assert.equal(new Set(quiz.choices).size,4);assert(quiz.choices.every(c=>quiz.rationales[c]));assert(quiz.source.startsWith('https://'));}}
for(const pair of TENDON_COMPARISONS){const html=render(React.createElement(TendonStudyPanel,{pairId:pair.id,onPair(){},onQuiz(){},onClose(){}}));assert(html.includes('<table'));assert(html.includes('scope="row"'));for(const side of pair.sides)assert(html.includes(side.title));assert.deepEqual(parseWorkspaceRoute(workspaceHash({lesson:'tendons',compare:pair.id})),{lesson:'tendons',compare:pair.id});}
for(const side of ['right','left']){const selection=connectiveSelection(atlas,'quadriceps tendon',side);assert.equal(selection.structures.length,1);assert.equal(selection.selected.length,1);const markers=attachmentTargets(atlas,{key:'quadriceps tendon',side,mode:'both'});assert.equal(markers.length,1);assert.equal(markers[0].kind,'insertion');assert.equal(atlas.parts.find(p=>p.id===markers[0].boneId).name.toLowerCase(),`${side} patella`);}
const learning=parseLearning({authenticated:false,favorites:[],answers:[{questionId:TENDON_QUESTIONS[0].id,correct:false}],history:[{attemptId:'tendon-qa',questionId:TENDON_QUESTIONS[0].id,correct:false,answeredAt:Date.now()}]});assert.equal(learning.answers.length,1);assert(reviewSchedule(learning)[0].due);assert.equal(reviewSchedule(learning)[0].label,CLINICAL_STRUCTURES.find(s=>s.key===TENDON_QUESTIONS[0].key).name);
assert.equal(FOLLOWUP_QUESTION_IDS.length,36);
const sqlite=new DatabaseSync(':memory:');for(const f of fs.readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync('drizzle/'+f,'utf8'));
const DB={prepare(sql){const s=sqlite.prepare(sql);let args=[];return {bind(...v){args=v;return this},async all(){return {results:s.all(...args)}},async run(){return s.run(...args)}}}};
const call=async p=>{if(p){const row=sqlite.prepare('SELECT revision FROM case_progress WHERE user_id = ? AND case_id = ? AND mode = ?').get('tendon-qa',p.caseId,p.mode);p={...p,revision:row?.revision??0};}return worker.fetch(new Request('https://atlas.test/api/cases',{method:p?'PUT':'GET',headers:{Origin:'https://atlas.test','Content-Type':'application/json','oai-authenticated-user-id':'tendon-qa','oai-authenticated-user-email':'tendon-qa@test.dev'},...(p?{body:JSON.stringify(p)}:{})}),{DB});};
for(const [id,paths] of Object.entries(CASE_FOLLOWUPS)){const c=CASE_JOURNEYS.find(c=>c.id===id);assert.equal(new Set(paths.map(p=>p.steps[0].finding)).size,3);assert.equal(new Set(paths.map(p=>p.steps[1].question+' '+p.steps[1].finding)).size,3);
 for(const path of paths){for(const index of [8,9]){const s=caseStep(c,index,path.id),def=questionDefinition(`journey:${id}:${index}:${path.id}`);assert.equal(def.answer,s.choices[s.correct]);assert.equal(new Set(s.choices).size,4);assert.equal(s.rationales.length,4);assert(s.rationales.every(Boolean));assert.equal(caseStep(c,index,'bad'),c.steps[index]);}
  const p={...freshProgress(id,'learn'),index:8,answers:c.steps.map((_,i)=>i<8?0:null),branch:['plan-0'],followup:path.id};assert(parseCaseProgress(p));assert.equal((await call(p)).status,200);const records=(await(await call()).json()).progress,saved=records.find(x=>x.caseId===id&&x.mode==='learn');assert.equal(saved.followup,path.id);assert.equal(caseStep(c,saved.index,saved.followup).finding,path.steps[0].finding);
  assert.equal(caseScore(c,c.steps.map(()=>0),path.id),10);
  for(const bad of [{...p,mode:'exam'},{...p,followup:'bad'},{...p,index:6,answers:c.steps.map((_,i)=>i<6?0:null)},{...p,index:7,answers:c.steps.map((_,i)=>i<7?0:null)}])assert.equal((await call(bad)).status,400);
 }
 const legacy={...freshProgress(id,'learn'),index:8,answers:c.steps.map((_,i)=>i<8?0:null),branch:['plan-0']};assert.deepEqual(parseCaseProgress(legacy),legacy);assert.equal(caseStep(c,8),c.steps[8]);const exam=freshProgress(id,'exam');assert.equal((await call(exam)).status,200);assert((await(await call()).json()).progress.some(p=>p.caseId===id&&p.mode==='exam'&&!p.followup));
}
const learningCall=body=>worker.fetch(new Request('https://atlas.test/api/learning'+(body?'/answer':''),{method:body?'PUT':'GET',headers:{Origin:'https://atlas.test','Content-Type':'application/json','oai-authenticated-user-id':'tendon-qa','oai-authenticated-user-email':'tendon-qa@test.dev'},...(body?{body:JSON.stringify(body)}:{})}),{DB});
for(const id of [TENDON_QUESTIONS[0].id,FOLLOWUP_QUESTION_IDS[0]]){const q=questionDefinition(id),body={questionId:id,choice:q.answer,attemptId:'tendon-attempt-'+id.replace(/[^a-z0-9]/gi,'-')};assert.equal((await learningCall(body)).status,200);assert.equal((await learningCall(body)).status,200);}
const savedLearning=await(await learningCall()).json();assert.equal(savedLearning.answers.length,2);assert.equal(savedLearning.history.length,2);assert(savedLearning.answers.every(q=>q.correct));
assert(!questionDefinition('journey:biceps-tendon:7:adjusted'));assert(!questionDefinition('journey:biceps-tendon:8:bad'));assert(!questionDefinition('tendon:unknown:0'));
console.log('PASS: '+TENDON_QUESTIONS.length+' explained structure questions, 5 comparison routes/tables, bilateral quadriceps geometry, due reviews, 18 decision paths / 36 follow-up questions, real SQLite resume, independent modes, legacy records and invalid plans.');
