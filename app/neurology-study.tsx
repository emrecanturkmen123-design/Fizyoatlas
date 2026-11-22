import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Atlas } from './anatomy';
import { ClinicalLink } from './clinical-navigation';
import { StudySplit } from './clinical-study-layout';
import { footDropSource, upperLimbSource } from './clinical-learning-questions';
import { Disclosure } from './disclosure';
import FindingProjection from './finding-projection';
import { findingScene } from './model-finding';
import { SensoryDiagram } from './neuro-practice';
import type { WorkspaceRoute } from './workspace-route';

export const neuroPair=(value?:string)=>value==='c8-t1'?'c8-t1':'l5-fibular';

type Finding={
  label:string;root:string;nerve:string;target:string;key?:string;area?:'foot'|'forearm'|'hand';
};

const lower:Finding[]=[
  {label:'İnversiyon',root:'Tibialis posterior zayıf olabilir.',nerve:'Tibialis posterior genellikle korunur.',key:'muscle:tibialis posterior',target:'M. tibialis posterior'},
  {label:'Kalça abdüksiyonu',root:'Gluteus medius zayıflayabilir.',nerve:'Gluteus medius genellikle korunur.',key:'muscle:gluteus medius',target:'M. gluteus medius'},
  {label:'Dorsifleksiyon ve başparmak ekstansiyonu',root:'Zayıflayabilir.',nerve:'Zayıflayabilir.',key:'muscle:extensor hallucis longus',target:'M. extensor hallucis longus'},
  {label:'Eversiyon',root:'Zayıflayabilir.',nerve:'Yüzeyel fibular liflerin etkilenmesiyle zayıflayabilir.',key:'muscle:fibularis longus',target:'M. fibularis longus'},
  {label:'Ayak sırtı duyusu',root:'Duyu değişikliği görülebilir.',nerve:'Duyu değişikliği görülebilir. Dağılım tutulan dala göre değişebilir.',area:'foot',target:'L5 anahtar duyu noktası'},
];

const upper:Finding[]=[
  {label:'Medial önkol duyusu',root:'Etkilenebilir.',nerve:'Genellikle korunur.',area:'forearm',target:'Medial önkol'},
  {label:'Başparmak palmar abdüksiyonu',root:'Median sinirle uyarılan bu kas zayıflayabilir.',nerve:'İzole ulnar nöropatide genellikle korunur.',key:'muscle:abductor pollicis brevis',target:'M. abductor pollicis brevis'},
  {label:'Küçük ve yüzük parmağı duyusu',root:'Duyu değişikliği görülebilir.',nerve:'Küçük parmak ve yüzük parmağının ulnar yarısı etkilenebilir.',area:'hand',target:'C8 anahtar duyu noktası'},
  {label:'İnterosseöz kasların kuvveti',root:'Zayıflayabilir.',nerve:'Zayıflayabilir.',key:'nerve:ulnar',target:'N. ulnaris'},
];
const comparisonFor=(pair:string)=>pair==='c8-t1'?upper:lower;

export default function NeurologyComparison({ atlas, pair, onPair }: {atlas:Atlas;pair:string;onPair:(pair:string)=>void}) {
  return <ComparisonFinding key={pair} atlas={atlas} pair={pair} onPair={onPair}/>;
}

function ComparisonFinding({ atlas, pair, onPair }: {atlas:Atlas;pair:string;onPair:(pair:string)=>void}){
  const [index,setIndex]=useState(0);
  const rows=comparisonFor(pair);
  const finding=rows[index];
  const isUpper=pair==='c8-t1';
  const names=isUpper?['C8–T1 kökleri','Dirsekte ulnar sinir']:['L5 kökü','Ortak fibular sinir'];
  const level=isUpper?'C8':'L5';
  const targetId=finding.key?`locate:${finding.key}:right`:undefined;
  const scene=targetId?findingScene(atlas,targetId):undefined;
  const anatomyRoute:WorkspaceRoute|undefined=finding.key?.startsWith('muscle:')?{lesson:'study',muscle:finding.key.slice(7),side:'right'}:
    finding.key?.startsWith('nerve:')?{lesson:'study',nerve:finding.key.slice(6),side:'right'}:undefined;

  const visual=scene&&targetId?<figure className="clinical-study-diagram">
    <FindingProjection key={targetId} atlas={atlas} id={targetId} disabled reference/>
    <figcaption>{finding.target}</figcaption>
  </figure>:finding.area==='foot'||finding.area==='hand'?<SensoryDiagram upper={finding.area==='hand'} marked={level}/>:
    finding.area==='forearm'?<figure className="clinical-study-diagram">
      <svg viewBox="0 0 360 220" role="img" aria-label="Medial önkol duyu bölgesi">
        <path className="study-limb" d="M26 69 Q76 69 118 79 L163 76 Q202 76 258 99 L281 102 Q295 97 308 100 L337 114 Q345 121 339 129 Q326 143 301 139 L257 132 Q205 129 159 126 Q127 129 105 119 L25 113Z"/>
        <path className="study-area" d="M126 99 Q141 99 157 101 Q199 101 243 115 L257 129 Q206 126 159 123 Q141 123 126 116Z"/>
      </svg>
      <figcaption>Medial önkol · Şematik duyu alanı</figcaption>
    </figure>:<p>Bu yapının kaynağını atlas kartından incele.</p>;
  return <section className="clinical-neuro-comparison" aria-label="Klinik ayrım">
    <div className="clinical-workbench-controls">
      <label>Klinik çift<select value={pair} onChange={event=>onPair(event.target.value)}>
        <option value="l5-fibular">L5 kökü / Fibular sinir</option>
        <option value="c8-t1">C8–T1 kökleri / Ulnar sinir</option>
      </select></label>
      <label>Muayene bulgusu<select value={index} onChange={event=>setIndex(Number(event.target.value))}>
        {rows.map((row,i)=><option key={row.label} value={i}>{row.label}</option>)}
      </select></label>
    </div>
    <h3>{finding.label}</h3>
    <StudySplit visual={visual}>
      <dl className="clinical-study-facts clinical-compare-cards"><div><dt>{names[0]}</dt><dd>{finding.root}</dd></div><div><dt>{names[1]}</dt><dd>{finding.nerve}</dd></div></dl>
      <p>Motor ve duyu bulgularını öyküyle birlikte yorumla.</p>
      <div className="clinical-study-actions">
        {anatomyRoute&&<ClinicalLink route={anatomyRoute}>Atlas kartını aç</ClinicalLink>}
        <ClinicalLink route={{lesson:'clinical',clinicalMode:finding.area?'dermatomes':'myotomes',clinicalLevel:level}}>İlgili kökü incele</ClinicalLink>
        <ClinicalLink route={{lesson:'study',nerve:isUpper?'ulnar':'common-fibular'}}>Sinir kartını aç</ClinicalLink>
        <ClinicalLink route={{lesson:'cases',caseId:isUpper?'ulnar-hand':'foot-drop'}}>İlgili vakayı çöz</ClinicalLink>
      </div>
    </StudySplit>
    <Disclosure title="Tüm muayene bulguları">
      <dl className="clinical-compare-list">{rows.map(row=><div key={row.label}><dt>{row.label}</dt><dd>
        <span><strong>{names[0]}</strong> {row.root}</span><span><strong>{names[1]}</strong> {row.nerve}</span>
      </dd></div>)}</dl>
    </Disclosure>
    <a className="source-link" href={isUpper?upperLimbSource:footDropSource} target="_blank" rel="noreferrer">Klinik kaynak</a>
  </section>;
}
