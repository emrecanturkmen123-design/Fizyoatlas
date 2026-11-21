import { Button } from '@/components/ui/button';
import { clinicalTestLayers, levels, regions, rootGroup, rootGroups, sensoryLevels, tests, type ClinicalSelection, type ClinicalTestLayer } from './clinical-model';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { MyotomeMuscle } from './myotome-muscles';
import { MUSCLES } from './education-data';
import { NERVES } from './innervation';
import type { Part } from './anatomy';
import reference from './clinical-reference.json' with { type: 'json' };
import ClinicalNavigation, { ClinicalLink } from './clinical-navigation';
import ClinicalTestIllustration from './clinical-test-illustration';
import './clinical-reference.css';

const sources: Record<string, string[]> = reference.sources;
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
  parts: Part[];
  muscles: MyotomeMuscle[];
  hasPin: boolean;
  dermatome3D?: boolean;
  onDermatomeView?: (useModel: boolean) => void;
  dermatomeMap?: ReactNode;
  onPickLevel: (id: string) => void;
};

export default function ClinicalReference({value, onChange, parts, muscles, hasPin, dermatome3D, onDermatomeView, dermatomeMap, onPickLevel}: Props) {
  const { mode, region, side, levelId, testId } = value;
  const panel = useRef<HTMLElement>(null);
  useEffect(()=>{
    if(mode==='tests'&&panel.current)panel.current.scrollTop=0;
  },[mode,region,testId]);
  const visibleTests = tests.filter(test => test.region === region);
  const test = visibleTests.find(test => test.id === testId);
  const level = sensoryLevels.find(level => level.id === levelId)!;
  const rootColor = rootGroup(levelId)?.color;
  const availableLevels = mode === 'dermatomes' ? sensoryLevels : levels;
  const activeMuscle = muscles.find(muscle => muscle.key === value.motorMuscleKey);
  const primaryMuscles = muscles.filter(muscle => muscle.primary);
  const relatedMuscles = muscles.filter(muscle => !muscle.primary);
  const muscleDetail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mode === 'myotomes' && activeMuscle) muscleDetail.current?.scrollIntoView({ block: 'nearest' });
  }, [mode, activeMuscle?.key]);
  const relatedTests = tests.filter(item=>item.levels.some(id=>id===levelId));
  const visualTarget = hasPin || parts.length > 0;
  return <section ref={panel} id="atlas-content" className="study-panel glass clinical-reference" data-clinical-mode={mode} aria-label="Klinik Atlas" tabIndex={-1}>
    <div className="panel-heading">
      <strong>Klinik Atlas</strong>
    </div>
    <ClinicalNavigation active={mode} level={mode==='tests'?undefined:levelId} side={side}/>
    {mode === 'dermatomes' && <>
      <div className="clinical-reference-views" role="group" aria-label="Dermatom görünümü">
        <Button variant={dermatome3D ? 'outline' : 'default'} aria-pressed={!dermatome3D} onClick={() => onDermatomeView?.(false)}>Harita</Button>
        <Button variant={dermatome3D ? 'default' : 'outline'} aria-pressed={!!dermatome3D} onClick={() => onDermatomeView?.(true)}>3D model</Button>
      </div>
      <p className="clinical-reference-hint">Duyu alanını seçmek için renkli bölgeye dokun.</p>
      {dermatomeMap}
    </>}
    {mode !== 'tests' && <div className="clinical-reference-views">
      <Button aria-pressed={side === 'left'} variant="outline" onClick={() => onChange({side:'left'})}>Sol</Button>
      <Button aria-pressed={side === 'right'} variant="outline" onClick={() => onChange({side:'right'})}>Sağ</Button>
      {(mode === 'myotomes' || dermatome3D) && <><Button aria-pressed={value.view === 'front'} variant="ghost" onClick={() => onChange({view:'front',focus:0})}>Ön</Button>
      <Button aria-pressed={value.view === 'back'} variant="ghost" onClick={() => onChange({view:'back',focus:0})}>Arka</Button></>}
    </div>}
    {mode === 'tests' ? <div className="clinical-test-flow">
      {!region ? <>
        <h3>Hangi bölgeyi incelemek istiyorsun?</h3>
        <p className="clinical-reference-hint">Modeldeki işarete dokun veya aşağıdan bölgeyi seç.</p>
        <div className="clinical-region-grid">
          {regions.map(region => <Button key={region} variant="outline" onClick={() => onChange({region})}>{region}</Button>)}
        </div>
      </> : <>
        <div className="clinical-test-navigation">
          <Button variant="ghost" onClick={() => onChange({region:'', view:'front', focus:0})}>← Bölgeler</Button>
          {test && <Button variant="ghost" onClick={() => onChange({testId:''})}>Testleri göster</Button>}
        </div>
        {!test && <>
          <h3>{region} testleri</h3>
          <div className="clinical-test-list">
            {visibleTests.map(test => <Button key={test.id} variant="outline" onClick={() => onChange({testId:test.id})}>{test.title}</Button>)}
          </div>
        </>}
        <details className="clinical-model-settings">
          <summary>Model görünümü</summary>
          <div className="clinical-reference-views" aria-label="Model yönü ve tarafı">
            <Button aria-pressed={side === 'left'} variant="outline" onClick={() => onChange({side:'left'})}>Sol</Button>
            <Button aria-pressed={side === 'right'} variant="outline" onClick={() => onChange({side:'right'})}>Sağ</Button>
            <Button aria-pressed={value.view === 'front'} variant="ghost" onClick={() => onChange({view:'front',focus:0})}>Ön</Button>
            <Button aria-pressed={value.view === 'back'} variant="ghost" onClick={() => onChange({view:'back',focus:0})}>Arka</Button>
            {visualTarget && <Button variant="outline" onClick={() => onChange({focus:value.focus+1})}>Yakın göster</Button>}
          </div>
          <label className="atlas-region">Model katmanı
            <select value={value.testLayer ?? 'anatomy'} onChange={event => onChange({testLayer:event.target.value as ClinicalTestLayer})}>
              {Object.entries(clinicalTestLayers).filter(([id])=>id!=='target'||parts.length>0).map(([id,label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
        </details>
      </>}
    </div> : visualTarget && (mode === 'myotomes' || dermatome3D) && <Button variant="outline" onClick={() => onChange({focus:value.focus+1})}>Modelde yakından göster</Button>}
    {(mode !== 'tests' || test) && <article className="clinical-reference-card" aria-live="polite">
      {mode === 'tests' && test ? <>
        <p className="clinical-reference-hint">{region} · {test.tag}</p>
        <h3>{test.title}</h3>
        <p className="clinical-test-focus">{test.focus}</p>
        <ClinicalTestIllustration key={test.id} testId={test.id} title={test.title} />
        <p className="clinical-reference-hint">{parts.length > 0 ? 'Model, testle ilişkili anatomik yapıyı vurgular.' : 'Model, testin uygulandığı bölgeyi gösterir.'}</p>
        <dl className="clinical-test-steps">
          {test.position && <div><dt>Uygulama</dt><dd>{test.position}</dd></div>}
          {test.positiveMeaning ? <>
            <div><dt>Test pozitifse neyi düşündürür?</dt><dd>{test.positiveMeaning}</dd></div>
            <div><dt>Pozitiflik kriteri</dt><dd>{test.finding}</dd></div>
          </> : <div><dt>DVT şüphesinde</dt><dd>{test.finding}</dd></div>}
        </dl>
        <details className="clinical-reference-sources">
          <summary>Klinik yorum</summary>
          <p>{test.meaning}</p>
        </details>
        {test.levels.length > 0 && <div className="clinical-reference-views" aria-label="İlgili sinir kökleri">
          {test.levels.flatMap(id => [
            <ClinicalLink key={id+'-duyu'} route={{lesson:'clinical',clinicalMode:'dermatomes',clinicalLevel:id,side}}>{id} dermatomu</ClinicalLink>,
            <ClinicalLink key={id+'-motor'} route={{lesson:'clinical',clinicalMode:'myotomes',clinicalLevel:id,side}}>{id} miyotomu</ClinicalLink>,
          ])}
        </div>}
      </> : <div className="clinical-root-detail" style={{'--root-color': rootColor} as CSSProperties}>
        <div className="clinical-root-heading">
          <span className="clinical-root-badge">{levelId}</span>
          <div><p>{rootGroup(levelId)?.name} · {side === 'left' ? 'Sol' : 'Sağ'}</p>
            <h3>{mode === 'dermatomes' ? (levelId.startsWith('V')?'Yüzün duyu alanı':'Anahtar duyu noktası') : (level.motor||'İlişkili kaslar')}</h3>
          </div>
        </div>
        {mode === 'dermatomes' && <p>{level.sensory}</p>}
        {mode === 'dermatomes' && <p className="clinical-reference-hint">Alanlar şematiktir. Komşu köklerin duyu alanları örtüşebilir.</p>}
        {levels.some(entry=>entry.id===levelId) && <div className="clinical-root-links">
          <p><strong>{mode==='myotomes'?'Duyu noktası':'Anahtar hareket'}</strong> · {mode==='myotomes'?level.sensory:level.motor||'ISNCSCI anahtar motor testi tanımlamaz.'}</p>
          <div className="clinical-reference-views">
            <ClinicalLink route={{lesson:'clinical',clinicalMode:mode==='myotomes'?'dermatomes':'myotomes',clinicalLevel:levelId,side}}>{mode==='myotomes'?'Duyu haritasında göster':'Kasları ve sinirleri göster'}</ClinicalLink>
            {levelId==='L5'&&<ClinicalLink route={{lesson:'neuro-compare'}}>L5 ve fibularis karşılaştırması</ClinicalLink>}
          </div>
          {relatedTests.length>0&&<details className="clinical-related-muscles">
            <summary>İlişkili klinik testler</summary>
            <div className="clinical-reference-views">{relatedTests.map(item=>
              <ClinicalLink key={item.id} route={{lesson:'clinical',clinicalMode:'tests',clinicalTest:item.id,side}}>{item.title}</ClinicalLink>)}</div>
          </details>}
        </div>}
        {mode === 'myotomes' && !level.motor && <p>Bu düzey için ISNCSCI anahtar motor testi tanımlamaz.</p>}
        {mode === 'myotomes' && <div className="clinical-muscle-key">
          {activeMuscle && <div className="clinical-innervation" ref={muscleDetail} aria-label="Seçili kasın innervasyonu">
            <h4>{activeMuscle.name}</h4>
            <dl>
              {activeMuscle.innervation.map(entry => {
                const nerve = NERVES.find(item=>item.name===entry.nerve);
                return <div key={entry.nerve}>
                  <dt>{entry.nerve}</dt><dd>{entry.roots}</dd>
                  {nerve&&<ClinicalLink route={{lesson:'study',nerve:nerve.id,side}}>Siniri modelde göster</ClinicalLink>}
                </div>;
              })}
            </dl>
            {MUSCLES.some(item=>item.key===activeMuscle.key)&&<ClinicalLink route={{lesson:'study',muscle:activeMuscle.key,side}}>Atlas kas kartı</ClinicalLink>}
            {activeMuscle.note && <p>{activeMuscle.note}</p>}
            <Button variant="outline" size="sm" onClick={() => onChange({motorMuscleKey:undefined})}>Kök görünümüne dön</Button>
          </div>}
          {primaryMuscles.length > 0 && <MyotomeMuscleList title="Anahtar kaslar" muscles={primaryMuscles}
            active={activeMuscle?.key} onPick={key => onChange({motorMuscleKey:key,focus:value.focus+1})}/>}
          {relatedMuscles.length > 0 && (primaryMuscles.length ? <details className="clinical-related-muscles">
            <summary>Diğer ilişkili kaslar ({relatedMuscles.length})</summary>
            <Button variant="outline" aria-pressed={!!value.showRelatedMotorMuscles}
              onClick={() => onChange({showRelatedMotorMuscles:!value.showRelatedMotorMuscles,motorMuscleKey:undefined})}>
              {value.showRelatedMotorMuscles ? 'Yalnızca anahtar kasları göster' : 'İlişkili kasları modelde göster'}
            </Button>
            <MyotomeMuscleList muscles={relatedMuscles} active={activeMuscle?.key}
              onPick={key => onChange({motorMuscleKey:key,focus:value.focus+1})}/>
          </details> : <MyotomeMuscleList title="İlişkili kaslar" muscles={relatedMuscles} active={activeMuscle?.key}
            onPick={key => onChange({motorMuscleKey:key,focus:value.focus+1})}/>)}
        </div>}
      </div>}
      <Sources ids={test && mode === 'tests' ? test.sources : mode==='myotomes'?['isncsci','uw_motor','thoracic_motor','abdominal_motor','lumbar_motor','cervical_motor','pelvic_motor','anal_motor','coccygeus_motor']:['isncsci','map_variability','trigeminal','map']} />
    </article>}
    {mode !== 'tests' && <div className="clinical-root-picker" aria-label="Sinir kökleri">
      {rootGroups.map(group => {
        const groupLevels = availableLevels.filter(level => level.id.startsWith(group.prefix));
        if (!groupLevels.length) return null;
        return <div key={group.prefix} className="clinical-root-group" style={{'--root-color': group.color} as CSSProperties} role="group" aria-label={group.name}>
          <p>{group.name}</p>
          <div className="clinical-root-choices">
            {groupLevels.map(level => <Button key={level.id} variant="outline" aria-pressed={level.id === levelId} onClick={() => onPickLevel(level.id)}>{level.id}</Button>)}
          </div>
        </div>;
      })}
    </div>}
  </section>;
}

function MyotomeMuscleList({ title, muscles, active, onPick }: {
  title?: string;
  muscles: MyotomeMuscle[];
  active?: string;
  onPick: (key: string) => void;
}) {
  return <div className="clinical-myotome-muscles">
    {title && <h4>{title}</h4>}
    <ul>{muscles.map(muscle => <li key={muscle.key}>
      <Button variant={active === muscle.key ? 'default' : 'outline'} aria-pressed={active === muscle.key}
        onClick={() => onPick(muscle.key)}>{muscle.name}</Button>
    </li>)}</ul>
  </div>;
}
