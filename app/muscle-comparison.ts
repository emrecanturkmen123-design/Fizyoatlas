import type {Atlas} from './anatomy';
import {MUSCLES,elementsFor} from './education-data';
import {MUSCLE_GROUPS} from './attachments';
import {muscleRegion} from './study-map';
import {localStudyBones} from './model-study';
import {selectionPalette} from './selection-palette';
export const MUSCLE_COMPARISON_ITEMS=[
 ...Object.entries(MUSCLE_GROUPS).map(([key,g])=>({key:'muscle:'+key,name:g.name,keys:g.keys})),
 ...MUSCLES.map(m=>({key:'muscle:'+m.key,name:m.name,keys:[m.key]})),
];
export const MUSCLE_COMPARISON_PAIRS=[
 {id:'thigh-groups',label:'Quadriceps / Hamstring',left:'quadriceps',right:'hamstrings'},
 {id:'calf',label:'Gastrocnemius / Soleus',left:'gastrocnemius',right:'soleus'},
 {id:'elbow-flexors',label:'Biceps / Brachialis',left:'biceps brachii',right:'brachialis'},
 {id:'shoulder-abductors',label:'Supraspinatus / Deltoid',left:'supraspinatus',right:'deltoid'},
 {id:'gluteal',label:'Gluteus medius / Minimus',left:'gluteus medius',right:'gluteus minimus'},
 {id:'tibial',label:'Tibialis anterior / Posterior',left:'tibialis anterior',right:'tibialis posterior'},
];
export function muscleComparisonItem(key:string){return MUSCLE_COMPARISON_ITEMS.find(item=>item.key===key);}
export function suggestedMuscleComparison(key:string){
 const plain=key.replace(/^muscle:/,''),pair=MUSCLE_COMPARISON_PAIRS.find(p=>p.left===plain||p.right===plain);
 if(pair)return 'muscle:'+(pair.left===plain?pair.right:pair.left);
 const item=muscleComparisonItem(key),region=muscleRegion(item?.keys[0]??plain);
 return MUSCLE_COMPARISON_ITEMS.find(x=>x.key!==key&&muscleRegion(x.keys[0])===region)?.key??'muscle:quadriceps';
}
export function muscleComparisonSelection(atlas:Atlas,key:string,side:'right'|'left'){
 const item=muscleComparisonItem(key),selected=elementsFor(atlas,item?.keys??[]).filter(id=>new RegExp('\\b'+side+'\\b','i').test(atlas.parts.find(p=>p.id===id)!.name));
 return {selected,context:localStudyBones(atlas,atlas.parts.filter(p=>selected.includes(p.id)),side).map(p=>p.id)};
}
export function muscleComparisonPalette(atlas:Atlas,left:string[],right:string[]){
 return selectionPalette(atlas,{selected:[...left,...right],visible:['muscular','skeletal'],view:'front',explode:0,isolate:false,rotate:false,reset:0});
}
export function muscleComparisonFacts(key:string,field:'action'|'nerve'|'origin'|'insertion'){
 const item=muscleComparisonItem(key);
 return MUSCLES.filter(m=>item?.keys.includes(m.key)).map(m=>({key:m.key,name:m.name,text:m[field],source:m.source,additionalSource:'additionalSource'in m?m.additionalSource:undefined}));
}
