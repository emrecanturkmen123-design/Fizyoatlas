import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { Atlas } from './anatomy';
import ClinicalNavigation, { ClinicalLink } from './clinical-navigation';
import FindingProjection from './finding-projection';
import { findingChoice, findingScene } from './model-finding';
import { motorChecks, motorQuestionId, stationQuestionId, stations, upperLimbSource } from './clinical-learning-questions';
import type { LearningController } from './use-learning';
import type { WorkspaceRoute } from './workspace-route';

export function ClinicalStudyPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section id="atlas-content" tabIndex={-1} className="case-panel case-reading glass neuro-study" aria-label={title}>
    <h2>{title}</h2>
    {children}
  </section>;
}

function PracticeSaveStatus({ learning }: { learning:LearningController }) {
  if (!learning.error) return null;
  return <p role="alert">{learning.error} <Button onClick={()=>void learning.retry()} disabled={learning.pending}>Kaydı yeniden dene</Button></p>;
}

type PracticePrompt = { prompt:string; options:string[]; answer:string; explanation:string };
function PracticeQuestion({ question, choice, choose, disabled }: {
  question:PracticePrompt; choice:string; choose:(choice:string)=>void; disabled:boolean;
}) {
  return <section className="neuro-question">
    <h3>{question.prompt}</h3>
    <div className="clinical-reference-views">{question.options.map(option=>
      <Button variant="outline" key={option} aria-pressed={choice===option} disabled={disabled||!!choice} onClick={()=>choose(option)}>{option}</Button>)}</div>
    {choice&&<p role="status"><strong>{choice===question.answer?'Doğru.':'Doğru yanıt · '+question.answer}</strong> {question.explanation}</p>}
  </section>;
}

export function Osce({ atlas, variant, learning }: { atlas:Atlas; variant?:string; learning:LearningController }) {
  const station=stations.find(s=>s.id===variant);
  return <ClinicalStudyPanel title={station?.title??'Uygulama sınavı'}>
    {station?<Station key={station.id} station={station} atlas={atlas} learning={learning}/>:<>
      <p>Bir istasyon seç. Modelde yapıyı bul, muayeneyi planla ve bulguyu yorumla.</p>
      <div className="lesson-links">{stations.map(s=><ClinicalLink key={s.id} route={{lesson:'osce',compare:s.id}}>{s.title}</ClinicalLink>)}</div>
    </>}
  </ClinicalStudyPanel>;
}

function Station({ atlas, station, learning }: { atlas:Atlas; station:typeof stations[number]; learning:LearningController }) {
  const [part,setPart]=useState('');
  const [answers,setAnswers]=useState<string[]>([]);
  const [finished,setFinished]=useState(false);
  const scene=findingScene(atlas,station.finding);
  const found=scene?.targetIds.includes(part)??false;
  const locked=!learning.canWork||learning.pending||learning.retryPending;
  const reviewRoute:WorkspaceRoute=station.testId?{lesson:'clinical',clinicalMode:'tests',clinicalTest:station.testId}:{lesson:'neuro-compare'};
  return <>
    <p>{station.scenario}</p>
    {scene&&<>
      <h3>{scene.question.prompt}</h3>
      <FindingProjection atlas={atlas} id={station.finding} selectedId={part} disabled={!!part||locked} onPick={id=>{
        const choice=findingChoice(atlas,station.finding,id);
        if(!choice)return;
        setPart(id);void learning.answer(station.finding,choice);
      }}/>
      {part&&<p role="status">{found?'Yapı doğru.':'Seçilen yapı hedefle eşleşmedi.'} {scene.question.explanation}</p>}
    </>}
    {(!scene||part)&&station.questions.map((question,index)=>index<=answers.length&&<PracticeQuestion key={question.prompt}
      question={question} choice={answers[index]??''} disabled={locked}
      choose={choice=>{setAnswers([...answers,choice]);void learning.answer(stationQuestionId(station.id,index),choice);}}/>)}
    <PracticeSaveStatus learning={learning}/>
    {answers.length===station.questions.length&&(!finished?<Button disabled={locked} onClick={()=>setFinished(true)}>İstasyon sonucunu göster</Button>:
      <div role="status">
        <h3>{Number(found)+answers.filter((answer,i)=>answer===station.questions[i].answer).length} / {station.questions.length+Number(!!scene)} doğru</h3>
        <p>Yanıtlar Çalışmalarım’a eklendi. Yanlışlarını tekrar listesinden çalışabilirsin.</p>
      </div>)}
    <div className="clinical-reference-views">
      <ClinicalLink route={{lesson:'osce'}}>İstasyonlar</ClinicalLink>
      {finished&&<><ClinicalLink route={reviewRoute}>Konuyu incele</ClinicalLink><ClinicalLink route={{lesson:'learning'}}>Yanlışları tekrar et</ClinicalLink></>}
    </div>
    <a className="source-link" href={station.source} target="_blank" rel="noreferrer">Klinik kaynak ↗</a>
  </>;
}

