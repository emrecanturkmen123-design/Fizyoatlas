import fs from 'node:fs';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Color,DataTexture,ShaderLib,RGBAFormat,FloatType} from 'three';
import {MUSCLE_GROUPS,attachmentTargets} from '../app/attachments.ts';
import {SYSTEMS} from '../app/anatomy.ts';
import {elementsFor,muscleFor} from '../app/education-data.ts';
import {sideOf} from '../app/innervation.ts';
import {muscleSelectionColor,selectionPalette} from '../app/selection-palette.ts';
import {writeSelectionPalette,applySelectionPalette} from '../app/selection-color-shader.ts';
import {SelectionLegend} from '../app/selection-legend.tsx';
import {MuscleGroupCard} from '../app/muscle-group-card.tsx';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
const base={selected:[],visible:['skeletal','muscular'],view:'front',explode:0,isolate:false,rotate:false,reset:0};
const width=2**Math.ceil(Math.log2(atlas.parts.length)),data=new Float32Array(width*4);
const boneColor=SYSTEMS.find(s=>s.id==='skeletal').color;
for(const [key,group] of Object.entries(MUSCLE_GROUPS))for(const side of ['left','right',undefined]){
 const ids=elementsFor(atlas,group.keys).filter(id=>!side||sideOf(atlas.parts.find(p=>p.id===id).name)===side);
 const attachment={key,side:side??'right',mode:'both'},bones=attachmentTargets(atlas,attachment).map(t=>t.boneId);
 const state={...base,selected:[...ids,...bones],attachments:attachment},palette=selectionPalette(atlas,state);
 assert.equal(palette.members.length,group.keys.length);assert.equal(new Set(palette.members.map(m=>m.color)).size,group.keys.length);
 for(const id of ids){const p=atlas.parts.find(p=>p.id===id);assert.equal(palette.partColors.get(id),muscleSelectionColor(muscleFor(p.name).key));}
 for(const id of bones)assert.equal(palette.partColors.get(id),boneColor,'attachment bones retain bone color');
 writeSelectionPalette(data,atlas,palette);
 for(const id of [...ids,...bones]){const offset=atlas.parts.findIndex(p=>p.id===id)*4,color=new Color(palette.partColors.get(id)).toArray();assert.equal(data[offset+3],1);color.forEach((v,i)=>assert(Math.abs(data[offset+i]-v)<1e-6,'GPU values are linear RGB'))}
 for(const disabled of [{hideNames:true},{trace:true},{spine:'all'},{gait:{}},{shoulder:{}},{elbow:{}},{knee:{}},{lower:{}}])assert.equal(selectionPalette(atlas,{...state,...disabled}).partColors.size,0,'existing teaching/exam color systems are preserved');
 const html=renderToStaticMarkup(React.createElement(MuscleGroupCard,{name:group.name,onMuscle(){}}));
 for(const member of palette.members){assert(html.includes(member.name));assert(html.includes('background-color:'+member.color));}
 const legend=renderToStaticMarkup(React.createElement(SelectionLegend,{members:palette.members}));assert(legend.includes('Seçilen kasların renkleri'));
 for(const member of palette.members)assert(legend.includes(member.name)&&legend.includes(member.color));
 const first=elementsFor(atlas,[group.keys[0]]);
 assert.equal(selectionPalette(atlas,{...base,selected:first}).partColors.size,0,'one muscle on both sides remains blue');
 const single=selectionPalette(atlas,{...base,selected:[...first,...bones],attachments:attachment});
 assert.equal(single.members.length,0);for(const id of first)assert(!single.partColors.has(id));for(const id of bones)assert.equal(single.partColors.get(id),boneColor);
 writeSelectionPalette(data,atlas,selectionPalette(atlas,base));assert(data.every(v=>v===0),'clearing selection removes every previous tint');
}
const allMuscles=selectionPalette(atlas,{...base,selected:atlas.parts.filter(p=>p.system==='muscular').map(p=>p.id)});
assert.equal(new Set(allMuscles.members.map(m=>m.color)).size,allMuscles.members.length,'large selections also have distinct color definitions');
writeSelectionPalette(data,atlas,allMuscles);assert(data.every(Number.isFinite),'fallback HSL colors convert to finite GPU values');
const mixed=elementsFor(atlas,['semitendinosus','vastus medialis']);
const one=selectionPalette(atlas,{...base,selected:mixed}),two=selectionPalette(atlas,{...base,selected:[...mixed].reverse()});
assert.equal(new Set(one.members.map(m=>m.color)).size,2,'mixed muscles with the same preferred color are separated');
assert.deepEqual([...one.partColors],[...two.partColors],'selection order does not alter colors');
// Execute the shader hook on Three's actual standard shader, independently of a GPU.
const texture=new DataTexture(data,width,1,RGBAFormat,FloatType);
const shader={uniforms:{},vertexShader:ShaderLib.standard.vertexShader,fragmentShader:ShaderLib.standard.fragmentShader};applySelectionPalette(shader,texture);
assert.equal(shader.uniforms.selectionColorState.value,texture);
assert(shader.vertexShader.includes('varying vec4 partSelectionColor;'));
assert(shader.vertexShader.includes('texture2D(selectionColorState'));
assert(shader.fragmentShader.includes('partSelected > 0.5 && partSelectionColor.a > 0.5'));
assert(shader.fragmentShader.indexOf('diffuseColor.rgb = partSelectionColor.rgb')>shader.fragmentShader.indexOf('#include <color_fragment>'));
assert(shader.fragmentShader.indexOf('diffuseColor.rgb = partSelectionColor.rgb')<shader.fragmentShader.indexOf('#include <roughnessmap_fragment>'));
assert(shader.vertexShader.includes('#include <begin_vertex>'));texture.dispose();
console.log('PASS: stable distinct muscle colors across sides/order, matched labeled group/legend colors, linear GPU texture values and clearing, anatomical bone context, single-muscle blue, protected exam/motion/trace/spine roles, actual Three standard-shader hook. GPU rendering is not covered.');
