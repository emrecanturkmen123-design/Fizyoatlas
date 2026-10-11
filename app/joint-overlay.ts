import {lowerAnchor,lowerAxis} from './lower-motion';
import * as T from 'three';
import type {Atlas,SceneState} from './anatomy';
import {jointAnchors} from './shoulder-motion';
import {kneeAnchor} from './knee-motion';
import {elbowMatrices,elbowRotationAxis} from './elbow-motion';
export function jointFrame(atlas:Atlas,s:SceneState){
 if(s.lower)return {origin:lowerAnchor(atlas,s.lower),normal:lowerAxis(s.lower),size:s.lower.joint==='hip'?.6:.35,visible:s.lower.plane};
 if(s.knee)return {origin:kneeAnchor(atlas,s.knee.side),normal:new T.Vector3(1,0,0),size:.6,visible:s.knee.plane!==false};
 if(s.elbow){const rotation=['pronation','supination'].includes(s.elbow.id),pose=elbowMatrices(atlas,s.elbow);return {origin:jointAnchors(atlas,s.elbow.side).elbow,normal:rotation?elbowRotationAxis(s.elbow.side).transformDirection(pose.upper):new T.Vector3(1,0,0),size:.5,visible:s.elbow.plane!==false};}
 return undefined;
}
export function planeOverlay(frame:ReturnType<typeof jointFrame>){const group=new T.Group();if(!frame||!frame.visible)return group;group.position.copy(frame.origin);const color=0x1278aa,normal=frame.normal.clone().normalize();
 const plane=new T.Mesh(new T.PlaneGeometry(frame.size,frame.size),new T.MeshBasicMaterial({color,transparent:true,opacity:.13,side:T.DoubleSide,depthWrite:false}));plane.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),normal);group.add(plane);
 const axis=new T.Line(new T.BufferGeometry().setFromPoints([normal.clone().multiplyScalar(-frame.size*.45),normal.clone().multiplyScalar(frame.size*.45)]),new T.LineDashedMaterial({color:0x34495e,dashSize:.018,gapSize:.012,depthTest:false}));axis.computeLineDistances();axis.renderOrder=12;group.add(axis);return group;}
