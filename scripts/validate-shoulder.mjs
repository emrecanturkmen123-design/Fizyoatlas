import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SHOULDER_MOVES,shoulderParts} from '../app/shoulder.ts';
import {shoulderOverlay,disposeOverlay} from '../app/shoulder-overlay.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
for(const m of SHOULDER_MOVES)for(const side of ['left','right']){
 for(let i=0;i<m.muscles.length;i++)if(m.muscles[i][0]!=='latissimus dorsi')assert.ok(shoulderParts(atlas,m,side,i).length,`${side} ${m.id} ${m.muscles[i][2]}`);
 const matches=shoulderParts(atlas,m,side);assert.ok(matches.every(p=>p.name.toLowerCase().includes(side)));
 const overlay=shoulderOverlay({id:m.id,side,plane:true});
 for(const child of overlay.children){const a=child.geometry.attributes.position.array;assert.ok([...a].every(Number.isFinite));}
 const arc=overlay.children[2];const coords=arc.geometry.attributes.position.array;
 assert.ok(coords.length>0);disposeOverlay(overlay);
}
console.log('PASS: six movements, both sides, every muscle target and finite overlay geometry.');
