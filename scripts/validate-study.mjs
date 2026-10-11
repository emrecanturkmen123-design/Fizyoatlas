import assert from 'node:assert/strict';
import fs from 'node:fs';
import {NERVES,nerveForName,nerveParts,nervesForMuscle,targetParts} from '../app/innervation.ts';
const atlas=JSON.parse(fs.readFileSync(new URL('../public/models/atlas.json',import.meta.url)));
for(const nerve of NERVES){
 const left=targetParts(atlas,nerve,'left'),right=targetParts(atlas,nerve,'right');
 assert.ok(left.length&&right.length,nerve.id+' has bilateral motor targets');
 assert.ok(left.every(p=>!right.some(r=>r.id===p.id)),nerve.id+' side separation');
 for(const p of [...left,...right])assert.equal(nervesForMuscle(p.name).includes(nerve),!nerve.indirect,'direct reverse relation '+p.name);
}
assert.equal(nerveForName('Left infratrochlear nerve'),undefined,'sensory branch must not map to CN IV');
assert.equal(nerveForName('Right supratrochlear nerve'),undefined);
assert.equal(nerveForName('Left trochlear nerve')?.id,'trochlear');
assert.equal(nerveForName('Inferior branch of left oculomotor nerve')?.id,'oculomotor-inferior');
assert.equal(nerveParts(atlas,NERVES.find(n=>n.id==='axillary')).length,2,'axillary geometry must be available on both sides');
assert.equal(nerveParts(atlas,NERVES.find(n=>n.id==='trochlear')).length,2);
const inferior=targetParts(atlas,NERVES.find(n=>n.id==='oculomotor-inferior'),'left');
assert.ok(inferior.some(p=>p.name.toLowerCase().includes('medial rectus')));
assert.ok(!inferior.some(p=>p.name.toLowerCase().includes('superior rectus')),'branch-specific targets');
console.log('PASS: all nerve cards have bilateral motor targets, reverse links and branch-safe matching.');
