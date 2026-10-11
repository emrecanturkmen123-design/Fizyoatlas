import fs from 'node:fs';import assert from 'node:assert/strict';
import {requiredChunks} from '../app/model-demand.ts';
import {connectiveSelection} from '../app/connective-study.ts';
const a=JSON.parse(fs.readFileSync('public/models/atlas.json'));
const base={visible:['skeletal','muscular'],selected:[],explode:0,isolate:false,rotate:false,reset:0,view:'side'};
const bytes=ids=>ids.reduce((n,i)=>n+a.chunks[i].gzipBytes,0);
const whole=bytes(a.chunks.map((_,i)=>i)),start=requiredChunks(a,base),gait=requiredChunks(a,{...base,gait:{progress:0,playing:false,muscles:false,plane:false,speed:1}});
assert(bytes(start)<whole*.65,'initial atlas skips non-visible anatomical systems');
assert(bytes(gait)<whole*.15,'skeletal gait does not download muscles/organs');
for(const side of ['left','right'])for(const key of ['calcaneal tendon','patellar ligament']){
 const c=connectiveSelection(a,key,side),ids=requiredChunks(a,{...base,visible:['skeletal','connective'],selected:c.selected,hidden:c.hidden});
 for(const id of [...c.selected,...c.context])assert(ids.includes(a.parts.find(p=>p.id===id).chunk));
 assert(bytes(ids)<whole*.4,'local study remains region-limited');
}
for(const system of ['nervous','arterial','venous','respiratory'])for(const p of a.parts.filter(p=>p.system===system))assert(requiredChunks(a,{...base,visible:[system]}).includes(p.chunk));
console.log(`PASS: initial atlas ${(bytes(start)/1e6).toFixed(2)} MB, skeleton gait ${(bytes(gait)/1e6).toFixed(2)} MB, complete atlas ${(whole/1e6).toFixed(2)} MB; deferred layers and bilateral tendon context remain available.`);
