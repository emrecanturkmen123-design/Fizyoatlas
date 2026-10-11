import {muscleFor,muscleKeyMatches} from './education-data';
import {nerveLessons} from './coverage';
import type {MuscleLesson} from './muscle-lessons';
import {Button} from '@/components/ui/button';
import {Disclosure} from './disclosure';
import type {Atlas} from './anatomy';
import {nerveParts,targetParts,type Nerve,type Side} from './innervation';
import type {NerveFocus} from './nerve-study';
export default function NerveCard({nerve,atlas,side,focus,onSide,onFind,onMuscle,onTargets,onNerve,onLesson}:{nerve:Nerve;atlas:Atlas;side:Side;focus?:NerveFocus;onSide?:(side:Side)=>void;onFind?:()=>void;onMuscle:(key:string)=>void;onTargets:()=>void;onNerve:()=>void;onLesson?:(lesson:MuscleLesson)=>void}){
 const meshes=nerveParts(atlas,nerve,side),targets=targetParts(atlas,nerve,side);
 const activeFocus=focus??(meshes.length?'nerve':'targets');
 return <section className="education-card">
  <span className="edu-tag">Motor innervasyon · {side==='left'?'Sol':side==='right'?'Sağ':'Her iki taraf'}</span>
  {onSide&&<label className="nerve-side">Gösterilen taraf<select aria-label="Sinir kartının tarafı" value={side??'both'} onChange={e=>onSide(e.target.value==='left'||e.target.value==='right'?e.target.value:undefined)}><option value="both">İki taraf</option><option value="right">Sağ</option><option value="left">Sol</option></select></label>}
  <p className="education-empty">{meshes.length?(activeFocus==='targets'?'Modelde bu sinirin seçili motor hedef kasları vurgulanıyor.':'Modelde sinirin kendisi vurgulanıyor.'):'Bu sinirin ayrı 3D çizimi kaynak modelde yok. Modelde sinirin kendisi yerine motor hedef kasları vurgulanıyor.'}</p>
  <div className="nerve-group-actions"><Button variant={activeFocus==='targets'?'default':'outline'} aria-pressed={activeFocus==='targets'} disabled={!targets.length} onClick={onTargets}>Kasları birlikte göster</Button>{meshes.length>0&&<Button variant={activeFocus==='nerve'?'default':'outline'} aria-pressed={activeFocus==='nerve'} onClick={onNerve}>Sinirin kendisini göster</Button>}</div>
  <h3>{nerve.indirect?'Dalları üzerinden ulaştığı kas örnekleri':'Seçili motor hedefler'}</h3>
  <div className="nerve-targets">{nerve.muscles.map(key=>{const available=targets.some(p=>muscleKeyMatches(p.name,key));return <Button key={key} variant="ghost" disabled={!available&&!muscleFor(key)} onClick={()=>onMuscle(key)}>{key}<span>{available?'İncele ↗':muscleFor(key)?'Kas kartı ↗':'Modelde yok'}</span></Button>})}</div>
  {nerve.note&&<p className="clinical-note">{nerve.note}</p>}
  {(onFind||onLesson&&nerveLessons(nerve).length>0)&&<Disclosure title="Bu sinirle çalış"><div className="card-secondary-actions">{onFind&&<Button variant="outline" onClick={onFind}>Sinir ve hedeflerini modelde sına</Button>}{onLesson&&nerveLessons(nerve).map(l=><Button key={l.lesson+l.id+('stop' in l?l.stop:'')} variant="outline" onClick={()=>onLesson(l)}>{l.label} → {l.lesson==='regional-course'?'Ders':'Oynatıcı'}</Button>)}</div></Disclosure>}
  <a href={nerve.source} target="_blank" rel="noreferrer">İnnervasyon kaynağı · UAMS ↗</a>
 </section>;
}
