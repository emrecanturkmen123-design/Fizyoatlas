import assert from 'node:assert/strict';
import {Box3,PerspectiveCamera,Vector3} from 'three';
import {modelViewport,viewportUsable} from '../app/model-viewport.ts';
import {frameModelBounds} from '../app/model-framing.ts';
const overlaps=(a,b)=>a.right>b.left&&a.left<b.right&&a.bottom>b.top&&a.top<b.bottom;
const cases=[
 [320,480,176,[{left:8,right:312,top:208,bottom:472}]],
 [390,844,176,[{left:8,right:382,top:184,bottom:836}]],
 [320,260,250,[]],
 [1366,900,0,[{left:20,right:310,top:100,bottom:804},{left:1006,right:1346,top:100,bottom:804}]],
 [900,700,90,[{left:300,right:590,top:100,bottom:650}]],
 [390,844,176,[{left:8,right:382,top:506,bottom:836},{left:500,right:700,top:200,bottom:600}]],
];
for(const [w,h,controls,panels] of cases){
 const v=modelViewport(w,h,panels,controls);
 assert(Object.values(v).every(Number.isFinite));assert(v.left>=0&&v.right<=w&&v.top>=0&&v.bottom<=h);
 assert(v.right>=v.left&&v.bottom>=v.top);
 if(v.right>v.left&&v.bottom>v.top){assert(v.top>=controls+12);for(const p of panels)assert(!overlaps(v,p));}
}
assert(!viewportUsable(modelViewport(...[320,480,[{left:8,right:312,top:208,bottom:472}],176])),'do not invent 60px under the sheet');
assert(!viewportUsable(modelViewport(390,844,[{left:8,right:382,top:184,bottom:836}],176)),'expanded reading panel leaves no camera frame');
for(let w=280;w<=1400;w+=70)for(let h=280;h<=1000;h+=60){
 const panels=w<768?[{left:8,right:w-8,top:Math.max(184,h*.55),bottom:h-8}]:[{left:8,right:Math.min(310,w*.4),top:100,bottom:h-20},{left:w-300,right:w-8,top:160,bottom:h-8}],v=modelViewport(w,h,panels,176);
 if(v.right>v.left&&v.bottom>v.top){assert(v.top>=188);for(const p of panels)assert(!overlaps(v,p),JSON.stringify({w,h,v,p}));}
}
// Reuse one camera as a device changes orientation. Project every source-box corner.
const camera=new PerspectiveCamera(34,1,.005,100),box=new Box3(new Vector3(-.3,.5,-.2),new Vector3(.2,1.1,.35));
for(const [w,h,panels] of [[390,844,[{left:8,right:382,top:506,bottom:836}]],[844,390,[{left:490,right:836,top:84,bottom:382}]],[1366,900,[{left:20,right:310,top:100,bottom:804},{left:1006,right:1346,top:100,bottom:804}]]]){
 camera.aspect=w/h;camera.updateProjectionMatrix();const v=modelViewport(w,h,panels,h<500?72:176);assert(viewportUsable(v));
 for(const direction of [new Vector3(.2,.1,1),new Vector3(.2,.1,-1),new Vector3(1,.1,0)]){
  const result=frameModelBounds(camera,box,v,w,h,direction);assert(result);camera.updateMatrixWorld();
  for(let i=0;i<8;i++){
   const p=new Vector3(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z).project(camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2;
   assert(x>=v.left&&x<=v.right&&y>=v.top&&y<=v.bottom,JSON.stringify({w,h,v,x,y}));assert(p.z>-1&&p.z<1);
  }
 }
}
const position=camera.position.clone(),projection=camera.projectionMatrix.clone();
assert.equal(frameModelBounds(camera,box,{left:12,right:12,top:188,bottom:188},390,844,new Vector3(0,0,1)),undefined);
assert(camera.position.equals(position)&&camera.projectionMatrix.equals(projection),'fully covered model keeps its finite camera state');
console.log('PASS: short-screen, expanded-card, keyboard and multi-panel occlusion; all source-box corners fit front/back/side views after orientation changes using real Three camera projection. No browser pixels or GPU tested.');
