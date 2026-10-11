import * as T from 'three';
import type {ShoulderState} from './shoulder';
// BodyParts3D coordinates: +X left, +Y superior, +Z anterior.
// Approximate teaching origin, not a fitted glenohumeral joint centre.
export function shoulderOverlay(s:ShoulderState){
 const group=new T.Group(),sign=s.side==='left'?1:-1,rotation=['internal','external'].includes(s.id),sagittal=['flexion','extension'].includes(s.id);
 const origin=new T.Vector3(sign*.18,rotation?1.12:1.40,-.025),color=sagittal?0x1278aa:rotation?0x8552bc:0x16856b;
 group.position.copy(origin);
 const normal=sagittal?new T.Vector3(1,0,0):rotation?new T.Vector3(0,1,0):new T.Vector3(0,0,1);
 const plane=new T.Mesh(new T.PlaneGeometry(.8,.8),new T.MeshBasicMaterial({color,transparent:true,opacity:.12,side:T.DoubleSide,depthWrite:false}));plane.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),normal);plane.visible=s.plane;group.add(plane);
 const axis=new T.Line(new T.BufferGeometry().setFromPoints([normal.clone().multiplyScalar(-.25),normal.clone().multiplyScalar(.25)]),new T.LineDashedMaterial({color:0x34495e,dashSize:.018,gapSize:.012,depthTest:false}));axis.computeLineDistances();axis.renderOrder=12;group.add(axis);
 const points:T.Vector3[]=[];
 for(let i=0;i<=48;i++){
  const t=i/48;
  if(rotation){const a=(s.id==='internal'?-sign:sign)*t*Math.PI/4;points.push(new T.Vector3(.19*Math.sin(a),0,.19*Math.cos(a)));}
  else if(sagittal){const a=t*(s.id==='extension'?-Math.PI/6:Math.PI/2);points.push(new T.Vector3(0,-.3*Math.cos(a),.3*Math.sin(a)));}
  else{const a=(s.id==='adduction'?1-t:t)*Math.PI/2;points.push(new T.Vector3(sign*.3*Math.sin(a),-.3*Math.cos(a),0));}
 }
 const curve=new T.CatmullRomCurve3(points);const arc=new T.Mesh(new T.TubeGeometry(curve,48,.0035,6,false),new T.MeshBasicMaterial({color,depthTest:false}));arc.renderOrder=13;group.add(arc);
 const tip=new T.Mesh(new T.ConeGeometry(.014,.035,12),new T.MeshBasicMaterial({color,depthTest:false}));const end=points.at(-1)!;tip.position.copy(end);tip.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.clone().sub(points.at(-2)!).normalize());tip.renderOrder=14;group.add(tip);
 return group;
}
export function disposeOverlay(g:T.Group){g.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});g.removeFromParent();}
