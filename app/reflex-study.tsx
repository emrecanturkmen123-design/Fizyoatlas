import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Atlas } from './anatomy';
import ClinicalNavigation,{ClinicalLink} from './clinical-navigation';
import FindingProjection from './finding-projection';
import { reflexSource } from './neuro-drill-data';
import { workspaceHash } from './workspace-route';
import { ClinicalStudyPanel, SpotButtons, StudySplit, type StudySpot } from './clinical-study-layout';
import { Disclosure } from './disclosure';

export const reflexes=[
  {name:'Biseps',roots:'C5–C6',level:'C5',nerve:'musculocutaneous',area:'upper',where:'Dirsek önünde biseps tendonu',position:'Önkol destekli, dirsek hafif fleksiyonda ve gevşek. Tendon üzerinde duran parmak üzerinden uyar.',response:'Dirsek fleksiyonu'},
  {name:'Brakiyoradialis',roots:'C6 ağırlıklı',level:'C6',nerve:'radial',area:'upper',where:'Radius stiloid çıkıntısının biraz proksimali',position:'Dirsek fleksiyonda, önkol gevşek ve destekli.',response:'Dirsek fleksiyonu ve hafif supinasyon'},
  {name:'Triseps',roots:'C7 ağırlıklı',level:'C7',nerve:'radial',area:'upper',where:'Olekranonun hemen proksimalindeki triseps tendonu',position:'Üst kolu destekle ve dirseğin gevşek, fleksiyonda kalmasını sağla.',response:'Dirsek ekstansiyonu'},
  {name:'Patellar',roots:'L4 ağırlıklı',level:'L4',nerve:'femoral',area:'lower',where:'Patellanın hemen altında, patellar tendon üzerinde',position:'Kişi oturur. Diz fleksiyonda, alt bacak gevşek ve serbestçe sarkar.',response:'Diz ekstansiyonu'},
  {name:'Aşil',roots:'S1 ağırlıklı',level:'S1',nerve:'tibial',area:'lower',where:'Topuğun hemen proksimalindeki Aşil tendonu',position:'Ayağı destekleyip ayak bileğini hafif dorsifleksiyonda tut. Baldır gevşek kalsın.',response:'Ayak bileği plantar fleksiyonu'},
] as const;
const bounds=[0,0,360,220] as const;

const reflexArt:Record<string,{outline:string;detail:string;spots:readonly StudySpot[];point:string;direction:string}>={
  C5:{outline:'M37 41 Q103 89 136 101 Q151 108 169 100 L292 71 Q316 66 320 79 L308 101 Q300 109 280 103 L173 139 Q145 153 119 137 L31 87Z',detail:'M38 65 Q104 108 147 115 Q165 116 197 102 L297 87',spots:[{id:'arm',x:76,y:82},{id:'elbow',x:149,y:111},{id:'wrist',x:264,y:97}],point:'elbow',direction:'M245 66 Q235 41 210 33'},
  C6:{outline:'M31 69 Q90 79 128 90 Q153 96 169 97 L283 103 Q307 96 324 103 L332 123 Q321 139 289 135 L167 132 Q136 144 113 131 Q73 119 31 115Z',detail:'M53 90 Q109 111 153 114 L294 116',spots:[{id:'elbow',x:145,y:112},{id:'wrist',x:266,y:111},{id:'hand',x:310,y:120}],point:'wrist',direction:'M240 88 Q227 67 204 57'},
  C7:{outline:'M29 64 Q86 54 137 61 Q165 63 181 86 L234 154 Q251 160 264 175 L250 191 Q231 190 220 176 L158 119 Q129 110 104 111 L29 115Z',detail:'M29 85 Q104 78 149 87 Q172 96 199 130 L246 174',spots:[{id:'arm',x:80,y:76},{id:'elbow',x:146,y:84},{id:'wrist',x:226,y:156}],point:'elbow',direction:'M220 146 Q249 128 251 103'},
  L4:{outline:'M38 63 Q74 67 106 73 L167 86 Q195 91 200 115 L194 177 Q208 182 225 193 Q239 205 211 208 L170 205 Q157 201 159 184 L159 131 Q154 124 139 121 L37 111Z',detail:'M73 92 L168 107 L176 165 L178 192 M161 100 Q180 94 188 108',spots:[{id:'thigh',x:132,y:91},{id:'below',x:188,y:129},{id:'shin',x:181,y:171}],point:'below',direction:'M208 176 Q242 156 257 132'},
  S1:{outline:'M26 63 L179 64 Q213 66 224 87 L235 116 Q245 120 260 120 L285 115 Q303 113 306 125 L283 148 Q259 166 218 159 Q202 157 193 141 L176 112 L27 109Z',detail:'M49 84 L196 88 Q211 97 217 132 Q217 145 232 148 L283 129',spots:[{id:'calf',x:152,y:87},{id:'heel',x:204,y:132},{id:'foot',x:273,y:125}],point:'heel',direction:'M283 157 Q297 169 300 187'},
};

export function reflexPoint(level:string) {return reflexArt[level].point;}

