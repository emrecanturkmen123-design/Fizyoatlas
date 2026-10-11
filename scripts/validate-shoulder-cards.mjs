import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SHOULDER_MOVES,shoulderParts} from '../app/shoulder.ts';
import {MUSCLES,muscleFor} from '../app/education-data.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
const keys=new Set(SHOULDER_MOVES.flatMap(m=>m.muscles.map(x=>x[0])));
for(const key of keys){const card=muscleFor(key);assert.ok(card,key);for(const f of ['origin','insertion','nerve','action','source'])assert.ok(card[f]?.length>8,`${key}: ${f}`);assert.ok(new URL(card.source).hostname.includes('.edu'));
 for(const m of SHOULDER_MOVES.filter(m=>m.muscles.some(x=>x[0]===key)))for(const side of ['left','right'])for(const p of shoulderParts(atlas,m,side).filter(p=>p.name.toLowerCase().includes(key)))assert.equal(muscleFor(p.name)?.key,key);
}
assert.ok(MUSCLES.length>=14);assert.equal(keys.size,9);
assert.equal(atlas.parts.filter(p=>p.name.toLowerCase().includes('latissimus dorsi')).length,2);
console.log('PASS: all 9 shoulder movement muscles have complete sourced cards; both-side model selections resolve; original shoulder coverage preserved.');
