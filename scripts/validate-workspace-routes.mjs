import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseWorkspaceRoute,workspaceHash,routeIdentity} from '../app/workspace-route.ts';
import {buildSearchIndex,querySearch} from '../app/anatomy-search.ts';
const samples=[
 {lesson:'study',muscle:'soleus',side:'left',region:'ankle'},
 {lesson:'study',structure:'patellar ligament',side:'right',tab:'connective'},
 {lesson:'study',nerve:'tibial',tab:'nerves'},
 {lesson:'shoulder',motion:'external',side:'left',progress:42},
 {lesson:'gait',progress:94},
 {lesson:'cases',caseId:'ankle-sprain',mode:'exam'},
 {lesson:'quiz',quizMuscle:'biceps brachii'},
 {lesson:'practice'},
 {lesson:'study',concept:'FMA_24474'},
 {lesson:'study',structure:'biceps long head tendon',side:'left',attachment:'origin'},
 {lesson:'study',structure:'patellar ligament',side:'left',attachment:'both'},
 {lesson:'study',muscle:'extensor carpi radialis brevis',side:'right',attachment:'insertion'},
 {lesson:'knee',motion:'flexion',side:'left',progress:67,tendons:true},
 {lesson:'elbow',motion:'flexion',side:'left',progress:50,tendons:true},
 {lesson:'quiz',quizFinding:'biceps distal tendon',side:'left'},
 {lesson:'quiz',quizTendon:'quadriceps tendon',side:'left'},
 {lesson:'tendons',compare:'biceps-ends',structure:'biceps long head tendon',side:'left'}
];
for(const route of samples){const parsed=parseWorkspaceRoute(workspaceHash(route));for(const [key,value]of Object.entries(route))assert.equal(parsed[key],value,workspaceHash(route));}
assert.equal(parseWorkspaceRoute('#latissimus').muscle,'latissimus dorsi');
assert.equal(parseWorkspaceRoute('#kaslar').lesson,'study');
assert.equal(parseWorkspaceRoute('#yuruyus?konum=200').progress,100);
assert.equal(parseWorkspaceRoute('#yuruyus?konum=NaN').progress,undefined);
assert.equal(parseWorkspaceRoute('#omuz?taraf=unknown').side,undefined);
assert.equal(parseWorkspaceRoute('#atlas?tutunma=invalid').attachment,undefined);
assert.equal(parseWorkspaceRoute('#diz?sema=0').tendons,undefined);
assert.equal(routeIdentity({lesson:'gait',progress:6}),routeIdentity({lesson:'gait',progress:94}),'scrubbing must not add one browser history item per frame');
assert.notEqual(routeIdentity({lesson:'shoulder',motion:'external'}),routeIdentity({lesson:'shoulder',motion:'internal'}));
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),index=buildSearchIndex(atlas);
for(const query of ['aşil','AŞİL','achilles']){
 const result=querySearch(index,query);assert.ok(result[0].id==='clinical-study:calcaneal tendon'||/calcaneal tendon/i.test(result[0].name),query+' ranks tendon first');
 assert(!result.some(c=>/basilic|basilar/i.test(c.name)),query+' excludes unrelated word interiors');
}
assert.equal(querySearch(index,'patella tendonu')[0].id,'clinical-study:patellar ligament');
assert.equal(querySearch(index,'öçb')[0].id,'clinical-study:anterior cruciate ligament');
assert(querySearch(index,'bice').some(c=>/biceps/i.test(c.name)),'partial word prefixes remain searchable');
console.log('PASS: deep links restore structures, side, motion, gait, cases and quizzes; legacy links, bounded parameters, history identity and anatomical relevance.');
