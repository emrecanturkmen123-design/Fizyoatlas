import type {SceneState} from './anatomy';
export function separateStructures(s:SceneState,percentage:number):SceneState{
 const explode=Math.max(0,Math.min(100,percentage))/100;
 return {...s,spine:undefined,explode,isolate:false,rotate:false,shoulder:undefined,elbow:undefined,knee:undefined,lower:undefined,attachments:undefined,highlightedSystem:undefined,contextOpacity:1,view:explode>.8?'front':s.view};
}
