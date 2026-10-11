import type {SceneState} from './anatomy';
import type {WorkspaceRoute} from './workspace-route';
import {MOVEMENT_LAYER_OPTIONS} from './movement-options';

export function movementLesson(state:SceneState):WorkspaceRoute['lesson']|undefined {
 if(state.hand?.motion)return 'hand';
 if(state.shoulder?.motion)return 'shoulder';
 if(state.elbow?.motion)return 'elbow';
 if(state.knee?.motion)return 'knee';
 if(state.lower?.motion)return state.lower.joint;
 if(state.gait)return 'gait';
}

export function movementRoute(state:SceneState):WorkspaceRoute|undefined {
 const lesson=movementLesson(state);if(!lesson)return;
 const motion=state.hand??state.shoulder??state.elbow??state.knee??state.lower;
 const options=motion as unknown as Record<string,unknown>|undefined;
 const layers=MOVEMENT_LAYER_OPTIONS.filter(key=>key==='slow'?state.gait?.speed===.5:key==='fast'?state.gait?.speed===2:key==='plane'?options?.plane||state.gait?.plane:options?.[key]);
 return {lesson,handDigit:state.hand?.digit,motion:motion?.id,side:motion?.side,progress:motion?.progress??state.gait?.progress,
  motionLayers:layers.length?layers:undefined,
  motionMuscles:motion?.anatomicalMuscles||state.gait?.muscles?true:undefined,
  tendons:state.knee?.tendons||state.elbow?.tendons?true:undefined};
}

// Inspect the source mesh in its current pose. Pause playback without rebuilding
// the movement or resetting the camera; the card is another view of this pose.
export function inspectMovement(state:SceneState,selected:string[],showMuscles=false):SceneState {
 const pause=<T extends {playing?:boolean;anatomicalMuscles?:boolean}>(value:T|undefined):T|undefined=>value?{...value,playing:false,...(showMuscles?{anatomicalMuscles:true}:{})}:undefined;
 return {...state,selected,rotate:false,isolate:false,highlightedSystem:undefined,
  hidden:state.hidden?.filter(id=>!selected.includes(id)),
  hand:pause(state.hand),shoulder:pause(state.shoulder),elbow:pause(state.elbow),knee:pause(state.knee),lower:pause(state.lower),
  gait:state.gait?{...state.gait,playing:false,muscles:showMuscles||state.gait.muscles}:undefined};
}
