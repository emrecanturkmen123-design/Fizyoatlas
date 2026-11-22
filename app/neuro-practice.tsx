import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Atlas } from './anatomy';
import { ClinicalLink } from './clinical-navigation';
import { ClinicalStudyPanel, SpotButtons, StudySplit, type StudySpot } from './clinical-study-layout';
import { motorChecks, motorQuestionId } from './clinical-learning-questions';
import FindingProjection from './finding-projection';
import { findingChoice, findingScene } from './model-finding';
import { lowerSensory, upperSensory, reflexDrillQuestions, sensoryPointQuestions, sensoryPoints,
  type DrillKind, type NeuroRegion, type SensoryRoot } from './neuro-drill-data';
import { ReflexDiagram, reflexPoint, reflexes } from './reflex-study';
import { PracticeSaveStatus } from './practice-save-status';
import type { LearningController } from './use-learning';

const bounds=[0,0,360,220] as const;
const upperSpots:readonly StudySpot[]=[{id:'C6',x:108,y:136},{id:'C7',x:184,y:91},{id:'C8',x:244,y:117}];
const lowerSpots:readonly StudySpot[]=[{id:'L4',x:108,y:102},{id:'L5',x:143,y:156},{id:'S1',x:279,y:159}];

export function SensoryDiagram({ upper, marked, selected, correct, disabled, onPick }: {
  upper:boolean;marked?:string;selected?:string;correct?:string;disabled?:boolean;onPick?:(id:string)=>void;
}) {
  const spots=upper?upperSpots:lowerSpots;
  const dot=spots.find(point=>point.id===(correct??marked));
  return <figure className="clinical-study-diagram">
    <div className="clinical-diagram-stage">
      <svg viewBox={bounds.join(' ')} role="img" aria-label={upper?'El sırtında duyu noktaları':'Ayak sırtı, iç ayak bileği ve dış topuk görünümü'}>
        {upper?<path className="study-limb" d="M138 216 L135 175 Q124 161 112 155 L91 131 Q82 119 92 116 Q103 112 126 135 L133 140 L134 60 Q135 48 145 49 Q155 49 157 59 L160 102 L169 102 L174 38 Q176 25 186 27 Q197 28 197 41 L198 102 L208 102 L212 53 Q214 42 224 43 Q235 45 233 57 L231 110 L237 113 L243 82 Q246 70 256 74 Q265 77 264 89 L257 145 Q253 163 236 178 L232 215Z"/>:<>
          <path className="study-limb" d="M90 23 L141 23 L140 78 Q142 95 150 112 Q161 136 163 160 L169 176 Q174 187 168 195 Q163 201 156 196 Q150 208 142 200 Q133 208 126 198 Q118 202 112 191 Q100 195 96 180 L93 153 Q92 137 99 117 Q98 107 93 100 Q88 99 87 92Z"/>
          <path className="study-landmark" d="M111 103 Q115 126 110 151 M111 167 Q134 162 156 169"/>
          <path className="study-limb" d="M245 23 L277 23 L276 76 Q278 99 285 120 Q289 137 288 151 Q289 163 282 169 Q265 178 246 174 L203 177 Q188 176 188 169 Q188 158 202 153 L231 142 Q242 136 242 119Z"/>
          <text x="130" y="211" textAnchor="middle">Ayak sırtı</text><text x="258" y="200" textAnchor="middle">Dış yan</text>
        </>}
        {dot&&<circle className="study-target-dot" cx={dot.x} cy={dot.y} r={onPick?6:10}/>}
      </svg>
      {onPick&&<SpotButtons spots={spots} bounds={bounds} selected={selected} correct={correct} disabled={disabled} onPick={onPick}/>}
    </div>
    <figcaption>{upper?'El sırtı':'Ayak çevresi'} · ISNCSCI anahtar duyu noktaları</figcaption>
  </figure>;
}

type QuizTask =
  | {kind:'muscle'; id:string; root:string}
  | {kind:'choice'; id:string; prompt:string; options:string[]; answer:string; explanation:string; root:string; label:string; visual?:'sensory'|'reflex'}
  | {kind:'sensory-point'; id:string; prompt:string; root:SensoryRoot; answer:string; explanation:string}
  | {kind:'reflex-point'; id:string; prompt:string; root:string; answer:string; explanation:string};

type Attempt = {task:QuizTask;correct:boolean};
const regionLabels:Record<NeuroRegion,string>={lower:'Alt ekstremite',upper:'Üst ekstremite',mixed:'Karışık'};
const typeLabels:Record<DrillKind,string>={all:'Tüm alıştırmalar',motor:'Miyotom',sensory:'Dermatom',reflex:'Refleks'};

