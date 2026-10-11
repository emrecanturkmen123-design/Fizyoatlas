import type {Region} from './case-schema';
const base='https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const spine=base+'7-3-the-vertebral-column',joints=base+'9-6-anatomy-of-selected-synovial-joints',nerves=base+'13-4-the-peripheral-nervous-system',tissue=base+'12-2-nervous-tissue',limb=base+'8-4-bones-of-the-lower-limb';
type Fact=[string,string,string,string,string,string];
const groups:{region:Region;displayName:string;muscleKey:string;source:string;facts:Fact[]}[]=[
 {region:'spine',displayName:'Omurga temelleri',muscleKey:'latissimus dorsi',source:spine,facts:[
 ['Servikal omur sayısı kaçtır?','7','5','12','8','Servikal bölgede yedi omur vardır.'],
 ['Torakal omur sayısı kaçtır?','12','7','5','8','Torakal bölge on iki omurdan oluşur.'],
 ['Lomber omur sayısı kaçtır?','5','7','12','8','Lomber bölge beş omurdan oluşur.'],
 ['Atlas hangi omurdur?','C1','C2','T1','L1','Birinci servikal omur atlas adını alır.'],
 ['Axis hangi omurdur?','C2','C1','T2','L2','İkinci servikal omur axis adını alır.'],
 ['Omurilik hangi kemik kanalında korunur?','Vertebral kanal','Karpal tünel','Femoral kanal','Tarsal tünel','Omur deliklerinin devamı vertebral kanalı oluşturur.'],
 ['İntervertebral diskler hangi yapılar arasında bulunur?','Komşu omur gövdeleri','Diken çıkıntıları','Kaburga başları','Omuz eklem yüzleri','Diskler omur gövdelerini birleştirir ve yükleri paylaşır.'],
 ['Diskin dış fibröz kısmı hangisidir?','Annulus fibrosus','Nucleus pulposus','Dens','Lamina','Diskin dış halkası annulus fibrosustur.'],
 ['Diskin merkezindeki yapı hangisidir?','Nucleus pulposus','Annulus fibrosus','Pedikül','Diken çıkıntısı','Diskin merkezi nucleus pulposustur.'],
 ['Sakrumun omurları erişkinde nasıl bir yapı oluşturur?','Birleşmiş kemik','Serbest yedi kemik','Karpal kemik dizisi','Humerus başı','Sakral omurlar birleşerek sakrumu oluşturur.'],
 ]},
 {region:'neuro',displayName:'Sinir sistemi temelleri',muscleKey:'biceps brachii',source:nerves,facts:[
 ['Merkezi sinir sisteminin temel bileşenleri hangileridir?','Beyin ve omurilik','Kas ve tendon','Sinir ve menisküs','Deri ve kemik','Beyin ile omurilik merkezi sinir sistemini oluşturur.'],
 ['Afferent liflerin temel yönü hangisidir?','Çevreden merkezi sinir sistemine','Merkezden kasa','Tendondan kemiğe','Kemikten deriye','Afferent lifler duyusal bilgiyi merkeze taşır.'],
 ['Efferent lifler motor bilgiyi hangi yönde taşır?','Merkezden hedef dokuya','Çevreden merkeze','Kemiğin içine','Diskin dış halkasına','Efferent lifler merkezden çevredeki hedeflere uzanır.'],
 ['Spinal sinirin oluşumuna hangi kökler katılır?','Dorsal ve ventral kök','İki dorsal kök','İki ventral kök','Tendon ve bağ','Dorsal ve ventral kökler birleşerek spinal siniri oluşturur.'],
 ['Dorsal kök ağırlıklı olarak hangi lifleri taşır?','Duyusal lifler','Yalnız somatik motor lifler','Tendon lifleri','Bağ lifleri','Dorsal kök duyusal girdiyi omuriliğe taşır.'],
 ['Ventral kökün temel işlevsel yönü hangisidir?','Motor çıkış','Duyusal giriş','Kemik yük aktarımı','Disk basıncı','Ventral kök efferent motor lifleri taşır.'],
 ['Bir periferik sinir tek bir spinal kökün doğrudan devamı mıdır?','Birden çok kökten lif içerebilir','Daima yalnız tek köktür','Omurilikle ilişkisi yoktur','Daima bir tendondur','Pleksuslarda farklı köklerden gelen lifler yeniden dağılır.'],
 ['Dermatom hangi alanı ifade eder?','Bir spinal sinirle ilişkili deri alanı','Bir tendonun insertiosu','Bir bağın kemik alanı','Bir menisküs bölgesi','Dermatom, spinal duyusal dağılımla ilişkili bir deri alanıdır.'],
 ['Motor sinir ile tendon için doğru ayrım hangisidir?','Sinir sinyal taşır, tendon kuvvet iletir','İkisi de kemiktir','Tendon elektriksel motor sinirdir','Sinir pasif bağdır','Sinir ile tendon farklı dokular ve işlevlerdir.'],
 ['Periferik sinir ile sinir kökü için doğru yaklaşım hangisidir?','İlişkili fakat farklı anatomik düzeylerdir','Daima aynı yapının iki adıdır','Kök yalnız tendon adıdır','Periferik sinir daima menisküstür','Kök ve periferik sinirin dağılımları aynı kavram değildir.'],
 ]},
 {region:'hip',displayName:'Kalça eklemi temelleri',muscleKey:'gluteus medius',source:joints,facts:[
 ['Kalça ekleminin kemik bileşenleri hangileridir?','Femur başı ve acetabulum','Femur ve patella','Tibia ve talus','Humerus ve ulna','Femur başı acetabulum içinde eklemleşir.'],
 ['Kalça hangi sinovyal eklem tipidir?','Küresel eklem','Menteşe eklem','Pivot eklem','Düzlemsel eklem','Kalça birden çok eksende hareket sağlayan küresel eklemdir.'],
 ['Acetabular labrumun temel katkısı hangisidir?','Eklem yuvasını derinleştirmek','Dizi ekstansiyona getirmek','Önkolu pronasyona getirmek','Patellayı tibiaya bağlamak','Labrum acetabulumun kenarında yer alır.'],
 ['Femur başı hangi kemiğin parçasıdır?','Femur','Tibia','Fibula','Patella','Femurun proksimal başı kalça eklemine katılır.'],
 ['Acetabulum nerede bulunur?','Kalça kemiğinde','Patellada','Calcaneusta','Radiusta','Kalça kemiği femur başını kabul eden acetabulumu taşır.'],
 ['Kalça abdüksiyonu hangi hareketi ifade eder?','Uyluğu orta hattan uzaklaştırma','Uyluğu orta hatta yaklaştırma','Dizi düzleştirme','Önkolu içe döndürme','Abdüksiyon, uyluğun orta hattan uzaklaşmasıdır.'],
 ['Kalça addüksiyonu hangi hareketi ifade eder?','Uyluğu orta hatta yaklaştırma','Uyluğu orta hattan uzaklaştırma','Ayak bileğini dorsifleksiyona getirme','Dirseği düzleştirme','Addüksiyon, uyluğun orta hatta yaklaşmasıdır.'],
 ['Kalça fleksiyonu için doğru örnek hangisidir?','Uyluğu gövdeye yaklaştırma','Uyluğu geriye götürme','Ayağı eversiyona getirme','Önkolu supinasyona getirme','Kalça fleksiyonunda uyluk gövdenin önüne yaklaşır.'],
 ['Kalça ekstansiyonu için doğru örnek hangisidir?','Uyluğu geriye götürme','Uyluğu gövdeye yaklaştırma','Dizi bükme','Parmağı ekstansiyona getirme','Ekstansiyon, uyluğun fleksiyondan geriye ilerlemesidir.'],
 ['Eklem kıkırdağı ile labrum için doğru ayrım hangisidir?','Eklem yüzeyini örten kıkırdak ile kenar yapısı farklıdır','İkisi aynı tendonun adıdır','Labrum femur kemiğinin tamamıdır','Eklem kıkırdağı bir motor sinirdir','Labrum kenardaki fibrokartilaj yapıdır; eklem yüzeyi kıkırdağından ayrıdır.'],
 ]},
];
export const FOUNDATION_QUESTIONS=groups.flatMap(g=>g.facts.map((f,i)=>({id:`foundation:${g.region}:${i}`,region:g.region,displayName:g.displayName,muscleKey:g.muscleKey,prompt:f[0],answer:f[1],options:f.slice(1,5),explanation:f[5],source:g.region==='neuro'&&(i===0||i===8)?tissue:g.region==='hip'&&(i===3||i===4)?limb:g.source,topic:g.region==='hip'&&i>=5&&i<=8?'action' as const:g.region==='neuro'?'nerve' as const:'name' as const})));
