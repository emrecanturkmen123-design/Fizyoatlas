import assert from 'node:assert/strict';
import fs from 'node:fs';
import {comparisonFrames,suggestedComparison} from '../app/comparison-options.ts';
import {CLINICAL_STRUCTURES} from '../app/clinical-structures.ts';
import {connectiveSelection} from '../app/connective-study.ts';
import {parseWorkspaceRoute,workspaceHash,routeIdentity} from '../app/workspace-route.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
for(const s of CLINICAL_STRUCTURES){const next=suggestedComparison(s.key);assert.notEqual(next,s.key);assert(CLINICAL_STRUCTURES.some(x=>x.key===next));for(const side of ['right','left']){const a=connectiveSelection(atlas,s.key,side),b=connectiveSelection(atlas,next,side);const centered=comparisonFrames(atlas,a.selected,b.selected,'centered');assert.equal(centered[0].span,centered[1].span);for(const [i,selection] of [a,b].entries()){const parts=atlas.parts.filter(p=>selection.selected.includes(p.id));for(let axis=0;axis<3;axis++){const lo=Math.min(...parts.map(p=>p.bounds[0][axis])),hi=Math.max(...parts.map(p=>p.bounds[1][axis]));assert(Math.abs(centered[i].center[axis]-(lo+hi)/2)<1e-8);assert(hi-lo<=centered[i].span+1e-8);}}const aligned=comparisonFrames(atlas,a.selected,b.selected,'aligned');assert.deepEqual(aligned[0],aligned[1]);}}
assert.equal(suggestedComparison('calcaneal tendon'),'tibialis anterior tendon');
for(const route of [{lesson:'learning',learningView:'favorites'},{lesson:'notebook'},{lesson:'lab',structure:'calcaneal tendon',compare:'tibialis anterior tendon',side:'left',labMode:'compare',labFrame:'centered',labContext:false,yaw:35,pitch:20,zoom:1.25},{lesson:'lab',labMode:'clinical',clinicalPair:'achilles-location'}]){const result=parseWorkspaceRoute(workspaceHash(route));for(const [k,v] of Object.entries(route))assert.equal(result[k],v);}
const legacy=parseWorkspaceRoute('#inceleme?gosterim=section&kesitbolge=knee&eksen=2&kesit=64&taraf=sol&yapi=calcaneal+tendon');assert.equal(legacy.labMode,'compare');assert.equal(legacy.side,'left');assert.equal(legacy.structure,'calcaneal tendon');assert(!/kesit|eksen|section/.test(workspaceHash(legacy)));
assert.equal(parseWorkspaceRoute('#calismalarim?bolum=unknown').learningView,undefined);
assert.equal(parseWorkspaceRoute('#inceleme?yerlesim=unknown&cevre=7').labFrame,undefined);
assert.equal(parseWorkspaceRoute('#inceleme?yerlesim=unknown&cevre=7').labContext,undefined);
assert.equal(parseWorkspaceRoute('#tendonlar?karsilastir=achilles-location').compare,'achilles-location');
assert.equal(routeIdentity({lesson:'lab',labFrame:'centered',yaw:0}),routeIdentity({lesson:'lab',labFrame:'centered',yaw:90}));
assert.notEqual(routeIdentity({lesson:'learning'}),routeIdentity({lesson:'learning',learningView:'favorites'}));
console.log('PASS: 33 suggested pairs in both sides; independent centering with common physical scale, shared anatomical coordinates; study tabs, clinical comparisons, context and camera deep links.');
