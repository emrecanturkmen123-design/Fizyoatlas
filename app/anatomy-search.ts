export const SEARCH_RESULT_LIMIT=60;
import {tendonParts} from './tendon-model';
import {CLINICAL_STRUCTURES,clinicalStructure} from './clinical-structures';
import type {Atlas,Concept} from './anatomy';
import {MUSCLES,elementsFor} from './education-data';
import {MUSCLE_GROUPS} from './attachments';
import {NERVES,nerveParts} from './innervation';
export function normalizeSearch(s:string){return s.toLocaleLowerCase('tr').replaceAll('ı','i').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
export const ANATOMY_ALIASES:Record<string,string[]>={
 'posterior cruciate ligament':['arka çapraz bağ','açb','pcl'],'medial collateral ligament':['iç yan bağ','medial yan bağ','mcl'],'lateral collateral ligament':['dış yan bağ','lateral yan bağ','lcl'],'medial meniscus':['iç menisküs','medial menisküs'],'lateral meniscus':['dış menisküs','lateral menisküs'],
 'patellar ligament':['patellar tendon','patella tendonu','patella bağı','ligamentum patellae'],'anterior cruciate ligament':['ön çapraz bağ','öçb','acl'],'anterior talofibular ligament':['atfl','ön talofibular bağ'],'posterior talofibular ligament':['ptfl','arka talofibular bağ'],'calcaneofibular ligament':['cfl','kalkaneofibular bağ'],'calcaneal tendon':['aşil','achilles','aşil tendonu'],'tendon insertion surface':['tendon tutunması','insertio yüzeyi'],'infraspinatus tendon':['infraspinatus tendonu'],
 'scapula':['kürek kemiği','skapula'],clavicle:['köprücük kemiği','clavicula','klavikula'],humerus:['kol kemiği','üst kol kemiği'],radius:['radius','önkol kemiği'],ulna:['ulna','dirsek kemiği'],sternum:['göğüs kemiği','iman tahtası'],rib:['kaburga','costa'],vertebra:['omur','vertebra'],femur:['uyluk kemiği'],tibia:['kaval kemiği'],fibula:['kamış kemiği'],patella:['diz kapağı'],calcaneus:['topuk kemiği'],pelvis:['pelvis','leğen kemiği'],'hip bone':['kalça kemiği','os coxae'],skull:['kafatası','cranium'],mandible:['alt çene','mandibula'],heart:['kalp','cor'],lung:['akciğer','pulmo'],brain:['beyin','encephalon'],liver:['karaciğer','hepar'],kidney:['böbrek','ren'],'spinal cord':['omurilik','medulla spinalis'],
 'deltoid':['deltoid','deltoideus','omuz kası'],'biceps brachii':['biceps brachii','biseps','pazu'],'triceps brachii':['triceps brachii','triseps','arka kol'],'brachialis':['brachialis','brakiyalis'],'brachioradialis':['brachioradialis','brakiyoradialis'],'pronator teres':['pronator teres','pronatör teres'],'pronator quadratus':['pronator quadratus','pronatör kuadratus'],'supinator':['supinator','supinatör'],'anconeus':['anconeus','ankoneus'],'pectoralis major':['pectoralis major','pektoralis major','büyük göğüs kası'],'latissimus dorsi':['latissimus dorsi','latissimus','latissumus','latissumus dersi','geniş sırt kası','kanat kası'],'serratus anterior':['serratus anterior','serratus','ön dişli kas'],'supraspinatus':['supraspinatus','supraspinöz kas'],'infraspinatus':['infraspinatus','infraspinöz kas'],'subscapularis':['subscapularis','subskapularis'],'teres minor':['teres minor','küçük yuvarlak kas'],'teres major':['teres major','büyük yuvarlak kas'],'coracobrachialis':['coracobrachialis','korakobrakiyalis'],'gluteus medius':['gluteus medius','orta gluteal kas'],'rectus femoris':['rectus femoris','rektus femoris'],'tibialis anterior':['tibialis anterior','ön tibial kas'],'gastrocnemius':['gastrocnemius','gastroknemius','baldır kası'],
 'axillary nerve':['n axillaris','nervus axillaris','aksiller sinir'],'suprascapular nerve':['n suprascapularis','supraskapular sinir'],'long thoracic nerve':['n thoracicus longus','uzun torasik sinir'],'median nerve':['n medianus','median sinir'],'ulnar nerve':['n ulnaris','ulnar sinir'],'radial nerve':['n radialis','radial sinir'],'femoral nerve':['n femoralis','femoral sinir'],'tibial nerve':['n tibialis','tibial sinir'],'deep fibular nerve':['n fibularis profundus','derin fibular sinir','derin peroneal sinir'],
};
function labels(name:string){const lower=normalizeSearch(name);return [lower,...Object.entries(ANATOMY_ALIASES).filter(([key])=>new RegExp('\\b'+normalizeSearch(key)+'\\b').test(lower)).flatMap(([,aliases])=>aliases.map(normalizeSearch)),/\bleft\b/.test(lower)?'sol':'',/\bright\b/.test(lower)?'sag':''];}
export function buildSearchIndex(atlas:Atlas){const entries:{concept:Concept;text:string;terms:string[]}[]=[];const add=(concept:Concept,extra:string[]=[])=>{const terms=[...labels(concept.name),...extra.map(normalizeSearch)];entries.push({concept,text:terms.join(' '),terms});};
 for(const m of MUSCLES){const elements=elementsFor(atlas,[m.key]);add({id:'edu-'+m.key,name:m.name,elements},[m.key,m.tr,...labels(m.key)]);for(const side of ['left','right']){const ids=elements.filter(id=>atlas.parts.find(p=>p.id===id)?.name.toLowerCase().includes(side));if(ids.length)add({id:'edu-'+side+'-'+m.key,name:(side==='left'?'Left ':'Right ')+m.name,elements:ids},[m.tr,m.key,...labels(m.key)]);}}
 for(const [key,group] of Object.entries(MUSCLE_GROUPS))add({id:'edu-'+key,name:group.name,elements:elementsFor(atlas,group.keys)},[key,key==='quadriceps'?'kuadriseps':'hamstring']);
 for(const n of NERVES)add({id:'nerve:'+n.id,name:n.name,elements:nerveParts(atlas,n).map(p=>p.id)},n.aliases.flatMap(a=>[a,...labels(a)]));
 for(const c of atlas.concepts){const clinical=clinicalStructure(c.name);add(c,clinical?[clinical.name,...(clinical.aliases??[])]:[]);}
 for(const c of CLINICAL_STRUCTURES)add({id:'clinical-study:'+c.key,name:c.name,elements:(['right','left'] as const).flatMap(side=>tendonParts(atlas,c.key,side).map(p=>p.id))},[c.key,...labels(c.key),...(c.aliases??[])]);
 return entries;
}
export function querySearch(index:ReturnType<typeof buildSearchIndex>,query:string){
 const normalized=normalizeSearch(query),tokens=normalized.split(' ').filter(t=>t&&!['m','musculus','n','nervus'].includes(t));if(!tokens.length)return[];
 const words=(e:typeof index[number])=>e.text.split(' ');
 const score=(e:typeof index[number])=>{
  const exact=e.terms.includes(normalized)?0:tokens.every(t=>words(e).includes(t))?1:2;
  const side=/\b(left|right)\b/i.test(e.concept.name)&&!tokens.some(t=>t==='sag'||t==='sol')?1:0;
  const card=e.concept.id.startsWith('edu-')||e.concept.id.startsWith('nerve:')||e.concept.id.startsWith('clinical-study:')?0:1;
  return exact*100+side*10+card;
 };
 return index.filter(e=>tokens.every(t=>words(e).some(w=>w.startsWith(t)))).sort((a,b)=>score(a)-score(b)||a.concept.name.length-b.concept.name.length).slice(0,SEARCH_RESULT_LIMIT).map(e=>e.concept);
}
