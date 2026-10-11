import {Button} from '@/components/ui/button';
import type {Atlas} from './anatomy';
import {nerveParts,type Nerve,type Side} from './innervation';
import type {NerveFocus} from './nerve-study';
export interface MuscleNervePreview{id:string;side:Side;focus:NerveFocus}
export default function MuscleNerveControls({atlas,nerves,value,onChange,onCard}:{atlas:Atlas;nerves:Nerve[];value?:MuscleNervePreview;onChange:(nerve:Nerve,side:Side,focus:NerveFocus)=>void;onCard:(nerve:Nerve,side:Side)=>void}){
 const nerve=nerves.find(n=>n.id===value?.id)??nerves[0];if(!nerve)return null;
 const side=value?value.side:'right',focus=value?.focus??'nerve',available=nerveParts(atlas,nerve,side).length>0;
 return <div className="muscle-inline-nerve">
  <div className="muscle-inline-nerve-heading">{nerves.length>1?<label>Sinir<select value={nerve.id} onChange={e=>onChange(nerves.find(n=>n.id===e.target.value)!,side,'nerve')}>{nerves.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select></label>:<strong>{nerve.name}</strong>}<label>Taraf<select aria-label="Sinir bağlantısının tarafı" value={side??'both'} onChange={e=>onChange(nerve,e.target.value==='both'?undefined:e.target.value as Side,focus)}><option value="right">Sağ</option><option value="left">Sol</option><option value="both">İki taraf</option></select></label></div>
  <div className="learning-options"><Button variant={focus==='nerve'?'default':'outline'} disabled={!available} aria-pressed={focus==='nerve'} onClick={()=>onChange(nerve,side,'nerve')}>Siniri göster</Button><Button variant={focus==='targets'?'default':'outline'} aria-pressed={focus==='targets'} onClick={()=>onChange(nerve,side,'targets')}>Motor hedefleri</Button></div>
  {!available&&<p>Bu sinirin ayrı kaynak yüzeyi yok; motor hedef kasları gösterilir.</p>}
  {nerve.note&&<p>{nerve.note}</p>}<p>Sinir ve kas ilişkisini referans anatomide incele.</p>
  <Button variant="ghost" onClick={()=>onCard(nerve,side)}>Sinir kartını ve hedef listesini aç →</Button>
 </div>;
}
