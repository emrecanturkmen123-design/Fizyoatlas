import type { Region } from './case-schema';

const isncsci = 'https://asia-spinalinjury.org/wp-content/uploads/2019/10/ASIA-ISCOS-Worksheet_10.2019_PRINT-Page-1-2.pdf';
const uw = 'https://rad.uw.edu/muscle-atlas/';
export const footDropSource = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6637663/';
export const upperLimbSource = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3908974/';

type Choice = { prompt: string; answer: string; options: string[]; explanation: string };
type MotorCheck = {
  key: string; root: string; muscleSource: string;
  nerve: Choice; motion: Choice;
};

function check(prompt: string, answer: string, distractors: string[], explanation: string): Choice {
  return {prompt,answer,options:[...distractors.slice(0,1),answer,...distractors.slice(1)],explanation};
}

function motor(key: string, root: string, nerve: string, movement: string, alternatives: string[], sourceKey=key.replaceAll(' ','-')): MotorCheck {
  return {key,root,muscleSource:uw+sourceKey,
    nerve:check('Hangi periferik sinir bu kası innerve eder?',nerve,
      ['N. femoralis','N. medianus','N. radialis','N. tibialis'].filter(n=>n!==nerve).slice(0,3),nerve+' bu kasın motor innervasyonuna katkı verir.'),
    motion:check(root+' düzeyinin anahtar motor değerlendirmesi hangisidir?',movement,alternatives,
      root+' düzeyinde anahtar motor değerlendirme '+movement.toLocaleLowerCase('tr')+' ile yapılır.')};
}

export const motorChecks = [
  motor('biceps brachii','C5','N. musculocutaneus','Dirsek fleksiyonu',['Dirsek ekstansiyonu','El bileği ekstansiyonu','Parmak abdüksiyonu']),
  motor('extensor carpi radialis longus','C6','N. radialis','El bileği ekstansiyonu',['El bileği fleksiyonu','El bileği pronasyonu','Parmak addüksiyonu']),
  motor('triceps brachii','C7','N. radialis','Dirsek ekstansiyonu',['Dirsek fleksiyonu','Önkol pronasyonu','El bileği fleksiyonu']),
  motor('tibialis anterior','L4','N. fibularis profundus','Ayak bileği dorsifleksiyonu',['Ayak bileği plantar fleksiyonu','Diz fleksiyonu','Kalça ekstansiyonu']),
  motor('extensor hallucis longus','L5','N. fibularis profundus','Ayak başparmağı ekstansiyonu',['Ayak başparmağı fleksiyonu','Diz ekstansiyonu','Kalça fleksiyonu']),
  motor('gastrocnemius','S1','N. tibialis','Ayak bileği plantar fleksiyonu',['Ayak bileği dorsifleksiyonu','Ayak başparmağı ekstansiyonu','Diz ekstansiyonu']),
];

