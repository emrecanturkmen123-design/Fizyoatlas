/** Optional teaching overlays start closed when choosing another movement. */
export const CLOSED_MOVEMENT_OPTIONS = {
 anatomicalMuscles:false, muscleDemo:false, muscleAttachments:false,
 plane:false, antagonists:false, cuff:false, tendons:false, achilles:false,
};
export const MOVEMENT_LAYER_OPTIONS=['plane','antagonists','cuff','tendons','achilles','muscleAttachments','muscleDemo','scapula','slow','fast'] as const;
type Movement = {id:string; joint?:string; progress?:number; playing?:boolean; motion?:boolean};
export function movementOptions<T extends Movement>(next:T, previous?:Movement):T {
 // No previous state can also mean returning from a card: keep its saved options.
 if(previous && (previous.id!==next.id || previous.joint!==next.joint))
  return {...next,...CLOSED_MOVEMENT_OPTIONS,motion:true,progress:0,playing:false};
 return {...CLOSED_MOVEMENT_OPTIONS,...next};
}
