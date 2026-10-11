import {useState} from 'react';
import type {SceneState} from './anatomy';
import {muscleFor} from './education-data';
import {interpretationKeys,motionMeaning} from './motion-interpretation';
import {Button} from '@/components/ui/button';
export default function MotionInterpretation({state,muscle,name,onMuscle}:{state:Partial<SceneState>;muscle?:string;name?:string;onMuscle?:(key:string)=>void}){
 const keys=interpretationKeys(state),[choice,setChoice]=useState(''),[side,setSide]=useState('right');
 const key=muscle??(keys.includes(choice)?choice:keys[0]);if(!key)return null;
 const meaning=motionMeaning(state,key,name??(state.gait?(side==='left'?'Left ':'Right '):'')+key);if(!meaning)return null;
 return <section className="motion-meaning" aria-label="Animasyon anındaki kas yorumu"><div className="motion-meaning-heading"><strong>Bu anda kasın rolü</strong><span>{meaning.phase} · {meaning.position}</span></div>
  {!muscle&&<div className="motion-meaning-fields"><label>Kas<select aria-label="Yorumlanacak kas" value={key} onChange={e=>setChoice(e.target.value)}>{keys.map(key=><option key={key} value={key}>{muscleFor(key)?.name??key}</option>)}</select></label>{state.gait&&<label>Taraf<select aria-label="Yorumlanacak yürüyüş tarafı" value={side} onChange={e=>setSide(e.target.value)}><option value="right">Sağ</option><option value="left">Sol</option></select></label>}</div>}
  <p>{meaning.body}</p><p className="motion-meaning-note">{meaning.note}</p>{!muscle&&onMuscle&&<Button variant="ghost" onClick={()=>onMuscle(key)}>Bu kası modelde incele →</Button>}
 </section>;
}
