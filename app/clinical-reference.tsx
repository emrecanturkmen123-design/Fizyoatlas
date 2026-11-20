import { Button } from '@/components/ui/button';
import { levels, regions, tests, type ClinicalSelection } from './clinical-model';
import type { Part } from './anatomy';
import reference from './clinical-reference.json';
import './clinical-reference.css';

const sources: Record<string, string[]> = reference.sources;
const modes = [
  ['tests', 'Klinik testler'], ['dermatomes', 'Dermatom'], ['myotomes', 'Miyotom'],
] as const;
const motorLevels = levels.filter(level => level.motor);

function Sources({ ids }: { ids: string[] }) {
  return <details className="clinical-reference-sources">
    <summary>Kaynaklar</summary>
    <ul>{ids.map(id => {
      const [label, url] = sources[id];
      return <li key={id}><a href={url} target="_blank" rel="noreferrer">{label}</a></li>;
    })}</ul>
  </details>;
}

type Props = {
  value: ClinicalSelection;
  onChange: (value: Partial<ClinicalSelection>) => void;
  onClose: () => void;
  parts: Part[];
  hasPin: boolean;
  onPickLevel: (id: string) => void;
};

export default function ClinicalReference({value, onChange, onClose, parts, hasPin, onPickLevel}: Props) {
  const { mode, region, side, levelId, testId } = value;
  const visibleTests = tests.filter(test => test.region === region);
  const test = visibleTests.find(test => test.id === testId) ?? visibleTests[0];
  const level = levels.find(level => level.id === levelId)!;
  const visualTarget = hasPin || parts.length > 0;
  return <section id="atlas-content" className="study-panel glass clinical-reference" aria-label="Klinik Atlas" tabIndex={-1}>
    <div className="panel-heading">
      <strong>Klinik Atlas</strong>
      <Button variant="ghost" onClick={onClose}>← Atlas</Button>
    </div>
    <div className="clinical-reference-views" aria-label="Klinik Atlas bölümleri">
      {modes.map(([id, label]) => <Button key={id} aria-pressed={mode === id} variant={mode === id ? 'default' : 'outline'} onClick={() => onChange({mode:id})}>{label}</Button>)}
    </div>
    {mode !== 'myotomes' && <p className="clinical-reference-hint">{mode === 'tests' ? 'Testleri açmak için modeldeki bölge işaretine dokun.' : 'Duyu noktasını seçmek için modeldeki işarete dokun.'}</p>}
    <div className="clinical-reference-views">
      <Button aria-pressed={side === 'left'} variant="outline" onClick={() => onChange({side:'left'})}>Sol</Button>
      <Button aria-pressed={side === 'right'} variant="outline" onClick={() => onChange({side:'right'})}>Sağ</Button>
      <Button aria-pressed={value.view === 'front'} variant="ghost" onClick={() => onChange({view:'front',focus:0})}>Ön</Button>
      <Button aria-pressed={value.view === 'back'} variant="ghost" onClick={() => onChange({view:'back',focus:0})}>Arka</Button>
    </div>
    {mode === 'tests' ? <>
      <label className="atlas-region">Bölge
        <select value={region} onChange={event => onChange({region:event.target.value})}>
          {regions.map(region => <option key={region}>{region}</option>)}
        </select>
      </label>
      <label className="atlas-region">Test
        <select value={test.id} onChange={event => onChange({testId:event.target.value})}>
          {visibleTests.map(test => <option key={test.id} value={test.id}>{test.title}</option>)}
        </select>
      </label>
    </> : <label className="atlas-region">Sinir kökü
      <select value={levelId} onChange={event => onPickLevel(event.target.value)}>
        {(mode === 'dermatomes' ? levels : motorLevels).map(level => <option key={level.id}>{level.id}</option>)}
      </select>
    </label>}
    {visualTarget && <Button variant="outline" onClick={() => onChange({focus:value.focus+1})}>Modelde yakından göster</Button>}
    <article className="clinical-reference-card" aria-live="polite">
      {mode === 'tests' ? <>
        <p className="clinical-reference-hint">{test.tag}</p>
        <h3>{test.title}</h3>
        <dl>
          <dt>Değerlendirilen yapı veya işlev</dt><dd>{test.focus}</dd>
          {test.position && <><dt>Uygulama</dt><dd>{test.position}</dd></>}
          <dt>Aranan bulgu</dt><dd>{test.finding}</dd>
          <dt>Klinik yorum</dt><dd>{test.meaning}</dd>
        </dl>
        {test.levels.length > 0 && <div className="clinical-reference-views" aria-label="İlgili sinir kökleri">
          {test.levels.map(id => <Button key={id} variant="outline" onClick={() => onPickLevel(id)}>{id} dermatomu</Button>)}
        </div>}
      </> : <>
        <h3>{levelId} · {side === 'left' ? 'Sol' : 'Sağ'}</h3>
        <dl>
          {mode === 'dermatomes' ? <><dt>Anahtar duyu noktası</dt><dd>{level.sensory}</dd></>
            : <><dt>Anahtar motor hareket</dt><dd>{level.motor}</dd></>}
        </dl>
        {mode === 'dermatomes' && !hasPin && <p>Bu duyu noktası modelde işaretlenmemiştir.</p>}
        {mode === 'myotomes' && parts.length > 0 && <p>Modelde hareketle ilişkili örnek kaslar vurgulanır.</p>}
      </>}
      <Sources ids={mode === 'tests' ? test.sources : ['isncsci']} />
    </article>
    {mode === 'dermatomes' && <details className="clinical-reference-sources">
      <summary>Dermatom alan haritası</summary>
      <figure>
        <img src="/clinical/dermatom-map.png" loading="lazy" width="665" height="704" alt="Önden ve arkadan görünümde yaklaşık dermatom alanları" />
        <figcaption>Komşu alanlar örtüşebilir. <a href={sources.map[1]} target="_blank" rel="noreferrer">Goran tek-en</a>{' · '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a> (kırpılmış).
        </figcaption>
      </figure>
      <Sources ids={['map_variability']} />
    </details>}
  </section>;
}