function nextMotorSet() {
  const start=Math.floor(Math.random()*motorChecks.length);
  return [...motorChecks.slice(start),...motorChecks.slice(0,start)];
}

export function MotorPractice({ atlas, learning }: { atlas:Atlas; learning:LearningController }) {
  const [order,setOrder]=useState(nextMotorSet);
  const [index,setIndex]=useState(0);
  const [score,setScore]=useState(0);
  const available=order.filter(exam=>findingScene(atlas,'locate:muscle:'+exam.key+':right')).slice(0,3);
  const exam=available[index];
  return <ClinicalStudyPanel title="Nörolojik uygulama">
    {exam?<MotorRound key={exam.key} atlas={atlas} learning={learning} exam={exam} index={index} total={available.length}
      next={points=>{setScore(score+points);setIndex(index+1);}}/>:available.length?<>
        <p role="status"><strong>{score} / {available.length*3}</strong> doğru seçim</p>
        <div className="clinical-reference-views">
          <Button onClick={()=>{setOrder([...order.slice(3),...order.slice(0,3)]);setIndex(0);setScore(0);}}>Sonraki üç kası çalış</Button>
          <ClinicalLink route={{lesson:'learning'}}>Yanlışları tekrar et</ClinicalLink>
        </div>
      </>:<p>Bu alıştırmaya ait geometri yüklenemedi.</p>}
    <ClinicalLink route={{lesson:'practice'}}>Kendini sına</ClinicalLink>
  </ClinicalStudyPanel>;
}

function MotorRound({ atlas, learning, exam, index, total, next }: {
  atlas:Atlas; learning:LearningController; exam:typeof motorChecks[number]; index:number; total:number; next:(points:number)=>void;
}) {
  const [part,setPart]=useState('');
  const [nerve,setNerve]=useState('');
  const [motion,setMotion]=useState('');
  const finding='locate:muscle:'+exam.key+':right';
  const scene=findingScene(atlas,finding)!;
  const locked=!learning.canWork||learning.pending||learning.retryPending;
  const found=scene.targetIds.includes(part);
  return <>
    <p className="clinical-reference-hint">Kas {index+1} / {total}</p>
    <h3>{scene.question.prompt}</h3>
    <FindingProjection atlas={atlas} id={finding} selectedId={part} disabled={!!part||locked} onPick={id=>{
      const choice=findingChoice(atlas,finding,id);
      if(!choice)return;
      setPart(id);void learning.answer(finding,choice);
    }}/>
    {part&&<p role="status">{found?'Kas seçimi doğru.':'Seçilen yapı hedef kasla eşleşmedi.'} {scene.question.explanation}</p>}
    {part&&<PracticeQuestion question={exam.nerve} choice={nerve} choose={choice=>{setNerve(choice);void learning.answer(motorQuestionId(exam.root,'nerve'),choice);}} disabled={locked}/>}
    {nerve&&<PracticeQuestion question={exam.motion} choice={motion} choose={choice=>{setMotion(choice);void learning.answer(motorQuestionId(exam.root,'motion'),choice);}} disabled={locked}/>}
    <PracticeSaveStatus learning={learning}/>
    {motion&&<div className="clinical-reference-views">
      <ClinicalLink route={{lesson:'clinical',clinicalMode:'myotomes',clinicalLevel:exam.root,clinicalMuscle:exam.key,side:'right'}}>İlgili miyotomu incele</ClinicalLink>
      <Button disabled={locked} onClick={()=>next(Number(found)+Number(nerve===exam.nerve.answer)+Number(motion===exam.motion.answer))}>{index+1===total?'Sonucu göster':'Sonraki kas'}</Button>
    </div>}
  </>;
}

