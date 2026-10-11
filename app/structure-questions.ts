import {DISTAL_STUDIES} from './distal-tendons';
import {CLINICAL_STRUCTURES} from './clinical-structures';
import {LIGAMENT_INFO} from './ligament-data';
import type {TendonQuestion} from './tendon-questions';
const contrasts:Record<string,[string,string,string,string,string]>={
 'flexor digitorum profundus tendon':['FDP tendonunu FDS’den ayıran distal bağlantı hangisidir?','Distal falanks','Orta falanks','Metakarp tabanı','Radius başı'],
 'flexor digitorum superficialis tendon':['FDS tendonunun doğrudan fleksiyon katkısı hangi eklemdedir?','Proksimal interfalangeal eklem','Distal interfalangeal eklem','Başparmak interfalangeal eklemi','Dirsek eklemi'],
 'extensor digitorum tendon':['Parmak ekstansör tendonları hangi yapıya devam eder?','Ekstansör genişlemeler','Patellar ligament','Fleksör retinakulumun kendisi','Aşil insertiosu'],
 'flexor pollicis longus tendon':['FPL hangi parmağa kuvvet iletir?','Başparmak','İşaret parmağı','Yüzük parmağı','Küçük parmak'],
 'extensor pollicis longus tendon':['EPL ile FPL’yi işlev açısından ayıran özellik hangisidir?','EPL başparmak ekstansiyonuna katkı verir','EPL yalnız başparmak fleksiyonu yapar','EPL ayak eversiyonu yapar','EPL dirsek supinasyonunun ana tendonudur'],
 'wrist flexor retinaculum':['Fleksör retinakulumla ilişkili karpal tünelde hangi sinir bulunur?','Median sinir','Femoral sinir','Tibial sinir','Aksiller sinir'],
 'wrist extensor retinaculum':['Ekstansör retinakulum el bileğinin hangi yüzündedir?','Dorsal yüz','Palmar yüz','Dirseğin iç yüzü','Başparmağın distal ucu'],
 'digital fibrous sheath':['Fibröz kılıf ile sinovyal kılıf için doğru ayrım hangisidir?','Bunlar tendon çevresindeki farklı dokulardır','İkisi aynı kasın iki başıdır','Fibröz kılıf tendonun kemiğe insertiosudur','Sinovyal kılıf bir parmak kemiğidir'],
 'digital synovial sheath':['Sinovyal kılıfın tendonla ilişkisi hangisidir?','Tendonun kaydığı çevre dokudur','Tendonun aktif kasılan bölgesidir','Tendonun distal kemik bağlantısıdır','Tendonun motor siniridir'],
 'common flexor tendon sheath':['Ortak fleksör tendon kılıfı hangi tendonlarla ilişkilidir?','FDS ve FDP','Aşil ve patellar tendon','Tibialis ve fibularis tendonları','Quadriceps ve biseps uzun başı'],
 'tibialis anterior tendon':['Tibialis anteriorun tibialis posteriordan farklı temel hareket katkısı hangisidir?','Dorsifleksiyon','Plantar fleksiyon','Parmak ekstansiyonu olmadan eversiyon','Diz ekstansiyonu'],
 'tibialis posterior tendon':['Tibialis posterior tendonu hangi malleolün arkasından geçer?','Medial malleol','Lateral malleol','Patella üst kutbu','Fibula başı'],
 'fibularis longus tendon':['Fibularis longus tendonu distal bağlantıya giderken hangi yolu izler?','Ayak tabanını geçer','Patellanın önünü geçer','Medial epikondilden başlar','Karpal tünelden geçer'],
 'fibularis brevis tendon':['Fibularis brevisin distal bağlantısı hangisidir?','Beşinci metatarsal tabanı','Birinci metatarsal tabanı','Calcaneusun arka yüzü','Navicular tüberkülü'],
 'ankle flexor retinaculum':['Ayak bileği fleksör retinakulumunun yerel konumu hangisidir?','Medial ayak bileği','Ön ayak bileği','El bileğinin dorsal yüzü','Dizin arka çapraz bölgesi'],
 'ankle extensor retinacula':['Ayak bileği ekstansör retinakulumları hangi yüzdedir?','Ön ayak bileği','Medial diz','Elin palmar yüzü','Uyluğun arka yüzü'],
 'fibular retinacula':['Fibular retinakulumların yerel ilişkisi hangisidir?','Lateral malleol çevresindeki fibular tendonlar','Patella üstündeki quadriceps tendonu','Karpal tüneldeki fleksör tendonlar','Femurun iç yan bağı'],
 'tibialis tendon sheaths':['Bu kartta hangi kasların tendon kılıfları birlikte gösterilir?','Tibialis anterior ve posterior','Gastrocnemius ve soleus','Fibularis longus ve brevis','FDS ve FDP'],
 'fibular tendon sheaths':['Bu kartta gösterilen kılıflar hangi tendon grubuna aittir?','Fibular tendonlar','Tibialis tendonları','Parmak fleksör tendonları','Rotator manşet tendonları'],
};
function make(key:string,index:number,prompt:string,answer:string,wrong:string[],explanation:string,source:string,region:'knee'|'ankle'|'elbow'):TendonQuestion {const options=[answer,...new Set(wrong.filter(w=>w!==answer))].slice(0,4);return {id:`tendon:${key}:${index}`,key,muscleKey:region==='knee'?'rectus femoris':region==='ankle'?'tibialis anterior':'extensor carpi radialis brevis',region,prompt,answer,options,explanation,source,rationales:Object.fromEntries(options.map(c=>[c,c===answer?explanation:'Bu seçenek yapının konumu veya işleviyle uyuşmuyor. '+explanation]))};}
const choose=(pool:string[],answer:string)=>[...new Set(pool)].filter(v=>v!==answer).slice(0,3);
export const STRUCTURE_QUESTIONS:TendonQuestion[]=DISTAL_STUDIES.flatMap(s=>{
 const region=s.module==='hand'?'elbow':'ankle',pool=DISTAL_STUDIES.filter(x=>x.module===s.module),source=s.sources.find(x=>!x.label.includes('Open3DModel'))?.url??s.sources[0].url,c=contrasts[s.key],type=s.kind==='Tendon bölgesi'?'Tendon':s.kind,relation=s.muscles.length?s.muscles.join(', '):s.key.includes('extensor')?'Ekstansör tendonlar':s.key.includes('fibular')?'Fibular tendonlar':s.key.includes('tibialis')?'Tibialis tendonları':s.module==='hand'?'Parmak fleksör tendonları':'Ayak bileği fleksör tendonları';
 return [make(s.key,0,s.name+' için doğru konum veya bağlantı hangisidir?',s.attachment,choose(pool.map(x=>x.attachment),s.attachment),s.attachment,source,region),make(s.key,1,s.name+' için doğru görev hangisidir?',s.action,choose(pool.map(x=>x.action),s.action),s.action,source,region),make(s.key,2,s.name+' hangi doku türüdür?',type,choose(['Tendon','Retinakulum','Fibröz kılıf','Sinovyal kılıf','Kemik','Motor sinir'],type),s.kind==='Tendon bölgesi'?'Kas kuvvetini ileten tendon bölgesidir.':s.name+' tendonun kendisinden ayrı bir çevre dokusudur.',source,region),make(s.key,3,c[0],c[1],c.slice(2),s.attachment+' '+s.action,source,region),make(s.key,4,s.name+' hangi kas veya tendon grubuyla ilişkilidir?',relation,choose(['Rotator manşet kasları','Quadriceps kasları','Parmak fleksör tendonları','Ekstansör tendonlar','Fibular tendonlar','Tibialis tendonları'],relation),s.attachment,source,region)];
});
const ligamentFacts:Record<string,[string,string,string]>={
 'anterior cruciate ligament':['ÖÇB tibianın hangi aşırı yer değiştirmesini sınırlar?','Öne kayma','Arkaya kayma'],
 'posterior cruciate ligament':['AÇB tibianın hangi aşırı yer değiştirmesini sınırlar?','Arkaya kayma','Öne kayma'],
 'medial collateral ligament':['MCL hangi iki kemiği bağlar?','Femur ve tibia','Femur ve fibula'],
 'lateral collateral ligament':['LCL hangi iki kemiği bağlar?','Femur ve fibula','Femur ve tibia'],
 'anterior talofibular ligament':['ATFL hangi iki kemik arasındadır?','Fibula ve talus','Fibula ve calcaneus'],
 'calcaneofibular ligament':['CFL hangi iki kemik arasındadır?','Fibula ve calcaneus','Fibula ve talus'],
 'posterior talofibular ligament':['PTFL talusun hangi bölümüyle ilişkilidir?','Arka bölüm','Ön bölüm'],
 'medial meniscus':['İç menisküs eklemin hangi bölümündedir?','Medial bölüm','Lateral bölüm'],
 'lateral meniscus':['Dış menisküs eklemin hangi bölümündedir?','Lateral bölüm','Medial bölüm'],
};
for(const [key,fact] of Object.entries(ligamentFacts)){
 const s=CLINICAL_STRUCTURES.find(s=>s.key===key)!,info=LIGAMENT_INFO[key],region=s.region==='Diz'?'knee':'ankle',meniscus=s.kind==='Menisküs',source=info.sources[0].url;
 STRUCTURE_QUESTIONS.push(make(key,0,s.name+' için doğru bağlantı veya konum hangisidir?',info.attachment,choose(Object.values(LIGAMENT_INFO).map(x=>x.attachment),info.attachment),info.attachment,source,region),make(key,1,s.name+' için doğru işlev hangisidir?',info.action,choose(Object.values(LIGAMENT_INFO).map(x=>x.action),info.action),info.action,source,region),make(key,2,fact[0],fact[1],[fact[2],'Karpal tünel','Calcaneus insertiosu'],info.attachment+' '+info.action,source,region),make(key,3,s.name+' için doğru doku ayrımı hangisidir?',meniscus?'Fibrokartilaj yapı':'Kemikleri bağlayan bağ',meniscus?['Kas kuvvetini kemiğe ileten tendon','Motor sinir','Aktif kasılan kas']:['Aktif kasılan kas','Eklem içindeki menisküs','Motor sinir'],meniscus?'Menisküsler bağ ve tendonlardan ayrı fibrokartilaj yapılardır.':'Bağlar eklem stabilitesine katkı verir; kas gibi aktif kasılmaz.',source,region),make(key,4,s.name+' için bu modelin kapsamı hangisidir?','Sağlıklı referans anatomi',['Hastanın yırtık derecesi','Ölçülmüş bağ gerilimi','Kişiye özel tedavi kararı'],s.note,source,region));
}
