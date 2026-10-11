import type {Part,Atlas} from './anatomy';
import {clinicalStructure} from './clinical-structures';
import {connectiveSelection} from './connective-study';
export function connectionTraceBones(atlas:Atlas,selected:Set<string>){
 const keys=new Set<string>();for(const p of atlas.parts)if(selected.has(p.id)&&p.system==='connective'){const key=p.clinicalKey??clinicalStructure(p.name)?.key;if(key)keys.add((/left/i.test(p.name)?'left':'right')+':'+key);}
 const ids=new Set<string>();for(const entry of keys){const split=entry.indexOf(':'),side=entry.slice(0,split) as 'left'|'right',key=entry.slice(split+1);for(const id of connectiveSelection(atlas,key,side).context)if(atlas.parts.find(p=>p.id===id)?.system==='skeletal')ids.add(id);}return ids;
}
export function connectionTraceRole(part:Part,selected:boolean,muscleContext:boolean,visibleBone:boolean){
 if(part.system==='skeletal'&&visibleBone)return 13;
 if(part.system==='connective'&&selected)return 12;
 if(part.system==='muscular'&&muscleContext)return 11;
 return 0;
}
