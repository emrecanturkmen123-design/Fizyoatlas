import type {Atlas,Part,SceneState} from './anatomy';
export const SPINE_REGIONS=[
 {id:'cervical',name:'Servikal',range:'C1–C7 · boyun',color:'#54baff',note:'7 vertebra. C1 atlas, C2 axis olarak adlandırılır.'},
 {id:'thoracic',name:'Torakal',range:'T1–T12 · sırt',color:'#b394ff',note:'12 vertebra. Kaburgalarla eklemleşen göğüs bölgesi.'},
 {id:'lumbar',name:'Lomber',range:'L1–L5 · bel',color:'#62d8a1',note:'5 vertebra. Omurganın bel bölgesi.'},
 {id:'sacrum',name:'Sakrum',range:'S1–S5 · sakral bölge',color:'#ffc35c',note:'Erişkinde kaynaşmış 5 sakral vertebra; modelde tek kemik.'},
 {id:'coccyx',name:'Koksiks',range:'Kuyruk sokumu',color:'#ff7b91',note:'Sakrumun altında yer alır. Genellikle 4 segment; modelde tek kemik olarak gösterilir.'},
] as const;
export type SpineRegion=typeof SPINE_REGIONS[number]['id'];
export function spineRegion(p:Part):SpineRegion|undefined{if(p.system!=='skeletal'||/disk|disc/i.test(p.name))return;const n=p.name.toLowerCase();if(n==='atlas'||n==='axis'||n.includes('cervical vertebra'))return 'cervical';if(n.includes('thoracic vertebra'))return 'thoracic';if(n.includes('lumbar vertebra'))return 'lumbar';if(n==='sacrum')return 'sacrum';if(n==='coccyx')return 'coccyx';}
export function spineParts(atlas:Atlas,region?:SpineRegion){return atlas.parts.filter(p=>{const r=spineRegion(p);return r&&(!region||region===r);});}
export function spineState(s:SceneState,atlas:Atlas,region?:SpineRegion):SceneState{return {...s,spine:region??'all',lower:undefined,knee:undefined,elbow:undefined,shoulder:undefined,attachments:undefined,selected:spineParts(atlas,region).map(p=>p.id),hidden:[],visible:['skeletal'],highlightedSystem:undefined,isolate:false,explode:0,rotate:false,contextOpacity:.09,view:'back',reset:s.reset+1,focus:(s.focus??0)+1};}

const ORDINALS=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth'];
export function vertebraLabel(part:Part){
 const region=spineRegion(part);if(!region)return;
 const n=part.name.toLowerCase();
 if(region==='sacrum')return {code:'Sakrum',name:'S1–S5 · kaynaşmış sakral vertebralar'};
 if(region==='coccyx')return {code:'Koksiks',name:'Kuyruk sokumu · modelde tek kemik'};
 const level=n==='atlas'?1:n==='axis'?2:ORDINALS.indexOf(n.split(' ')[0])+1;if(!level)return;
 const prefix=region==='cervical'?'C':region==='thoracic'?'T':'L';
 const name=region==='cervical'?'servikal':region==='thoracic'?'torakal':'lomber';
 return {code:prefix+level,name:level+'. '+name+' omur'+(n==='atlas'?' · Atlas':n==='axis'?' · Axis':'')};
}
export function selectSpinePart(s:SceneState,part:Part,focus=false):SceneState{
 const region=spineRegion(part);if(!region)return s;
 return {...s,spine:region,selected:[part.id],contextOpacity:.18,focus:(s.focus??0)+(focus?1:0)};
}
