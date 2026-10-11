import type {Atlas,SceneState} from './anatomy';
import {nerveParts,targetParts,type Nerve,type Side} from './innervation';
export type NerveFocus='nerve'|'targets';
export function nerveStudySelection(atlas:Atlas,nerve:Nerve,side:Side,requested:NerveFocus='nerve'){
 const meshes=nerveParts(atlas,nerve,side);
 const focus:NerveFocus=requested==='nerve'&&meshes.length?'nerve':'targets';
 const selected=(focus==='nerve'?meshes:targetParts(atlas,nerve,side)).map(p=>p.id);
 const visible:SceneState['visible']=focus==='nerve'?['skeletal','muscular','nervous']:['skeletal','muscular'];
 const view:SceneState['view']=nerve.id.includes('gluteal')?'back':'front';
 return {selected,visible,view,focus};
}
