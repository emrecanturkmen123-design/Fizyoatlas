import {useEffect,useRef,useState} from 'react';
import {Disclosure} from './disclosure';
import {Switch} from '@/components/ui/switch';
import {Slider} from '@/components/ui/slider';
import {Button} from '@/components/ui/button';
import {LessonIntro} from './lesson-intro';
import {muscleFor} from './education-data';
import {GAIT_PHASES} from './gait-data';
import {gaitPhase,gaitContact,gaitSupport,GAIT_SAMPLES,type GaitState} from './gait-motion';

export default function GaitPanel({onChange,onMuscle,onClose,initialProgress=0}:{initialProgress?:number;onChange:(state:GaitState)=>void;onMuscle:(key:string)=>void;onClose:()=>void}){
 const [progress,setProgress]=useState(initialProgress),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1),[muscles,setMuscles]=useState(false),[plane,setPlane]=useState(false);
 const publish=useRef(onChange);publish.current=onChange;
 const current=useRef(initialProgress),transition=useRef<{from:number;to:number;start:number}|null>(null);
 const step=gaitPhase(progress),phase=GAIT_PHASES[step];
 useEffect(()=>publish.current({progress,playing,speed,muscles,plane}),[progress,playing,speed,muscles,plane]);
 useEffect(()=>{let frame=0,last=0;const tick=(now:number)=>{const dt=last?Math.min((now-last)/1000,.05):0;last=now;
  if(!document.hidden){if(transition.current){const tr=transition.current,t=Math.min(1,(now-tr.start)/650),e=t*t*(3-2*t);current.current=tr.from+(tr.to-tr.from)*e;if(t===1)transition.current=null;setProgress(current.current);}
   else if(playing){current.current=Math.min(100,current.current+dt*10*speed);setProgress(current.current);if(current.current===100)setPlaying(false);}}
  frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[playing,speed]);
 const go=(p:number)=>{setPlaying(false);if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){scrub(p);return;}transition.current={from:current.current,to:p,start:performance.now()};};
 const scrub=(p:number)=>{setPlaying(false);transition.current=null;current.current=p;setProgress(p);};
 const play=()=>{transition.current=null;if(current.current>=100){current.current=0;setProgress(0);}setPlaying(p=>!p);};
 return <section className="learning-panel glass" aria-label="Yürüyüş evreleri">
  <div className="panel-heading"><strong>Yürüyüş evreleri</strong><Button variant="ghost" onClick={onClose}>Kapat</Button></div>
  <LessonIntro lesson="gait"/>
  <p>Sağ ayağın ilk temasından bir sonraki temasına: sekiz poz ve aralarındaki hareket.</p>
  <div className="gait-overview" aria-label="Basma yaklaşık yüzde 60, salınım yüzde 40"><span>Basma ≈ %60</span><span>Salınım ≈ %40</span></div>
  <div className="gait-steps" aria-label="Evre seç">{GAIT_PHASES.map((p,i)=><Button key={p.en} aria-pressed={step===i} variant={step===i?'default':'outline'} onClick={()=>go(GAIT_SAMPLES[i])}>{i+1}. {p.name}</Button>)}</div>
  <div className="motion-controls">
   <label className="gait-progress-label">Döngü <output>%{Math.round(progress)}</output></label>
   <Slider aria-label="Yürüyüş döngüsü" min={0} max={100} step={1} value={[progress]} onValueChange={v=>scrub(Array.isArray(v)?v[0]:v)}/>
   <div className="learning-options"><Button variant="outline" disabled={progress<=0} onClick={()=>go(GAIT_SAMPLES[Math.max(0,step-1)])}>Önceki evre</Button><Button onClick={play}>{playing?'Duraklat':progress>=100?'Tekrar oynat':'Oynat'}</Button><Button variant="outline" disabled={progress>=100} onClick={()=>go(step===7?100:GAIT_SAMPLES[step+1])}>{step===7?'Yeni ilk temas':'Sonraki evre'}</Button><Button variant="ghost" onClick={()=>go(0)}>Başa dön</Button></div>
   <label className="gait-speed">Gösterim hızı <select aria-label="Yürüyüş gösterim hızı" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={.5}>0,5×</option><option value={1}>1×</option><option value={2}>2×</option></select></label>
  </div>
  <div className="gait-contact-status" aria-label="Ayak zemin teması"><strong>{gaitSupport(progress)}</strong><span><i className="gait-dot right"/>Sağ: {gaitContact(progress)}</span><span><i className="gait-dot left"/>Sol: {gaitContact(progress+50)}</span></div>
  <section aria-live="polite" aria-atomic="true"><p className="edu-tag">{step+1}/8 · {phase.period}</p><h2>{progress===100?'Yeni ilk temas':phase.name}</h2><p>{phase.en}</p><p>{phase.event}</p><p>{phase.action}</p></section>
  <Disclosure title="Kaslar ve hareket düzlemi">
   <label className="plane-toggle">İlgili kasları göster<Switch checked={muscles} onCheckedChange={setMuscles}/></label>
   <label className="plane-toggle">Sagittal düzlemi göster<Switch checked={plane} onCheckedChange={setPlane}/></label>
   <div className="case-list">{phase.keys.map(key=><Button key={key} variant="outline" onClick={()=>{setPlaying(false);onMuscle(key);}}>{muscleFor(key)?.name??key} → Kas kartı</Button>)}</div>
  </Disclosure>
  <p className="shoulder-note">Mavi halka sağ, sarı halka sol ayağın zemin temasını gösterir. Kas ve düzlem katmanlarını istersen açabilirsin. Hareket yavaşlatılmış, yaklaşık bir eğitim gösterimidir; kişiye özel yürüyüş analizi veya EMG ölçümü değildir. Evre sınırları ve kas katkıları yürüyüş hızına göre değişebilir.</p>
  <a href="https://now.aapmr.org/biomechanics-normal-gait/" target="_blank" rel="noreferrer">Yürüyüş biyomekaniği · AAPM&R ↗</a>
 </section>;
}
