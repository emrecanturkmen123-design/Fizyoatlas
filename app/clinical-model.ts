import type { Atlas, Part, SystemId, View } from './anatomy';
import reference from './clinical-reference.json';
import landmarks from './clinical-landmarks.json';

export const { tests, levels } = reference;
export const regions = [...new Set(tests.map(test => test.region))];
export const rootGroups = [
  { prefix: 'C', name: 'Servikal', color: '#14749a' },
  { prefix: 'T', name: 'Torakal', color: '#197b65' },
  { prefix: 'L', name: 'Lomber', color: '#774db4' },
  { prefix: 'S', name: 'Sakral', color: '#9d5917' },
] as const;

export function rootGroup(id: string) {
  return rootGroups.find(group => id.startsWith(group.prefix));
}

export type ClinicalMode = 'tests' | 'dermatomes' | 'myotomes';
export type ClinicalSide = 'left' | 'right';
export type Landmark = { id: string; side: ClinicalSide; position: number[]; normal: number[] };
export type ClinicalSelection = {
  mode: ClinicalMode;
  region: string;
  testId: string;
  levelId: string;
  side: ClinicalSide;
  view: View;
  focus: number;
};
export const defaultClinical: ClinicalSelection = {
  mode: 'tests', region: 'Omuz', testId: 'neer', levelId: 'C6', side: 'left', view: 'front', focus: 0,
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
const regionParts: Record<string, RegExp> = {
  Omuz: /^(scapula|clavicle|humerus)$/,
  Dirsek: /^(humerus|ulna|radius)$/,
  'El bileği': /^(radius|ulna|scaphoid|lunate)$/,
  'Omurga ve pelvis': /^(sacrum|hip bone|ilium)$/,
  Kalça: /^(hip bone|ilium|femur)$/,
  Diz: /^(femur|tibia|patella|fibula)$/,
  'Ayak bileği': /^(tibia|fibula|talus|calcaneus)$/,
  'Alt bacak': /^(tibia|fibula)$/,
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
  if (selection.mode === 'dermatomes') return [];
  const matches = (pattern: RegExp, parts: Part[]) => parts.filter(part => {
    const name = part.name.toLowerCase(), side = partSide(name);
    return (!side || side === selection.side) && pattern.test(name.replace(/^(left|right) /, ''));
  });
  if (selection.mode === 'myotomes') {
    const pattern = motorMuscles[selection.levelId];
    return pattern ? matches(pattern, atlas.parts.filter(part => part.system === 'muscular')) : [];
  }
  const pattern = testParts[selection.testId];
  const targets = pattern ? matches(pattern, atlas.parts) : [];
  if (targets.length) return targets;
  const region = regionParts[selection.region];
  return region ? matches(region, atlas.parts.filter(part => part.system === 'skeletal')) : [];
}

const normalizePins = (pins: typeof landmarks.tests): Landmark[] => pins.map(pin => ({
  ...pin, side: pin.side === 'left' ? 'left' : 'right',
}));
const testPins = normalizePins(landmarks.tests);
const dermatomePins = normalizePins(landmarks.dermatomes);

const clinicalSkin: SystemId[] = ['integumentary'];
const clinicalBones: SystemId[] = ['skeletal'];
const clinicalMuscles: SystemId[] = ['skeletal', 'muscular'];

export function clinicalPresentation(atlas: Atlas, selection: ClinicalSelection) {
  const parts = clinicalParts(atlas, selection);
  const pins = selection.mode === 'tests' ? testPins : selection.mode === 'dermatomes' ? dermatomePins : [];
  const active = selection.mode === 'tests' ? selection.region : selection.levelId;
  return {
    parts, pins, active, mode: selection.mode, side: selection.side,
    visible: selection.mode === 'dermatomes' ? clinicalSkin : selection.mode === 'myotomes' ? clinicalMuscles : clinicalBones,
    focusPin: pins.find(pin => pin.id === active && pin.side === selection.side),
  };
}
