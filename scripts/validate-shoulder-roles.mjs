import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SHOULDER_MOVES,shoulderRoles,oppositeMove} from '../app/shoulder.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
for(const move of SHOULDER_MOVES)for(const side of ['right','left']){
 const roles=shoulderRoles(atlas,move,side);assert.ok(roles.agonists.length&&roles.antagonists.length);
 assert.ok(!roles.agonists.some(id=>roles.antagonists.includes(id)),'no ambiguous mesh colors');
 const opposite=shoulderRoles(atlas,oppositeMove(move),side);
 assert.deepEqual(new Set(roles.agonists),new Set(opposite.antagonists),'roles swap with direction');
 for(const id of [...roles.agonists,...roles.antagonists])assert.ok(atlas.parts.find(p=>p.id===id).name.toLowerCase().includes(side));
 if(move.id==='flexion'){
  assert.ok(roles.agonists.some(id=>atlas.parts.find(p=>p.id===id).name.toLowerCase().includes('clavicular part of')));
  assert.ok(roles.antagonists.some(id=>atlas.parts.find(p=>p.id===id).name.toLowerCase().includes('spinal part of')));
 }
}
console.log('PASS: six movement pairs on both sides; nonoverlapping role colors, direction reversal and deltoid subdivisions.');
