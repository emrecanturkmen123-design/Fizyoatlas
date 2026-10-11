import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {configureNavigation} from '../app/navigation.ts';
class Surface extends EventTarget {
 style={};clientWidth=1000;clientHeight=800;
 getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};}
 setPointerCapture(){} releasePointerCapture(){}
}
function emit(el,type,props){const e=new Event(type,{cancelable:true});Object.assign(e,props);el.dispatchEvent(e);}
for(const offset of [false,true]){
 const surface=new Surface(),camera=new PerspectiveCamera(34,1.25,.005,100);
 if(offset)camera.setViewOffset(1000,800,-100,30,1000,800);
 camera.position.set(0,0,4);const controls=new OrbitControls(camera,surface);configureNavigation(controls);controls.update();camera.updateMatrixWorld();
 const point=new Vector3(.6,.3,0),before=point.clone().project(camera);const x=(before.x+1)*500,y=(1-before.y)*400;
 emit(surface,'wheel',{clientX:x,clientY:y,deltaY:-100,deltaMode:0});camera.updateMatrixWorld();
 const after=point.clone().project(camera);
 assert.ok(camera.position.z<4,'wheel zooms in');
 assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<1e-6,'cursor target stays anchored, including offset viewport');
 const distance=camera.position.distanceTo(controls.target),target=controls.target.clone();
 emit(surface,'pointerdown',{pointerId:1,pointerType:'mouse',button:2,clientX:500,clientY:400});
 emit(surface,'pointermove',{pointerId:1,pointerType:'mouse',clientX:560,clientY:430});
 emit(surface,'pointerup',{pointerId:1,pointerType:'mouse',button:2,clientX:560,clientY:430});
 assert.ok(controls.target.distanceTo(target)>.01,'right drag pans');
 assert.ok(Math.abs(distance-camera.position.distanceTo(controls.target))<1e-6,'pan preserves distance');
 controls.dispose();
}
console.log('PASS: cursor zoom remains anchored and right-button pan preserves distance for normal and focused cameras.');
