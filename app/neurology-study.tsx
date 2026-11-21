import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { Atlas } from './anatomy';
import ClinicalNavigation, { ClinicalLink } from './clinical-navigation';
import FindingProjection from './finding-projection';
import { findingScene } from './model-finding';

const footDropSource = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6637663/';
const comparison = [
  ['Ayak bileği dorsifleksiyonu ve başparmak ekstansiyonu', 'Zayıflayabilir', 'Zayıflayabilir'],
  ['Ayak bileği eversiyonu', 'Zayıflayabilir', 'Zayıflayabilir'],
  ['Tibialis posterior ile inversiyon', 'Zayıflık L5 kök tutulumunu destekler', 'Genellikle korunur'],
  ['Kalça abdüksiyonu', 'Zayıflık L5 kök tutulumunu destekleyebilir', 'Genellikle korunur'],
  ['Ayak sırtında duyu değişikliği', 'Görülebilir', 'Görülebilir. Dağılım tutulan dala göre değişebilir.'],
];

function StudyPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section id="atlas-content" tabIndex={-1} className="case-panel case-reading glass neuro-study" aria-labelledby="neuro-study-title">
    <h2 id="neuro-study-title">{title}</h2>
    {children}
  </section>;
}

export function NeurologyComparison() {
  return <StudyPanel title="Nörolojik karşılaştırma">
    <ClinicalNavigation active="compare" level="L5"/>
    <h3>Ayak düşmesinde L5 kökü ve fibular sinir</h3>
    <p>Ayak sırtındaki duyu değişikliği ve dorsifleksiyon zayıflığı iki tabloda da görülebilir. İnversiyon ve kalça abdüksiyonu, bulgunun yerini ayırt etmeye yardımcı olur.</p>
    <table className="neuro-comparison">
      <thead><tr><th scope="col">Muayene</th><th scope="col">L5 radikülopatisi</th><th scope="col">N. fibularis communis nöropatisi</th></tr></thead>
      <tbody>{comparison.map(([exam, root, nerve]) => <tr key={exam}><th scope="row">{exam}</th><td>{root}</td><td>{nerve}</td></tr>)}</tbody>
    </table>
    <p className="clinical-reference-hint">Bulgular birlikte yorumlanır ve tek bir muayene bulgusu tanıyı kesinleştirmez.</p>
    <div className="clinical-reference-views">
      <ClinicalLink route={{lesson:'clinical',clinicalMode:'dermatomes',clinicalLevel:'L5'}}>L5 duyu alanı</ClinicalLink>
      <ClinicalLink route={{lesson:'clinical',clinicalMode:'myotomes',clinicalLevel:'L5'}}>L5 kasları</ClinicalLink>
      <ClinicalLink route={{lesson:'study',nerve:'common-fibular'}}>Siniri modelde göster</ClinicalLink>
      <ClinicalLink route={{lesson:'foot-drop-case'}}>Ayak düşmesi vakasını çöz</ClinicalLink>
    </div>
    <a className="source-link" href={footDropSource} target="_blank" rel="noreferrer">Kaynak · The Interdisciplinary Management of Foot Drop ↗</a>
  </StudyPanel>;
}

const exams = [
  {
    key: 'biceps brachii', root: 'C5',
    nerves: ['N. radialis', 'N. musculocutaneus', 'N. medianus'],
    nerve: 'N. musculocutaneus',
    motions: ['Dirsek ekstansiyonu', 'El bileği ekstansiyonu', 'Dirsek fleksiyonu'],
    motion: 'Dirsek fleksiyonu',
    explanation: 'Biceps brachii dirsek fleksiyonuna ve önkol supinasyonuna katkı verir. Dirsek fleksiyonu C5 anahtar motor değerlendirmesidir.',
  },
  {
    key: 'tibialis anterior', root: 'L4',
    nerves: ['N. fibularis profundus', 'N. tibialis', 'N. fibularis superficialis'],
    nerve: 'N. fibularis profundus',
    motions: ['Ayak bileği plantar fleksiyonu', 'Ayak bileği dorsifleksiyonu', 'Ayak bileği eversiyonu'],
    motion: 'Ayak bileği dorsifleksiyonu',
    explanation: 'Tibialis anterior dorsifleksiyona ve inversiyona katkı verir. Ayak bileği dorsifleksiyonu L4 anahtar motor değerlendirmesidir.',
  },
  {
    key: 'extensor hallucis longus', root: 'L5',
    nerves: ['N. femoralis', 'N. fibularis superficialis', 'N. fibularis profundus'],
    nerve: 'N. fibularis profundus',
    motions: ['Ayak başparmağı ekstansiyonu', 'Ayak başparmağı fleksiyonu', 'Diz ekstansiyonu'],
    motion: 'Ayak başparmağı ekstansiyonu',
    explanation: 'Extensor hallucis longus ayak başparmağını ekstansiyona getirir. Başparmak ekstansiyonu L5 anahtar motor değerlendirmesidir.',
  },
];

