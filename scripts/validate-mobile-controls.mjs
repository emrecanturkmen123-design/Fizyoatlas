import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {configureNavigation} from '../app/navigation.ts';
import {PointerTap} from '../app/pointer-tap.ts';
import {modelViewport} from '../app/model-viewport.ts';
class Surface extends EventTarget {
 style={}; constructor(width,height){super();this.clientWidth=width;this.clientHeight=height;}
 getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};}
 setPointerCapture(){} releasePointerCapture(){}
}
function emit(el,type,id,x,y){const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:id,pointerType:'touch',button:0,clientX:x,clientY:y,pageX:x,pageY:y});el.dispatchEvent(e);}
for(const [width,height] of [[320,640],[390,844],[768,1024],[844,390]]){
 const el=new Surface(width,height),camera=new PerspectiveCamera(34,width/height,.005,100);camera.position.set(0,0,4);
 const controls=new OrbitControls(camera,el);configureNavigation(controls);controls.update();controls.saveState();
 const before=camera.position.clone();
 emit(el,'pointerdown',1,100,100);emit(el,'pointermove',1,150,120);emit(el,'pointerup',1,150,120);
 assert(camera.position.distanceTo(before)>.01,'one-finger drag rotates');assert(Math.abs(camera.position.distanceTo(controls.target)-4)<1e-7);
 controls.reset();const tap=new PointerTap();tap.down(1,100,100,12);tap.down(2,200,100,12);
 emit(el,'pointerdown',1,100,100);emit(el,'pointerdown',2,200,100);
 emit(el,'pointermove',2,260,120);tap.move(2,260,120);emit(el,'pointermove',1,120,120);tap.move(1,120,120);
 assert(camera.position.distanceTo(controls.target)<4,'two-finger spread zooms');assert(controls.target.distanceTo(new Vector3())>.01,'two-finger centroid pans');
 emit(el,'pointerup',2,260,120);emit(el,'pointerup',1,120,120);assert(!tap.up(2,260,120)&&!tap.up(1,120,120),'pinch must not select anatomy');
 emit(el,'pointerdown',3,100,100);emit(el,'pointercancel',3,100,100);tap.down(3,100,100,12);tap.cancel(3);assert(!tap.up(3,100,100));
 assert([...camera.position,...controls.target].every(Number.isFinite));
 const panel=width>=600&&height<500?{left:width*.58,right:width-8,top:180,bottom:height-8}:width<768?{left:8,right:width-8,top:height*.6,bottom:height-8}:{left:width-300,right:width-8,top:180,bottom:height-8};
 const v=modelViewport(width,height,[panel],170);
 assert(v.top>=182);assert(v.right-v.left>=120);assert(v.bottom-v.top>=60);
 if(width<600)assert(v.bottom<panel.top);else assert(v.right<panel.left);
 controls.dispose();
}
console.log('PASS: actual OrbitControls touch rotation, pinch zoom/pan, canceled gestures and finite camera math at four viewport sizes; software panel bounds. No physical device, browser pixels or GPU rendering tested.');
