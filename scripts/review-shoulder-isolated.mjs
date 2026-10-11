import fs from 'node:fs';import zlib from 'node:zlib';import * as T from 'three';
import {createShoulderRig,updateShoulderRig,disposeShoulderRig} from '../app/shoulder-muscles.ts';import {poseMatrices,motionSegment} from '../app/shoulder-motion.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),geometry=new Map(),chunks=new Map();
for(const p of atlas.parts.filter(p=>['muscular','skeletal','connective'].includes(p.system))){if(!chunks.has(p.chunk)){const b=fs.readFileSync('public'+atlas.chunks[p.chunk].url);chunks.set(p.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}const b=chunks.get(p.chunk),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(b,p.positions,p.vertexCount*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(b,p.indices,p.indexCount),1));geometry.set(p.id,g);}
const out=[];for(const side of ['right','left'])for(const id of (process.argv[3]??'abduction').split(',')){
 const s={id,side,progress:0,motion:true,anatomicalMuscles:true,plane:false,antagonists:false,cuff:false,tendons:false},rig=createShoulderRig(atlas,geometry,s);
 for(const progress of [0,50,100]){s.progress=progress;updateShoulderRig(rig,s);const pose=poseMatrices(atlas,s),bones=[];
 for(const p of atlas.parts.filter(p=>p.system==='skeletal'&&p.name.toLowerCase().startsWith(side+' ')&&/humerus|scapula|clavicle/.test(p.name.toLowerCase()))){const seg=motionSegment(p,s),g=geometry.get(p.id).clone().applyMatrix4(seg===1?pose.upper:seg===3?pose.scapula:new T.Matrix4());bones.push({name:p.name,color:[.83,.81,.72],p:Array.from(g.attributes.position.array),i:Array.from(g.index.array)});}
 for(const h of rig.surfaces){const g=h.mesh.geometry;out.push({name:h.part.name+' '+id+' '+progress+'%',id,side,progress,part:h.part.name,objects:[...bones,{name:h.part.name,color:[.82,.37,.34],p:Array.from(g.attributes.position.array),i:Array.from(g.index.array)}]});}
 }disposeShoulderRig(rig);
}fs.writeFileSync(process.argv[2],zlib.gzipSync(JSON.stringify(out)));console.log(out.length,'isolated poses');
