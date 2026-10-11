import type {SceneState} from './anatomy';
import {MUSCLE_GROUPS} from './attachments';
import {muscleFor} from './education-data';

export function muscleGroupFor(name:string){
 const base=name.replace(/^(left|right)\s+/i,'');
 const entry=Object.entries(MUSCLE_GROUPS).find(([,group])=>group.name===base);
 return entry?{key:entry[0] as keyof typeof MUSCLE_GROUPS,...entry[1]}:undefined;
}

// Keep the reference body visible by default. A local-only view is opt-in.
export function thighStudyState(name:string):Partial<SceneState>|undefined{
 const group=muscleGroupFor(name),muscle=muscleFor(name);
 const key=group?.key??Object.entries(MUSCLE_GROUPS).find(([,g])=>muscle&&g.keys.includes(muscle.key))?.[0];
 if(!key)return;
 return {visible:['skeletal','muscular'],hidden:[],contextOpacity:.28,view:key==='hamstrings'?'back':'front',explode:0,isolate:false};
}
