import {useId,type ReactNode} from 'react';
import {MapPin,Network} from 'lucide-react';
import {Disclosure} from './disclosure';
import {muscleFor} from './education-data';
import {muscleReview} from './muscle-review';
export type MuscleTool='attachments'|'nerve';
export interface MuscleTools {
 active?:MuscleTool;
 attachments?:ReactNode;
 nerve?:ReactNode;
 motion?:ReactNode;
 modelSources?:ReactNode;
 onTool:(tool:MuscleTool|undefined)=>void;
}
export default function MuscleInformation({muscle,tools,actions,sources,clinical}:{muscle:NonNullable<ReturnType<typeof muscleFor>>;tools:MuscleTools;actions?:ReactNode;sources:ReactNode;clinical?:ReactNode}){
 const review=muscleReview(muscle.key),id=useId();
 const toggle=(tool:MuscleTool)=>tools.onTool(tools.active===tool?undefined:tool);
 return <section className="education-card integrated-muscle-card" aria-label="Kas bilgileri">
  <dl>
   <div className="muscle-fact"><div className="muscle-fact-heading"><dt>Origo</dt>{tools.attachments&&<button type="button" className="muscle-inline-action" aria-expanded={tools.active==='attachments'} aria-controls={id+'-attachments'} onClick={()=>toggle('attachments')}><MapPin size={16}/>3D bağlantıları</button>}</div><dd>{muscle.origin}</dd></div>
   <div className="muscle-fact"><dt>Insertio</dt><dd>{muscle.insertion}</dd>{tools.active==='attachments'&&<div id={id+'-attachments'} className="muscle-inline-tool" aria-label="Kasın 3D tutunma araçları">{tools.attachments}</div>}</div>
   <div className="muscle-fact"><div className="muscle-fact-heading"><dt>İnnervasyon</dt>{tools.nerve&&<button type="button" className="muscle-inline-action" aria-expanded={tools.active==='nerve'} aria-controls={id+'-nerve'} onClick={()=>toggle('nerve')}><Network size={16}/>Sinir bağlantıları</button>}</div><dd>{muscle.nerve.replace(/ · [CLST]\d.*$/,'')} <span className="muscle-roots">· {review.roots}</span></dd>{tools.active==='nerve'&&<div id={id+'-nerve'} className="muscle-inline-tool" aria-label="Kasın sinir bağlantı araçları">{tools.nerve}</div>}</div>
   <div className="muscle-fact"><dt>Yaptırdığı hareketler</dt><dd>{muscle.action}</dd>{tools.motion&&<div className="muscle-inline-motion">{tools.motion}</div>}</div>
  </dl>
  {actions}
  <Disclosure title="Kaynaklar">{sources}{review.note&&<p className="clinical-note">{review.note}</p>}{clinical}{tools.modelSources}</Disclosure>
 </section>;
}