export function NeurologyExam({ atlas }: { atlas: Atlas }) {
  const [index,setIndex] = useState(0);
  const [score,setScore] = useState(0);
  const available = exams.filter(exam => findingScene(atlas, 'locate:muscle:'+exam.key+':right'));
  const exam = available[index];
  return <StudyPanel title="Nörolojik uygulama">
    {exam ? <ExamRound key={index} atlas={atlas} exam={exam} index={index} total={available.length} onAdvance={points=>{setScore(score+points);setIndex(index+1);}}/>:
      available.length?<><p role="status"><strong>{score} / {available.length * 3}</strong> doğru seçim</p><Button onClick={()=>{setIndex(0);setScore(0);}}>Yeniden çöz</Button></>:<p>Modelde bu alıştırma için gereken kaslar bulunamadı.</p>}
    <div className="clinical-reference-views"><ClinicalLink route={{lesson:'practice'}}>Kendini sına</ClinicalLink></div>
  </StudyPanel>;
}

function ExamRound({ atlas, exam, index, total, onAdvance }: { atlas: Atlas; exam: typeof exams[number]; index: number; total: number; onAdvance: (points:number)=>void }) {
  const [part,setPart] = useState('');
  const [nerve,setNerve] = useState('');
  const [motion,setMotion] = useState('');
  const findingId = 'locate:muscle:'+exam.key+':right';
  const scene = findingScene(atlas,findingId)!;
  const found = scene.targetIds.includes(part);
  return <>
    <p className="clinical-reference-hint">Kas {index+1} / {total}</p>
    <h3>Modelde {scene.question.displayName} kasını seç</h3>
    <FindingProjection atlas={atlas} id={findingId} disabled={!!part} selectedId={part} onPick={setPart}/>
    {part&&<p role="status">{found?'Kas seçimi doğru.':'Seçilen yüzey hedef kasla eşleşmedi.'} {scene.question.explanation}</p>}
    {part&&<div className="neuro-question">
      <h3>Kası hangi periferik sinir innerve eder?</h3>
      <div className="clinical-reference-views">{exam.nerves.map(option=><Button variant="outline" key={option} disabled={!!nerve} onClick={()=>setNerve(option)}>{option}</Button>)}</div>
      {nerve&&<p role="status">{nerve===exam.nerve?'Doğru.':'Doğru yanıt'} {exam.nerve}.</p>}
    </div>}
    {nerve&&<div className="neuro-question">
      <h3>Bu kası hangi hareketle değerlendirirsin?</h3>
      <div className="clinical-reference-views">{exam.motions.map(option=><Button variant="outline" key={option} disabled={!!motion} onClick={()=>setMotion(option)}>{option}</Button>)}</div>
      {motion&&<p role="status">{motion===exam.motion?'Doğru.':`Doğru yanıt ${exam.motion.toLocaleLowerCase('tr')}.`} {exam.explanation}</p>}
    </div>}
    {motion&&<div className="clinical-reference-views">
      <ClinicalLink route={{lesson:'clinical',clinicalMode:'myotomes',clinicalLevel:exam.root,clinicalMuscle:exam.key,side:'right'}}>İlgili miyotomu incele</ClinicalLink>
      <Button onClick={()=>onAdvance(Number(found)+Number(nerve===exam.nerve)+Number(motion===exam.motion))}>{index+1===total?'Sonucu göster':'Sonraki kas'}</Button>
    </div>}
  </>;
}

