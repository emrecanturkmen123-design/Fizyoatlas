import * as T from 'three';
import type {Atlas} from './anatomy';
// Normalized dual-quaternion skinning (Kavan et al., 2008), implemented here.
// https://users.cs.utah.edu/~ladislav/kavan08geometric/
export function rigidBlend(a:T.Matrix4,b:T.Matrix4){
 const ar=new T.Quaternion().setFromRotationMatrix(a),br=new T.Quaternion().setFromRotationMatrix(b);
 const ap=new T.Vector3().setFromMatrixPosition(a),bp=new T.Vector3().setFromMatrixPosition(b);
 const ad=new T.Quaternion(ap.x,ap.y,ap.z,0).multiply(ar),bd=new T.Quaternion(bp.x,bp.y,bp.z,0).multiply(br);
 const sign=ar.dot(br)<0?-1:1,qr=new T.Quaternion(),qd=new T.Quaternion(),translation=new T.Quaternion();
 return (point:T.Vector3,w:number)=>{
  if(w===0)return point.applyMatrix4(a);if(w===1)return point.applyMatrix4(b);
  const v=1-w,u=w*sign;
  qr.set(ar.x*v+br.x*u,ar.y*v+br.y*u,ar.z*v+br.z*u,ar.w*v+br.w*u);
  const inv=1/qr.length();qr.set(qr.x*inv,qr.y*inv,qr.z*inv,qr.w*inv);
  qd.set((ad.x*v+bd.x*u)*inv*.5,(ad.y*v+bd.y*u)*inv*.5,(ad.z*v+bd.z*u)*inv*.5,(ad.w*v+bd.w*u)*inv*.5);
  translation.copy(qr).conjugate().premultiply(qd);point.applyQuaternion(qr);
  point.x+=2*translation.x;point.y+=2*translation.y;point.z+=2*translation.z;return point;
 };
}
export interface BoneGuard {bone:string;a:T.Vector3;b:T.Vector3;radius:number}
// Conservative interior cores, not full bone-mesh collision surfaces.
export function boneGuards(atlas:Atlas,geometries:Map<string,T.BufferGeometry>,side:string){
 const result:BoneGuard[]=[];
 for(const bone of ['humerus','radius','ulna']){
  const part=atlas.parts.find(p=>p.name.toLowerCase()===side+' '+bone),g=part&&geometries.get(part.id);if(!g)continue;
  const attr=g.getAttribute('position'),box=new T.Box3().setFromBufferAttribute(attr as T.BufferAttribute),step=(box.max.y-box.min.y)/8;
  const slices:{center:T.Vector3;radius:number}[]=[];
  for(let j=0;j<8;j++){
   const y=box.min.y+(j+.5)*step,points:T.Vector3[]=[];
   for(let i=0;i<attr.count;i++)if(Math.abs(attr.getY(i)-y)<=step/2)points.push(new T.Vector3().fromBufferAttribute(attr,i));
   if(!points.length)continue;
   const center=points.reduce((sum,p)=>sum.add(p),new T.Vector3()).multiplyScalar(1/points.length);
   const radii=points.map(p=>Math.hypot(p.x-center.x,p.z-center.z)).sort((a,b)=>a-b);
   slices.push({center,radius:radii[Math.floor(radii.length*.4)]*.8});
  }
  for(let j=1;j<slices.length;j++)result.push({bone,a:slices[j-1].center,b:slices[j].center,radius:Math.min(slices[j-1].radius,slices[j].radius)});
 }
 return result;
}
export function poseGuards(guards:BoneGuard[],matrix:(bone:string)=>T.Matrix4){return guards.map(g=>({...g,a:g.a.clone().applyMatrix4(matrix(g.bone)),b:g.b.clone().applyMatrix4(matrix(g.bone))}));}
export function surfaceConstraints(g:T.BufferGeometry,parameters:Float32Array){
 const pos=g.getAttribute('position'),idx=g.getIndex(),edges:number[][]=[],seen=new Set<string>();
 const add=(a:number,b:number)=>{if(a>b)[a,b]=[b,a];const key=a+':'+b;if(seen.has(key))return;seen.add(key);const d=Math.hypot(pos.getX(a)-pos.getX(b),pos.getY(a)-pos.getY(b),pos.getZ(a)-pos.getZ(b));if(d>.00015)edges.push([a,b,d]);};
 for(let i=0;i<(idx?.count??pos.count);i+=3){const a=idx?idx.getX(i):i,b=idx?idx.getX(i+1):i+1,c=idx?idx.getX(i+2):i+2;add(a,b);add(b,c);add(c,a);}
 return {edges,mobility:parameters.map(w=>w<=.03||w>=.97?0:1)};
}
export function guardDepth(p:T.Vector3,g:BoneGuard){const x=g.b.x-g.a.x,y=g.b.y-g.a.y,z=g.b.z-g.a.z;const t=T.MathUtils.clamp(((p.x-g.a.x)*x+(p.y-g.a.y)*y+(p.z-g.a.z)*z)/Math.max(1e-12,x*x+y*y+z*z),0,1);return g.radius-Math.hypot(p.x-g.a.x-t*x,p.y-g.a.y-t*y,p.z-g.a.z-t*z);}
export function stabilizeSurface(pos:T.BufferAttribute,c:ReturnType<typeof surfaceConstraints>,guards:BoneGuard[],strength:number){
 if(!strength)return;
 // Anchors remain fixed. Relax only excessively elongated edges, then repel
 // mobile vertices from conservative bone cores. No tissue/force simulation.
 for(let pass=0;pass<48;pass++)for(const [a,b,rest]of c.edges){
  const ma=c.mobility[a],mb=c.mobility[b];if(!ma&&!mb)continue;
  const dx=pos.getX(b)-pos.getX(a),dy=pos.getY(b)-pos.getY(a),dz=pos.getZ(b)-pos.getZ(a),d=Math.hypot(dx,dy,dz),limit=Math.max(rest*1.8,.001);
  if(d<=limit)continue;const f=(d-limit)/d*strength/(ma+mb);
  pos.setXYZ(a,pos.getX(a)+dx*f*ma,pos.getY(a)+dy*f*ma,pos.getZ(a)+dz*f*ma);
  pos.setXYZ(b,pos.getX(b)-dx*f*mb,pos.getY(b)-dy*f*mb,pos.getZ(b)-dz*f*mb);
 }
 const p=new T.Vector3(),axis=new T.Vector3(),closest=new T.Vector3(),delta=new T.Vector3();
 for(let i=0;i<pos.count;i++){if(!c.mobility[i])continue;p.fromBufferAttribute(pos,i);
  for(const g of guards){axis.subVectors(g.b,g.a);const t=T.MathUtils.clamp(delta.subVectors(p,g.a).dot(axis)/Math.max(axis.lengthSq(),1e-12),0,1);closest.copy(g.a).addScaledVector(axis,t);delta.subVectors(p,closest);const distance=delta.length();if(distance>=g.radius)continue;if(distance<1e-10)delta.set(0,0,1);else delta.multiplyScalar(1/distance);p.addScaledVector(delta,(g.radius-distance+.0003)*strength);}
  pos.setXYZ(i,p.x,p.y,p.z);
 }
}
