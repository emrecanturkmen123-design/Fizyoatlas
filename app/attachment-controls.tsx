import {Button} from '@/components/ui/button';
import type {Atlas} from './anatomy';
import {ATTACHMENTS,attachmentTargets,type AttachmentState} from './attachments';
import {clinicalStructure} from './clinical-structures';
export default function AttachmentControls({atlas,muscleKey,value,side,onChange}:{atlas:Atlas;muscleKey:string;value?:AttachmentState;side:'left'|'right';onChange:(v:AttachmentState|undefined)=>void}){
 const cfg=ATTACHMENTS[muscleKey];if(!cfg)return null;
 const connective=!!clinicalStructure(muscleKey),hasOrigin=cfg.origin.length>0,hasInsertion=cfg.insertion.length>0;
 const active=value?.key===muscleKey;
 const current:AttachmentState=active?value!:{key:muscleKey,side,mode:hasOrigin&&hasInsertion?'both':hasOrigin?'origin':'insertion'};
 const originLabel=connective?'Proksimal bağlantı':'Origo',insertionLabel=connective?'Distal bağlantı':'Insertio';
 return <section className="attachment-controls"><h3>{connective?'Tendonun kemik bağlantısı · 3D':'Origo ve insertio · 3D'}</h3>
  <p>{hasOrigin&&<>Mor <b>O</b>: {originLabel.toLowerCase()}</>}{hasOrigin&&hasInsertion&&' · '}{hasInsertion&&<>Sarı <b>İ</b>: {insertionLabel.toLowerCase()}</>}</p>
  <div className="attachment-buttons">{(['right','left'] as const).map(side=><Button key={side} aria-pressed={active&&current.side===side} variant={active&&current.side===side?'default':'outline'} onClick={()=>onChange({...current,side})}>{side==='right'?'Sağ':'Sol'}</Button>)}<Button variant="outline" onClick={()=>onChange(active?undefined:current)}>{active?'İşaretleri kapat':'Tutunma bölgelerini göster'}</Button></div>
  {active&&<><div className="attachment-buttons">{([['both','İkisi'],['origin',originLabel],['insertion',insertionLabel]] as const).filter(([mode])=>mode==='both'?hasOrigin&&hasInsertion:mode==='origin'?hasOrigin:hasInsertion).map(([mode,label])=><Button key={mode} aria-pressed={current.mode===mode} variant={current.mode===mode?'default':'outline'} onClick={()=>onChange({...current,mode})}>{label}</Button>)}</div><ul>{attachmentTargets(atlas,current).map(t=><li key={t.id}><b className={t.kind}>{t.id}</b> {t.label}</li>)}</ul></>}
  <p className="attachment-note">Yaklaşık bölge işaretleri; kesin tutunma noktası veya tendon sınırı değildir. İşaretler örtülmemesi için önde çizilir. Kemiği döndürerek konumu incele.</p>{cfg.note&&<p className="attachment-note">{cfg.note}</p>}</section>;
}