const hypotheses = ['L5 radikülopatisi','N. fibularis communis nöropatisi'];
const examChoices = [
  'Öyküyü derinleştir',
  'Dorsifleksiyon ve eversiyonu değerlendir',
  'İnversiyon ve kalça abdüksiyonunu değerlendir',
  'Duyu dağılımını değerlendir',
];
const scenarios = [
  {
    findings:[
      'Uzun süre bacak bacak üstüne attıktan sonra şikâyet başlamış. Beline veya uyluğuna yayılan ağrı tarif etmiyor.',
      'Sol ayakta dorsifleksiyon ve eversiyon karşı tarafa göre zayıf.',
      'Sol ayak inversiyonu ve sol kalça abdüksiyonu korunmuş.',
      'Ayak sırtında ve birinci parmak aralığında his azalmış.',
    ],
    answer:hypotheses[1],
    explanation:'Dorsifleksiyon ve eversiyon zayıfken inversiyon ve kalça abdüksiyonunun korunması fibular sinir tutulumunu destekliyor.',
  },
  {
    findings:[
      'Belde başlayan ağrı, sol bacağın dış yanından ayak sırtına yayılıyor.',
      'Sol ayakta dorsifleksiyon ve eversiyon karşı tarafa göre zayıf.',
      'Sol ayak inversiyonu ve sol kalça abdüksiyonu karşı tarafa göre zayıf.',
      'Sol ayak sırtında his azalmış.',
    ],
    answer:hypotheses[0],
    explanation:'Dorsifleksiyona ek olarak inversiyon ve kalça abdüksiyonunun zayıf olması, fibular sinirin dışındaki kasları da kapsayan L5 kök tutulumunu destekliyor.',
  },
];

export function FootDropCase() {
  const [scenarioIndex,setScenarioIndex] = useState(0);
  const [checked,setChecked] = useState<number[]>([]);
  const [answer,setAnswer] = useState('');
  const scenario = scenarios[scenarioIndex];
  const assessedMotor = checked.includes(1) && checked.includes(2);
  const finished = !!answer && assessedMotor;
  const reset = (next = scenarioIndex) => {setScenarioIndex(next);setChecked([]);setAnswer('');};

  return <StudyPanel title="Ayak düşmesi vakası">
    <p>Bir kişi yürürken sol ayak ucunun yere takıldığını ve ayak sırtında uyuşma olduğunu söylüyor. Bulguları hangi sırayla toplamak istediğini seç.</p>
    <div className="clinical-reference-views" aria-label="Muayene seçenekleri">
      {examChoices.map((label,index)=><Button key={label} variant="outline" disabled={checked.includes(index)} onClick={()=>setChecked([...checked,index])}>{label}</Button>)}
    </div>
    {checked.length>0&&<ol className="neuro-findings" aria-label="Toplanan bulgular" aria-live="polite">
      {checked.map(index=><li key={index}><strong>{examChoices[index]}</strong><p>{scenario.findings[index]}</p></li>)}
    </ol>}
    <div className="neuro-question">
      <h3>Bulgular hangi tutulumu daha çok destekliyor?</h3>
      <div className="clinical-reference-views">
        {hypotheses.map(label=><Button key={label} variant="outline" aria-pressed={answer===label} disabled={!checked.length} onClick={()=>setAnswer(label)}>{label}</Button>)}
      </div>
      {answer&&<div role="status">{finished?
        <p><strong>{answer===scenario.answer?'Seçimin bulgularla uyumlu.':scenario.answer+' daha olası.'}</strong> {scenario.explanation}</p>:
        <p>{answer===hypotheses[0]
          ?'L5 olasılığını tartmak için inversiyon ve kalça abdüksiyonunu değerlendir. Diğer ayak hareketleriyle birlikte yorumla.'
          :'Fibular sinir tutulumunu tartmak için dorsifleksiyon ve eversiyonu değerlendir. İnversiyon ve kalça abdüksiyonunun korunup korunmadığını kontrol et.'}</p>}
      </div>}
    </div>
    <div className="clinical-reference-views">
      <ClinicalLink route={{lesson:'neuro-compare'}}>Karşılaştırmayı aç</ClinicalLink>
      {checked.length>0&&<Button variant="ghost" onClick={()=>reset()}>Vakayı sıfırla</Button>}
      {finished&&<Button variant="outline" onClick={()=>reset((scenarioIndex+1)%scenarios.length)}>Diğer vakayı çöz</Button>}
    </div>
  </StudyPanel>;
}
