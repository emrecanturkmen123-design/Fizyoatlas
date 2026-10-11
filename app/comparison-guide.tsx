import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {comparisonGuide} from './comparison-guide-data';
export default function ComparisonGuide({left,right,onCamera}:{left:string;right:string;onCamera:()=>void}){
 const guide=comparisonGuide(left,right),[open,setOpen]=useState(false),[step,setStep]=useState(0),[revealed,setRevealed]=useState(false),[answers,setAnswers]=useState<Record<number,number>>({});if(!guide)return null;
 const question=guide.questions[step-1],complete=step>guide.questions.length,answered=answers[step]!==undefined;
 return <section className="comparison-guide" aria-label="Yönlendirmeli kas karşılaştırması">
  <div className="comparison-guide-heading"><div><h3>Yönlendirmeli karşılaştırma</h3><p>{guide.goal}</p></div><Button variant="outline" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?'Çalışmayı kapat':'Birlikte incele'}</Button></div>
  {open&&<div className="comparison-guide-content"><p className="comparison-guide-position">{complete?'Çalışma tamamlandı':`Adım ${step+1} / ${guide.questions.length+1} · ${step===0?'İncele':'Kendini sına'}`}</p>
   {complete?<><h4>Karşılaştırmayı tamamladın</h4><p>{Object.entries(answers).filter(([n,a])=>guide.questions[Number(n)-1]?.answer===a).length} / {guide.questions.length} soruyu ilk yanıtında doğru cevapladın.</p><p>{guide.observation}</p><Button variant="outline" onClick={()=>{setStep(0);setAnswers({});setRevealed(false);}}>Yeniden çalış</Button></>:step===0?<><p>{guide.task}</p><div className="learning-options"><Button variant="outline" onClick={onCamera}>Anatomik konumda incele</Button><Button variant="ghost" aria-expanded={revealed} onClick={()=>setRevealed(v=>!v)}>{revealed?'Açıklamayı gizle':'Açıklamayı gör'}</Button></div>{revealed&&<p className="comparison-guide-feedback">{guide.observation}</p>}</>:question?<><h4>{question.prompt}</h4><div className="comparison-guide-options">{question.options.map((option,i)=><Button variant={answers[step]===i?'default':'outline'} aria-pressed={answers[step]===i} disabled={answered} key={i} onClick={()=>setAnswers(a=>({...a,[step]:i}))}>{option}</Button>)}</div>{answered&&<div className="comparison-guide-feedback" role="status"><strong>{answers[step]===question.answer?'Doğru.':'Doğru yanıt: '+question.options[question.answer]}</strong><p>{question.explanation}</p></div>}</>:null}
   {!complete&&<div className="learning-options"><Button variant="ghost" disabled={step===0} onClick={()=>setStep(n=>n-1)}>Önceki adım</Button><Button disabled={step>0&&!answered} onClick={()=>setStep(n=>n+1)}>{step===guide.questions.length?'Bitir':'Sonraki adım'}</Button></div>}
   <div className="comparison-guide-sources">{guide.sources.map((url,i)=><a key={url} href={url} target="_blank" rel="noreferrer">Anatomi kaynağı {i+1} ↗</a>)}</div>
  </div>}
 </section>;
}
