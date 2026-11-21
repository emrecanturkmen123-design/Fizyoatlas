import type { Atlas, Part, SystemId, View } from './anatomy';
import reference from './clinical-reference.json';
import { myotomeMuscles } from './myotome-muscles';
import landmarks from './clinical-landmarks.json';
export { default as dermAreaLabels } from './dermatome-labels.json';
import dermAreaLabels from './dermatome-labels.json';

export const { tests, levels } = reference;
export const sensoryLevels = [...levels,
  {id:'V1',sensory:'N. ophthalmicus · alın ve üst göz kapağı.',motor:''},
  {id:'V2',sensory:'N. maxillaris · yanak ve üst dudak.',motor:''},
  {id:'V3',sensory:'N. mandibularis · alt dudak ve çene.',motor:''},
];
export const regions = [...new Set(tests.map(test => test.region))];
export const rootGroups = [
  { prefix: 'C', name: 'Servikal', color: '#af7518' },
  { prefix: 'T', name: 'Torakal', color: '#286297' },
  { prefix: 'L', name: 'Lomber', color: '#41804c' },
  { prefix: 'S', name: 'Sakral', color: '#8c4a86' },
  { prefix: 'V', name: 'Trigeminal', color: '#a64b67' },
] as const;

export function rootGroup(id: string) {
  return rootGroups.find(group => id.startsWith(group.prefix));
}

export type ClinicalMode = 'tests' | 'dermatomes' | 'myotomes';
export const clinicalTestLayers = {
  anatomy: 'Kas ve iskelet',
  target: 'Hedef yapı ve kemikler',
  skeleton: 'İskelet',
  surface: 'Vücut yüzeyi',
} as const;
export type ClinicalTestLayer = keyof typeof clinicalTestLayers;
export type ClinicalSide = 'left' | 'right';
export type Landmark = { id: string; side: ClinicalSide; position: number[]; normal: number[] };
export type ClinicalSelection = {
  mode: ClinicalMode;
  region: string;
  testId: string;
  testLayer?: ClinicalTestLayer;
  levelId: string;
  areaPin?: Landmark;
  motorMuscleKey?: string;
  showRelatedMotorMuscles?: boolean;
  side: ClinicalSide;
  view: View;
  focus: number;
};
export const defaultClinical: ClinicalSelection = {
  mode: 'tests', region: '', testId: '', testLayer: 'anatomy', levelId: 'C6', side: 'left', view: 'front', focus: 0,
};

const testParts: Record<string, RegExp> = {
  neer: /supraspinatus$|supraspinatus tendon$/, hawkins: /supraspinatus$|supraspinatus tendon$/,
  jobe: /supraspinatus$|supraspinatus tendon$/, drop_arm: /supraspinatus$|infraspinatus$/,
  speed: /long head of (left|right) biceps brachii$/, yergason: /long head of (left|right) biceps brachii$/,
  cozen: /extensor carpi radialis brevis$/, mill: /extensor carpi radialis brevis$/,
  phalen: /median nerve$|wrist flexor retinaculum$|flexor retinaculum of (left|right) wrist$/,
  tinel: /median nerve$|wrist flexor retinaculum$|flexor retinaculum of (left|right) wrist$/,
  finkelstein: /abductor pollicis longus$|extensor pollicis brevis$/,
  spurling: /^(third|fourth|fifth|sixth|seventh) cervical vertebra$/,
  slr: /sciatic nerve$/, femoral_stretch: /femoral nerve$/,
  adams: /^(third|sixth|ninth|twelfth) thoracic vertebra$/,
  thomas: /iliacus$|psoas major$|rectus femoris$/,
  ober: /iliotibial tract$|tensor fasciae latae$/,
  trendelenburg: /gluteus medius$/,
  lachman: /anterior cruciate ligament$/, knee_anterior: /anterior cruciate ligament$/,
  knee_posterior: /posterior cruciate ligament$/, posterior_sag: /posterior cruciate ligament$/,
  valgus: /medial collateral ligament$/, varus: /lateral collateral ligament$/,
  mcmurray: /medial meniscus$|lateral meniscus$/, apley: /medial meniscus$|lateral meniscus$/,
  clarke: /patella$/, ankle_anterior: /anterior talofibular ligament$/,
  talar_tilt: /calcaneofibular ligament$/, thompson: /calcaneal tendon$/,
};

function partSide(name: string) {
  return name.match(/\b(left|right)\b/i)?.[1].toLowerCase();
}

