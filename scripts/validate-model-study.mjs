import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MUSCLES} from '../app/education-data.ts';
import {NERVES,nerveParts,targetParts,sideOf} from '../app/innervation.ts';
import {MODEL_FINDINGS,CONNECTIVE_FINDINGS,findingScene,findingChoice,findingIds,projectFinding,pickFinding} from '../app/model-finding.ts';
import {reviewQuestions,quizPool,DEFAULT_QUIZ} from '../app/quiz-data.ts';
import {questionDefinition} from '../app/learning-data.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
assert.equal(MODEL_FINDINGS.length,CONNECTIVE_FINDINGS.length+MUSCLES.length*2+NERVES.length*4-2);
assert.equal(new Set(MODEL_FINDINGS.map(q=>q.id)).size,MODEL_FINDINGS.length);
for(const q of MODEL_FINDINGS){
 const scene=findingScene(atlas,q.id);assert(scene,q.id);assert(scene.targetIds.length&&scene.candidateIds.length);
 assert(scene.targetIds.every(id=>scene.candidateIds.includes(id)));assert(!scene.targetIds.some(id=>scene.hidden.includes(id)));
 for(const id of scene.candidateIds){assert.equal(sideOf(atlas.parts.find(p=>p.id===id).name),q.side);assert.equal(findingChoice(atlas,q.id,id)===q.answer,scene.targetIds.includes(id),q.id+' '+id);}
 assert.equal(findingChoice(atlas,q.id,'missing-part'),undefined);const quiz=reviewQuestions(atlas,[q.id])[0];assert.equal(quiz.findingId,q.id);assert.equal(quiz.findingGroup,q.group);assert.equal(quiz.choices.length,4);
 assert(questionDefinition(q.id));
}
// A regional envelope can be shared, but the requested answer and target IDs
// must stay specific to each question, side, task and source Atlas.
const deltoid=findingScene(atlas,'locate:muscle:deltoid:right'),supra=findingScene(atlas,'locate:muscle:supraspinatus:right');
assert.equal(deltoid.parts,supra.parts);assert.equal(deltoid.candidateIds,supra.candidateIds);assert.equal(deltoid.hidden,supra.hidden);
assert.notEqual(deltoid.question,supra.question);assert.notDeepEqual(deltoid.targetIds,supra.targetIds);
assert.notEqual(deltoid.parts,findingScene(atlas,'locate:muscle:deltoid:left').parts);
assert.notEqual(deltoid.parts,findingScene(atlas,'locate:muscle:soleus:right').parts);
assert.notEqual(findingScene(atlas,'locate:nerve:axillary:right').parts,findingScene(atlas,'locate:target:axillary:right').parts);
const quad=findingScene(atlas,'locate:quadriceps tendon:right'),patella=findingScene(atlas,'locate:patellar ligament:right');
assert.equal(quad.candidateIds,patella.candidateIds);assert.notDeepEqual(quad.targetIds,patella.targetIds);
assert.notEqual(deltoid.parts,findingScene({...atlas,parts:[...atlas.parts]},deltoid.question.id).parts,'source Atlases do not share envelopes');
assert.equal(MODEL_FINDINGS.filter(q=>q.task==='nerve').length,46);
assert(!MODEL_FINDINGS.some(q=>q.id.startsWith('locate:nerve:inferior-gluteal:')));
for(const n of NERVES)for(const side of ['left','right']){
 const ids=findingIds('nerve:'+n.id,side),locate=ids.filter(id=>id.startsWith('locate:'));assert(locate.length>=1);
 if(nerveParts(atlas,n,side).length)assert(ids.some(id=>id===`locate:nerve:${n.id}:${side}`));
 const target=findingScene(atlas,`locate:target:${n.id}:${side}`);assert.deepEqual(new Set(target.targetIds),new Set(targetParts(atlas,n,side).map(p=>p.id)));
 assert(ids.every(id=>!id.startsWith('locate:')||questionDefinition(id).side===side));
}
for(const group of ['muscles','nerves','connective']){
 const pool=quizPool(atlas,{...DEFAULT_QUIZ,topic:'locate',findingGroup:group});assert(pool.length);assert(pool.every(q=>q.findingGroup===group));
}
// Actual source triangles, including small nerves, must remain selectable in
// an anonymous projection; no target identity is given to the picking code.
const cache=new Map(),mesh=p=>{if(!cache.has(p.chunk)){const b=fs.readFileSync('public'+atlas.chunks[p.chunk].url);cache.set(p.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}const b=cache.get(p.chunk);return {part:p,positions:new Float32Array(b,p.positions,p.vertexCount*3),indices:new Uint32Array(b,p.indices,p.indexCount)};};
for(const id of ['locate:muscle:soleus:left','locate:muscle:deltoid:right','locate:nerve:femoral:left','locate:nerve:oculomotor-superior:right','locate:target:axillary:right']){
 const scene=findingScene(atlas,id),meshes=scene.parts.map(mesh);let reachable=false;
 for(const view of ['front','back','side']){
  const triangles=projectFinding(meshes,view,600,420,scene.candidateIds);assert(triangles.length);assert(triangles.every(t=>t.p.flat().every(Number.isFinite)));
  for(const t of triangles.filter(t=>scene.targetIds.includes(t.partId)).filter((_,i)=>i%37===0)){
   const x=t.p.reduce((a,p)=>a+p[0],0)/3,y=t.p.reduce((a,p)=>a+p[1],0)/3,hit=pickFinding(triangles,x,y,scene.candidateIds);
   if(scene.targetIds.includes(hit))reachable=true;
  }
 }
 assert(reachable,id+' is reachable from actual source triangles');
}
console.log(`PASS: ${MODEL_FINDINGS.length} findings, 40 bilateral muscles, 23 bilateral nerve surfaces, all 24 target studies, valid multiple targets, filtered pools, and actual source-triangle selection. No GPU or browser pixels tested.`);
