import type { Atlas, Part, SystemId, View } from './anatomy';
import reference from './clinical-reference.json';
import { muscleFor } from './education-data';
import { muscleReview } from './muscle-review';
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
  side: ClinicalSide;
  view: View;
  focus: number;
};
export const defaultClinical: ClinicalSelection = {
  mode: 'tests', region: '', testId: '', testLayer: 'anatomy', levelId: 'C6', side: 'left', view: 'front', focus: 0,
};

const motorMuscles: Record<string, RegExp> = {
  C5: /biceps brachii|^brachialis$/,
  C6: /extensor carpi radialis (brevis|longus)$/,
  C7: /triceps brachii$/,
  C8: /flexor digitorum profundus$/,
  T1: /abductor digiti minimi of (left|right) hand$/,
  L2: /iliacus$|psoas major$/,
  L3: /rectus femoris$|vastus (intermedius|lateralis|medialis)$/,
  L4: /tibialis anterior$/,
  L5: /extensor hallucis longus$/,
  S1: /gastrocnemius$|soleus$/,
};
const rootOrder = levels.map(level=>level.id);

function rootIncluded(description: string, id: string) {
  for (const match of description.matchAll(/([CTLS]\d+)(?:[–-]([CTLS]\d+))?/g)) {
    const index = rootOrder.indexOf(id);
    const first = rootOrder.indexOf(match[1]), last = rootOrder.indexOf(match[2] ?? match[1]);
    if (first >= 0 && index >= first && index <= last) return true;
  }
  return false;
}

const thoracicLevels = Array.from({length:11},(_,index)=>'T'+(index+1));
const additionalMotor = [
  {roots:['C3','C4','C5'], muscles:/^diaphragm$/, nerve:'N. phrenicus'},
  {roots:thoracicLevels, muscles:/intercostal muscle$/, nerve:'Nn. intercostales'},
  {roots:['T7','T8','T9','T10','T11','T12'], muscles:/external oblique$/, nerve:'Nn. thoracoabdominales · N. subcostalis'},
  {roots:['L1','L2','L3','L4'], muscles:/psoas major$/, nerve:'Lomber spinal sinirlerin ön dalları'},
  {roots:['C8','T1'], muscles:/abductor digiti minimi of (left|right) hand$/, nerve:'N. ulnaris · derin dal'},
];

export function motorLevelAvailable(id:string) {
  return !!motorMuscles[id] || ['C3','C4','L1','S2'].includes(id) || /^T(?:[2-9]|1[0-2])$/.test(id);
}

export function motorNerve(part:Part, levelId:string) {
  const extra=additionalMotor.find(entry=>entry.roots.includes(levelId)&&entry.muscles.test(part.name.toLowerCase()));
  return extra?.nerve ?? muscleFor(part.name)?.nerve.split(' · ')[0];
}

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
  if (selection.mode === 'dermatomes') return [];
  const matches = (pattern: RegExp, parts: Part[]) => parts.filter(part => {
    const name = part.name.toLowerCase(), side = partSide(name);
    return (!side || side === selection.side) && pattern.test(name.replace(/^(left|right) /, ''));
  });
  if (selection.mode === 'myotomes') {
    const pattern = motorMuscles[selection.levelId];
    return atlas.parts.filter(part=>{
      if(part.system!=='muscular')return false;
      const name=part.name.toLowerCase(),side=partSide(name);
      if(side&&side!==selection.side)return false;
      if(pattern?.test(name.replace(/^(left|right) /,'')))return true;
      if(additionalMotor.some(entry=>entry.roots.includes(selection.levelId)&&entry.muscles.test(name)))return true;
      const muscle=muscleFor(part.name);
      const roots=muscle&&muscleReview(muscle.key).roots;
      return !!roots&&rootIncluded(roots,selection.levelId);
    });
  }
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
  const parts = clinicalParts(atlas, selection);
  const pins = selection.mode === 'tests' ? testPins : [];
  const active = selection.mode === 'tests' ? selection.region : selection.levelId;
  const testLayer = selection.mode === 'tests' ? selection.testLayer ?? 'anatomy' : undefined;
  const focusPin=selection.mode==='dermatomes'
    ? selection.areaPin?.id===active&&selection.areaPin.side===selection.side
      ? selection.areaPin : defaultAreaPin(active,selection.side)
    : selection.mode==='tests'?testFocusPin(selection):undefined;
  return {
    parts, pins, active, mode: selection.mode, testLayer, side: selection.side,
    visible: selection.mode === 'dermatomes' || testLayer === 'surface' ? clinicalSkin
      : testLayer === 'skeleton'||testLayer==='target' ? clinicalBones : clinicalMuscles,
    contextOpacity: selection.mode === 'myotomes' ? .17
      : testLayer === 'surface' ? .86 : testLayer === 'target' && parts.length ? .28 : 1,
    focusPin,
  };
}