export const stations = [
  {
    id:'diz',title:'Diz · Lachman',region:'knee' as Region, key:'rectus femoris',
    finding:'locate:anterior cruciate ligament:right',testId:'lachman',
    scenario:'Kurgusal vaka. Yön değiştirirken dizinden ses gelen bir sporcu ön çapraz bağ açısından değerlendiriliyor.',
    questions:[
      check('Lachman’da hangi uygulama doğrudur?','Diz hafif fleksiyondayken femuru sabitle ve tibiayı öne çek.',
        ['Tibiayı arkaya it.','Diz tam ekstansiyondayken tibianın dış rotasyonunu ölç.','Femuru serbest bırak ve yalnız ayak bileğini çek.'],'Femurun stabilizasyonu, tibianın femura göre hareketini değerlendirmeyi sağlar.'),
      check('Karşı tarafa göre artmış öne hareket ve yumuşak son his neyi düşündürür?','Ön çapraz bağ yaralanması olasılığını',
        ['Tek başına menisküs yırtığını','İzole Aşil tendon rüptürünü','Yalnız patellofemoral ağrıyı'],'Bulgular ön çapraz bağ yaralanması olasılığını destekler ve öykü ile diğer muayene bulgularıyla birlikte değerlendirilir.'),
    ],
    source:'https://www.aafp.org/pubs/afp/issues/2018/1101/p576.html',
  },
  {
    id:'ayak',title:'Ayak düşmesi · L5 ve fibular sinir',region:'ankle' as Region,key:'extensor hallucis longus',
    finding:'locate:muscle:extensor hallucis longus:right',testId:undefined,
    scenario:'Kurgusal vaka. Kişinin sağ ayağı yürürken yere takılıyor. Ayak bileği dorsifleksiyonu ve eversiyonu zayıf.',
    questions:[
      check('Bulguları ayırt etmek için hangi ek motor değerlendirme anlamlıdır?','İnversiyon ve kalça abdüksiyonu',
        ['Yalnız dirsek fleksiyonu','Yalnız omuz iç rotasyonu','Yalnız parmak fleksiyonu'],'İnversiyon ve kalça abdüksiyonu, ortak fibular sinirin dışındaki motor hedefler hakkında bilgi verir.'),
      check('İnversiyon ve kalça abdüksiyonu korunmuşsa bu örnekte hangisi daha olasıdır?','Ortak fibular sinir tutulumu',
        ['İzole tibial sinir tutulumu','Femoral sinir tutulumu','Kesin L5 radikülopatisi'],'Dorsifleksiyon ve eversiyon zayıfken inversiyon ve kalça abdüksiyonunun korunması ortak fibular sinir tutulumunu destekler.'),
    ],
    source:footDropSource,
  },
  {
    id:'omuz',title:'Omuz · Hawkins–Kennedy',region:'shoulder' as Region,key:'supraspinatus',
    finding:'locate:muscle:supraspinatus:right',testId:'hawkins',
    scenario:'Kurgusal vaka. Baş üstüne uzanırken ön-yan omuz ağrısı artan bir kişi değerlendiriliyor.',
    questions:[
      check('Hawkins–Kennedy’de hangi manevra kullanılır?','Omuz ve dirsek fleksiyondayken omuzda pasif iç rotasyon',
        ['Omuz adduksiyonda pasif dış rotasyon','Dirsekte dirençli ekstansiyon','Önkolda aktif supinasyon'],'Dirsek desteklenirken önkol, omuzda iç rotasyon oluşturacak şekilde yönlendirilir.'),
      check('Tanıdık ağrı oluşursa en uygun yorum hangisidir?','Subakromiyal ağrı olasılığını diğer bulgularla değerlendir.',
        ['Tam kat tendon yırtığı kesinleşti.','Ön çapraz bağ yaralanması kesinleşti.','Tek bulguyla servikal radikülopatiyi doğrula.'],'Ağrı provokasyonu tek başına belirli bir doku hasarını doğrulamaz.'),
    ],
    source:'https://www.aafp.org/pubs/afp/issues/2008/0215/p453.html',
  },
];

export const motorQuestionId = (root: string, kind: 'nerve' | 'motion') => 'foundation:motor-'+root+':'+kind;
export const stationQuestionId = (id: string, index: number) => 'foundation:station-'+id+':'+index;

export const clinicalLearningQuestions = [
  ...motorChecks.flatMap(m=>(['nerve','motion'] as const).map(kind=>({
    ...m[kind],id:motorQuestionId(m.root,kind),prompt:m.key+' · '+m[kind].prompt,
    muscleKey:m.key,displayName:m.root+' nörolojik değerlendirme',region:'neuro' as Region,
    topic:kind==='nerve'?'nerve' as const:'action' as const,source:kind==='nerve'?m.muscleSource:isncsci,
  }))),
  ...stations.flatMap(s=>s.questions.map((q,i)=>({
    ...q,id:stationQuestionId(s.id,i),muscleKey:s.key,displayName:s.title,region:s.region,topic:'clinical' as const,source:s.source,
  }))),
];
