import type { KneeCourseStep, CourseQuestion } from "./knee-course-content";
export type RegionalCourseId =
  | "shoulder-foundations"
  | "elbow-foundations"
  | "hand-foundations"
  | "hip-foundations"
  | "ankle-foundations";
export type CourseSource = CourseQuestion["source"];
export interface CourseStructure {
  key: string;
  label: string;
  group: string;
  text: string;
  source: CourseSource;
}
export interface CourseMotion {
  label: string;
  text: string;
  visualKey: string;
  joint?: "shoulder" | "elbow" | "hip" | "ankle";
  id?: string;
  progress?: number;
}
export interface CourseCase {
  title: string;
  text: string;
  visualKey: string;
  questions: CourseQuestion[];
}
export interface RegionalCourseDefinition {
  id: RegionalCourseId;
  title: string;
  summary: string;
  structures: CourseStructure[];
  motions: CourseMotion[];
  anatomy: CourseQuestion[];
  motion: CourseQuestion[];
  chain: CourseQuestion[];
  chainText: string;
  chainKeys: string[];
  cases: CourseCase[];
  extra: CourseQuestion[];
  locateKey: string;
  locateLabel: string;
  sources: CourseSource[];
}
const source = (label: string, path: string): CourseSource => ({ label, url: path });
const upper = source(
  "Üst ekstremite kasları · OpenStax",
  "https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs",
);
const lower = source(
  "Alt ekstremite kasları · OpenStax",
  "https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs",
);
const joints = source(
  "Sinovyal eklemler · OpenStax",
  "https://openstax.org/books/anatomy-and-physiology-2e/pages/9-6-anatomy-of-selected-synovial-joints",
);
const moves = source(
  "Hareket türleri · OpenStax",
  "https://openstax.org/books/anatomy-and-physiology-2e/pages/9-5-types-of-body-movements",
);
const upperBones = source(
  "Üst ekstremite kemikleri · OpenStax",
  "https://openstax.org/books/anatomy-and-physiology-2e/pages/8-2-bones-of-the-upper-limb",
);
const lowerBones = source(
  "Alt ekstremite kemikleri · OpenStax",
  "https://openstax.org/books/anatomy-and-physiology-2e/pages/8-4-bones-of-the-lower-limb",
);
const cuff = source(
  "Rotator manşet · AAOS",
  "https://www.orthoinfo.org/diseases--conditions/rotator-cuff-tears/",
);
const tennis = source(
  "Lateral epikondil · AAOS",
  "https://www.orthoinfo.org/diseases--conditions/tennis-elbow-lateral-epicondylitis/",
);
const tunnel = source(
  "Karpal tünel · AAOS",
  "https://www.orthoinfo.org/diseases--conditions/carpal-tunnel-syndrome/",
);
const achilles = source(
  "Aşil tendonu · AAOS",
  "https://www.orthoinfo.org/diseases--conditions/achilles-tendinitis/",
);
const ankle = source(
  "Ayak bileği bağları · AAOS",
  "https://www.orthoinfo.org/diseases--conditions/sprained-ankle/",
);
const hand = source(
  "El ve önkol anatomisi · Texas Tech Üniversitesi",
  "https://anatomy.ttuhscep.edu/musculoskeletal_system/forearm_tables.html",
);
const pelvis = source(
  "Gluteus medius ve pelvis kontrolü · Kim ve ark.",
  "https://pubmed.ncbi.nlm.nih.gov/26079865/",
);
const gluteal = source(
  "Gluteus minimus · Washington Üniversitesi",
  "https://rad.uw.edu/muscle-atlas/gluteus-minimus",
);
const s = (
  key: string,
  label: string,
  group: string,
  text: string,
  src: CourseSource,
): CourseStructure => ({ key, label, group, text, source: src });
function q(
  prompt: string,
  answer: string,
  other: readonly [string, string],
  why: string,
  review: KneeCourseStep,
  src: CourseSource,
  visualKey?: string,
): CourseQuestion {
  const correct = [...prompt].reduce((n, c) => n + c.charCodeAt(0), 0) % 3,
    options = [...other];
  options.splice(correct, 0, answer);
  return { prompt, options, correct, why, review, source: src, visualKey };
}
const shoulder: RegionalCourseDefinition = {
  id: "shoulder-foundations",
  title: "Omuz",
  summary: "Omuz kuşağı, rotator manşet ve kol hareketleri",
  locateKey: "supraspinatus tendon insertion surface",
  locateLabel: "Supraspinatus tendonu",
  sources: [upper, upperBones, joints, cuff],
  structures: [
    s(
      "clavicle",
      "Clavicula",
      "Kemikler",
      "Köprücük kemiği, üst ekstremiteyi gövdeye bağlayan omuz kuşağının parçasıdır.",
      upperBones,
    ),
    s(
      "scapula",
      "Scapula",
      "Kemikler",
      "Glenoid çukur humerus başıyla eklemleşir. Scapulanın konumu kolun hareketine eşlik eder.",
      joints,
    ),
    s(
      "humerus",
      "Humerus",
      "Kemikler",
      "Proksimal başı glenoid ile eklemleşir; kas ve tendon tutunmaları için referanstır.",
      upperBones,
    ),
    s(
      "deltoid",
      "Deltoid",
      "Kaslar",
      "Orta lifler abdüksiyona, ön lifler fleksiyona, arka lifler ekstansiyona katkı verir.",
      upper,
    ),
    s(
      "supraspinatus",
      "Supraspinatus",
      "Rotator manşet",
      "Scapulanın spina üzerindeki fossasından başlar. Abdüksiyona ve humerus başının dinamik stabilitesine katkı verir.",
      upper,
    ),
    s(
      "infraspinatus",
      "Infraspinatus",
      "Rotator manşet",
      "Scapulanın arka yüzünde spina altındadır. Dış rotasyon ve dinamik stabiliteye katılır.",
      upper,
    ),
    s(
      "subscapularis",
      "Subscapularis",
      "Rotator manşet",
      "Scapulanın ön yüzündedir. İç rotasyona ve humerus başının stabilitesine katkı verir.",
      upper,
    ),
    s(
      "teres minor",
      "Teres minor",
      "Rotator manşet",
      "Rotator manşetin arka bölümündeki kaslardan biridir; dış rotasyona katılır.",
      upper,
    ),
    s(
      "supraspinatus tendon insertion surface",
      "Supraspinatus tendonu",
      "Tendonlar",
      "Supraspinatusun kuvvetini humerusa aktarır. Sağlıklı kaynak yüzey, yırtığın boyutunu göstermez.",
      cuff,
    ),
    s(
      "biceps long head tendon",
      "Biseps uzun baş tendonu",
      "Tendonlar",
      "Biseps uzun başının proksimal tendonudur; dört rotator manşet tendonundan biri değildir.",
      upper,
    ),
  ],
  motions: [
    {
      label: "Kolu yana aç",
      text: "Abdüksiyon: humerus orta hattan uzaklaşır. Deltoid ve supraspinatus çalışır; scapula da harekete katılır.",
      visualKey: "deltoid",
      joint: "shoulder",
      id: "abduction",
      progress: 50,
    },
    {
      label: "Kolu öne kaldır",
      text: "Fleksiyon sagittal düzlemde öne kaldırma hareketidir. Ön deltoid lifleri katkı verir.",
      visualKey: "deltoid",
      joint: "shoulder",
      id: "flexion",
      progress: 50,
    },
    {
      label: "Dışa döndür",
      text: "Humerusun dış rotasyonuna infraspinatus ve teres minor katkı verir. Dönen segment humerustur.",
      visualKey: "infraspinatus",
      joint: "shoulder",
      id: "external",
      progress: 60,
    },
    {
      label: "Skapula ve serratus anterior",
      text: "Serratus anterior skapulayı göğüs duvarına yakın tutar; protraksiyon ve yukarı rotasyona katkı verir. Kolu kaldırırken skapulanın rolünü düşün. Bu durakta kasın kaynak anatomisi vurgulanır; skapula hareketi oynatılmaz.",
      visualKey: "serratus anterior",
    },
  ],
  anatomy: [
    q(
      "Glenohumeral eklem hangi kemiklerin arasında oluşur?",
      "Scapula ve humerus",
      ["Clavicula ve radius", "Humerus ve ulna"],
      "Humerus başı scapulanın glenoid çukuruyla eklemleşir.",
      "anatomy",
      joints,
      "scapula",
    ),
    q(
      "Hangisi rotator manşet kası değildir?",
      "Deltoid",
      ["Supraspinatus", "Subscapularis"],
      "Manşet supraspinatus, infraspinatus, teres minor ve subscapularisten oluşur.",
      "anatomy",
      cuff,
      "deltoid",
    ),
    q(
      "Subscapularis scapulanın hangi yüzündedir?",
      "Ön yüzünde",
      ["Arka yüzünde spina altında", "Claviculanın üstünde"],
      "Subscapularis scapulanın kostal, yani ön yüzündeki fossadadır.",
      "anatomy",
      upper,
      "subscapularis",
    ),
  ],
  motion: [
    q(
      "Kolun yandan gövdeden uzaklaştırılması hangi harekettir?",
      "Abdüksiyon",
      ["Addüksiyon", "Dirsek fleksiyonu"],
      "Abdüksiyon kolu orta hattan uzaklaştırır.",
      "motion",
      moves,
      "deltoid",
    ),
    q(
      "Ön deltoid lifleri hangi harekete katkı verir?",
      "Omuz fleksiyonu",
      ["Ayak bileği eversiyonu", "Dirsek pronasyonu"],
      "Deltoidin ön lifleri kolu öne kaldırmaya katkı verir.",
      "motion",
      upper,
      "deltoid",
    ),
    q(
      "Omuz dış rotasyonunda hangi kas çifti önemlidir?",
      "Infraspinatus ve teres minor",
      ["Subscapularis ve pectoralis major", "Brachialis ve soleus"],
      "Infraspinatus ve teres minor dış rotasyona katkı verir.",
      "motion",
      upper,
      "infraspinatus",
    ),
  ],
  chainText:
    "Scapula kasın başlangıç zeminini sağlar; manşet kası, tendonu üzerinden humerusa kuvvet aktarır. Deltoid kolu kaldırırken rotator manşet humerus başının kontrolüne katkı verir. Tek bir kas omuzun bütün işini açıklamaz.",
  chainKeys: ["scapula", "supraspinatus", "supraspinatus tendon insertion surface", "humerus"],
  chain: [
    q(
      "Supraspinatus tendonu kuvveti hangi kemiğe aktarır?",
      "Humerus",
      ["Ulna", "Calcaneus"],
      "Manşet tendonları scapuladan gelen kas kuvvetini humerusa taşır.",
      "chain",
      upper,
      "supraspinatus tendon insertion surface",
    ),
    q(
      "Rotator manşetin temel ortak işlevlerinden biri hangisidir?",
      "Humerus başının dinamik stabilitesine katkı",
      ["El bileği fleksiyonu", "Tibianın öne kaymasını sınırlama"],
      "Tendonlar humerus başının çevresinde eklem kontrolüne katkı verir.",
      "chain",
      cuff,
      "humerus",
    ),
    q(
      "Biseps uzun baş tendonu ile supraspinatus tendonu için hangisi doğrudur?",
      "Farklı kaslara ait yapılardır",
      ["Aynı tendonun iki adı", "İkisi de dirsek bağlarıdır"],
      "Biseps uzun baş tendonu, supraspinatusun tendonuyla aynı yapı değildir.",
      "chain",
      upper,
      "biceps long head tendon",
    ),
  ],
  cases: [
    {
      title: "Yukarı uzanırken omuz ağrısı",
      text: "Kurgusal kişi raftan eşya alırken ağrı ve kolunu kaldırmada güçlük anlatıyor. Bu bulguları işlevsel zincire bağla.",
      visualKey: "supraspinatus tendon insertion surface",
      questions: [
        q(
          "İlk olarak hangi bölgesel işlev incelenmelidir?",
          "Omuz kaldırma ve rotator manşet işlevi",
          ["Ayak bileği plantar fleksiyonu", "Parmak distal fleksiyonu"],
          "Ağrılı yukarı uzanma omuz hareketi ve ilgili kas–tendonların değerlendirilmesini gerektirir.",
          "case",
          cuff,
        ),
        q(
          "Bu öykü tek başına neyi belirlemez?",
          "Yırtığın varlığını ve boyutunu",
          ["Yukarı uzanmanın zor olduğunu", "Omuzla ilişkili yakınma olduğunu"],
          "Öykü, muayene ve gerektiğinde görüntüleme birlikte değerlendirilir; ağrı tek başına yırtık derecesi değildir.",
          "case",
          cuff,
        ),
        q(
          "Modelden hangi bilgi elde edilebilir?",
          "Tendonun kemiğe göre konumu",
          ["Hastanın kişisel kuvveti", "Hastanın kesin tanısı"],
          "Sağlıklı referans anatomi konumu öğretir; kişiye ait doku hasarını ölçmez.",
          "case",
          cuff,
        ),
      ],
    },
    {
      title: "Dış rotasyonda güçlük",
      text: "İkinci kişi kolunu dışa çevirirken zorlanıyor. Rotasyon yönünü ve kas çiftini seç.",
      visualKey: "infraspinatus",
      questions: [
        q(
          "Bu harekette hangi kas grubu incelenir?",
          "Infraspinatus ve teres minor",
          ["Subscapularis ve teres major", "FDS ve FDP"],
          "İlk çift dış rotasyona katkı verir.",
          "case",
          upper,
        ),
        q(
          "Karşıt yöndeki harekete hangi kas katkı verir?",
          "Subscapularis",
          ["Infraspinatus", "Tibialis anterior"],
          "Subscapularis iç rotasyona katkı verir.",
          "case",
          upper,
        ),
        q(
          "Aktif ve pasif hareketin ayrı değerlendirilmesi neden yararlıdır?",
          "Hareket sınırını ve aktif kontrolü karşılaştırmak için",
          ["Tek başına yırtık yüzdesini hesaplamak için", "Kemik adlarını değiştirmek için"],
          "Aktif işlev ile dışarıdan sağlanan hareket farklı bilgiler verir; tek başına doku tanısı koydurmaz.",
          "case",
          cuff,
        ),
      ],
    },
  ],
  extra: [
    q(
      "Teres major için hangi ifade doğrudur?",
      "Rotator manşetin dört kasından biri değildir",
      ["Teres minorun diğer adıdır", "Tek başına omuz kuşağını oluşturur"],
      "Teres major omuz hareketlerine katılır ama dört kaslı manşet grubuna dahil değildir.",
      "anatomy",
      upper,
      "teres minor",
    ),
    q(
      "Scapulanın hareketi hangi etkinliğe eşlik eder?",
      "Kolun yukarı kaldırılmasına",
      ["Yalnız parmak bükmeye", "Yalnız diz açmaya"],
      "Omuz kuşağı humerusun hareketi için hareketli bir zemin sağlar.",
      "motion",
      upper,
      "scapula",
    ),
    q(
      "Humerusun iç rotasyonu ile dış rotasyonu nasıl ilişkilidir?",
      "Karşıt yönlerdeki hareketlerdir",
      ["Aynı yönün iki adı", "İkisi de dirsek ekstansiyonudur"],
      "İç ve dış rotasyon humerusun uzun ekseni çevresindeki karşıt yönlerdir.",
      "motion",
      moves,
    ),
    q(
      "Supraspinatus kası ve tendonu nasıl ilişkilidir?",
      "Kas kuvvetini tendon kemiğe aktarır",
      ["Tendon aktif kasılır", "Kas tendonun kılıfıdır"],
      "Tendon kasın ürettiği kuvveti kemiğe ileten bağlantıdır.",
      "chain",
      upper,
    ),
    q(
      "Omuz ağrısıyla sağlıklı model arasındaki fark nedir?",
      "Model referans anatomiyi gösterir",
      ["Model her ağrının nedenini kanıtlar", "Model kişisel doku tanısıdır"],
      "Referans anatomi kişiye ait patoloji görüntüsü değildir.",
      "case",
      cuff,
    ),
  ],
};
const elbow: RegionalCourseDefinition = {
  id: "elbow-foundations",
  title: "Dirsek–önkol",
  summary: "Fleksiyon, ekstansiyon, pronasyon ve supinasyon",
  locateKey: "biceps distal tendon",
  locateLabel: "Distal biseps tendonu",
  sources: [upper, upperBones, joints, tennis],
  structures: [
    s(
      "humerus",
      "Humerus",
      "Kemikler",
      "Distal ucu radius ve ulna ile dirsek bölgesini oluşturur.",
      joints,
    ),
    s(
      "radius",
      "Radius",
      "Kemikler",
      "Anatomik pozisyonda önkolun başparmak tarafındadır; önkol rotasyonuna katılır.",
      upperBones,
    ),
    s(
      "ulna",
      "Ulna",
      "Kemikler",
      "Önkolun küçük parmak tarafındadır. Olecranon dirseğin arka kemik çıkıntısıdır.",
      upperBones,
    ),
    s(
      "biceps brachii",
      "Biceps brachii",
      "Kaslar",
      "Dirsek fleksiyonuna ve önkol supinasyonuna katkı verir.",
      upper,
    ),
    s(
      "brachialis",
      "Brachialis",
      "Kaslar",
      "Ulna bağlantısı üzerinden dirsek fleksiyonuna katılır.",
      upper,
    ),
    s(
      "triceps brachii",
      "Triceps brachii",
      "Kaslar",
      "Ulna olecranonuna kuvvet aktararak dirsek ekstansiyonuna katılır.",
      upper,
    ),
    s(
      "pronator teres",
      "Pronator teres",
      "Kaslar",
      "Önkol pronasyonuna katılır; bu hareket el bileği fleksiyonu değildir.",
      upper,
    ),
    s(
      "supinator",
      "Supinator",
      "Kaslar",
      "Radiusun dönmesiyle önkol supinasyonuna katılır.",
      upper,
    ),
    s(
      "biceps distal tendon",
      "Distal biseps tendonu",
      "Tendonlar",
      "Bisepsin distal kuvvet aktarımı radiusun tuberositas radiisine olur.",
      upper,
    ),
    s(
      "common extensor tendon",
      "Ortak ekstansör tendon",
      "Tendonlar",
      "Lateral epikondil bölgesindeki el bileği ve parmak ekstansör bağlantılarıdır.",
      tennis,
    ),
  ],
  motions: [
    {
      label: "Dirseği bük",
      text: "Fleksiyonda önkol kola yaklaşır. Biceps ve brachialis katkı verir.",
      visualKey: "biceps brachii",
      joint: "elbow",
      id: "flexion",
      progress: 50,
    },
    {
      label: "Avucu aşağı çevir",
      text: "Pronasyon radioulnar eklemlerde olur. Radius ulna çevresinde döner.",
      visualKey: "pronator teres",
      joint: "elbow",
      id: "pronation",
      progress: 70,
    },
    {
      label: "Avucu yukarı çevir",
      text: "Supinasyonda radius ve ulna daha paralel duruma gelir. Supinator ve biceps katkı verir.",
      visualKey: "supinator",
      joint: "elbow",
      id: "supination",
      progress: 70,
    },
  ],
  anatomy: [
    q(
      "Anatomik pozisyonda radius hangi taraftadır?",
      "Başparmak tarafında",
      ["Küçük parmak tarafında", "Uyluğun iç tarafında"],
      "Radius önkolun lateral, başparmak tarafındaki kemiğidir.",
      "anatomy",
      upperBones,
      "radius",
    ),
    q(
      "Triceps hangi kemiğin olecranonuna tutunur?",
      "Ulna",
      ["Radius", "Scapula"],
      "Triceps tendonunun distal tutunması ulna olecranonudur.",
      "anatomy",
      upper,
      "triceps brachii",
    ),
    q(
      "Distal biseps tendonu hangi kemiğe kuvvet aktarır?",
      "Radius",
      ["Ulna", "Clavicula"],
      "Bisepsin distal tendonu tuberositas radiiye tutunur.",
      "anatomy",
      upper,
      "biceps distal tendon",
    ),
  ],
  motion: [
    q(
      "Dirsek açısının azalması hangi harekettir?",
      "Fleksiyon",
      ["Ekstansiyon", "Abdüksiyon"],
      "Fleksiyonda önkol kola yaklaşır ve açı azalır.",
      "motion",
      moves,
    ),
    q(
      "Pronasyonda hangi kemik ulna çevresinde döner?",
      "Radius",
      ["Humerus", "Clavicula"],
      "Pronasyon ve supinasyon radioulnar eklemlerdeki radius hareketiyle oluşur.",
      "motion",
      joints,
      "radius",
    ),
    q(
      "Biceps brachii hangi iki işleve katkı verir?",
      "Dirsek fleksiyonu ve önkol supinasyonu",
      ["Dirsek ekstansiyonu ve pronasyon", "El bileği eversiyonu ve diz fleksiyonu"],
      "Biceps hem fleksiyon hem supinasyona katılır.",
      "motion",
      upper,
      "biceps brachii",
    ),
  ],
  chainText:
    "Biceps distal tendonu radiusa; brachialis ulna bağlantısına; triceps ise olecranona kuvvet aktarır. Lateral epikondildeki ortak ekstansör tendon, el bileği ve parmak kaslarıyla ilişkili ayrı bir zincirdir.",
  chainKeys: [
    "biceps brachii",
    "biceps distal tendon",
    "radius",
    "triceps brachii",
    "ulna",
    "common extensor tendon",
  ],
  chain: [
    q(
      "Biceps ile brachialisin distal bağlantısı için hangisi doğrudur?",
      "Biceps radiusa, brachialis ulnaya bağlanır",
      ["İkisi de claviculaya bağlanır", "İkisi de calcaneusa bağlanır"],
      "İki fleksör aynı hareketi desteklerken farklı kemik bağlantıları kullanır.",
      "chain",
      upper,
    ),
    q(
      "Ortak ekstansör tendon hangi işlevlerle ilişkilidir?",
      "El bileği ve parmak ekstansiyonu",
      ["Yalnız dirsek fleksiyonu", "Ayak bileği plantar fleksiyonu"],
      "Önkol ekstansörleri lateral epikondil bölgesinden el bileği ve parmaklara kuvvet iletir.",
      "chain",
      tennis,
      "common extensor tendon",
    ),
    q(
      "Dirsek ekstansiyonunda ana kas hangisidir?",
      "Triceps brachii",
      ["Biceps brachii", "Pronator teres"],
      "Triceps olecranon bağlantısı üzerinden dirseği açar.",
      "chain",
      upper,
      "triceps brachii",
    ),
  ],
  cases: [
    {
      title: "Kavramayla lateral dirsek ağrısı",
      text: "Kurgusal kişi kavrama ve el bileğini geriye kaldırmada dış dirsek ağrısı anlatıyor.",
      visualKey: "common extensor tendon",
      questions: [
        q(
          "Hangi bağlantı bölgesi bu öyküyle ilişkilidir?",
          "Lateral epikondildeki ekstansör tendon bağlantıları",
          ["Calcaneustaki Aşil bağlantısı", "Patelladaki quadriceps bağlantısı"],
          "Lateral epikondil el bileği ve parmak ekstansör tendonlarıyla ilişkilidir.",
          "case",
          tennis,
        ),
        q(
          "AAOS kaynağında sık etkilenen kas hangisidir?",
          "Extensor carpi radialis brevis",
          ["Soleus", "Subscapularis"],
          "ECRB lateral epikondil bölgesindeki sık etkilenen tendon örneğidir.",
          "case",
          tennis,
        ),
        q(
          "Öykü tek başına neyi kanıtlamaz?",
          "Kesin doku tanısını",
          ["Ağrının dış dirsekte olduğunu", "Kavramanın yakınmayı tetiklediğini"],
          "Yer ve tetikleyici işlev değerlendirmeyi yönlendirir; tek başına kesin tanı değildir.",
          "case",
          tennis,
        ),
      ],
    },
    {
      title: "Avucu yukarı çevirmede güçlük",
      text: "İkinci kişi bir nesneyi avucu yukarı dönük taşımakta zorlanıyor.",
      visualKey: "biceps distal tendon",
      questions: [
        q(
          "Tarif edilen yön hangi harekettir?",
          "Supinasyon",
          ["Pronasyon", "Omuz addüksiyonu"],
          "Avucun yukarı/anterior yönlenmesi önkol supinasyonuyla ilişkilidir.",
          "case",
          moves,
        ),
        q(
          "Hangi kas–tendon zinciri incelenebilir?",
          "Biceps ve distal tendonu",
          ["Triceps ve patellar tendon", "Supraspinatus ve Aşil"],
          "Biceps supinasyona katılır ve radiusa distal tendonuyla bağlanır.",
          "case",
          upper,
        ),
        q(
          "Supinasyona katkı veren başka kas hangisidir?",
          "Supinator",
          ["Pronator teres", "Deltoid"],
          "Supinator, biceps dışında supinasyona katılan kas örneğidir.",
          "case",
          upper,
        ),
      ],
    },
  ],
  extra: [
    q(
      "Brachialisin temel hareketi hangisidir?",
      "Dirsek fleksiyonu",
      ["Omuz dış rotasyonu", "Parmak ekstansiyonu"],
      "Brachialis önkolu dirsekten büken kastır.",
      "motion",
      upper,
      "brachialis",
    ),
    q(
      "Önkol rotasyonu esas olarak hangi eklemlerde olur?",
      "Radioulnar eklemler",
      ["İnterfalangeal eklemler", "Glenohumeral eklem"],
      "Pronasyon ve supinasyonda radius ve ulna arasındaki eklemler rol alır.",
      "anatomy",
      joints,
    ),
    q(
      "Pronator teres hangi hareketin örnek kasıdır?",
      "Pronasyon",
      ["Supinasyon", "Dirsek ekstansiyonu"],
      "Pronator teres radiusu pronasyon yönüne çevirir.",
      "motion",
      upper,
    ),
    q(
      "Distal biseps tendonu ile ortak ekstansör tendon nasıl ilişkilidir?",
      "Farklı kas ve işlev zincirlerindedir",
      ["Aynı dokunun iki adı", "İkisi de ulnanın olecranonundadır"],
      "Distal biceps radiusa; ortak ekstansörler lateral epikondil bölgesine bağlıdır.",
      "chain",
      upper,
    ),
    q(
      "Radius ve ulna supinasyonda nasıl konumlanır?",
      "Daha paralel",
      ["Radius ortadan kaybolur", "Humerusla tek kemik olur"],
      "Supinasyonda iki önkol kemiği daha paralel konumdadır.",
      "anatomy",
      joints,
    ),
  ],
};
const handCourse: RegionalCourseDefinition = {
  id: "hand-foundations",
  title: "El–el bileği",
  summary: "Karpal kemikler, parmak tendonları ve kılıflar",
  locateKey: "flexor digitorum profundus tendon",
  locateLabel: "FDP tendonları",
  sources: [hand, upper, upperBones, tunnel],
  structures: [
    s(
      "radius",
      "Radius",
      "Kemikler",
      "Distal radius el bileğinin önkol tarafındaki ana kemik referansıdır.",
      upperBones,
    ),
    s(
      "scaphoid",
      "Scaphoideum",
      "Kemikler",
      "Proksimal karpal sırada başparmak tarafındaki kemiktir.",
      upperBones,
    ),
    s(
      "lunate",
      "Lunatum",
      "Kemikler",
      "Proksimal karpal sıradaki kemiklerden biridir.",
      upperBones,
    ),
    s(
      "first metacarpal bone",
      "Birinci metakarpal",
      "Kemikler",
      "Başparmağın metakarpal kemiğidir; karpal kemik veya falanks değildir.",
      upperBones,
    ),
    s(
      "flexor digitorum superficialis tendon",
      "FDS tendonları",
      "Tendonlar",
      "II–V parmakların orta falankslarına tutunur ve PIP fleksiyonuna kuvvet iletir.",
      hand,
    ),
    s(
      "flexor digitorum profundus tendon",
      "FDP tendonları",
      "Tendonlar",
      "II–V parmakların distal falankslarına tutunur ve DIP fleksiyonuna kuvvet iletir.",
      hand,
    ),
    s(
      "flexor pollicis longus tendon",
      "FPL tendonu",
      "Tendonlar",
      "Başparmağın distal falanksına uzanır ve IP fleksiyonuna katkı verir.",
      hand,
    ),
    s(
      "extensor digitorum tendon",
      "Parmak ekstansör tendonları",
      "Tendonlar",
      "II–V parmakların ekstansör genişlemelerine katılır.",
      upper,
    ),
    s(
      "wrist flexor retinaculum",
      "Fleksör retinakulum",
      "Destek dokuları",
      "Karpal tünelin palmar çatısıyla ilişkili fibröz yapıdır; tendon gövdesi değildir.",
      tunnel,
    ),
    s(
      "digital fibrous sheath",
      "Fibröz tendon kılıfları",
      "Destek dokuları",
      "Fleksör tendonları parmak kemiklerine yakın tutan sistemin kaynak yüzeyleridir.",
      hand,
    ),
  ],
  motions: [
    {
      label: "PIP eklemini bük",
      text: "FDS orta falanksa kuvvet aktarır. PIP, proksimal ve orta falanks arasındaki eklemdir.",
      visualKey: "flexor digitorum superficialis tendon",
    },
    {
      label: "DIP eklemini bük",
      text: "FDP distal falanksa kuvvet aktarır. DIP, orta ve distal falanks arasındadır.",
      visualKey: "flexor digitorum profundus tendon",
    },
    {
      label: "Başparmağı bük",
      text: "FPL başparmak IP fleksiyonuna kuvvet aktarır. Başparmağın iki falanksı ve tek IP eklemi vardır.",
      visualKey: "flexor pollicis longus tendon",
    },
    {
      label: "FCR · Fleksiyon ve radial deviasyon",
      text: "Flexor carpi radialis el bileğini büker ve radius tarafına yönlendirmeye katkı verir. Aynı kasın iki işlevini kaynak modeldeki kas–tendon doğrultusuyla ilişkilendir.",
      visualKey: "flexor carpi radialis",
    },
    {
      label: "FCU · Fleksiyon ve ulnar deviasyon",
      text: "Flexor carpi ulnaris el bileğini büker ve ulna tarafına yönlendirmeye katkı verir. FCR ile ortak fleksiyon işlevini ve karşıt deviasyon yönünü karşılaştır.",
      visualKey: "flexor carpi ulnaris",
    },
    {
      label: "ECRL · Ekstansiyon ve radial deviasyon",
      text: "Extensor carpi radialis longus el bileği ekstansiyonuna ve radial deviasyona katkı verir. İkinci metakarpal tabanına uzanan doğrultuyu incele.",
      visualKey: "extensor carpi radialis longus",
    },
    {
      label: "ECRB · Ekstansiyon ve radial deviasyon",
      text: "Extensor carpi radialis brevis el bileği ekstansiyonuna ve radial deviasyona katkı verir. Üçüncü metakarpal tabanına uzanan doğrultuyu ECRL ile karşılaştır.",
      visualKey: "extensor carpi radialis brevis",
    },
  ],
  anatomy: [
    q(
      "FDP hangi falanksa kadar devam eder?",
      "Distal falanks",
      ["Yalnız proksimal falanks", "Yalnız metakarpal"],
      "FDP tendonları II–V parmakların distal falankslarına tutunur.",
      "anatomy",
      hand,
      "flexor digitorum profundus tendon",
    ),
    q(
      "FDS ve FDP tutunmaları için hangisi doğrudur?",
      "FDS orta, FDP distal falanksa tutunur",
      ["İkisi de aynı kemik noktasına tutunur", "İkisi de yalnız radiusa tutunur"],
      "Bu fark PIP ve DIP işlevini ayırt etmeyi sağlar.",
      "anatomy",
      hand,
    ),
    q(
      "Karpal tünelin çatısıyla ilişkili yapı hangisidir?",
      "Fleksör retinakulum",
      ["Aşil tendonu", "Biseps distal tendonu"],
      "Transvers karpal bağ/fleksör retinakulum tünelin palmar çatısıdır.",
      "anatomy",
      tunnel,
      "wrist flexor retinaculum",
    ),
  ],
  motion: [
    q(
      "PIP fleksiyonuyla en doğrudan eşleştirilen tendon hangisidir?",
      "FDS",
      ["EPL", "Aşil"],
      "FDS orta falanks tutunmasıyla PIP fleksiyonuna kuvvet aktarır.",
      "motion",
      hand,
    ),
    q(
      "DIP fleksiyonuyla en doğrudan eşleştirilen tendon hangisidir?",
      "FDP",
      ["FDS", "Ortak ekstansör tendon"],
      "FDP distal falanksa kadar uzanır.",
      "motion",
      hand,
    ),
    q(
      "FPL hangi harekete katkı verir?",
      "Başparmak IP fleksiyonu",
      ["Önkol pronasyonu", "Başparmak IP ekstansiyonu"],
      "FPL başparmağın distal falanksına kuvvet aktarır.",
      "motion",
      hand,
    ),
  ],
  chainText:
    "Önkoldaki kas, tendon üzerinden parmağa kuvvet aktarır. Fibröz kılıf tendonu kemiğe yakın tutar; sinovyal kılıf kayma ilişkisini destekler. Karpal tünelde tendonlarla birlikte median sinir geçer. Tendon, retinakulum ve kılıf farklı dokulardır.",
  chainKeys: [
    "flexor digitorum superficialis tendon",
    "flexor digitorum profundus tendon",
    "digital fibrous sheath",
    "wrist flexor retinaculum",
  ],
  chain: [
    q(
      "Fibröz kılıfın temel rolü hangisidir?",
      "Tendonu kemiğe yakın tutmak",
      ["Kas gibi aktif kuvvet üretmek", "Distal falanksın yerini almak"],
      "Kılıf, tendonun geçişini yönlendiren destek dokusudur.",
      "chain",
      hand,
      "digital fibrous sheath",
    ),
    q(
      "Karpal tünelden hangi sinir geçer?",
      "Median sinir",
      ["Aksiller sinir", "Femoral sinir"],
      "Median sinir parmak fleksör tendonlarıyla tünelden geçer.",
      "chain",
      tunnel,
    ),
    q(
      "Tendon ile kılıf için doğru ifade hangisidir?",
      "Farklı dokulardır",
      ["Aynı yapının iki adı", "İkisi de karpal kemiktir"],
      "Tendon kuvvet aktarır; çevresindeki kılıf geçiş ve kayma ilişkisini destekler.",
      "chain",
      hand,
    ),
  ],
  cases: [
    {
      title: "Gece el uyuşması",
      text: "Kurgusal kişi başparmak, işaret ve orta parmakta gece uyuşması anlatıyor.",
      visualKey: "wrist flexor retinaculum",
      questions: [
        q(
          "Hangi sinir–geçiş ilişkisi incelenebilir?",
          "Median sinir ve karpal tünel",
          ["Femoral sinir ve kalça", "Tibial sinir ve dirsek"],
          "Bu dağılım karpal tünel–median sinir ilişkisini düşündürür; değerlendirme gerekir.",
          "case",
          tunnel,
        ),
        q(
          "Tünelin sınırları hangi yapılarla ilişkilidir?",
          "Karpal kemikler ve fleksör retinakulum",
          ["Humerus ve patella", "Radius ve calcaneus"],
          "Karpal kemikler taban ve yanları, retinakulum palmar çatıyı oluşturur.",
          "case",
          tunnel,
        ),
        q(
          "Bu öykü tek başına hangi sonucu vermez?",
          "Sinir hasarının kesin derecesini",
          ["Uyuşmanın anlatıldığını", "Yakınmanın gece ortaya çıktığını"],
          "Öykü, muayene ve gerekli testler kişiye ait sinir işlevini değerlendirir.",
          "case",
          tunnel,
        ),
      ],
    },
    {
      title: "Parmak ucunu bükmede güçlük",
      text: "İkinci kişi bir parmağının uç eklemini aktif bükmekte zorlanıyor.",
      visualKey: "flexor digitorum profundus tendon",
      questions: [
        q(
          "Öncelikle hangi tendon işlevi düşünülür?",
          "FDP ve DIP fleksiyonu",
          ["FDS ve yalnız PIP fleksiyonu", "EPL ve dirsek ekstansiyonu"],
          "DIP fleksiyonuna FDP kuvvet aktarır.",
          "case",
          hand,
        ),
        q(
          "Aynı parmağın PIP fleksiyonu hangi tendonla eşleştirilir?",
          "FDS",
          ["Aşil", "Biseps distal tendonu"],
          "FDS orta falanksa tutunarak PIP fleksiyonuna katılır.",
          "case",
          hand,
        ),
        q(
          "Tendon kılıfını modelde seçmek neyi gösterir?",
          "Tendon çevresindeki destek ilişkisini",
          ["Kişinin tendon kayma hızını", "Kişinin kesin rüptürünü"],
          "Kaynak yüzey bir referanstır; tendon kayması ve hasar kişiye göre simüle edilmez.",
          "case",
          hand,
        ),
      ],
    },
  ],
  extra: [
    q(
      "Başparmağın falanks sayısı kaçtır?",
      "İki",
      ["Üç", "Beş"],
      "Başparmakta proksimal ve distal falanks bulunur.",
      "anatomy",
      upperBones,
    ),
    q(
      "Parmak ekstansör tendonları hangi işleve katkı verir?",
      "Parmakları açmaya",
      ["Önkol supinasyonuna", "Kalça abdüksiyonuna"],
      "Ekstansör tendonlar parmak ekstansiyonuna kuvvet aktarır.",
      "motion",
      upper,
    ),
    q(
      "Fleksör retinakulum nasıl bir dokudur?",
      "Fibröz destek dokusu",
      ["Aktif kasılan kas", "Karpal kemik"],
      "Retinakulum tendon geçişini tutan fibröz bir yapıdır.",
      "chain",
      tunnel,
    ),
    q(
      "FPL ile FDP arasındaki temel fark nedir?",
      "FPL başparmağa, FDP II–V parmaklara uzanır",
      ["İkisi yalnız başparmağa gider", "FDP el bileği kemiğidir"],
      "FPL başparmağın uzun fleksörü, FDP diğer dört parmağın derin fleksörüdür.",
      "anatomy",
      hand,
    ),
    q(
      "Sinovyal ve fibröz kılıflar için hangisi doğrudur?",
      "Farklı doku ilişkilerini temsil eder",
      ["İkisi tendon gövdesinin adı", "İkisi kemik yüzeyidir"],
      "Fibröz kılıfın tutucu ve sinovyal kılıfın kayma ilişkileri birbirinden ayrılır.",
      "chain",
      hand,
    ),
  ],
};
const hip: RegionalCourseDefinition = {
  id: "hip-foundations",
  title: "Kalça",
  summary: "Pelvis, femur ve kalçanın hareket zincirleri",
  locateKey: "gluteus medius",
  locateLabel: "Gluteus medius",
  sources: [lower, lowerBones, joints, moves, pelvis, gluteal],
  structures: [
    s(
      "hip bone",
      "Kalça kemiği",
      "Kemikler",
      "Acetabulum femur başını karşılayan eklem yuvasıdır; pelvisin bir parçasıdır.",
      joints,
    ),
    s(
      "femur",
      "Femur",
      "Kemikler",
      "Baş, boyun ve trochanter bölgeleri kalça eklemi ve kas tutunmaları için referanstır.",
      lowerBones,
    ),
    s(
      "iliacus",
      "Iliacus",
      "Fleksörler",
      "Iliopsoas grubunun parçasıdır; kalça fleksiyonuna katılır.",
      lower,
    ),
    s(
      "psoas major",
      "Psoas major",
      "Fleksörler",
      "Iliacus ile iliopsoas grubunu oluşturur; kalça fleksiyonuna katılır.",
      lower,
    ),
    s(
      "gluteus maximus",
      "Gluteus maximus",
      "Gluteal kaslar",
      "Kalça ekstansiyonuna ve dış rotasyona katkı verir.",
      lower,
    ),
    s(
      "gluteus medius",
      "Gluteus medius",
      "Gluteal kaslar",
      "Kalça abdüksiyonu ve tek ayak desteğinde pelvis kontrolüne katkı verir.",
      pelvis,
    ),
    s(
      "gluteus minimus",
      "Gluteus minimus",
      "Gluteal kaslar",
      "Gluteus mediusun derinindedir; abdüksiyona katılır.",
      gluteal,
    ),
    s(
      "adductor longus",
      "Adductor longus",
      "Adduktorlar",
      "Uyluğu orta hatta yaklaştırmaya katkı verir.",
      lower,
    ),
    s(
      "rectus femoris",
      "Rectus femoris",
      "İki eklemli kaslar",
      "Hem kalça fleksiyonu hem diz ekstansiyonuna katılan quadriceps üyesidir.",
      lower,
    ),
    s(
      "semitendinosus",
      "Semitendinosus",
      "İki eklemli kaslar",
      "Hamstring grubunda kalça ekstansiyonu ve diz fleksiyonuna katılır.",
      lower,
    ),
  ],
  motions: [
    {
      label: "Uyluğu öne kaldır",
      text: "Kalça fleksiyonu: femur öne yönelir. Iliopsoas grubu örnek fleksördür.",
      visualKey: "iliacus",
      joint: "hip",
      id: "flexion",
      progress: 70,
    },
    {
      label: "Bacağı yana aç",
      text: "Abdüksiyon: femur orta hattan uzaklaşır. Gluteus medius örnek kastır.",
      visualKey: "gluteus medius",
      joint: "hip",
      id: "abduction",
      progress: 80,
    },
    {
      label: "Uyluğu geriye götür",
      text: "Ekstansiyon: uyluk arkaya yönelir. Gluteus maximus ve hamstringler katkı verir.",
      visualKey: "gluteus maximus",
      joint: "hip",
      id: "extension",
      progress: 80,
    },
  ],
  anatomy: [
    q(
      "Femur başını karşılayan eklem yuvası hangisidir?",
      "Acetabulum",
      ["Glenoid", "Olecranon"],
      "Acetabulum pelviste kalça ekleminin yuvasıdır.",
      "anatomy",
      joints,
      "hip bone",
    ),
    q(
      "Iliopsoas grubu hangi kaslardan oluşur?",
      "Iliacus ve psoas major",
      ["Gluteus maximus ve soleus", "Biceps ve triceps"],
      "Iliacus ile psoas major kalçanın önemli fleksör grubunu oluşturur.",
      "anatomy",
      lower,
    ),
    q(
      "Hem kalça hem diz eklemi işlevine katılan kas hangisidir?",
      "Rectus femoris",
      ["Gluteus medius", "Iliacus"],
      "Rectus femoris kalça fleksiyonu ve diz ekstansiyonuna katılır.",
      "anatomy",
      lower,
      "rectus femoris",
    ),
  ],
  motion: [
    q(
      "Uyluğu öne kaldırma hangi harekettir?",
      "Kalça fleksiyonu",
      ["Kalça ekstansiyonu", "Ayak bileği dorsifleksiyonu"],
      "Femurun öne yönelmesi kalça fleksiyonudur.",
      "motion",
      moves,
    ),
    q(
      "Gluteus medius hangi harekete katkı verir?",
      "Kalça abdüksiyonu",
      ["Dirsek fleksiyonu", "Parmak ekstansiyonu"],
      "Gluteus medius femuru orta hattan uzaklaştırmaya katılır.",
      "motion",
      lower,
    ),
    q(
      "Gluteus maximus hangi işlevin güçlü bir örneğidir?",
      "Kalça ekstansiyonu",
      ["Önkol pronasyonu", "Diz ekstansiyonu"],
      "Gluteus maximus uyluğu geriye götürmeye katkı verir.",
      "motion",
      lower,
    ),
  ],
  chainText:
    "Pelvis femur için hareketli bir temel oluşturur. Kalça abduktorları tek ayak desteğinde pelvisin kontrolüne katılır. İki eklemli rectus femoris ve hamstringler kalça ile diz arasında işlevsel bağlantı kurar; aynı kasın etkisi eklem konumuyla değişebilir.",
  chainKeys: ["hip bone", "gluteus medius", "femur", "rectus femoris", "semitendinosus"],
  chain: [
    q(
      "Tek ayak desteğinde pelvis kontrolü hangi grupla ilişkilidir?",
      "Destek tarafındaki kalça abduktorları",
      ["El parmak ekstansörleri", "Dirsek pronatorları"],
      "Gluteus medius ve minimus destek tarafında pelvisin kontrolüne katkı verir.",
      "chain",
      pelvis,
      "gluteus medius",
    ),
    q(
      "Rectus femoris ile semitendinosusun ortak özelliği nedir?",
      "Kalça ve diz işlevlerine katılmaları",
      ["İkisinin de tek eklemli olması", "İkisinin de Aşil tendonunu oluşturması"],
      "İki kas farklı hareketlere katılır ama her ikisi iki eklemli zincir örneğidir.",
      "chain",
      lower,
    ),
    q(
      "Kalça addüksiyonu için hangi kas örnektir?",
      "Adductor longus",
      ["Gluteus medius", "Tibialis anterior"],
      "Adduktor grubu uyluğu orta hatta yaklaştırır.",
      "chain",
      lower,
      "adductor longus",
    ),
  ],
  cases: [
    {
      title: "Tek ayakta pelvis kontrolü",
      text: "Kurgusal kişinin tek ayak desteğinde pelvisini dengede tutması zorlaşıyor.",
      visualKey: "gluteus medius",
      questions: [
        q(
          "Hangi bölgesel kas grubu incelenebilir?",
          "Destek tarafındaki kalça abduktorları",
          ["Karşı elin fleksörleri", "Yalnız dirsek ekstansörleri"],
          "Kalça abduktorları pelvis kontrolüne katılır.",
          "case",
          pelvis,
        ),
        q(
          "Modelde hangi kas bu grubun örneğidir?",
          "Gluteus medius",
          ["Biceps brachii", "Soleus"],
          "Gluteus medius kalça abdüksiyonu ve pelvis kontrolüyle ilişkilidir.",
          "case",
          pelvis,
        ),
        q(
          "Bu gözlem tek başına neyi belirlemez?",
          "Sorunun kesin sinir veya doku nedenini",
          ["Denge görevinin zorlaştığını", "Pelvis kontrolünün incelenebileceğini"],
          "İşlev gözlemi nedenin kesin tanısı değildir; ağrı, kuvvet ve diğer bulgularla değerlendirilir.",
          "case",
          lower,
        ),
      ],
    },
    {
      title: "Sandalyeden kalkış",
      text: "İkinci kişi sandalyeden doğrulurken kalça ve dizini açmada zorlanıyor.",
      visualKey: "gluteus maximus",
      questions: [
        q(
          "Kalçayı açma hangi hareketle eşleştirilir?",
          "Ekstansiyon",
          ["Fleksiyon", "Önkol pronasyonu"],
          "Sandalyeden doğrulurken kalça fleksiyondan ekstansiyon yönüne gelir.",
          "case",
          moves,
        ),
        q(
          "Kalça ekstansörlerinden hangisi incelenebilir?",
          "Gluteus maximus",
          ["Iliacus", "Pronator teres"],
          "Gluteus maximus kalça ekstansiyonuna katılır.",
          "case",
          lower,
        ),
        q(
          "Görevin tamamı neden tek kasa indirgenemez?",
          "Kalça, diz ve gövde birlikte çalışır",
          ["Kalça eklemi hareket etmez", "Yalnız el bileği kuvvet üretir"],
          "Fonksiyonel görev birden çok eklem ve kas grubunun koordinasyonunu gerektirir.",
          "case",
          lower,
        ),
      ],
    },
  ],
  extra: [
    q(
      "Kalça eklemi hangi eklem tipinin örneğidir?",
      "Küresel sinovyal eklem",
      ["Sabit fibröz sütür", "Yalnız menteşe eklem"],
      "Femur başı acetabulumda çok eksenli hareket eder.",
      "anatomy",
      joints,
    ),
    q(
      "Adduksiyonda uyluk hangi yöne gider?",
      "Orta hatta yaklaşır",
      ["Orta hattan uzaklaşır", "Yalnız radius döner"],
      "Addüksiyon orta hatta yaklaşma hareketidir.",
      "motion",
      moves,
    ),
    q(
      "Hamstringlerin ortak işlev örneği hangisidir?",
      "Kalça ekstansiyonu ve diz fleksiyonu",
      ["Kalça fleksiyonu ve diz ekstansiyonu", "Parmak ekstansiyonu"],
      "Semitendinosus gibi hamstringler iki eklem arasında bu işlevlere katılır.",
      "chain",
      lower,
    ),
    q(
      "Gluteus minimus hangi kasın derinindedir?",
      "Gluteus medius",
      ["Soleus", "Triceps"],
      "Gluteal kaslar yüzeyelden derine farklı katmanlar oluşturur.",
      "anatomy",
      lower,
    ),
    q(
      "Kalça ve diz açılmasını aynı hareket adıyla adlandırmak neden mümkündür?",
      "İki eklemde de ekstansiyon yönü vardır",
      ["İkisi aynı eklemdir", "Ekstansiyon yalnız el bileğinde olur"],
      "Hareket terimi farklı eklemlerde kullanılabilir; ilgili kaslar farklıdır.",
      "motion",
      moves,
    ),
  ],
};
const foot: RegionalCourseDefinition = {
  id: "ankle-foundations",
  title: "Ayak–ayak bileği",
  summary: "Talokrural hareket, Aşil ve lateral bağlar",
  locateKey: "calcaneal tendon",
  locateLabel: "Aşil tendonu",
  sources: [lower, lowerBones, joints, achilles, ankle],
  structures: [
    s(
      "tibia",
      "Tibia",
      "Kemikler",
      "Distal tibia ayak bileği ekleminin üst ve medial kemik referansıdır.",
      lowerBones,
    ),
    s(
      "fibula",
      "Fibula",
      "Kemikler",
      "Distal ucu lateral malleolü oluşturur; lateral bağlar için referanstır.",
      lowerBones,
    ),
    s(
      "talus",
      "Talus",
      "Kemikler",
      "Tibia ve fibula arasındaki eklem ilişkisiyle talokrural harekete katılır.",
      joints,
    ),
    s(
      "calcaneus",
      "Calcaneus",
      "Kemikler",
      "Topuk kemiğidir; Aşil tendonu arka yüzüne kuvvet aktarır.",
      achilles,
    ),
    s(
      "gastrocnemius",
      "Gastrocnemius",
      "Kaslar",
      "Baldırın yüzeyel kasıdır; plantar fleksiyona ve diz fleksiyonuna katılır.",
      lower,
    ),
    s(
      "soleus",
      "Soleus",
      "Kaslar",
      "Gastrocnemiusun derinindedir ve plantar fleksiyona katılır.",
      lower,
    ),
    s(
      "tibialis anterior",
      "Tibialis anterior",
      "Kaslar",
      "Dorsifleksiyon ve inversiyona katılan ön bacak kasıdır.",
      lower,
    ),
    s(
      "calcaneal tendon",
      "Aşil tendonu",
      "Tendonlar",
      "Gastrocnemius–soleus kuvvetini calcaneusa aktarır.",
      achilles,
    ),
    s(
      "anterior talofibular ligament",
      "ATFL",
      "Lateral bağlar",
      "Fibula ile talus arasında lateral bağ kompleksinin ön bölümüdür.",
      ankle,
    ),
    s(
      "calcaneofibular ligament",
      "CFL",
      "Lateral bağlar",
      "Fibula ile calcaneus arasında uzanan lateral bağdır.",
      ankle,
    ),
    s(
      "fibularis brevis tendon",
      "Fibularis brevis tendonu",
      "Tendonlar",
      "Lateral malleol arkasından beşinci metatarsal tabanına gider; eversiyona kuvvet aktarır.",
      lower,
    ),
  ],
  motions: [
    {
      label: "Ayağı yukarı çek",
      text: "Dorsifleksiyon: ayak sırtı bacağa yaklaşır. Tibialis anterior örnek kastır.",
      visualKey: "tibialis anterior",
      joint: "ankle",
      id: "dorsiflexion",
      progress: 80,
    },
    {
      label: "Ayağı aşağı yönlendir",
      text: "Plantar fleksiyon: gastrocnemius–soleus kompleksi Aşil üzerinden calcaneusa kuvvet aktarır.",
      visualKey: "calcaneal tendon",
      joint: "ankle",
      id: "plantarflexion",
      progress: 65,
    },
    {
      label: "Lateral desteği incele",
      text: "Fibular kaslar eversiyona katkı verir. ATFL ve CFL pasif bağ desteğidir; kas gibi aktif kasılmaz.",
      visualKey: "fibularis brevis tendon",
    },
  ],
  anatomy: [
    q(
      "Aşil tendonunun distal kemik bağlantısı hangisidir?",
      "Calcaneus",
      ["Talus", "Navicular"],
      "Aşil topuk kemiğinin arka yüzüne kuvvet aktarır.",
      "anatomy",
      achilles,
      "calcaneal tendon",
    ),
    q(
      "Lateral malleol hangi kemiğin parçasıdır?",
      "Fibula",
      ["Tibia", "Femur"],
      "Distal fibula lateral malleolü oluşturur.",
      "anatomy",
      lowerBones,
      "fibula",
    ),
    q(
      "ATFL hangi kemikleri bağlar?",
      "Fibula ve talus",
      ["Tibia ve patella", "Radius ve ulna"],
      "Adı anterior talofibular bağın iki kemik ilişkisini belirtir.",
      "anatomy",
      ankle,
      "anterior talofibular ligament",
    ),
  ],
  motion: [
    q(
      "Ayak sırtını bacağa yaklaştırma hangi harekettir?",
      "Dorsifleksiyon",
      ["Plantar fleksiyon", "Supinasyon"],
      "Dorsifleksiyon ayağın yukarı yönlenmesidir.",
      "motion",
      moves,
    ),
    q(
      "Plantar fleksiyonun temel kas grubu hangisidir?",
      "Gastrocnemius ve soleus",
      ["Tibialis anterior ve EDL", "Deltoid ve supraspinatus"],
      "Baldır kompleksi Aşil üzerinden plantar fleksiyon kuvveti aktarır.",
      "motion",
      lower,
    ),
    q(
      "Fibularis brevis hangi harekete katkı verir?",
      "Eversiyon",
      ["Önkol pronasyonu", "Kalça ekstansiyonu"],
      "Fibular kaslar ayağın eversiyonuna ve plantar fleksiyona katkı verir.",
      "motion",
      lower,
    ),
  ],
  chainText:
    "Gastrocnemius ve soleus, Aşil tendonu üzerinden calcaneusa kuvvet aktarır. Lateral bağlar fibulayı talus ve calcaneusa bağlar; fibular tendonlar ise kas kuvveti taşır. Dorsifleksiyon/plantar fleksiyon ile inversiyon/eversiyon aynı hareket çiftleri değildir.",
  chainKeys: [
    "gastrocnemius",
    "soleus",
    "calcaneal tendon",
    "calcaneus",
    "anterior talofibular ligament",
    "calcaneofibular ligament",
  ],
  chain: [
    q(
      "Gastrocnemius–soleus kuvvetini calcaneusa hangi yapı iletir?",
      "Aşil tendonu",
      ["ATFL", "Fleksör retinakulum"],
      "Aşil kas kuvvetini topuk kemiğine taşır.",
      "chain",
      achilles,
    ),
    q(
      "CFL hangi distal kemiğe bağlanır?",
      "Calcaneus",
      ["Talus", "Birinci metatarsal"],
      "CFL fibula ile calcaneus arasındaki bağdır.",
      "chain",
      ankle,
      "calcaneofibular ligament",
    ),
    q(
      "Fibular tendonlarla lateral bağların temel farkı nedir?",
      "Tendonlar kas kuvveti taşır; bağlar kemikleri bağlar",
      ["İkisi aynı doku adıdır", "Bağlar aktif kasılır"],
      "Aynı bölgede bulunmaları aynı işlev veya doku olmaları anlamına gelmez.",
      "chain",
      lower,
    ),
  ],
  cases: [
    {
      title: "Lateral burkulma sonrası ağrı",
      text: "Kurgusal kişi ayak bileğinin içe dönmesi sonrası dış tarafta ağrı anlatıyor.",
      visualKey: "anterior talofibular ligament",
      questions: [
        q(
          "Hangi bağ kompleksi incelenebilir?",
          "Lateral ayak bileği bağları",
          ["Rotator manşet", "Dirsek fleksörleri"],
          "İnversiyon mekanizması lateral bağların değerlendirilmesini gerektirebilir.",
          "case",
          ankle,
        ),
        q(
          "Bu kompleksin ön bağı hangisidir?",
          "ATFL",
          ["CFL", "Aşil"],
          "ATFL fibula ile talus arasındaki anterior bağdır.",
          "case",
          ankle,
        ),
        q(
          "Bu öykü tek başına neyi belirlemez?",
          "Yaralanmanın derecesini ve kırık olup olmadığını",
          ["Dış tarafta ağrı anlatıldığını", "Burkulma mekanizması olduğunu"],
          "Muayene ve gerektiğinde görüntüleme gerekir; öykü tek başına doku derecesi vermez.",
          "case",
          ankle,
        ),
      ],
    },
    {
      title: "Parmak ucuna yükselmede güçlük",
      text: "İkinci kişi parmak ucuna yükselme görevini yapmakta zorlanıyor.",
      visualKey: "calcaneal tendon",
      questions: [
        q(
          "Hangi hareket zinciri incelenebilir?",
          "Plantar fleksörler–Aşil–calcaneus",
          ["El fleksörleri–radius", "Omuz manşeti–scapula"],
          "Görev plantar fleksör kuvvet ve kontrolüyle ilişkilidir.",
          "case",
          achilles,
        ),
        q(
          "Soleus bu zincirde nasıl rol alır?",
          "Plantar fleksiyon kuvvetine katkı verir",
          ["ATFL bağını oluşturur", "Dorsifleksiyonun tek kasıdır"],
          "Soleus Aşil üzerinden plantar fleksiyona katkı verir.",
          "case",
          lower,
        ),
        q(
          "Sağlıklı Aşil yüzeyinden ne öğrenilebilir?",
          "Kas ve kemiğe göre tendon konumu",
          ["Kişinin tendon hasar yüzdesi", "Kişinin kesin kuvveti"],
          "Model referans bağlantıyı gösterir; kişisel hasar veya kuvvet ölçmez.",
          "case",
          achilles,
        ),
      ],
    },
  ],
  extra: [
    q(
      "Tibialis anterior hangi işleve katkı verir?",
      "Dorsifleksiyon ve inversiyon",
      ["Plantar fleksiyon ve eversiyon", "Dirsek ekstansiyonu"],
      "Tibialis anterior ön bacak kasıdır; dorsifleksiyon ve inversiyona katılır.",
      "motion",
      lower,
    ),
    q(
      "Talokrural eklem hangi kemiklerle ilişkilidir?",
      "Tibia, fibula ve talus",
      ["Femur, patella ve tibia", "Scapula, clavicula ve humerus"],
      "Ayak bileği ekleminde talus tibia–fibula kemik çatısı ile ilişkilidir.",
      "anatomy",
      joints,
    ),
    q(
      "Gastrocnemius soleustan hangi açıdan farklıdır?",
      "Diz eklemini de geçer",
      ["Aşille ilişkili değildir", "Önkol kasıdır"],
      "Gastrocnemius diz ve ayak bileği işlevine katılır; soleus diz eklemini geçmez.",
      "chain",
      lower,
    ),
    q(
      "Fibularis brevisin distal tutunması hangisidir?",
      "Beşinci metatarsal tabanı",
      ["Patellanın üstü", "Radius tuberositası"],
      "Kısa fibular tendon lateral ayakta beşinci metatarsal tabanına gider.",
      "anatomy",
      lower,
    ),
    q(
      "Dorsifleksiyon ve inversiyon için hangisi doğrudur?",
      "Farklı hareket adlarıdır",
      ["Aynı yönün iki adı", "İkisi önkol hareketidir"],
      "Dorsifleksiyon ayak sırtını bacağa yaklaştırır; inversiyon tabanı mediale yönlendirir.",
      "motion",
      moves,
    ),
  ],
};
export const REGIONAL_COURSES: readonly RegionalCourseDefinition[] = [
  shoulder,
  elbow,
  handCourse,
  hip,
  foot,
];
export const regionalCourse = (id: unknown) => REGIONAL_COURSES.find((c) => c.id === id);
export const isRegionalCourseId = (id: unknown): id is RegionalCourseId => !!regionalCourse(id);
export const regionalBank = (c: RegionalCourseDefinition) => [
  ...c.anatomy,
  ...c.motion,
  ...c.chain,
  ...c.cases.flatMap((x) => x.questions),
  ...c.extra,
];
export function regionalExam(c: RegionalCourseDefinition, round = 0) {
  const bank = regionalBank(c),
    pick = (domain: KneeCourseStep, n: number) => {
      const items = bank.map((q, i) => ({ q, i })).filter((x) => x.q.review === domain);
      return Array.from({ length: n }, (_, j) => items[(j + round) % items.length].i);
    };
  return [pick("anatomy", 2), pick("motion", 3), pick("chain", 2), pick("case", 2)].flat();
}