export function clinicalParts(atlas: Atlas, selection: ClinicalSelection) {
  if (selection.mode !== 'tests') return [];
  const matches = (pattern: RegExp, parts: Part[]) => parts.filter(part => {
    const name = part.name.toLowerCase(), side = partSide(name);
    return (!side || side === selection.side) && pattern.test(name.replace(/^(left|right) /, ''));
  });
  const pattern = testParts[selection.testId];
  const targets = pattern ? matches(pattern, atlas.parts) : [];
  return targets;
}

const normalizePins = (pins: typeof landmarks.tests): Landmark[] => pins.map(pin => ({
  ...pin, side: pin.side === 'left' ? 'left' : 'right',
}));
const testPins = normalizePins(landmarks.tests);
const dermatomePins = normalizePins(landmarks.dermatomes);

const focusedRegions: Record<string,string> = {
  faber:'Kalça', gaenslen:'Kalça', femoral_stretch:'Kalça', slr:'Kalça',
};

function testFocusPin(selection:ClinicalSelection):Landmark|undefined {
  if(selection.testId==='spurling'){
    const side=selection.side;
    return {id:selection.region,side,position:[side==='left'?.035:-.035,1.46,-.064],normal:[0,0,-1]};
  }
  const region=focusedRegions[selection.testId]??selection.region;
  return testPins.find(pin=>pin.id===region&&pin.side===selection.side);
}

export function updateClinicalTests(atlas:Atlas|null, current:ClinicalSelection, change:Partial<ClinicalSelection>):ClinicalSelection {
  const next={...current,...change};
  if(change.region!==undefined){
    const regionChanged=change.region!==current.region;
    if(regionChanged){next.testId='';next.testLayer='anatomy';}
    if(!next.region){next.focus=0;return next;}
  }
  if(change.testId!==undefined){
    const test=tests.find(test=>test.id===change.testId&&test.region===next.region);
    next.testId=test?.id??'';
    next.testLayer=atlas&&test&&clinicalParts(atlas,next).length?'target':'anatomy';
  }
  if((change.region!==undefined||change.testId!==undefined||change.side!==undefined)&&next.region){
    const pin=testFocusPin(next);
    if(pin)next.view=pin.normal[2]<0?'back':'front';
    next.focus=current.focus+1;
  }
  return next;
}

function defaultAreaPin(id:string,side:ClinicalSide):Landmark|undefined {
  const sensoryPoint=dermatomePins.find(pin=>pin.id===id&&pin.side===side);
  const areas=dermAreaLabels.filter(area=>area.id===id);
  const area=areas.find(area=>area.normal[2]===Math.sign(sensoryPoint?.normal[2]??1))??areas[0];
  if(!area)return sensoryPoint;
  const [x,y,z]=area.position;
  return {...area,side,position:[side==='left'?x:-x,y,z]};
}

const clinicalSkin: SystemId[] = ['integumentary'];
const clinicalBones: SystemId[] = ['skeletal'];
const clinicalMuscles: SystemId[] = ['skeletal', 'muscular'];

export function clinicalPresentation(atlas: Atlas, selection: ClinicalSelection) {
  const muscles = selection.mode === 'myotomes' ? myotomeMuscles(atlas, selection.levelId, selection.side) : [];
  const selectedMuscle = muscles.find(muscle => muscle.key === selection.motorMuscleKey);
  const showPrimaryOnly = !selection.showRelatedMotorMuscles && muscles.some(muscle => muscle.primary);
  const parts = selection.mode === 'myotomes'
    ? (selectedMuscle ? [selectedMuscle] : muscles.filter(muscle => !showPrimaryOnly || muscle.primary)).flatMap(muscle => muscle.parts)
    : clinicalParts(atlas, selection);
  const pins = selection.mode === 'tests' ? testPins : [];
  const active = selection.mode === 'tests' ? selection.region : selection.levelId;
  const testLayer = selection.mode === 'tests' ? selection.testLayer ?? 'anatomy' : undefined;
  const focusPin=selection.mode==='dermatomes'
    ? selection.areaPin?.id===active&&selection.areaPin.side===selection.side
      ? selection.areaPin : defaultAreaPin(active,selection.side)
    : selection.mode==='tests'?testFocusPin(selection):undefined;
  return {
    parts, muscles, pins, active, mode: selection.mode, testLayer, side: selection.side,
    visible: selection.mode === 'dermatomes' || testLayer === 'surface' ? clinicalSkin
      : testLayer === 'skeleton'||testLayer==='target' ? clinicalBones : clinicalMuscles,
    contextOpacity: selection.mode === 'myotomes' ? .09
      : testLayer === 'surface' ? .86 : testLayer === 'target' && parts.length ? .28 : 1,
    focusPin,
  };
}
