import type { Atlas, Part } from './anatomy';
import type { ClinicalSide } from './clinical-model';
import { muscleFor } from './education-data';
import { muscleReview } from './muscle-review';

type Innervation = { nerve: string; roots: string };
export type MyotomeMuscle = {
  key: string;
  name: string;
  primary: boolean;
  parts: Part[];
  innervation: Innervation[];
  note?: string;
};

const keyMuscles: Record<string, string[]> = {
  C5: ['biceps brachii', 'brachialis'],
  C6: ['extensor carpi radialis longus', 'extensor carpi radialis brevis'],
  C7: ['triceps brachii'],
  C8: ['flexor digitorum profundus'],
  T1: ['abductor digiti minimi hand'],
  L2: ['iliacus', 'psoas major'],
  L3: ['rectus femoris', 'vastus lateralis', 'vastus medialis', 'vastus intermedius'],
  L4: ['tibialis anterior'],
  L5: ['extensor hallucis longus'],
  S1: ['gastrocnemius', 'soleus'],
};

const addedMuscles: Record<string, { name: string; innervation: Innervation[]; note?: string }> = {
  'abductor digiti minimi hand': { name: 'M. abductor digiti minimi (el)', innervation: [{ nerve: 'N. ulnaris · derin dal', roots: 'C8–T1' }] },
  'flexor digitorum profundus': {
    name: 'M. flexor digitorum profundus',
    innervation: [
      { nerve: 'N. medianus · n. interosseus anterior (işaret ve orta parmak)', roots: 'C8–T1' },
      { nerve: 'N. ulnaris (yüzük ve küçük parmak)', roots: 'C8–T1' },
    ],
    note: 'C8 anahtar motor muayenesinde orta parmağın distal fleksiyonu değerlendirilir.',
  },
  diaphragm: { name: 'Diyafram', innervation: [{ nerve: 'N. phrenicus', roots: 'C3–C5' }] },
  'external oblique': {
    name: 'M. obliquus externus abdominis',
    innervation: [{ nerve: 'Nn. thoracoabdominales · n. subcostalis', roots: 'T7–T12' }],
  },
  'splenius capitis': { name: 'M. splenius capitis', innervation: [{ nerve: 'Servikal spinal sinirlerin arka dalları', roots: 'C2–C3' }] },
  'iliococcygeus': { name: 'M. iliococcygeus', innervation: [{ nerve: 'N. musculi levatoris ani', roots: 'S2–S4' }] },
  'pubococcygeus': { name: 'M. pubococcygeus', innervation: [{ nerve: 'N. musculi levatoris ani', roots: 'S2–S4' }] },
  'puborectalis': { name: 'M. puborectalis', innervation: [{ nerve: 'Levator ani dalları · pudendal katkı', roots: 'S2–S4' }] },
  'external anal sphincter': { name: 'M. sphincter ani externus', innervation: [{ nerve: 'N. pudendus · nn. rectales inferiores', roots: 'S2–S4' }] },
  coccygeus: { name: 'M. coccygeus', innervation: [{ nerve: 'Sakral spinal sinirlerin ön dalları', roots: 'S4–S5' }] },
};

const intercostals: Record<string, string> = {
  'external intercostal muscle': 'Mm. intercostales externi',
  'internal intercostal muscle': 'Mm. intercostales interni',
  'innermost intercostal muscle': 'Mm. intercostales intimi',
};

const rootOrder = [
  ...Array.from({ length: 8 }, (_, i) => `C${i + 1}`),
  ...Array.from({ length: 12 }, (_, i) => `T${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `L${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `S${i + 1}`),
];

function includesRoot(roots: string, level: string) {
  const indices = (level === 'S4–5' ? ['S4', 'S5'] : [level]).map(root => rootOrder.indexOf(root));
  return Array.from(roots.matchAll(/([CTLS]\d+)(?:[–-]([CTLS]\d+))?/g)).some(match => {
    const first = rootOrder.indexOf(match[1]);
    const last = rootOrder.indexOf(match[2] ?? match[1]);
    return first >= 0 && indices.some(index => index >= first && index <= last);
  });
}

export function innervationRoots(roots: string) {
  return [...rootOrder.slice(0, -2), 'S4–5'].filter(level => includesRoot(roots, level));
}

function myotomePart(part: Part) {
  const name = part.name.toLowerCase().replace(/^(left|right) /, '');
  const specialKey = /^abductor digiti minimi of (left|right) hand$/.test(name) ? 'abductor digiti minimi hand' : name;
  const special = addedMuscles[specialKey];
  if (special) return { key: specialKey, ...special };
  if (intercostals[name]) return {
    key: name,
    name: intercostals[name],
    innervation: [{ nerve: 'Nn. intercostales · komşu aralığın segmental dalı', roots: 'T1–T11' }],
    note: 'Atlas bu kas katmanını kaburga aralıklarına ayrılmamış tek bir grup olarak gösterir.',
  };
  const muscle = muscleFor(part.name);
  if (!muscle) return;
  const { motorRoots:roots, note } = muscleReview(muscle.key);
  if (!roots) return;
  const nerve = muscle.nerve.replace(/ · [CTLS]\d+(?:[–-][CTLS]\d+)?$/, '');
  return { key: muscle.key, name: muscle.name, innervation: [{ nerve, roots }], note };
}

export function myotomeMuscles(atlas: Atlas, level: string, side: ClinicalSide) {
  const muscles = new Map<string, MyotomeMuscle>();
  const keys = keyMuscles[level] ?? [];

  for (const part of atlas.parts) {
    if (part.system !== 'muscular') continue;
    const partSide = part.name.match(/\b(left|right)\b/i)?.[1].toLowerCase();
    if (partSide && partSide !== side) continue;
    const data = myotomePart(part);
    if (!data) continue;
    const primary = keys.includes(data.key);
    if (!primary && !data.innervation.some(entry => includesRoot(entry.roots, level))) continue;
    const existing = muscles.get(data.key);
    if (existing) existing.parts.push(part);
    else muscles.set(data.key, { ...data, primary, parts: [part] });
  }

  return [...muscles.values()].sort((a, b) => Number(b.primary) - Number(a.primary) || a.name.localeCompare(b.name, 'tr'));
}