export function ReflexDiagram({ level, selected, disabled, onPick }: {level:string;selected?:string;disabled?:boolean;onPick?:(id:string)=>void}) {
  const drawing=reflexArt[level];
  const target=drawing.spots.find(spot=>spot.id===drawing.point)!;
  const reveal=!onPick||!!selected;
  return <figure className="clinical-study-diagram">
    <div className="clinical-diagram-stage">
      <svg viewBox={bounds.join(' ')} role="img" aria-label={level==='L4'?'Oturur pozisyonda diz ve serbest alt bacak, yandan görünüm':'Refleks uygulamasının yandan görünümü'}>
        <path className="study-limb" d={drawing.outline}/>
        <path className="study-landmark" d={drawing.detail}/>
        {level==='L4'&&<path className="study-surface" d="M20 117 H149 M32 118 V207 M132 118 V207"/>}
        {reveal&&<>
          <circle className="study-target" cx={target.x} cy={target.y} r={11}/><circle className="study-target-dot" cx={target.x} cy={target.y} r={4}/>
          <path className="study-motion" d={drawing.direction}/>
        </>}
      </svg>
      {onPick&&<SpotButtons spots={drawing.spots} bounds={bounds} selected={selected} correct={reveal?target.id:undefined} disabled={disabled} onPick={onPick}/>}
    </div>
    <figcaption>{onPick&&!reveal?'Şemadaki üç işaretten birini seç.':reflexes.find(reflex=>reflex.level===level)?.where}</figcaption>
  </figure>;
}

export function ReflexStudy({ atlas, variant }: {atlas?:Atlas;variant?:string}) {
  const reflex=reflexes.find(item=>item.level===variant)??reflexes[3];
  const group=reflex.area;
  return <ClinicalStudyPanel title="Derin tendon refleksleri">
    <ClinicalNavigation active="reflexes" level={reflex.level}/>
    <div className="clinical-workbench-controls">
      <ClinicalLink route={{lesson:'reflexes',compare:'C5'}}>Üst ekstremite</ClinicalLink>
      <ClinicalLink route={{lesson:'reflexes',compare:'L4'}}>Alt ekstremite</ClinicalLink>
      <label>Refleks<select aria-label="Refleks" value={reflex.level} onChange={event=>{location.hash=workspaceHash({lesson:'reflexes',compare:event.target.value});}}>
        {reflexes.filter(item=>item.area===group).map(item=><option key={item.level} value={item.level}>{item.name}</option>)}
      </select></label>
    </div>
    <StudySplit visual={<>
      <ReflexDiagram key={reflex.level} level={reflex.level}/>
      {reflex.level==='L4'&&atlas&&<Disclosure title="Patellar tendonu anatomik modelde göster">
        <FindingProjection atlas={atlas} id="locate:patellar ligament:right" disabled reference/>
      </Disclosure>}
    </>}>
      <h3>{reflex.name} refleksi</h3>
      <dl className="clinical-study-facts"><div><dt>Uygulama noktası</dt><dd>{reflex.where}</dd></div><div><dt>Pozisyon</dt><dd>{reflex.position}</dd></div>
        <div><dt>Gözlenen yanıt</dt><dd>{reflex.response}</dd></div><div><dt>Sinir kökü</dt><dd>{reflex.roots}</dd></div>
      </dl>
      <Disclosure title="Sağ–sol derecelendirme örneği"><ReflexExample key={reflex.level}/></Disclosure>
      <div className="clinical-study-actions">
        <ClinicalLink route={{lesson:'clinical',clinicalMode:'myotomes',clinicalLevel:reflex.level}}>Miyotomu incele</ClinicalLink>
        <ClinicalLink route={{lesson:'study',nerve:reflex.nerve}}>Sinir kartını aç</ClinicalLink>
        {reflex.level==='L4'&&<ClinicalLink route={{lesson:'study',structure:'patellar ligament',side:'right',tab:'connective'}}>Tendonu 3D atlas içinde aç</ClinicalLink>}
        <ClinicalLink route={{lesson:'neuro-exam',compare:'reflex'}}>Refleks noktalarını çalış</ClinicalLink>
      </div>
      <a className="source-link" href={reflexSource} target="_blank" rel="noreferrer">MSD Manual · Refleks değerlendirmesi</a>
    </StudySplit>
  </ClinicalStudyPanel>;
}

function ReflexExample() {
  const [right,setRight]=useState('2+');
  const [left,setLeft]=useState('2+');
  return <fieldset className="assessment-fields">
    <legend>Kurgusal sağ–sol kayıt</legend>
    {([{label:'Sağ',value:right,set:setRight},{label:'Sol',value:left,set:setLeft}]).map(side=><label key={side.label}>{side.label}
      <select value={side.value} onChange={e=>side.set(e.target.value)}>{['0','1+','2+','3+','4+'].map(grade=><option key={grade}>{grade}</option>)}</select>
    </label>)}
    <p role="status">{right===left?'İki taraf aynı derecede kaydedildi.':'Kayıtta sağ–sol asimetrisi var.'} Refleks bulgusu duyu ve kas gücü ile birlikte yorumlanır.</p>
  </fieldset>;
}
