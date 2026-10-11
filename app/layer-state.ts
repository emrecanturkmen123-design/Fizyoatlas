import type {SceneState,SystemId} from './anatomy';
// Enabling nerves also opens an unobstructed inspection mode. Keep the user's
// layer selection intact so it can be restored without a destructive preset.
export function toggleLayer(s:SceneState,id:SystemId):SceneState{
 const enable=!s.visible.includes(id);
 return {...s,spine:undefined,shoulder:undefined,elbow:undefined,knee:undefined,lower:undefined,attachments:undefined,selected:[],isolate:false,explode:0,rotate:false,
  visible:enable?[...s.visible,id]:s.visible.filter(x=>x!==id),
  highlightedSystem:id==='nervous'?(enable?'nervous':undefined):s.highlightedSystem,
 };
}