function buildRound(atlas:Atlas,region:NeuroRegion,kind:DrillKind,round:number):QuizTask[] {
  const upper=region==='upper'||region==='mixed'&&round%2===1;
  const index=region==='mixed'?Math.floor(round/2):round;
  // Begin with the L4 motor / sensory / reflex set so the sections reinforce one another.
  const possible=motorChecks.filter(item=>(item.root.startsWith('C')===upper)&&findingScene(atlas,'locate:muscle:'+item.key+':right'));
  const motor=possible[index%possible.length];
  const sensoryRoots=upper?upperSensory:lowerSensory;
  const sensory=sensoryRoots[index%sensoryRoots.length];
  const reflexLevel=upper?'C5':index%2===0?'L4':'S1';
  const reflex=reflexes.find(item=>item.level===reflexLevel)!;
  const tasks:QuizTask[]=[];
  if(motor&&(kind==='all'||kind==='motor')){
    tasks.push({kind:'muscle',id:'locate:muscle:'+motor.key+':right',root:motor.root});
    for(const mode of ['nerve','motion'] as const)tasks.push({kind:'choice',id:motorQuestionId(motor.root,mode),root:motor.root,label:'Miyotom',...motor[mode]});
  }
  if(kind==='all'||kind==='sensory'){
    const point=sensoryPointQuestions.find(q=>q.id===`foundation:sensory:${sensory}:point`)!;
    const root=sensoryRoots[(index+1)%sensoryRoots.length];
    tasks.push({kind:'sensory-point',id:point.id,prompt:`${sensory} için anahtar duyu noktasını seç.`,root:sensory,answer:sensory,explanation:point.explanation});
    const q=sensoryPointQuestions.find(item=>item.id===`foundation:sensory:${root}:root`)!;
    tasks.push({...q,kind:'choice',prompt:'İşaretli nokta hangi kökün anahtar duyu noktası?',root,label:'Dermatom',visual:'sensory'});
  }
  if(kind==='all'||kind==='reflex'){
    tasks.push({kind:'reflex-point',id:`point:${reflexLevel}`,prompt:`${reflex.name} refleksi için uygulama noktasını seç.`,
      root:reflexLevel,answer:reflexPoint(reflexLevel),explanation:reflex.where+'.'});
    tasks.push(...reflexDrillQuestions.filter(q=>q.id.startsWith(`foundation:reflex:${reflexLevel}:`))
      .map(q=>({...q,kind:'choice' as const,root:reflexLevel,label:'Refleks',visual:'reflex' as const})));
  }
  return tasks;
}