const reflexSource='https://www.msdmanuals.com/professional/neurologic-disorders/neurologic-examination/how-to-assess-reflexes';
const reflexes=[
  {name:'Biseps',roots:'C5–C6',level:'C5',nerve:'musculocutaneous',where:'Biseps tendonu · dirsek önü',response:'Dirsek fleksiyonu'},
  {name:'Brakiyoradialis',roots:'C6 ağırlıklı',level:'C6',nerve:'radial',where:'Radius stiloid çıkıntısının biraz proksimali',response:'Dirsek fleksiyonu ve hafif supinasyon'},
  {name:'Triseps',roots:'C7 ağırlıklı',level:'C7',nerve:'radial',where:'Olekranonun üstündeki triseps tendonu',response:'Dirsek ekstansiyonu'},
  {name:'Patellar',roots:'L4 ağırlıklı',level:'L4',nerve:'femoral',where:'Patella ile tibia tüberkülü arasındaki tendon',response:'Diz ekstansiyonu'},
  {name:'Aşil',roots:'S1 ağırlıklı',level:'S1',nerve:'tibial',where:'Aşil tendonu',response:'Ayak bileği plantar fleksiyonu'},
];

export function ReflexStudy({ variant }: {variant?:string}) {
  const [index,setIndex]=useState(()=>Math.max(0,reflexes.findIndex(reflex=>reflex.level===variant)));
  const reflex=reflexes[index];
  return <ClinicalStudyPanel title="Derin tendon refleksleri">
    <ClinicalNavigation active="reflexes"/>
    <div className="clinical-reference-views">{reflexes.map((item,i)=><Button key={item.name} variant="outline" aria-pressed={i===index} onClick={()=>setIndex(i)}>{item.name}</Button>)}</div>
    <h3>{reflex.name} refleksi · {reflex.roots}</h3>
    <dl className="assessment-fields"><div><dt>Uygulama noktası</dt><dd>{reflex.where}</dd></div><div><dt>Gözlenen yanıt</dt><dd>{reflex.response}</dd></div></dl>
    <ReflexExample key={index}/>
    <div className="clinical-reference-views">
      <ClinicalLink route={{lesson:'clinical',clinicalMode:'myotomes',clinicalLevel:reflex.level}}>İlgili miyotom</ClinicalLink>
      <ClinicalLink route={{lesson:'study',nerve:reflex.nerve}}>Sinir kartı</ClinicalLink>
    </div>
    <a className="source-link" href={reflexSource} target="_blank" rel="noreferrer">MSD Manual · Refleks değerlendirmesi ↗</a>
  </ClinicalStudyPanel>;
}

function ReflexExample() {
  const [right,setRight]=useState('2+');
  const [left,setLeft]=useState('2+');
  return <fieldset className="assessment-fields">
    <legend>Kurgusal sağ–sol kayıt</legend>
    {([{label:'Sağ',value:right,set:setRight},{label:'Sol',value:left,set:setLeft}]).map(side=><label key={side.label}>{side.label}
      <select value={side.value} onChange={e=>side.set(e.target.value)}>{['0','1+','2+','3+','4+'].map(grade=><option key={grade}>{grade}</option>)}</select>
    </label>)}
    <p role="status">{right===left?'İki taraf aynı derecede kaydedildi.':'Kayıtta sağ–sol asimetrisi var.'} Refleks bulgusu duyu ve kas gücü ile birlikte yorumlanır.</p>
  </fieldset>;
}

