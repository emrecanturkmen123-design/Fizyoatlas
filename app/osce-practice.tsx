import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Atlas } from './anatomy';
import { ClinicalLink } from './clinical-navigation';
import { ClinicalStudyPanel, SpotButtons, StudySplit } from './clinical-study-layout';
import { ClinicalDiagram } from './clinical-test-illustration';
import { stations, stationQuestionId } from './clinical-learning-questions';
import { Disclosure } from './disclosure';
import FindingProjection from './finding-projection';
import { findingChoice, findingScene } from './model-finding';
import { lachmanBounds, lachmanDirectionSpots, lachmanPlacementOptions, lachmanSpots, lachmanTechnique } from './lachman-practice-data';
import { PracticeSaveStatus } from './practice-save-status';
import type { LearningController } from './use-learning';
import type { WorkspaceRoute } from './workspace-route';

const groups=['Anatomi','Uygulama','Yorum'] as const;
type Group=(typeof groups)[number];
type StationData=typeof stations[number];
type Step={
  id:string;group:Group;prompt:string;explanation:string;answer:string;options?:string[];
  visual:'model'|'placement'|'direction'|'context'|'none';
};
type Decision={choice:string;correct:boolean};

export function stationSteps(atlas:Atlas,station:StationData):Step[] {
  const model=findingScene(atlas,station.finding);
  const steps:Step[]=[];
  if(model)steps.push({...model.question,group:'Anatomi',visual:'model'});
  const [application,interpretation]=station.questions;
  if(station.id==='diz'){
    steps.push(...lachmanTechnique.map((question,index)=>({...question,group:'Uygulama' as const,visual:index===2?'direction' as const:'placement' as const})));
  }else{
    steps.push({...application,id:stationQuestionId(station.id,0),group:'Uygulama',visual:'none'});
  }
  steps.push({...interpretation,id:stationQuestionId(station.id,1),group:'Yorum',visual:station.id==='diz'?'context':'none'});
  return steps;
}

export default function Osce({ atlas, variant, learning }: { atlas:Atlas; variant?:string; learning:LearningController }) {
  const station=stations.find(item=>item.id===variant);
  return <ClinicalStudyPanel title={station?.title??'Uygulama sınavı'}>
    {station?<Station key={station.id} atlas={atlas} station={station} learning={learning}/>:<>
      <p>Bir istasyon seç. Sırayla yapıyı bul, uygulamayı seç ve bulguyu yorumla. Açıklamalar istasyon sonunda açılır.</p>
      <div className="lesson-links">{stations.map(item=><ClinicalLink key={item.id} route={{lesson:'osce',compare:item.id}}>
        <strong>{item.title}</strong><span>Anatomi · Uygulama · Yorum</span>
      </ClinicalLink>)}</div>
      <div className="clinical-study-actions"><ClinicalLink route={{lesson:'practice'}}>Kendini sına</ClinicalLink></div>
    </>}
  </ClinicalStudyPanel>;
}

