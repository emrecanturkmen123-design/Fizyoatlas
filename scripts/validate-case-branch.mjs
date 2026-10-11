import assert from 'node:assert/strict';import {ankleBranch,branchHistory,ANKLE_BRANCH} from '../app/case-branch.ts';import {freshProgress,parseCaseProgress} from '../app/case-progress.ts';
const paths=[['ottawa','mobility'],['drawer-first','screen-after-drawer','mobility'],['hop-first','screen-after-hop','mobility'],['ottawa','syndesmosis','mobility-after-syndesmosis'],['ottawa','achilles-screen','mobility-after-achilles']];
for(const path of paths){assert(ankleBranch(path).ready);assert.equal(branchHistory(path).length,path.length);const p={...freshProgress('ankle-sprain','learn'),index:3,answers:[0,0,0,...Array(7).fill(null)],branch:path};assert(parseCaseProgress(p));assert(!parseCaseProgress({...p,branch:[]}));}
assert(!ankleBranch(['mobility']));assert(!ankleBranch(['ottawa','hop-first']));assert(!ankleBranch(['hop-first']).ready);assert.match(ankleBranch(['ottawa','syndesmosis']).finding,/tibiofibular/);assert.match(ankleBranch(['ottawa','achilles-screen']).finding,/plantar/);
console.log('PASS: five distinct examination paths, deferred findings, reassessment gates, no skipped transitions, saved branch validation.');

import {CASE_JOURNEYS} from '../app/case-journeys.ts';import {caseBranch,caseBranchHistory} from '../app/case-branch.ts';
for(const c of CASE_JOURNEYS.filter(c=>c.id!=='ankle-sprain')){
 const step=c.steps[2],correct='plan-'+step.correct,wrong='plan-'+step.choices.findIndex((_,i)=>i!==step.correct);
 for(const path of [[correct],[wrong,'return-plan',correct]]){assert(caseBranch(c.id,path).ready);assert.equal(caseBranchHistory(c.id,path).length,path.length);const p={...freshProgress(c.id,'learn'),index:3,answers:[0,0,0,...Array(7).fill(null)],branch:path};assert(parseCaseProgress(p));assert(!parseCaseProgress({...p,mode:'exam'}));}
 assert(!caseBranch(c.id,['return-plan']));assert(parseCaseProgress({...freshProgress(c.id,'learn'),index:3,answers:[0,0,0,...Array(7).fill(null)]}),'legacy resume remains valid');
}
console.log(`PASS: all ${CASE_JOURNEYS.length} cases have validated examination choices; new planning feedback is limited to learning mode, and legacy resumes remain valid.`);
