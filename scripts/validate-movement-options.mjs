import assert from 'node:assert/strict';
import {CLOSED_MOVEMENT_OPTIONS as closed,movementOptions} from '../app/movement-options.ts';
import {SHOULDER_MOVES} from '../app/shoulder.ts';import {ELBOW_MOVES} from '../app/elbow-motion.ts';import {LOWER_MOVES} from '../app/lower-motion.ts';import {KNEE_MOVES} from '../app/knee-motion.ts';
const families=[SHOULDER_MOVES,ELBOW_MOVES,LOWER_MOVES,KNEE_MOVES];let n=0;
for(const moves of families)for(const m of moves){
 const fresh=movementOptions({id:m.id,joint:m.joint,progress:0,motion:true,...closed});
 for(const k of Object.keys(closed))assert.equal(fresh[k],false);
 const enabled={...fresh,anatomicalMuscles:true,plane:true,antagonists:true,progress:40};
 assert.deepEqual(movementOptions({...enabled,progress:50},enabled),{...enabled,progress:50},'stepping keeps explicit choices');
 assert.deepEqual(movementOptions(enabled),enabled,'card return keeps choices and angle');
 for(const other of moves.filter(x=>x.id!==m.id||x.joint!==m.joint)){
  const changed=movementOptions({...enabled,id:other.id,joint:other.joint,playing:true,motion:false},enabled);
  for(const k of Object.keys(closed))assert.equal(changed[k],false);
  assert.equal(changed.progress,0);assert.equal(changed.playing,false);assert.equal(changed.motion,true);
 }n++;
}
console.log('PASS',n,'movement defaults; opt-in, stepping, saved card return and movement-switch reset.');
