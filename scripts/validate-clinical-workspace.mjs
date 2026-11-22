import assert from 'node:assert/strict';
import fs from 'node:fs';
import {workspaceSearch} from '../app/workspace-search.ts';
import {parseWorkspaceRoute,workspaceHash} from '../app/workspace-route.ts';
import {motorChecks,motorQuestionId,stationQuestionId,stations} from '../app/clinical-learning-questions.ts';
import {findingScene} from '../app/model-finding.ts';
import {questionDefinition} from '../app/learning-data.ts';
import {makeStudyBackup,parseStudyBackup,restoreStudyBackup} from '../app/study-backup.ts';
import {CASES_KEY,LEARNING_KEY,KNEE_DRAFT_KEY} from '../app/study-storage-keys.ts';
import {freshProgress} from '../app/case-progress.ts';
import {freshKneeCourse} from '../app/knee-course-data.ts';

import {sensoryPointQuestions,reflexDrillQuestions} from '../app/neuro-drill-data.ts';
import {lachmanDirectionSpots,lachmanTechnique} from '../app/lachman-practice-data.ts';
import {stationSteps} from '../app/osce-practice.tsx';

const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
assert.equal(workspaceSearch('Lachman',[])[0].route.clinicalTest,'lachman');
assert.equal(workspaceSearch('Spurling',[])[0].route.clinicalTest,'spurling');
assert.equal(workspaceSearch('TUG',[])[0].route.compare,'tug');
const l5=workspaceSearch('L5',[]);
for(const pick of ['dermatomes','myotomes'])assert(l5.some(x=>x.route.clinicalMode===pick&&x.route.clinicalLevel==='L5'));
assert(l5.some(x=>x.route.lesson==='cases'&&x.route.caseId==='foot-drop'));
assert(l5.some(x=>x.route.lesson==='lab'&&x.route.labMode==='neuro'));
assert.deepEqual(parseWorkspaceRoute('#ayak-dusmesi-vakasi'),{lesson:'cases',caseId:'foot-drop'});
assert.deepEqual(parseWorkspaceRoute('#ulnar-vaka?mod=exam'),{lesson:'cases',caseId:'ulnar-hand',mode:'exam'});
assert(workspaceSearch('küçük parmak',[]).some(x=>x.route?.caseId==='ulnar-hand'));
for(const route of [{lesson:'osce',compare:'diz'},{lesson:'reflexes',compare:'L4'},{lesson:'measures',compare:'tug'},{lesson:'cases',caseId:'ulnar-hand'},{lesson:'lab',labMode:'neuro',compare:'c8-t1'}]){
  assert.deepEqual(parseWorkspaceRoute(workspaceHash(route)),route);
}
for(const motor of motorChecks){
  assert(findingScene(atlas,'locate:muscle:'+motor.key+':right')?.targetIds.length);
  for(const kind of ['nerve','motion']){
    const saved=questionDefinition(motorQuestionId(motor.root,kind));
    assert.equal(saved.answer,motor[kind].answer);
    assert.equal(new Set(saved.options).size,4);
  }
}
assert.deepEqual(parseWorkspaceRoute('#norolojik-karsilastirma?karsilastir=c8-t1'),{lesson:'lab',labMode:'neuro',compare:'c8-t1'});
assert.deepEqual(parseWorkspaceRoute('#norolojik-karsilastirma'),{lesson:'lab',labMode:'neuro',compare:'l5-fibular'});
assert.equal(lachmanDirectionSpots.find(spot=>spot.id===lachmanTechnique[2].answer)?.symbol,'↗');
assert.deepEqual(stationSteps(atlas,stations[0]).map(step=>step.group),['Anatomi','Uygulama','Uygulama','Uygulama','Yorum']);
for(const q of [...sensoryPointQuestions,...reflexDrillQuestions,...lachmanTechnique]){
  const saved=questionDefinition(q.id);assert(saved,q.id);
  assert.equal(saved.answer,q.answer);assert(saved.options.includes(saved.answer));
}
for(const station of stations){
  assert(findingScene(atlas,station.finding)?.targetIds.length,station.id+' uses source geometry');
  for(const [index,q] of station.questions.entries())assert.equal(questionDefinition(stationQuestionId(station.id,index)).answer,q.answer);
}

const storage=(initial={})=>{
  const data=new Map(Object.entries(initial));
  return {get length(){return data.size},key:i=>[...data.keys()][i],getItem:key=>data.get(key)??null,
    setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
};
const record=(favorite,id,correct,answeredAt)=>JSON.stringify({
  authenticated:false,favorites:[favorite],answers:[{questionId:'biceps brachii-action',correct}],
  history:[{attemptId:id,questionId:'biceps brachii-action',correct,answeredAt}],
});
const source=storage({
  unrelated:'do not include',
  [LEARNING_KEY]:record('soleus','source',false,22),
  [CASES_KEY]:JSON.stringify([freshProgress('ankle-sprain','learn')]),
  [KNEE_DRAFT_KEY]:JSON.stringify(freshKneeCourse()),
});
const raw=makeStudyBackup(source);
assert.equal(Object.keys(raw.records).length,3);
const backup=parseStudyBackup(JSON.stringify(raw));
assert.throws(()=>parseStudyBackup(JSON.stringify({...raw,records:{'unknown':{}}})));
assert.throws(()=>parseStudyBackup(JSON.stringify({...raw,records:{[LEARNING_KEY]:{authenticated:true,favorites:[],answers:[]}}})));
const target=storage({[LEARNING_KEY]:record('deltoid','target',true,11),other:'preserve'});
restoreStudyBackup(target,backup);
restoreStudyBackup(target,backup);
const result=JSON.parse(target.getItem(LEARNING_KEY));
assert.deepEqual(result.favorites,['deltoid','soleus']);
assert.equal(result.history.length,2);
assert.equal(result.answers[0].correct,false);
assert.equal(target.getItem('other'),'preserve');
assert(target.getItem(CASES_KEY));
assert(target.getItem(KNEE_DRAFT_KEY));
const failed=storage({[LEARNING_KEY]:record('deltoid','target',true,11)});
const set=failed.setItem;
failed.setItem=(key,value)=>{if(key===CASES_KEY)throw Error('storage full');set(key,value);};
assert.throws(()=>restoreStudyBackup(failed,backup));
assert.equal(failed.getItem(LEARNING_KEY),record('deltoid','target',true,11));
console.log('PASS: cross-workspace search, clinical deep links, authored fixation and review choices, three OSCE projections and backup import/export with rollback.');
