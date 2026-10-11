import {Box3,MathUtils,Mesh,PerspectiveCamera,Vector3,type Object3D} from 'three';
import {viewportUsable,type PanelRect} from './model-viewport';

// Use the deformed source geometry, not its neutral catalog bounds.
export function posedSelectionBounds(objects:(Object3D|undefined)[],ids:ReadonlySet<string>){
 const box=new Box3();
 for(const object of objects){if(!object?.visible)continue;object.traverse(child=>{
  if(!(child instanceof Mesh)||!child.visible||!ids.has(child.userData.partId))return;
  child.updateWorldMatrix(true,false);child.geometry.computeBoundingBox();
  if(child.geometry.boundingBox)box.union(child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld));
 });}
 return box;
}

// Fit the actual bounds in camera space, including side/back views and depth.
export function frameModelBounds(camera:PerspectiveCamera,box:Box3,viewport:PanelRect,width:number,height:number,direction:Vector3){
 if(!viewportUsable(viewport)||box.isEmpty()||width<=0||height<=0)return undefined;
 const center=box.getCenter(new Vector3()),back=direction.clone().normalize();
 const right=new Vector3().crossVectors(camera.up,back).normalize(),up=new Vector3().crossVectors(back,right).normalize();
 const tangent=Math.tan(MathUtils.degToRad(camera.fov/2)),horizontal=tangent*camera.aspect*(viewport.right-viewport.left)/width,vertical=tangent*(viewport.bottom-viewport.top)/height;
 let distance=.07;
 for(let i=0;i<8;i++){
  const corner=new Vector3(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z).sub(center),depth=corner.dot(back);
  distance=Math.max(distance,depth+Math.abs(corner.dot(right))*1.35/horizontal,depth+Math.abs(corner.dot(up))*1.35/vertical,depth+camera.near*2);
 }
 camera.setViewOffset(width,height,width/2-(viewport.left+viewport.right)/2,height/2-(viewport.top+viewport.bottom)/2,width,height);
 camera.position.copy(center).addScaledVector(back,distance);camera.lookAt(center);
 return {center,distance};
}