function Station({ atlas, station, learning }: { atlas:Atlas; station:StationData; learning:LearningController }) {
  const [attempts,setAttempts]=useState<Decision[]>([]);
  const [selected,setSelected]=useState('');
  const [decision,setDecision]=useState<Decision>();
  const steps=stationSteps(atlas,station);
  const index=attempts.length;
  const step=steps[index];
  const locked=!learning.canWork||learning.pending||learning.retryPending;
  const reviewRoute:WorkspaceRoute=station.testId?{lesson:'clinical',clinicalMode:'tests',clinicalTest:station.testId}:
    {lesson:'lab',labMode:'neuro',compare:'l5-fibular'};
  function pick(value:string,choice:string,correct=choice===step.answer){
    if(locked||decision)return;
    setSelected(value);setDecision({choice,correct});void learning.answer(step.id,choice);
  }
  function next(){
    if(!decision||locked)return;
    setAttempts([...attempts,decision]);setSelected('');setDecision(undefined);
  }
  const visual=step?.visual==='model'?<FindingProjection key={step.id} atlas={atlas} id={step.id} selectedId={selected} disabled={locked||!!decision}
      onPick={id=>{const choice=findingChoice(atlas,step.id,id);if(choice)pick(id,choice,!!findingScene(atlas,step.id)?.targetIds.includes(id));}}/>:
    step?.visual==='placement'?<ClinicalDiagram testId="lachman" step={0} overlay={<SpotButtons spots={lachmanSpots} bounds={lachmanBounds}
      selected={selected} disabled={locked} onPick={id=>pick(id,lachmanPlacementOptions[id as keyof typeof lachmanPlacementOptions])}/>}/>:
    step?.visual==='direction'?<ClinicalDiagram testId="lachman" step={0} overlay={<SpotButtons spots={lachmanDirectionSpots}
      bounds={lachmanBounds} selected={selected} disabled={locked} onPick={id=>pick(id,id)}/>}/>:
    step?.visual==='context'?<ClinicalDiagram testId="lachman" step={0}/>:undefined;
  return <>
    <p className="clinical-study-scenario">{station.scenario}</p>
    {step?<>
      <p className="clinical-study-progress">{step.group} · Görev {index+1} / {steps.length}</p>
      <h3 key={step.id} tabIndex={-1} ref={element=>{if(element&&index>0)element.focus({preventScroll:true});}}>{step.prompt}</h3>
      <StudySplit visual={visual}>
        {step.visual==='placement'&&<p>Şema üzerinde elin yerleşeceği numaralı bölgeyi seç.</p>}
        {step.visual==='direction'&&<p>Şemada hareketin yönünü gösteren oku seç.</p>}
        {step.options&&(step.visual==='context'||step.visual==='none')&&<div className="clinical-study-choices">{step.options.map(option=>
          <Button key={option} variant="outline" disabled={locked||!!decision} aria-pressed={selected===option} onClick={()=>pick(option,option)}>{option}</Button>)}</div>}
        {decision&&<div className="clinical-study-actions"><Button disabled={locked} onClick={next}>{index+1===steps.length?'İstasyon sonucunu göster':'Sonraki görev'}</Button></div>}
        {!learning.canWork&&!learning.error&&<p role="status">Çalışma kayıtları hazırlanıyor…</p>}
      </StudySplit>
    </>:<div className="clinical-study-result">
      <h3>İstasyon sonucu</h3>
      <p role="status"><strong>{attempts.filter(item=>item.correct).length} / {steps.length}</strong> doğru karar</p>
      <dl className="clinical-study-facts">{groups.map(group=>{
        const answers=attempts.filter((_,i)=>steps[i].group===group);
        return <div key={group}><dt>{group}</dt><dd>{answers.length?`${answers.filter(item=>item.correct).length} / ${answers.length}`:'Geometri bulunamadı'}</dd></div>;
      })}</dl>
      {station.id==='diz'&&<Disclosure title="Uygulama şemasını incele"><ClinicalDiagram testId="lachman" step={2}/></Disclosure>}
      <ol className="clinical-study-review">{steps.map((item,i)=><li key={item.id} data-correct={attempts[i].correct}>
        <strong>{item.prompt}</strong><p>Seçimin · {attempts[i].choice}</p>
        {!attempts[i].correct&&<p>Doğru yanıt · {item.answer}</p>}<p>{item.explanation}</p>
      </li>)}</ol>
      <div className="clinical-study-actions">
        <Button onClick={()=>setAttempts([])}>İstasyonu yeniden çöz</Button><ClinicalLink route={reviewRoute}>Konuyu incele</ClinicalLink>
        <ClinicalLink route={{lesson:'learning'}}>Çalışmalarım</ClinicalLink>
      </div>
      <a className="source-link" href={station.source} target="_blank" rel="noreferrer">Klinik kaynak</a>
    </div>}
    <PracticeSaveStatus learning={learning}/>
    <div className="clinical-study-actions"><ClinicalLink route={{lesson:'osce'}}>İstasyonlara dön</ClinicalLink></div>
  </>;
}
