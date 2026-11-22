import { useId,useState } from 'react';
import { Button } from '@/components/ui/button';

const pivot={x:171,y:80};
function at(degrees:number,radius:number){
  const phi=degrees*Math.PI/180;
  return {x:pivot.x+Math.cos(phi)*radius,y:pivot.y+Math.sin(phi)*radius};
}
const landmarks=[
  {id:'axis',label:'Eksen',detail:'Lateral femoral epikondil, dizin dış yanındaki kemik referansı.'},
  {id:'fixed',label:'Sabit kol',detail:'Femur boyunca büyük trokantere doğru hizalanır.'},
  {id:'moving',label:'Hareketli kol',detail:'Bacağın dış yanında lateral malleole doğru hizalanır.'},
] as const;
const ticks=[0,15,30,45,60,75,90,105,120,135,150];

export function KneeGoniometer(){
  const id=useId();
  const [angle,setAngle]=useState(60);
  const [focus,setFocus]=useState<(typeof landmarks)[number]['id']>('axis');
  const ankle=at(angle,108);
  const end=at(angle,45);
  return <figure className="clinical-study-diagram clinical-measure-graphic">
    <svg viewBox="0 0 360 225" role="img" aria-label={`Yandan diz gonyometresi, gösterilen fleksiyon açısı ${angle} derece`}>
      <path className="study-surface" d="M27 106 H140"/>
      <path className="study-limb-line" d="M50 80 H171"/>
      <g transform={`rotate(${angle} ${pivot.x} ${pivot.y})`}>
        <path className="study-limb-line" d="M171 80 H279 M279 80 L292 53"/>
      </g>
      <path className="study-protractor" d="M259 80 A88 88 0 0 1 95 124"/>
      {ticks.map(value=>{
        const major=value%30===0;
        const tick=at(value,88),inner=at(value,major?80:83),label=at(value,101);
        return <g key={value}><line className="study-landmark" x1={tick.x} y1={tick.y} x2={inner.x} y2={inner.y}/>
          {major&&<text x={label.x} y={label.y+4} textAnchor="middle">{value}°</text>}</g>;
      })}
      <path className="study-baseline" d="M171 80 H279"/>
      {angle>0&&<path className="study-angle" d={`M216 80 A45 45 0 0 1 ${end.x} ${end.y}`}/>}
      <line className="study-goniometer-arm" data-active={focus==='fixed'} x1="50" y1="80" x2={pivot.x} y2={pivot.y}/>
      <line className="study-goniometer-arm" data-active={focus==='moving'} x1={pivot.x} y1={pivot.y} x2={ankle.x} y2={ankle.y}/>
      <circle className={focus==='axis'?'study-target-dot':'study-target'} cx={pivot.x} cy={pivot.y} r="6"/>
    </svg>
    <figcaption>Diz fleksiyonu · Eğitim şeması</figcaption>
    <div className="clinical-angle-controls">
      <label htmlFor={id}>Diz fleksiyon açısı <output htmlFor={id}>{angle}°</output></label>
      <input id={id} type="range" min="0" max="150" value={angle} onChange={event=>setAngle(Number(event.target.value))}/>
      <div className="clinical-study-actions">{landmarks.map(item=><Button key={item.id} variant={focus===item.id?'default':'outline'} aria-pressed={focus===item.id}
        onClick={()=>setFocus(item.id)}>{item.label}</Button>)}</div>
      <p>{landmarks.find(item=>item.id===focus)?.detail}</p>
    </div>
  </figure>;
}

const stages={
  tug:['Sandalyeden kalk','3 m işarete yürü','Dön ve geri yürü','Sandalyeye otur'],
  sts:['Başlangıçta otur','Tam ayağa kalk','Tekrar otur','Beşinci oturuşta bitir'],
  mmt:['Önkolu destekle','El bileği ekstansiyonunu gözle','El sırtına kontrollü direnç uygula'],
} as const;
const measures=['mmt','tug','sts'] as const;

export function MeasureDiagram({kind}:{kind:string}){
  const [index,setIndex]=useState(0);
  const mode=measures.find(item=>item===kind)??'mmt';
  const labels=stages[mode];
  const tugPosition=[78,219,166,78][index];
  const sitting=mode==='sts'?index!==1:index===0||index===3;
  const x=mode==='tug'?tugPosition:144;
  return <figure className="clinical-study-diagram">
    <svg viewBox="0 0 360 220" role="img" aria-label={labels[index]}>
      {mode==='mmt'?<>
        <path className="study-surface" d="M37 126 H205 V202"/>
        <path className="study-limb-line" d="M56 105 H207"/>
        <path className="study-limb-line" d={index===0?'M207 105 H270':'M207 105 L265 78'}/>
        <circle className="study-target" cx="207" cy="105" r="7"/>
        {index===2&&<path className="study-motion" d="M255 43 V70 M245 60 L255 70 L265 60"/>}
      </>:<>
        <path className="study-surface" d={mode==='tug'?'M37 94 V133 H95 M47 133 V174 M88 133 V174 M29 176 H328':'M96 94 V133 H158 M103 133 V175 M151 133 V175 M72 176 H285'}/>
        {mode==='tug'&&<><path className="study-baseline" d="M280 133 V176"/><text x="280" y="197" textAnchor="middle">3 m işaret</text></>}
        <circle className="study-target" cx={x} cy={sitting?72:46} r="13"/>
        <path className="study-limb-line study-person" d={sitting?`M${x} 90 v40 h31 v44 h12 M${x} 95 l29 20 h17`:
          mode==='tug'?`M${x} 66 v63 l26 44 h10 M${x} 129 l-18 44 M${x} 81 l26 25 M${x} 81 l-16 29`:
            `M${x} 66 v65 l-6 42 h14 M${x} 130 l14 42 M${x} 83 l26 19`}/>
        {mode==='tug'&&(index===1||index===2)&&<path className="study-motion" d={index===1?'M151 59 H260 M247 49 L260 59 L247 69':'M258 59 H116 M129 49 L116 59 L129 69'}/>}
      </>}
    </svg>
    <figcaption>{labels[index]}</figcaption>
    <div className="clinical-study-actions">
      <Button variant="outline" disabled={index===0} onClick={()=>setIndex(index-1)}>Önceki adım</Button>
      <Button variant="outline" disabled={index===labels.length-1} onClick={()=>setIndex(index+1)}>Sonraki adım</Button>
    </div>
  </figure>;
}
