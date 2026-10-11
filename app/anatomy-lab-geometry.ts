import type {Part} from './anatomy';
export type Vec3=[number,number,number];
export interface LabMesh {part:Part;positions:Float32Array;indices:Uint32Array}
export function cameraPoint(p:Vec3,center:Vec3,yaw:number,pitch:number):Vec3{
 const x=p[0]-center[0],y=p[1]-center[1],z=p[2]-center[2],a=yaw*Math.PI/180,b=pitch*Math.PI/180;
 const u=x*Math.cos(a)+z*Math.sin(a),v=z*Math.cos(a)-x*Math.sin(a);
 return [u,y*Math.cos(b)-v*Math.sin(b),y*Math.sin(b)+v*Math.cos(b)];
}
