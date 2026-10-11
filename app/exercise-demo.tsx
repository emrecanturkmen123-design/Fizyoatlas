import {useEffect,useId,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Disclosure} from './disclosure';
import {CASE_EXERCISES,type Exercise,type ExerciseKind} from './case-exercises';
type Point=[number,number];
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
function ExerciseDrawing({kind,t,cue}:{kind:ExerciseKind;t:number;cue:boolean}){
 const id=useId();const seg=(a:Point,b:Point,color='#176b86',width=10)=><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={width} strokeLinecap="round"/>;
 const joint=(p:Point)=><circle cx={p[0]} cy={p[1]} r="5" fill="#fff" stroke="#176b86" strokeWidth="2"/>;
 let drawing;
 if(kind==='external'){const e:Point=[210,130],angle=(-90+60*t)*Math.PI/180,hand:Point=[e[0]+62*Math.cos(angle),e[1]+62*Math.sin(angle)];drawing=<><ellipse cx="160" cy="157" rx="49" ry="29" fill="#d9e6ea"/><circle cx="160" cy="134" r="19" fill="#9db5bf"/>{seg([112,147],[106,100],'#9db5bf')}{seg([203,153],e)}{seg(e,hand)}{joint(e)}<path d="M211 64 Q254 69 274 97" stroke="#c67b34" fill="none" strokeWidth="2" markerEnd={`url(#${id})`}/><text x="160" y="219" textAnchor="middle">Üstten görünüş · dirsek sabit</text></>;}
 else if(kind==='wrist'){const wrist:Point=[218,132],a=(-40*t)*Math.PI/180,hand:Point=[218+61*Math.cos(a),132+61*Math.sin(a)];drawing=<><path d="M44 155H215V224" fill="none" stroke="#b8c6cd" strokeWidth="8"/>{seg([64,132],wrist,'#809da9',20)}{seg(wrist,hand,'#176b86',15)}{joint(wrist)}<text x="160" y="246" textAnchor="middle">Önkol destekli · avuç aşağı</text></>;}
 else if(kind==='glide'){drawing=<><path d="M128 232V182L106 153Q100 142 110 137L130 153V133H224V211Q210 237 184 240" fill="#d9e6ea" stroke="#809da9" strokeWidth="3"/>{[136,161,186,211].map((x,i)=>{const a:Point=[x,137],b:Point=[x,92-i%2*8],angle=(-90+100*t)*Math.PI/180,c:Point=[x+27*Math.cos(angle),b[1]+27*Math.sin(angle)],angle2=angle+85*t*Math.PI/180,d:Point=[c[0]+22*Math.cos(angle2),c[1]+22*Math.sin(angle2)];return <g key={x}>{seg(a,b)}{seg(b,c)}{seg(c,d)}{joint(b)}{joint(c)}</g>})}<text x="160" y="264" textAnchor="middle">Kanca · kök eklemler açık</text></>;}
 else{
 let head:Point=[150,49],shoulder:Point=[150,80],pelvis:Point=[150,151],knee:Point=[150,200],ankle:Point=[150,247],foot:Point=[175,247],otherKnee:Point=[135,200],otherAnkle:Point=[135,247],hand:Point=[217,128],elbow:Point=[181,111];
 if(kind==='heel'){const lift=18*t;head[1]-=lift;shoulder[1]-=lift;pelvis[1]-=lift;knee[1]-=lift;ankle[1]-=lift;otherKnee[1]-=lift;otherAnkle[1]-=lift;}
 if(kind==='sitstand'){pelvis=[lerp(122,169,t),lerp(171,140,t)];shoulder=[lerp(140,169,t),lerp(103,72,t)];head=[shoulder[0],shoulder[1]-29];knee=[178,lerp(177,194,t)];ankle=[175,248];otherKnee=[knee[0]-12,knee[1]+3];otherAnkle=[163,248];foot=[201,248];elbow=[shoulder[0]+16,shoulder[1]+32];hand=[knee[0]-3,knee[1]-6];}
 if(kind==='hip'){pelvis=[155,150];otherKnee=[141,200];otherAnkle=[141,248];knee=[169+24*t,198-5*t];ankle=[174+47*t,247-16*t];foot=[ankle[0]+15,ankle[1]];hand=[99,129];elbow=[119,109];}
 if(kind==='walk'){pelvis=[145+15*t,151];head=[pelvis[0],49];shoulder=[pelvis[0],80];knee=[150+27*t,198];ankle=[145+54*t,247-9*Math.sin(Math.PI*t)];foot=[ankle[0]+20,ankle[1]];otherKnee=[140-8*t,201];otherAnkle=[134-11*t,247];elbow=[176-15*t,111];hand=[181-36*t,142];}
 if(kind==='elbow'){elbow=[170,135];const a=(90-110*t)*Math.PI/180;hand=[elbow[0]+52*Math.cos(a),elbow[1]+52*Math.sin(a)];}
 if(kind==='knee-flexion'){const a=(90+75*t)*Math.PI/180;ankle=[knee[0]+47*Math.cos(a),knee[1]+47*Math.sin(a)];foot=[ankle[0]+24*Math.sin(a),ankle[1]-24*Math.cos(a)];}
 drawing=<><line x1="50" y1="251" x2="282" y2="251" stroke="#b8c6cd" strokeWidth="2"/>{kind==='sitstand'&&<path d="M85 131V186H139M90 186V248M132 186V248" stroke="#a8b9c2" strokeWidth="7" fill="none"/>}{['heel','hip','knee-flexion'].includes(kind)&&<path d={kind!=='hip'?'M217 125H275M252 125V247':'M60 126H105M72 126V247'} stroke="#a8b9c2" strokeWidth="7" fill="none"/>}{cue&&[115,165,215,265].map(x=><line key={x} x1={x} x2={x+13} y1="257" y2="257" stroke="#c67b34" strokeWidth="4"/>)}{seg(pelvis,otherKnee,'#a8bdc6')}{seg(otherKnee,otherAnkle,'#a8bdc6')}{seg(otherAnkle,[otherAnkle[0]+23,251],'#a8bdc6')}<circle cx={head[0]} cy={head[1]} r="18" fill="#809da9"/>{seg(shoulder,pelvis,'#809da9',19)}{seg(shoulder,elbow,'#809da9',8)}{seg(elbow,hand,'#809da9',8)}{seg(pelvis,knee)}{seg(knee,ankle)}{seg(ankle,foot)}{joint(pelvis)}{joint(knee)}{joint(ankle)}</>;
 }
 return <svg viewBox="0 0 330 280" role="img" aria-label="Egzersizin seçili aşamasını gösteren hareket şeması"><defs><marker id={id} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#c67b34"/></marker></defs>{drawing}</svg>;
}
export default function ExerciseDemo({caseId,onMotion}:{caseId:string;onMotion?:(exercise:Exercise,t:number)=>void}){
 const ex=CASE_EXERCISES[caseId];const [phase,setPhase]=useState(0),[playing,setPlaying]=useState(false),[model,setModel]=useState(false),[time,setTime]=useState(0);
 useEffect(()=>{setPhase(0);setPlaying(false);setTime(0);setModel(false);},[caseId]);
 useEffect(()=>{if(!playing)return;const id=window.setInterval(()=>setTime(v=>Math.min(v+1,100)),50);return()=>window.clearInterval(id);},[playing]);
 useEffect(()=>{if(time===100)setPlaying(false);if(playing)setPhase(time<20?0:time<60?1:2);},[time,playing]);
 const t=playing||time>0?(time<20?0:time<60?(time-20)/40:(100-time)/40):phase===1?1:0;
 useEffect(()=>{if(model&&ex)onMotion?.(ex,t);},[model,t,ex]);
 if(!ex)return null;
 function step(i:number){setPlaying(false);setTime(0);setPhase(i);}
 return <section className="exercise-demo" aria-label="Egzersiz gösterimi"><p className="study-scope">Egzersiz örneği · hareket öğretimi</p><h3>{ex.title}</h3><div className="exercise-visual"><ExerciseDrawing kind={ex.kind} t={t} cue={caseId==='parkinson'}/><span>Hareket şeması · ölçüm değildir</span></div><div className="exercise-steps" aria-label="Egzersiz aşamaları">{['Hazırlık','Hareket','Dönüş'].map((x,i)=><Button key={x} variant={phase===i?'default':'outline'} aria-pressed={phase===i} onClick={()=>step(i)}>{i+1}. {x}</Button>)}</div><p role="status">{ex.steps[phase]}</p><div className="learning-options"><Button variant="outline" onClick={()=>{if(playing)setPlaying(false);else{setTime(0);setPhase(0);setPlaying(true);}}}>{playing?'Duraklat':'Bir tekrar oynat'}</Button><Button variant="ghost" onClick={()=>step(0)}>Başa dön</Button>{ex.motion&&onMotion&&<Button variant="outline" aria-pressed={model} onClick={()=>{setModel(true);onMotion(ex,t);}}>Hareket bileşenini 3D göster</Button>}</div><p className="practice-note">{ex.note}</p><Disclosure title="Kalite, kolaylaştırma ve ilerleme"><p><strong>Kontrol:</strong> {ex.quality}</p><p><strong>Kolaylaştır:</strong> {ex.regress}</p><p><strong>İlerlet:</strong> {ex.progress}</p><p>Doz ve uygunluk kişinin muayenesi, semptom yanıtı ve varsa cerrahi kısıtlamalara göre belirlenir.</p><a href={ex.source} target="_blank" rel="noreferrer">Egzersiz / rehabilitasyon kaynağı ↗</a></Disclosure></section>;
}
