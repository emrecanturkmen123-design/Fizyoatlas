import assert from 'node:assert/strict';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {interpretationKeys,motionMeaning} from '../app/motion-interpretation.ts';
import View from '../app/motion-interpretation-view.tsx';
import {HAND_MOVES,handAngles} from '../app/hand-motion.ts';
import {SHOULDER_MOVES} from '../app/shoulder.ts';
import {angleFor} from '../app/shoulder-motion.ts';
import {ELBOW_MOVES,elbowAngle} from '../app/elbow-motion.ts';
import {KNEE_MOVES,kneeAngle} from '../app/knee-motion.ts';
import {LOWER_MOVES,lowerAngle} from '../app/lower-motion.ts';
import {GAIT_SAMPLES,gaitPhase} from '../app/gait-motion.ts';
import {GAIT_PHASES} from '../app/gait-data.ts';
const base={side:'right',progress:0,motion:true,playing:false,digit:'all'},states=[...HAND_MOVES.map(m=>({hand:{...base,id:m.id}})),...SHOULDER_MOVES.map(m=>({shoulder:{...base,id:m.id}})),...ELBOW_MOVES.map(m=>({elbow:{...base,id:m.id}})),...KNEE_MOVES.map(m=>({knee:{...base,id:m.id}})),...LOWER_MOVES.map(m=>({lower:{...base,id:m.id,joint:m.joint}}))];
let checks=0;
for(const original of states)for(const side of ['left','right'])for(const progress of [0,33,34,66,67,99,100]){
 const field=Object.keys(original)[0],state={[field]:{...original[field],side,progress}};
 for(const key of interpretationKeys(state)){const result=motionMeaning(state,key);assert(result);assert(result.source.startsWith('https://'));assert(result.body&&result.note.includes('ölçümü değildir'));assert(!result.body.includes('undefined'));assert.equal(result.phase,progress===0?'Başlangıç':progress===100?'Son konum':progress<34?'Geçişin başı':progress<67?'Geçişin ortası':'Geçişin sonu');checks++;}
 if(field==='knee')assert(motionMeaning(state,interpretationKeys(state)[0]).position.includes(Math.round(kneeAngle(state.knee))+'°'));
 if(field==='elbow')assert(motionMeaning(state,interpretationKeys(state)[0]).position.includes(Math.round(elbowAngle(state.elbow))+'°'));
 if(field==='shoulder')assert(motionMeaning(state,interpretationKeys(state)[0]).position.includes(Math.round(angleFor(state.shoulder))+'°'));
}
assert.equal(motionMeaning({hand:{...base,id:'dip-flexion',progress:80}},'flexor digitorum superficialis').body.includes('doğrudan katkı vermez'),true);
assert(motionMeaning({hand:{...base,id:'thumb-opposition',progress:80}},'opponens pollicis').body.includes('metakarp'));
assert(motionMeaning({hand:{...base,id:'thumb-extension',progress:80}},'extensor pollicis brevis').body.includes('IP eklemine doğrudan tutunmaz'));
for(const contraction of ['concentric','eccentric','isometric']){const state={elbow:{...base,id:contraction==='eccentric'?'extension':'flexion',progress:60,contraction}};const meaning=motionMeaning(state,'biceps brachii');assert(meaning.body.includes(contraction==='eccentric'?'uzayarak':contraction==='concentric'?'kısalarak':'sabit'));assert(motionMeaning(state,'triceps brachii').body.includes('aktivasyonu bu görüntüden çıkarılamaz'));}
const deltoid=motionMeaning({shoulder:{...base,id:'abduction',progress:70}},'deltoid','Right clavicular part of deltoid');assert(deltoid.body.includes('aynı bölüm değildir'));
for(const progress of [...GAIT_SAMPLES,99,100])for(const side of ['left','right']){const state={gait:{progress,playing:false,speed:1,muscles:true,plane:false}},position=(progress+(side==='left'?50:0))%100,phase=GAIT_PHASES[gaitPhase(position)];for(const key of phase.keys){const meaning=motionMeaning(state,key,side+' '+key);assert(meaning.phase.includes(phase.name)||progress===100&&side==='right'&&meaning.phase.includes('Yeni ilk temas'));assert(!meaning.body.includes('devre dışı'),'listed phase role');checks++;}}
const right=motionMeaning({gait:{progress:10}},'tibialis anterior','Right tibialis anterior'),left=motionMeaning({gait:{progress:10}},'tibialis anterior','Left tibialis anterior');assert.notEqual(right.phase,left.phase);assert.notEqual(right.body,left.body);
assert.equal(motionMeaning({},'biceps brachii'),undefined);assert.equal(motionMeaning({elbow:{...base,id:'flexion',motion:false}},'biceps brachii'),undefined);
globalThis.IS_REACT_ACT_ENVIRONMENT=true;let root,picked;
const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n?.props?.children!==undefined?text(n.props.children):n?.children?text(n.children):'';
await act(async()=>{root=create(React.createElement(View,{state:{hand:{...base,id:'finger-flexion',progress:50}},onMuscle:key=>picked=key}));});
assert(text(root.toJSON()).includes('PIP 30°'));await act(async()=>root.root.findByProps({'aria-label':'Yorumlanacak kas'}).props.onChange({target:{value:'flexor digitorum profundus'}}));assert(text(root.toJSON()).includes('Distal falanksa'));await act(async()=>root.root.findAllByType('button')[0].props.onClick());assert.equal(picked,'flexor digitorum profundus');
await act(async()=>root.update(React.createElement(View,{state:{hand:{...base,id:'finger-flexion',progress:100}},muscle:'flexor digitorum superficialis'})));assert(text(root.toJSON()).includes('Son konum'));assert.equal(root.root.findAllByType('select').length,0);assert(text(root.toJSON()).includes('DIP eklemine doğrudan tutunmaz'));await act(async()=>root.unmount());
console.log(`PASS: ${checks} frame/side/muscle explanations, actual angle readouts, gait side and phase boundaries, contraction scenarios, hand joint roles, deltoid portions, source links and real selector/card callbacks.`);
