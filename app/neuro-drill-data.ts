import type { Region } from './case-schema';

export type NeuroRegion='lower'|'upper'|'mixed';
export type DrillKind='all'|'motor'|'sensory'|'reflex';

export const keySensorySource='https://asia-spinalinjury.org/wp-content/uploads/2016/02/Key_Sensory_Points.pdf';
export const reflexSource='https://www.msdmanuals.com/professional/neurologic-disorders/neurologic-examination/how-to-assess-reflexes';

export const sensoryPoints={
  L4:'Medial malleol',
  L5:'Ayak sırtında üçüncü metatarsofalangeal eklem',
  S1:'Topuğun dış yanı',
  C6:'Başparmağın proksimal falanksının sırtı',
  C7:'Orta parmağın proksimal falanksının sırtı',
  C8:'Küçük parmağın proksimal falanksının sırtı',
} as const;
export type SensoryRoot=keyof typeof sensoryPoints;
export const lowerSensory=['L4','L5','S1'] as const;
export const upperSensory=['C6','C7','C8'] as const;

const sensoryMuscles:Record<SensoryRoot,string>={L4:'tibialis anterior',L5:'extensor hallucis longus',S1:'gastrocnemius',C6:'extensor carpi radialis longus',C7:'triceps brachii',C8:'flexor digitorum profundus'};
const rootsFor=(root:SensoryRoot)=>root.startsWith('C')?upperSensory:lowerSensory;
export const sensoryPointQuestions=(Object.keys(sensoryPoints) as SensoryRoot[]).flatMap(root=>{
  const options=rootsFor(root);
  const meta={muscleKey:sensoryMuscles[root],displayName:root+' anahtar duyu noktası',region:'neuro' as Region,topic:'clinical' as const,source:keySensorySource};
  return [
    {...meta,id:'foundation:sensory:'+root+':point',prompt:`${root} kökünün ISNCSCI anahtar duyu noktası hangisi?`,
      answer:sensoryPoints[root],options:options.map(point=>sensoryPoints[point]),explanation:sensoryPoints[root]+' bu düzeyin standart değerlendirme noktasıdır.'},
    {...meta,id:'foundation:sensory:'+root+':root',prompt:`${sensoryPoints[root]} hangi kökün anahtar duyu noktasıdır?`,
      answer:root,options:[...options],explanation:`${sensoryPoints[root]} · ${root}.`},
  ];
});

const reflexQuestions=[
  {level:'L4',name:'Patellar',key:'rectus femoris',movement:'Diz ekstansiyonu',rootOptions:['L2','L4','S1']},
  {level:'S1',name:'Aşil',key:'gastrocnemius',movement:'Ayak bileği plantar fleksiyonu',rootOptions:['L4','L5','S1']},
  {level:'C5',name:'Biseps',key:'biceps brachii',movement:'Dirsek fleksiyonu',rootOptions:['C5–C6','C7–C8','C8–T1']},
] as const;
export const reflexDrillQuestions=reflexQuestions.flatMap(item=>{
  const meta={muscleKey:item.key,displayName:item.name+' refleksi',region:'neuro' as Region,topic:'clinical' as const,source:reflexSource};
  const choices=item.level==='C5'?['Dirsek ekstansiyonu','Dirsek fleksiyonu','El bileği ekstansiyonu']:
    ['Diz ekstansiyonu','Ayak bileği dorsifleksiyonu','Ayak bileği plantar fleksiyonu'];
  const root=item.level==='C5'?'C5–C6':item.level;
  return [
    {...meta,id:'foundation:reflex:'+item.level+':response',prompt:`${item.name} refleksinde hangi hareket beklenir?`,answer:item.movement,options:choices,
      explanation:`Beklenen hareket ${item.movement.toLocaleLowerCase('tr')}.`},
    {...meta,id:'foundation:reflex:'+item.level+':root',prompt:`${item.name} refleksi değerlendirilirken hangi kök düzeyi öne çıkar?`,answer:root,options:[...item.rootOptions],
      explanation:item.level==='C5'?'Biseps refleksi C5–C6 ile ilişkilidir.':`${item.name} refleksi ağırlıklı olarak ${root} ile ilişkilidir.`},
  ];
});
