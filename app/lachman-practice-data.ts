import type { Region } from './case-schema';

const meta={
  displayName:'Diz · Lachman',muscleKey:'rectus femoris',region:'knee' as Region,topic:'clinical' as const,
  source:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3782299/',
};

export const lachmanBounds=[16,60,288,126] as const;
export const lachmanSpots=[
  {id:'femur',x:133,y:116,label:'1. bölge'},
  {id:'tibia',x:188,y:129,label:'2. bölge'},
  {id:'ankle',x:252,y:137,label:'3. bölge'},
] as const;

export const lachmanDirectionSpots=[
  {id:'Öne doğru',x:218,y:91,label:'Öne doğru',symbol:'↗'},
  {id:'Arkaya doğru',x:191,y:155,label:'Arkaya doğru',symbol:'↙'},
  {id:'Yana doğru',x:255,y:112,label:'Yana doğru',symbol:'↔'},
] as const;

export const lachmanPlacementOptions={
  femur:'Distal femur',
  tibia:'Proksimal tibia',
  ankle:'Ayak bileği',
} as const;

const placements=Object.values(lachmanPlacementOptions);
export const lachmanTechnique = [
  {...meta,id:'foundation:lachman:stabilize',prompt:'Sabitleyen el nereye yerleşir?',options:placements,
    answer:lachmanPlacementOptions.femur,explanation:'Sabitleyen el dizin hemen proksimalinde distal femuru kontrol eder.'},
  {...meta,id:'foundation:lachman:grasp',prompt:'Hareketi uygulayan el nereye yerleşir?',options:placements,
    answer:lachmanPlacementOptions.tibia,explanation:'Diğer el proksimal tibiayı arka taraftan kavrar.'},
  {...meta,id:'foundation:lachman:direction',prompt:'Femur sabitken tibiayı hangi yöne hareket ettirirsin?',
    options:lachmanDirectionSpots.map(spot=>spot.id),answer:'Öne doğru',explanation:'Tibia femura göre öne çekilir.'},
];
