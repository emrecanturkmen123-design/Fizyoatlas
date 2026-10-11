import * as T from 'three';
import type {Atlas} from './anatomy';
import {around,jointAnchors} from './shoulder-motion';
import {elbowAngle,type ElbowState} from './elbow-motion';
// A schematic two-muscle teaching model, not a deformation of BodyParts3D.
// The posterior arc illustrates wrapping; endpoints are regional approximations.
export function demoPaths(atlas:Atlas,s:ElbowState){
 const {shoulder,elbow}=jointAnchors(atlas,s.side),angle=T.MathUtils.degToRad(elbowAngle(s)),rotation=around(elbow,new T.Vector3(1,0,0),-angle);
 const origin=shoulder.clone().add(new T.Vector3(0,-.025,.025));
 const insertion=elbow.clone().add(new T.Vector3(0,-.055,.025)).applyMatrix4(rotation);
 const middle=origin.clone().lerp(insertion,.5).add(new T.Vector3(0,0,.025));
 const biceps=new T.CatmullRomCurve3([origin,middle,insertion]);
 const back=shoulder.clone().add(new T.Vector3(0,-.065,-.035));
 const wrap=elbow.clone().add(new T.Vector3(0,0,-.035));
 const points=[back,back.clone().lerp(wrap,.6)];
 for(let i=0;i<=12;i++)points.push(wrap.clone().applyMatrix4(around(elbow,new T.Vector3(1,0,0),-angle*i/12)));
 // Avoid coincident control points at the straight-arm endpoint.
 const unique=points.filter((v,i)=>!i||v.distanceTo(points[i-1])>1e-7);
 const triceps=new T.CatmullRomCurve3(unique);
 return {biceps,triceps};
}
export function spindleGeometry(curve:T.Curve<T.Vector3>,radius:number){
 const geometry=new T.TubeGeometry(curve,48,1,12,false),position=geometry.getAttribute('position'),point=new T.Vector3();
 for(let i=0;i<=48;i++){const t=i/48,center=curve.getPointAt(t),r=.002+radius*Math.pow(Math.sin(Math.PI*t),.75);for(let j=0;j<=12;j++){const k=i*13+j;point.fromBufferAttribute(position,k).sub(center).multiplyScalar(r).add(center);position.setXYZ(k,point.x,point.y,point.z);}}
 geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
export function muscleDemo(atlas:Atlas,s:ElbowState){const group=new T.Group();if(!s.motion||!s.muscleDemo||!['flexion','extension'].includes(s.id))return group;const paths=demoPaths(atlas,s),rest=demoPaths(atlas,{...s,id:'flexion',progress:0,contraction:undefined});
 for(const [key,color] of [['biceps',0x1fa6d1],['triceps',0xf2611f]] as const){const curve=paths[key],ratio=rest[key].getLength()/curve.getLength();const mesh=new T.Mesh(spindleGeometry(curve,.016*Math.sqrt(Math.max(.6,Math.min(1.8,ratio)))),new T.MeshStandardMaterial({color,roughness:.6,side:T.DoubleSide}));mesh.name=key+' schematic';group.add(mesh);}return group;}
export function disposeMuscleDemo(group:T.Group){group.removeFromParent();group.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});}
