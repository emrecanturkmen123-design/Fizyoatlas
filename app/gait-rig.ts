import * as T from 'three';
import type {Atlas,Part} from './anatomy';
import {muscleKeyMatches} from './education-data';
import {rigidBlend} from './muscle-stability';
import {GAIT_PHASES} from './gait-data';
import {createGaitModel,gaitPose,gaitBoneMatrix,gaitPhase,GAIT_GROUND,type GaitState} from './gait-motion';

export function createGaitRig(atlas:Atlas,geometries:Map<string,T.BufferGeometry>){
 const group=new T.Group(),model=createGaitModel(atlas,geometries);
 const boneMaterial=new T.MeshStandardMaterial({color:0xe5d7b7,roughness:.65,side:T.DoubleSide});
 const muscleMaterial=new T.MeshStandardMaterial({color:0x2496ae,roughness:.7,side:T.DoubleSide});
 const bones:{part:Part;mesh:T.Mesh}[]=[],muscles:{part:Part;mesh:T.Mesh;rest:Float32Array}[]=[];
 for(const part of atlas.parts){const source=geometries.get(part.id);if(!source)continue;
  if(part.system==='skeletal'){const mesh=new T.Mesh(source,boneMaterial);mesh.matrixAutoUpdate=false;group.add(mesh);bones.push({part,mesh});}
  else if(part.system==='muscular'&&GAIT_PHASES.some(p=>p.keys.some(k=>muscleKeyMatches(part.name,k)))){
   const g=source.clone();g.deleteAttribute('partIndex');g.setAttribute('normal',new T.BufferAttribute(new Float32Array(part.vertexCount*3),3));
   const mesh=new T.Mesh(g,muscleMaterial);mesh.userData.partId=part.id;group.add(mesh);muscles.push({part,mesh,rest:new Float32Array(source.attributes.position.array)});
  }
 }
 const plane=new T.Mesh(new T.PlaneGeometry(1.25,1.85),new T.MeshBasicMaterial({color:0x2193b0,transparent:true,opacity:.09,side:T.DoubleSide,depthWrite:false}));plane.rotation.y=Math.PI/2;plane.position.y=.86;group.add(plane);
 const floor=new T.Mesh(new T.PlaneGeometry(1.4,3),new T.MeshStandardMaterial({color:0xe3e9e8,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.set(0,GAIT_GROUND-.002,.4);group.add(floor);
 const grid=new T.GridHelper(3,30,0xb1bfbd,0xcbd4d2);grid.position.set(0,GAIT_GROUND-.001,.4);group.add(grid);
 const contacts=Object.fromEntries((['right','left'] as const).map(side=>{const mesh=new T.Mesh(new T.RingGeometry(.012,.03,32),new T.MeshBasicMaterial({color:side==='right'?0x167c9b:0xc08040,side:T.DoubleSide,transparent:true,opacity:.9,depthTest:false}));mesh.rotation.x=-Math.PI/2;mesh.renderOrder=15;group.add(mesh);return [side,mesh];})) as unknown as Record<'right'|'left',T.Mesh>;
 return {group,model,bones,muscles,plane,contacts,boneMaterial,muscleMaterial,key:'',pose:gaitPose(model,0)};
}
export type GaitRig=ReturnType<typeof createGaitRig>;
export function updateGaitRig(rig:GaitRig,state:GaitState){
 const key=JSON.stringify([state.progress,state.muscles,state.plane]);if(rig.key===key)return;
 const pose=gaitPose(rig.model,state.progress);rig.pose=pose;
 for(const {part,mesh} of rig.bones){mesh.matrix.copy(gaitBoneMatrix(part,pose));mesh.updateMatrixWorld(true);}
 for(const {part,mesh,rest} of rig.muscles){
  const side=/\bright\b/i.test(part.name)?'right':/\bleft\b/i.test(part.name)?'left':undefined;
  const keys=GAIT_PHASES[gaitPhase(side?pose.legs[side].phase:state.progress)].keys;mesh.visible=state.muscles&&keys.some(k=>muscleKeyMatches(part.name,k));if(!mesh.visible)continue;
  const leg=side?pose.legs[side]:undefined,anchors=side?rig.model.legs[side]:undefined,pos=mesh.geometry.attributes.position as T.BufferAttribute,p=new T.Vector3();
  const hipBlend=leg?rigidBlend(pose.root,leg.thigh):undefined,kneeBlend=leg?rigidBlend(leg.thigh,leg.shin):undefined,ankleBlend=leg?rigidBlend(leg.shin,leg.foot):undefined;
  for(let i=0;i<pos.count;i++){p.fromArray(rest,i*3);const y=p.y;
   if(anchors&&leg){if(y>anchors.hip.y-.10)hipBlend!(p,1-T.MathUtils.smoothstep(y,anchors.hip.y-.10,anchors.hip.y+.06));
    else if(y>anchors.knee.y-.10)kneeBlend!(p,1-T.MathUtils.smoothstep(y,anchors.knee.y-.10,anchors.knee.y+.10));
    else ankleBlend!(p,1-T.MathUtils.smoothstep(y,anchors.ankle.y-.025,anchors.ankle.y+.08));
   }else p.applyMatrix4(pose.root);
   pos.setXYZ(i,p.x,p.y,p.z);
  }
  pos.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();
 }
 rig.plane.visible=state.plane;rig.plane.position.z=pose.root.elements[14];
 for(const side of ['right','left'] as const){const leg=pose.legs[side],marker=rig.contacts[side];marker.visible=leg.phase<60;marker.position.copy(leg.contact);marker.position.y=GAIT_GROUND+.001;}
 rig.key=key;
}
export function disposeGaitRig(rig:GaitRig){rig.group.removeFromParent();for(const {mesh} of rig.muscles)mesh.geometry.dispose();rig.boneMaterial.dispose();rig.muscleMaterial.dispose();rig.group.traverse(o=>{if(o instanceof T.Mesh&&!rig.bones.some(b=>b.mesh===o)&&!rig.muscles.some(m=>m.mesh===o)){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}if(o instanceof T.LineSegments){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});rig.group.clear();}