export default function MotorPractice({ atlas, learning, variant }: { atlas:Atlas; learning:LearningController;variant?:string }) {
  const [region,setRegion]=useState<NeuroRegion>('lower'),[kind,setKind]=useState<DrillKind>(variant==='motor'||variant==='sensory'||variant==='reflex'?variant:'all');
  const [round,setRound]=useState(0),[tasks,setTasks]=useState<QuizTask[]>([]),[attempts,setAttempts]=useState<Attempt[]>([]);
  const [selection,setSelection]=useState('');
  const index=attempts.length;
  const task=tasks[index];
  const locked=!learning.canWork||learning.pending||learning.retryPending;
  const wrong=attempts.filter(item=>!item.correct).map(item=>item.task);
  function begin(nextRound:number) {
    setRound(nextRound);setTasks(buildRound(atlas,region,kind,nextRound));setAttempts([]);setSelection('');
  }
  function restart() {setTasks([]);setAttempts([]);setSelection('');setRound(0);}
  return <ClinicalStudyPanel title="Nörolojik uygulama">
    {!tasks.length?<div className="clinical-study-setup">
      <p>Miyotom, dermatom ve refleksleri kısa bir turda çalış. Her seçimin ardından doğru yanıtı gör.</p>
      <div className="clinical-workbench-controls">
        <label>Bölge<select value={region} onChange={event=>setRegion(event.target.value as NeuroRegion)}>
          {Object.entries(regionLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}
        </select></label>
        <label>Alıştırma<select value={kind} onChange={event=>setKind(event.target.value as DrillKind)}>
          {Object.entries(typeLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}
        </select></label>
      </div>
      <Button disabled={locked||!buildRound(atlas,region,kind,0).length} onClick={()=>begin(0)}>Turu başlat</Button>
      {!learning.canWork&&!learning.error&&<p role="status">Çalışma kayıtları hazırlanıyor…</p>}
    </div>:task?<NeuroQuestion key={task.id} atlas={atlas} task={task} selection={selection} locked={locked} index={index} total={tasks.length}
        select={(value,saved)=>{setSelection(value);if(saved)void learning.answer(saved.id,saved.choice);}}
        next={correct=>{setAttempts([...attempts,{task,correct}]);setSelection('');}}/>:
      <div className="clinical-study-result">
        <h3>Tur sonucu</h3><p role="status"><strong>{attempts.length-wrong.length} / {attempts.length}</strong> doğru seçim</p>
        {wrong.length>0&&<ul>{wrong.map(item=><li key={item.id}>{item.kind==='muscle'?findingScene(atlas,item.id)?.question.prompt:item.prompt}</li>)}</ul>}
        <div className="clinical-study-actions">
          {!!wrong.length&&<Button onClick={()=>{setTasks(wrong);setAttempts([]);}}>Bu turdaki yanlışları tekrar et</Button>}
          <Button variant="outline" onClick={()=>begin(round+1)}>Yeni tur</Button>
          <Button variant="outline" onClick={restart}>Bölge ve alıştırma seç</Button>
        </div>
      </div>}
    <PracticeSaveStatus learning={learning}/>
    <div className="clinical-study-actions"><ClinicalLink route={{lesson:'practice'}}>Kendini sına</ClinicalLink>
      {!!tasks.length&&!task&&<ClinicalLink route={{lesson:'learning'}}>Çalışmalarım</ClinicalLink>}</div>
  </ClinicalStudyPanel>;
}

function NeuroQuestion({ atlas, task, selection, locked, index, total, select, next }: {
  atlas:Atlas;task:QuizTask;selection:string;locked:boolean;index:number;total:number;
  select:(value:string,saved?:{id:string;choice:string})=>void;next:(correct:boolean)=>void;
}) {
  const model=task.kind==='muscle'?findingScene(atlas,task.id):undefined;
  const correct=task.kind==='muscle'?!!model?.targetIds.includes(selection):selection===task.answer;
  const upper=task.root.startsWith('C');
  const heading=task.kind==='muscle'?model?.question.prompt:task.prompt;
  const topic=task.kind==='muscle'?'Miyotom':task.kind==='sensory-point'?'Dermatom':task.kind==='reflex-point'?'Refleks':task.label;
  const explanation=task.kind==='muscle'?model?.question.explanation:task.explanation;
  const visual=task.kind==='muscle'?<FindingProjection atlas={atlas} id={task.id} selectedId={selection} reveal={!!selection}
    disabled={!!selection||locked} onPick={id=>{const choice=findingChoice(atlas,task.id,id);if(choice)select(id,{id:task.id,choice});}}/>:
    task.kind==='sensory-point'?<SensoryDiagram upper={upper} selected={selection} disabled={locked} correct={selection?task.root:undefined}
      onPick={root=>{if(!locked)select(root,{id:task.id,choice:sensoryPoints[root as SensoryRoot]});}}/>:
    task.kind==='reflex-point'?<ReflexDiagram level={task.root} selected={selection} disabled={locked} onPick={id=>{if(!locked)select(id);}}/>:
    task.visual==='sensory'?<SensoryDiagram upper={upper} marked={task.root}/>:
    task.visual==='reflex'?<ReflexDiagram level={task.root}/>:undefined;
  const detailRoute=topic==='Dermatom'?{lesson:'clinical',clinicalMode:'dermatomes',clinicalLevel:task.root,side:'right'} as const:
    topic==='Refleks'?{lesson:'reflexes',compare:task.root} as const:
      {lesson:'clinical',clinicalMode:'myotomes',clinicalLevel:task.root,side:'right'} as const;
  return <>
    <p className="clinical-study-progress">{index+1} / {total} · {topic}</p>
    <h3 tabIndex={-1} ref={element=>{if(element&&index>0)element.focus({preventScroll:true});}}>{heading}</h3>
    <StudySplit visual={visual}>
      {task.kind==='choice'&&<div className="clinical-study-choices">{task.options.map(option=>
        <Button key={option} variant="outline" aria-pressed={selection===option} disabled={!!selection||locked}
          onClick={()=>select(option,{id:task.id,choice:option})}>{option}</Button>)}</div>}
      {selection&&<>
        <div className="clinical-study-feedback" role="status" data-result={correct?'correct':'incorrect'}>
          <strong>{correct?'Doğru':task.kind==='choice'?`Doğru yanıt · ${task.answer}`:'Doğru nokta görselde yeşille gösterildi'}</strong>
          <p>{explanation}</p>
        </div>
        <div className="clinical-study-actions">
          <Button disabled={locked} onClick={()=>next(correct)}>{index+1===total?'Tur sonucunu göster':'Sonraki soru'}</Button>
          <ClinicalLink route={detailRoute}>Atlas kaydını incele</ClinicalLink>
        </div>
      </>}
    </StudySplit>
  </>;
}
