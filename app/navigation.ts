import {MOUSE,TOUCH} from 'three';
import type {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
export function configureNavigation(controls:OrbitControls){
 controls.zoomToCursor=true;controls.enablePan=true;controls.screenSpacePanning=true;
 controls.mouseButtons.RIGHT=MOUSE.PAN;controls.touches.TWO=TOUCH.DOLLY_PAN;
}
