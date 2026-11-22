import type { ReactNode } from 'react';
import ClinicalNavigation, { ClinicalLink } from './clinical-navigation';
import { upperLimbSource } from './clinical-learning-questions';

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

const upperComparison = [
  ['Medial önkol duyusu','Etkilenebilir','Genellikle korunur'],
  ['Küçük parmak ve yüzük parmağının ulnar yarısı','Duyu değişikliği olabilir','Duyu değişikliği olabilir'],
  ['Başparmak abdüksiyonu ve opozisyonu','Median sinirle çalışan bu kaslarda zayıflık eşlik edebilir','İzole ulnar nöropatide genellikle korunur'],
  ['İnterosseöz kaslar','Zayıflayabilir','Zayıflayabilir'],
];

export function NeurologyComparison({ variant }: { variant?:string }) {
  const upper=variant==='c8-t1';
  return <StudyPanel title="Nörolojik karşılaştırma">
    <ClinicalNavigation active="compare" level={upper?'C8':'L5'}/>
    <div className="clinical-reference-views">
      <ClinicalLink route={{lesson:'neuro-compare'}}>L5 ve fibular sinir</ClinicalLink>
      <ClinicalLink route={{lesson:'neuro-compare',compare:'c8-t1'}}>C8–T1 ve ulnar sinir</ClinicalLink>
    </div>
    {upper?<><h3>C8–T1 kökleri ve dirsek düzeyinde ulnar sinir</h3>
      <table className="neuro-comparison">
        <thead><tr><th scope="col">Muayene</th><th scope="col">C8–T1 kökleri</th><th scope="col">Ulnar sinir</th></tr></thead>
        <tbody>{upperComparison.map(([test,root,nerve])=><tr key={test}><th scope="row">{test}</th><td>{root}</td><td>{nerve}</td></tr>)}</tbody>
      </table>
      <p>İnnervasyon varyasyonları bulunabilir. Duyu ve motor bulgular birlikte değerlendirilir.</p>
      <div className="clinical-reference-views">
        <ClinicalLink route={{lesson:'clinical',clinicalMode:'myotomes',clinicalLevel:'T1'}}>T1 miyotomu</ClinicalLink>
        <ClinicalLink route={{lesson:'study',nerve:'ulnar'}}>Ulnar sinir kartı</ClinicalLink>
        <ClinicalLink route={{lesson:'cases',caseId:'ulnar-hand'}}>El uyuşması vakasını çöz</ClinicalLink>
      </div>
      <a className="source-link" href={upperLimbSource} target="_blank" rel="noreferrer">Karşılaştırmanın kaynağı ↗</a>
    </>:<>
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
      <ClinicalLink route={{lesson:'cases',caseId:'foot-drop'}}>Ayak düşmesi vakasını çöz</ClinicalLink>
    </div>
    <a className="source-link" href={footDropSource} target="_blank" rel="noreferrer">Kaynak · The Interdisciplinary Management of Foot Drop ↗</a>
    </>}
  </StudyPanel>;
}