const measures=[
  {id:'rom',title:'Gonyometri · diz fleksiyonu',equipment:'Eklem gonyometresi',position:'Uygulama pozisyonunu ve aktif veya pasif ölçüm yaptığını kaydet.',
    steps:'Ekseni lateral femoral epikondile hizala. Sabit kolu büyük trokantere, hareketli kolu lateral malleole yönelt. Ölçümü derece olarak kaydet.',
    record:'Sağ 110° · sol 125° · aktif diz fleksiyonu',unit:'°',labels:['Sağ','Sol'],samples:['110','125'],max:180,
    source:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6195503/'},
  {id:'mmt',title:'Manuel kas testi · 0–5',equipment:'Sabit destek yüzeyi',position:'Ölçülecek hareketi ve kası seç. Pozisyonu ve stabilizasyonu iki taraf için standartlaştır.',
    steps:'Önce aktif hareketi gözle. Yerçekimine karşı hareket, dirence yanıt ve gerektiğinde yerçekimi azaltılmış konum bulgularını kaydet.',
    record:'Sağ 4/5 · sol 5/5 · el bileği ekstansiyonu',unit:'/5',labels:['Sağ','Sol'],samples:['4','5'],max:5,
    source:'https://www.msdmanuals.com/professional/neurologic-disorders/neurologic-examination/how-to-assess-muscle-strength'},
  {id:'tug',title:'Timed Up and Go',equipment:'Kollu sandalye, 3 m işaret ve kronometre',position:'Kişi sandalyede oturur. Yürüme yardımcı cihazı kullanılıyorsa kayda yaz.',
    steps:'Başla komutuyla süreyi başlat. Kişi kalkar, işarete yürür, döner ve yeniden oturur. Oturduğunda süreyi durdur.',
    record:'İlk ölçüm 14,2 sn · tekrar 12,8 sn · aynı yardımcı cihazla',unit:'sn',labels:['İlk ölçüm','Tekrar'],samples:['14.2','12.8'],max:3600,
    source:'https://www.sralab.org/rehabilitation-measures/timed-and-go'},
  {id:'sts',title:'5 Kez Otur-Kalk',equipment:'Sabit sandalye ve kronometre',position:'Başlangıçta kişi sandalyede oturur. Kol desteği ya da protokol değişikliği varsa kaydet.',
    steps:'Başla komutuyla süreyi başlat. Kişi beş kez ayağa kalkıp oturur. Beşinci oturuşta süreyi durdur.',
    record:'İlk ölçüm 17,4 sn · tekrar 15,9 sn · aynı sandalye ile',unit:'sn',labels:['İlk ölçüm','Tekrar'],samples:['17.4','15.9'],max:3600,
    source:'https://www.sralab.org/rehabilitation-measures/five-times-sit-stand-test'},
];

export function MeasureStudy({ variant }: {variant?:string}) {
  const [index,setIndex]=useState(()=>Math.max(0,measures.findIndex(measure=>measure.id===variant)));
  const measure=measures[index];
  return <ClinicalStudyPanel title="Ölçüm ve fonksiyonel değerlendirme">
    <ClinicalNavigation active="measures"/>
    <div className="clinical-reference-views">{measures.map((item,i)=><Button key={item.id} variant="outline" aria-pressed={i===index} onClick={()=>setIndex(i)}>{item.title}</Button>)}</div>
    <h3>{measure.title}</h3>
    <dl className="assessment-fields">
      <div><dt>Ekipman</dt><dd>{measure.equipment}</dd></div>
      <div><dt>Pozisyon ve hazırlık</dt><dd>{measure.position}</dd></div>
      <div><dt>Uygulama</dt><dd>{measure.steps}</dd></div>
      <div><dt>Kurgusal örnek</dt><dd>{measure.record}</dd></div>
    </dl>
    {measure.id==='mmt'&&<dl className="assessment-fields">
      {['Kasılma yok','Kasılma var, eklem hareketi yok','Yerçekimi etkisi azaltıldığında hareket','Yerçekimine karşı hareket','Yerçekimi ve dirence karşı hareket','Beklenen tam güç'].map((grade,i)=>
        <div key={grade}><dt>{i} / 5</dt><dd>{grade}</dd></div>)}
    </dl>}
    <MeasureExample key={measure.id} measure={measure}/>
    {measure.id==='rom'&&<ClinicalLink route={{lesson:'knee',motion:'flexion'}}>Diz fleksiyonunu 3D modelde aç</ClinicalLink>}
    {measure.id==='mmt'&&<ClinicalLink route={{lesson:'neuro-exam'}}>Kas ve innervasyon alıştırması</ClinicalLink>}
    <a className="source-link" href={measure.source} target="_blank" rel="noreferrer">Uygulama kaynağı ↗</a>
  </ClinicalStudyPanel>;
}

function MeasureExample({ measure }: { measure:typeof measures[number] }) {
  const [values,setValues]=useState(measure.samples);
  const valid=values.every(value=>value!==''&&Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=measure.max&&
    (measure.id!=='mmt'||Number.isInteger(Number(value))));
  return <fieldset className="assessment-fields">
    <legend>Kayıt alıştırması</legend>
    {measure.labels.map((label,i)=><label key={label}>{label} ({measure.unit})
      <input type="number" min="0" max={measure.max} step={measure.id==='mmt'?1:.1} value={values[i]} onChange={e=>setValues(values.map((v,j)=>j===i?e.target.value:v))}/>
    </label>)}
    <p role="status">{valid?measure.labels.map((label,i)=>label+' '+values[i]+' '+measure.unit).join(' · '):'İki ölçüm için de geçerli bir değer gir.'}</p>
  </fieldset>;
}

const upperFindings=[
  ['Duyu dağılımını değerlendir','Küçük parmak ve yüzük parmağının ulnar yarısında duyu azalmış. Medial önkol duyusu korunmuş.'],
  ['Median sinirle innerve edilen el kaslarını değerlendir','Başparmak abdüksiyonu ve opozisyonu iki tarafta benzer.'],
  ['Elin ulnar motor hedeflerini değerlendir','Sağ parmak abdüksiyonu zayıf. Öyküde dirsek uzun süre bükülü kaldığında yakınmalar artıyor.'],
];
const upperOptions=['C8–T1 kök tutulumu','Dirsek düzeyinde ulnar nöropati'];

export function UlnarCase() {
  const [checked,setChecked]=useState<number[]>([]);
  const [choice,setChoice]=useState('');
  const ready=checked.length===upperFindings.length;
  return <ClinicalStudyPanel title="El uyuşması vakası">
    <p>Kurgusal vaka. Kişi sağ küçük parmağında uyuşma ve elini kullanırken güç kaybı tarif ediyor.</p>
    <div className="clinical-reference-views">{upperFindings.map(([label],i)=><Button key={label} variant="outline" disabled={checked.includes(i)} onClick={()=>setChecked([...checked,i])}>{label}</Button>)}</div>
    <ol className="neuro-findings">{checked.map(i=><li key={i}><strong>{upperFindings[i][0]}</strong><p>{upperFindings[i][1]}</p></li>)}</ol>
    <PracticeQuestion question={{prompt:'Bu bulgular hangi tutulumu daha çok destekliyor?',options:upperOptions,answer:upperOptions[1],
      explanation:'Ulnar duyu ve motor hedefleri etkilenmişken medial önkol duyusunun ve median sinirle çalışan el kaslarının korunması ulnar sinir tutulumunu destekler.'}}
      choice={choice} choose={setChoice} disabled={!ready}/>
    <div className="clinical-reference-views">
      <ClinicalLink route={{lesson:'neuro-compare',compare:'c8-t1'}}>C8–T1 ve ulnar siniri karşılaştır</ClinicalLink>
      {choice&&<Button variant="outline" onClick={()=>{setChecked([]);setChoice('');}}>Vakayı yeniden çöz</Button>}
    </div>
    <a className="source-link" href={upperLimbSource} target="_blank" rel="noreferrer">Kaynak · C8–T1 ve ulnar sinir ayrımı ↗</a>
  </ClinicalStudyPanel>;
}
