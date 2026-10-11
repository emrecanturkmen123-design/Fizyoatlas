import {TENDON_INFO} from './tendon-data';
import {clinicalStructure,geometryLabel} from './clinical-structures';
import type {WorkspaceRoute} from './workspace-route';
export interface TendonComparison {id:string;title:string;intro:string;sides:{title:string;route:WorkspaceRoute;quizKey:string;scope:string}[];rows:{label:string;values:[string,string]}[];sources:{label:string;url:string}[]}
export const TENDON_COMPARISONS:TendonComparison[]=[
 {id:'knee-chain',title:'Quadriceps ve patellar tendon',intro:'Patella, diz ekstansör zincirindeki bu iki bağlantının arasındadır.',sides:[
  {title:'Quadriceps tendonu',route:{lesson:'study',tab:'connective',structure:'quadriceps tendon'},quizKey:'quadriceps tendon',scope:'Kaynak ortak tendon gövdesi ve dört kas gösterilir; medial katkı ortak yüzeyde yer alır. İç katmanlar ayrı çözümlenmez.'},
  {title:'Patellar tendon',route:{lesson:'study',tab:'connective',structure:'patellar ligament'},quizKey:'patellar ligament',scope:'Kaynak modelde ayrı tendon yüzeyi seçilebilir.'}],rows:[
  {label:'Bağlantı',values:['Quadriceps kas grubu → patellanın üst bölümü','Patellanın alt kutbu → tuberositas tibiae']},
  {label:'Kuvvetin yolu',values:['Kas kuvvetini patellaya aktarır.','Patelladan tibiaya kuvvet iletir.']},
  {label:'Yerel değerlendirme',values:['Patella üstündeki bölge, aktif ekstansiyon ve yük öyküsü','Patella altındaki bölge, aktif ekstansiyon ve sıçrama yükü']},
  {label:'Karıştırma',values:['Patellanın altındaki bağlantı quadriceps tendonu değildir.','Yakındaki her ön diz ağrısı patellar tendon kaynaklı değildir.']}],sources:[{label:'Ekstansör zincir · AAOS',url:'https://www.orthoinfo.org/diseases--conditions/quadriceps-tendon-tear/'},{label:'Patellar bağlantı · AAOS',url:'https://www.orthoinfo.org/diseases--conditions/patellar-tendon-tear/'}]},
 {id:'achilles-location',title:'Aşil orta bölüm ve insertio',intro:'Aynı tendonun iki farklı klinik yerleşimi. Yerleşim, değerlendirmeyi ve yükleme aralığını etkiler.',sides:[
  {title:'Orta bölüm',route:{lesson:'study',tab:'connective',structure:'calcaneal tendon'},quizKey:'calcaneal tendon',scope:'Sağlıklı referans yüzeyi; hasta patolojisi gösterilmez.'},
  {title:'Insertio',route:{lesson:'study',tab:'connective',structure:'calcaneal tendon'},quizKey:'calcaneal tendon',scope:'Aynı tendonun calcaneusa tutunan distal bölgesi.'}],rows:[
  {label:'Yerleşim',values:['Tendon gövdesinde, topuk bağlantısının üzerinde','Calcaneus bağlantısı çevresinde']},
  {label:'Kas bağlantısı',values:['Gastrocnemius–soleus kompleksinin devamı','Aynı kompleksin topuk kemiğine bağlantısı']},
  {label:'Yükleme',values:['Hareket aralığı ve direnç semptom yanıtına göre düzenlenir.','Derin topuk indirme otomatik başlangıç seçeneği değildir; aralık uyarlanır.']},
  {label:'Karıştırma',values:['Orta bölüm yakınması tam rüptür anlamına gelmez.','Insertio yerleşimi tendon kopması derecesi değildir.']}],sources:[{label:'Yerleşim ve egzersiz aralığı · AAOS',url:'https://www.orthoinfo.org/diseases--conditions/achilles-tendinitis/'}]},
 {id:'biceps-ends',title:'Biseps uzun baş ve distal tendon',intro:'Omuzdaki uzun baş bağlantısını dirsekteki distal bağlantıdan ayır.',sides:[
  {title:'Uzun baş · proksimal',route:{lesson:'study',tab:'connective',structure:'biceps long head tendon'},quizKey:'biceps long head tendon',scope:'Kaynak proksimal tendon bölgesi ve uzun baş kası birlikte gösterilir.'},
  {title:'Distal biseps',route:{lesson:'study',tab:'connective',structure:'biceps distal tendon'},quizKey:'biceps distal tendon',scope:'Kaynak distal tendon bölgesi ayrı seçilir; aponevrozun tüm yayılımı gösterilmez.'}],rows:[
  {label:'Bağlantı',values:['Scapulanın supraglenoid bölgesi ve üst labrum','Radiusun tuberositas radiisi']},
  {label:'Bölge',values:['Omuzdaki proksimal bağlantı','Dirsekteki distal bağlantı']},
  {label:'İşlev',values:['Biseps kuvvet aktarımının proksimal tarafı','Önkol supinasyonu ve dirsek fleksiyonuna kuvvet iletimi']},
  {label:'Karıştırma',values:['Kısa baş coracoidten başlar; aynı başlangıç değildir.','Uzun başın omuz bağlantısı distal radius bağlantısı değildir.']}],sources:[{label:'Biseps anatomisi · University of Washington',url:'https://rad.uw.edu/muscle-atlas/biceps-brachii'},{label:'Distal tendon · AAOS',url:'https://www.orthoinfo.org/diseases--conditions/biceps-tendon-tear-at-the-elbow/'}]},
 ...[
  {id:'cuff-rotation',title:'Infraspinatus ve subscapularis',keys:['infraspinatus tendon','subscapularis tendon insertion surface'] as [string,string],intro:'Manşetin arka ve ön bağlantılarını, dış ve iç rotasyon katkılarını karşılaştır.'},
  {id:'cuff-elevation',title:'Supraspinatus ve teres minor',keys:['supraspinatus tendon insertion surface','teres minor tendon insertion surface'] as [string,string],intro:'Aynı manşet grubundaki iki kasın tutunma bölgeleri ve hareket katkıları farklıdır.'},
 ].map(pair=>({id:pair.id,title:pair.title,intro:pair.intro,sides:pair.keys.map(key=>({title:clinicalStructure(key)!.name,route:{lesson:'study',tab:'connective',structure:key} as WorkspaceRoute,quizKey:key,scope:geometryLabel(clinicalStructure(key)!)+'. '+clinicalStructure(key)!.note})),rows:[
  {label:'Bağlı kas',values:pair.keys.map(key=>TENDON_INFO[key].muscles) as [string,string]},
  {label:'Kemik bağlantısı',values:pair.keys.map(key=>TENDON_INFO[key].attachment) as [string,string]},
  {label:'Hareket katkısı',values:pair.keys.map(key=>TENDON_INFO[key].action) as [string,string]},
  {label:'Klinik değerlendirme',values:pair.keys.map(key=>TENDON_INFO[key].clinical) as [string,string]},
 ],sources:TENDON_INFO[pair.keys[0]].sources})),
];
export const comparisonFor=(key:string)=>TENDON_COMPARISONS.find(pair=>pair.sides.some(s=>s.route.structure===key))?.id;
