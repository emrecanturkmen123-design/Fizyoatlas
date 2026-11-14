import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import reference from './clinical-reference.json';
import './clinical-reference.css';

const { tests, levels } = reference;
const sources: Record<string, string[]> = reference.sources;
const regions = [...new Set(tests.map(test => test.region))];

function Sources({ ids }: { ids: string[] }) {
  return <details className="clinical-reference-sources">
    <summary>Kaynaklar</summary>
    <ul>{ids.map(id => {
      const [label, url] = sources[id];
      return <li key={id}><a href={url} target="_blank" rel="noreferrer">{label}</a></li>;
    })}</ul>
  </details>;
}

export default function ClinicalReference() {
  const [view, setView] = useState<'tests' | 'roots'>('tests');
  const [region, setRegion] = useState('');
  const [testId, setTestId] = useState(tests[0].id);
  const [levelId, setLevelId] = useState('C6');
  const [linkedFromTest, setLinkedFromTest] = useState(false);
  const testHeading = useRef<HTMLHeadingElement>(null);
  const levelSelect = useRef<HTMLSelectElement>(null);
  const visibleTests = tests.filter(test => !region || test.region === region);
  const test = visibleTests.find(test => test.id === testId) ?? visibleTests[0];
  const level = levels.find(level => level.id === levelId)!;

  function openLevel(id: string) {
    setLevelId(id);
    setLinkedFromTest(true);
    setView('roots');
    requestAnimationFrame(() => levelSelect.current?.focus());
  }

  function returnToTest() {
    setLinkedFromTest(false);
    setView('tests');
    requestAnimationFrame(() => testHeading.current?.focus());
  }

  return <Dialog>
    <DialogTrigger render={<Button variant="outline" />}>Klinik Atlas</DialogTrigger>
    <DialogContent className="clinical-reference" showCloseButton={false}>
      <header className="clinical-reference-header">
        <div>
          <DialogTitle>Klinik Atlas</DialogTitle>
          <DialogDescription>Özel testler, dermatomlar ve miyotomlar</DialogDescription>
        </div>
        <DialogClose render={<Button variant="ghost" />}>Kapat</DialogClose>
      </header>
      <div className="clinical-reference-tabs" aria-label="Klinik Atlas bölümleri">
        <Button aria-pressed={view === 'tests'} variant={view === 'tests' ? 'default' : 'outline'} onClick={() => { setView('tests'); setLinkedFromTest(false); }}>Klinik testler</Button>
        <Button aria-pressed={view === 'roots'} variant={view === 'roots' ? 'default' : 'outline'} onClick={() => setView('roots')}>Dermatom ve miyotom</Button>
      </div>
      {view === 'tests' ? <>
        <div className="clinical-reference-fields">
          <label>Bölge
            <select value={region} onChange={event => setRegion(event.target.value)}>
              <option value="">Tüm bölgeler</option>
              {regions.map(region => <option key={region}>{region}</option>)}
            </select>
          </label>
          <label>Test ({visibleTests.length})
            <select value={test.id} onChange={event => setTestId(event.target.value)}>
              {visibleTests.map(test => <option key={test.id} value={test.id}>{test.title}</option>)}
            </select>
          </label>
        </div>
        <article className="clinical-reference-card" key={test.id}>
          <p className="clinical-reference-meta">{test.region} · {test.tag}</p>
          <h3 ref={testHeading} tabIndex={-1}>{test.title}</h3>
          <dl>
            <dt>Değerlendirilen yapı veya işlev</dt><dd>{test.focus}</dd>
            {test.position && <><dt>Uygulama</dt><dd>{test.position}</dd></>}
            <dt>Aranan bulgu</dt><dd>{test.finding}</dd>
            <dt>Klinik yorum</dt><dd>{test.meaning}</dd>
          </dl>
          {test.levels.length > 0 && <div className="clinical-reference-tabs" aria-label="İlgili sinir kökleri">
            {test.levels.map(id => <Button key={id} variant="outline" onClick={() => openLevel(id)}>{id} kökünü incele</Button>)}
          </div>}
          <Sources ids={test.sources} />
        </article>
      </> : <div className="clinical-reference-map">
        <div className="clinical-reference-card">
          <div className="clinical-reference-fields">
            <label>Spinal seviye
              <select ref={levelSelect} value={levelId} onChange={event => setLevelId(event.target.value)}>
                {levels.map(level => <option key={level.id}>{level.id}</option>)}
              </select>
            </label>
          </div>
          <dl>
            <dt>Anahtar duyu noktası · Dermatom</dt><dd>{level.sensory}</dd>
            <dt>Anahtar motor hareket · Miyotom</dt>
            <dd>{level.motor || 'Bu seviye için ISNCSCI anahtar motor muayene hareketi tanımlamaz.'}</dd>
          </dl>
          {linkedFromTest && <Button variant="outline" onClick={returnToTest}>← {test.title} kartına dön</Button>}
          <Sources ids={['isncsci', 'map_variability']} />
        </div>
        <figure>
          <img src="/clinical/dermatom-map.png" width="665" height="704" alt="Önden ve arkadan görünümde renk ve kök kodlarıyla işaretlenmiş dermatomlar" />
          <figcaption>Dermatom alanları · ön ve arka görünüm. Komşu alanlar örtüşebilir.
            {' '}<a href={sources.map[1]} target="_blank" rel="noreferrer">Goran tek-en</a>,
            {' '}<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a> (kırpılmış).
          </figcaption>
        </figure>
      </div>}
    </DialogContent>
  </Dialog>;
}
