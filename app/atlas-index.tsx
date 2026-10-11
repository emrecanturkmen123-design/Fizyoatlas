import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {MUSCLES,elementsFor} from './education-data';
import {MUSCLE_GROUPS} from './attachments';
import {NERVES,nerveParts,type Nerve} from './innervation';
import {CLINICAL_STRUCTURES,geometryLabel} from './clinical-structures';
import {muscleLessons} from './muscle-lessons';
import {STUDY_REGIONS,muscleRegion} from './study-map';
import type {Atlas} from './anatomy';
type Tab='muscles'|'nerves'|'connective';
export default function AtlasIndex({ready,atlas,selectedKey,activeTab,onTabChange,region:controlledRegion,onRegionChange,onStructure,onMuscle,onNerve,onSpine,onLab}:{onLab?:()=>void;ready:boolean;atlas?:Atlas;selectedKey?:string;activeTab?:Tab;onTabChange?:(tab:Tab)=>void;region?:string;onRegionChange?:(region:string)=>void;onStructure?:(key:string)=>void;onMuscle:(name:string,keys:string[])=>void;onNerve:(nerve:Nerve)=>void;onSpine:()=>void}){
 const listRef=useRef<HTMLDivElement>(null);useEffect(()=>{if(listRef.current?.clientHeight)listRef.current.querySelector<HTMLElement>('[aria-pressed=true]')?.scrollIntoView({block:'nearest'});},[selectedKey,activeTab,controlledRegion]);
 const [ownTab,setOwnTab]=useState<Tab>('muscles'),[ownRegion,setOwnRegion]=useState('all');
 const tab=activeTab??ownTab,region=controlledRegion??ownRegion;
 const setTab=(value:Tab)=>{setOwnTab(value);onTabChange?.(value);};
 const setRegion=(value:string)=>{setOwnRegion(value);onRegionChange?.(value);};
 const muscleList=MUSCLES.filter(m=>region==='all'||muscleRegion(m.key)===region).sort((a,b)=>a.name.localeCompare(b.name,'tr'));
 const nerveList=NERVES.filter(n=>region==='all'||n.muscles.some(k=>muscleRegion(k)===region));
 const structureList=CLINICAL_STRUCTURES.filter(x=>region==='all'||x.region===({shoulder:'Omuz',elbow:'Dirsek, önkol ve el',knee:'Diz',ankle:'Ayak bileği'} as Record<string,string>)[region]);
 const groupedStructures=['Omuz','Dirsek, önkol ve el','Diz','Ayak bileği'].map(region=>({region,groups:['Tendonlar','Bağlar','Menisküsler','Retinakulumlar','Tendon kılıfları'].map(label=>({label,items:structureList.filter(s=>s.region===region&&(s.kind.includes('kılıf')?'Tendon kılıfları':s.kind==='Retinakulum'?'Retinakulumlar':s.kind==='Bağ'?'Bağlar':s.kind==='Menisküs'?'Menisküsler':'Tendonlar')===label)})).filter(g=>g.items.length)})).filter(g=>g.groups.length);
 const total=tab==='muscles'?muscleList.length:tab==='nerves'?nerveList.length:structureList.length;
 return <section id="atlas-content" tabIndex={-1} className="study-panel glass" aria-label="Atlas yapıları">
  <div className="panel-heading"><strong>Atlas</strong><span className="quiet-count">{total} {tab==='muscles'?'kas':tab==='nerves'?'sinir':'yapı'}</span></div>
  <p className="study-intro">Yapıyı seç, bağlantılarını incele, ardından kendini sına.</p>
  <label className="atlas-region">Bölge<select aria-label="Atlas bölgesi" value={region} onChange={e=>setRegion(e.target.value)}>{Object.entries(STUDY_REGIONS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
  {onLab&&<Button variant="outline" onClick={onLab}>Karşılaştırma</Button>}
  <div className="index-tabs" aria-label="Yapı türü">{(['muscles','nerves','connective'] as Tab[]).map((id,i)=><Button key={id} variant={tab===id?'default':'ghost'} aria-label={id==='connective'?'Bağ, tendon, menisküs ve destek dokuları':undefined} aria-pressed={tab===id} onClick={()=>setTab(id)}>{['Kaslar','Sinirler','Bağ / tendon'][i]}</Button>)}</div>
  {(region==='all'||region==='spine')&&<Button className="spine-entry" variant="outline" disabled={!ready} onClick={onSpine}>Omurgayı incele <span aria-hidden="true">→</span></Button>}
  {tab==='connective'&&<p className="edu-footnote">Tendon kuvvet iletir; bağ stabiliteye katkı sağlar. Tutunma yüzeyi tam tendon değildir.</p>}
  {!total&&<p className="education-empty">Bu bölge ve yapı türünde henüz ayrıntılı kart yok. Diğer yapı türlerini veya tüm bölgeleri seçebilirsin.</p>}
  <div ref={listRef} className="study-list">{tab==='muscles'?<>
   {Object.entries(MUSCLE_GROUPS).filter(([,g])=>region==='all'||g.keys.some(k=>muscleRegion(k)===region)).map(([key,g])=><Button variant="ghost" key={key} disabled={!ready} aria-pressed={selectedKey===key} onClick={()=>onMuscle(g.name,g.keys)}><span>{g.name}<small>Kas grubu · birlikte incele</small></span><span aria-hidden="true">›</span></Button>)}
   {muscleList.map(m=><Button variant="ghost" key={m.key} disabled={!ready} aria-pressed={selectedKey===m.key} onClick={()=>onMuscle(m.name,[m.key])}><span>{m.name}<small>{m.tr.split(' · ')[0]}</small><small className="index-coverage">{atlas&&elementsFor(atlas,[m.key]).length?'3D · ':''}Bilgi kartı{muscleLessons(m.name).length?' · Hareket':''}</small></span><span aria-hidden="true">›</span></Button>)}
  </>:tab==='nerves'?nerveList.map(n=><Button variant="ghost" key={n.id} disabled={!ready} aria-pressed={selectedKey===n.id} onClick={()=>onNerve(n)}><span>{n.name}<small>{atlas&&nerveParts(atlas,n).length?'3D · ':''}Sinir kartı · motor hedefler</small></span><span aria-hidden="true">›</span></Button>) :groupedStructures.map(group=><section className="atlas-structure-group" key={group.region}><h3>{group.region==='Ayak bileği'?'Ayak bileği ve ayak':group.region}</h3>{group.groups.map(kind=><div key={kind.label}><h4>{kind.label}</h4>{kind.items.map(x=><Button variant="ghost" key={x.key} disabled={!ready||!onStructure} aria-pressed={selectedKey===x.key} title={geometryLabel(x)} onClick={()=>onStructure?.(x.key)}><span>{x.name}<small>{x.modelScope==='context'?'Kas referansı · ayrı tendon yok':x.kind}</small></span><span aria-hidden="true">›</span></Button>)}</div>)}</section>)}</div>
  <p className="atlas-scope">Listeler ayrıntılı eğitim kartlarını içerir. Diğer model yapıları arama ve katmanlardan incelenebilir.</p>
 </section>;
}
