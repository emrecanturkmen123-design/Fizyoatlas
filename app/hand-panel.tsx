import MotionInterpretation from './motion-interpretation-view';
import {useEffect,useRef} from 'react';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {Disclosure} from './disclosure';
import {MotionControls} from './motion-controls';
import {HAND_MOVES,HAND_DIGIT_NAMES,HAND_SOURCE,HAND_INTRINSIC_SOURCE,type HandState,type HandMoveId,type HandDigit} from './hand-motion';
import {muscleFor} from './education-data';
export default function HandPanel({value,onChange,onMuscle,onClose,onAdvance}:{onAdvance:()=>void;value:HandState;onChange:(next:HandState)=>void;onMuscle:(key:string)=>void;onClose:()=>void}){
 const tick=useRef(onAdvance);tick.current=onAdvance;useEffect(()=>{if(!value.playing||!value.motion)return;const timer=setInterval(()=>{if(!document.hidden)tick.current();},60);return()=>clearInterval(timer);},[value.playing,value.motion]);
 const move=HAND_MOVES.find(m=>m.id===value.id)!;
 return <section className="shoulder-panel glass" aria-label="El ve parmak hareketleri"><div className="panel-heading"><h2>El ve parmaklar</h2><Button variant="ghost" onClick={onClose} aria-label="El hareketlerinden geri dön">← Geri</Button></div>
  <label className="motion-field">Hareket<select aria-label="El ve parmak hareketi" value={value.id} onChange={e=>onChange({...value,id:e.target.value as HandMoveId,progress:0,playing:false})}>{(['wrist','fingers','thumb'] as const).map(group=><optgroup key={group} label={{wrist:'El bileği',fingers:'II–V parmaklar',thumb:'Başparmak'}[group]}>{HAND_MOVES.filter(m=>m.group===group).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>)}</select></label>
  <div className="learning-options">{(['right','left'] as const).map(side=><Button key={side} variant={side===value.side?'default':'outline'} aria-pressed={side===value.side} onClick={()=>onChange({...value,side})}>{side==='right'?'Sağ':'Sol'}</Button>)}</div>
  {move.group==='fingers'&&<label className="motion-field">Parmak<select aria-label="İncelenen parmak" value={value.digit} onChange={e=>onChange({...value,digit:e.target.value as HandDigit|'all',progress:0,playing:false})}>{Object.entries(HAND_DIGIT_NAMES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>}
  <p className="shoulder-note">{move.description}</p><MotionControls label="El hareketinin konumu" progress={value.progress} playing={value.playing} onChange={next=>onChange({...value,...next})}/><MotionInterpretation state={{hand:value}} onMuscle={onMuscle}/>
  <label className="plane-toggle">Kaynak kaslar<Switch checked={!!value.anatomicalMuscles} onCheckedChange={anatomicalMuscles=>onChange({...value,anatomicalMuscles})}/></label>
  <Disclosure title="Görünüm seçenekleri"><label className="plane-toggle">Kaynak tendonlar<Switch checked={!!value.tendons} onCheckedChange={tendons=>onChange({...value,tendons})}/></label></Disclosure>
  <Disclosure title="Hareketle ilişkili kaslar"><p>Başlıca kaslardan örneklerdir.</p><div className="case-list">{move.keys.map(key=><Button key={key} variant="ghost" onClick={()=>onMuscle(key)}>{muscleFor(key)?.name??key} → Kas kartı</Button>)}</div></Disclosure>
  <Disclosure title="Kaynaklar ve gösterim"><p className="shoulder-note">Mevcut anatomik kemik, kas ve tendon yüzeyleri kullanılır. Bilek tek yaklaşık merkez çevresinde; parmaklar MCP, PIP ve DIP zinciriyle hareket eder. Kas ve tendon yüzeyleri ağırlıklı olarak deforme edilir. Opozisyon birleşik hareketin yaklaşık öğretim gösterimidir.</p><p className="shoulder-note">Açılar örnek öğretim aralığıdır. Normal hareket açıklığı, kas aktivasyonu, kuvvet ve tendon kayması ölçümü değildir.</p><a href={HAND_SOURCE} target="_blank" rel="noreferrer">Önkol ve el bileği · Texas Tech ↗</a><a href={HAND_INTRINSIC_SOURCE} target="_blank" rel="noreferrer">El kasları · UAMS ↗</a></Disclosure>
 </section>;
}
