import type {Atlas} from './anatomy';
export function achillesParts(atlas:Atlas,side:'right'|'left'){
 const same=(name:string)=>new RegExp(`\\b${side}\\b`,'i').test(name);
 return atlas.parts.filter(p=>same(p.name)&&(p.system==='connective'&&p.name.toLowerCase().endsWith('calcaneal tendon')||p.system==='muscular'&&/gastrocnemius|soleus/i.test(p.name)));
}
