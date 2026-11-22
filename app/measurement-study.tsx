import {useState} from 'react';
import ClinicalNavigation,{ClinicalLink} from './clinical-navigation';
import {ClinicalStudyPanel, StudySplit} from './clinical-study-layout';
import {Disclosure} from './disclosure';
import {KneeGoniometer, MeasureDiagram} from './measurement-diagram';

const measures=[
  {id:'rom',title:'Gonyometri · diz fleksiyonu',equipment:'Eklem gonyometresi',position:'Uygulama pozisyonunu ve aktif veya pasif ölçüm yaptığını kaydet.',
    steps:'Ekseni lateral femoral epikondile hizala. Sabit kolu büyük trokantere, hareketli kolu lateral malleole yönelt. Ölçümü derece olarak kaydet.',
    record:'Sağ 110° · sol 125° · aktif diz fleksiyonu',unit:'°',labels:['Sağ','Sol'],samples:['110','125'],max:180,
    source:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3158982/'},
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
  const measure=measures.find(item=>item.id===variant)??measures[0];
  return <ClinicalStudyPanel title="Ölçüm ve fonksiyonel değerlendirme">
    <ClinicalNavigation active="measures"/>
    <div className="clinical-workbench-controls" aria-label="Ölçüm türü">
      <ClinicalLink route={{lesson:'measures',compare:'rom'}}>Eklem hareket açıklığı</ClinicalLink>
      <ClinicalLink route={{lesson:'measures',compare:'mmt'}}>Kas kuvveti</ClinicalLink>
      <ClinicalLink route={{lesson:'measures',compare:'tug'}}>Fonksiyonel testler</ClinicalLink>
      {(measure.id==='tug'||measure.id==='sts')&&<div className="clinical-study-actions">
        <ClinicalLink route={{lesson:'measures',compare:'tug'}}>Timed Up and Go</ClinicalLink>
        <ClinicalLink route={{lesson:'measures',compare:'sts'}}>5 Kez Otur-Kalk</ClinicalLink>
      </div>}
    </div>
    <h3>{measure.title}</h3>
    <StudySplit visual={measure.id==='rom'?<KneeGoniometer/>:<MeasureDiagram key={measure.id} kind={measure.id}/>}>
      <dl className="clinical-study-facts">
        <div><dt>Ekipman</dt><dd>{measure.equipment}</dd></div>
        <div><dt>Pozisyon ve hazırlık</dt><dd>{measure.position}</dd></div>
        <div><dt>Uygulama</dt><dd>{measure.steps}</dd></div>
      </dl>
      {measure.id==='mmt'&&<Disclosure title="Kas kuvveti dereceleri · 0–5"><ol className="clinical-study-grades" start={0}>
        {['Kasılma yok','Kasılma var, eklem hareketi yok','Yerçekimi etkisi azaltıldığında hareket','Yerçekimine karşı hareket','Yerçekimi ve dirence karşı hareket','Beklenen tam güç'].map(grade=>
          <li key={grade}>{grade}</li>)}
      </ol></Disclosure>}
      <Disclosure title="Örnek ölçümü dene"><p>{measure.record}</p><MeasureExample key={measure.id} measure={measure}/></Disclosure>
      <div className="clinical-study-actions">
        {measure.id==='rom'&&<ClinicalLink route={{lesson:'knee',motion:'flexion'}}>Diz fleksiyonunu 3D modelde aç</ClinicalLink>}
        {measure.id==='mmt'&&<ClinicalLink route={{lesson:'neuro-exam',compare:'motor'}}>Kas ve innervasyonu çalış</ClinicalLink>}
      </div>
      <a className="source-link" href={measure.source} target="_blank" rel="noreferrer">Uygulama kaynağı</a>
    </StudySplit>
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
