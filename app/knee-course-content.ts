export const KNEE_COURSE_ID = "knee-foundations";
export const KNEE_COURSE_STEPS = [
  { id: "anatomy", title: "Yapıları tanı", description: "13 yapı ve iki kontrol" },
  { id: "motion", title: "Hareketi oku", description: "Üç durak ve üç soru" },
  { id: "chain", title: "Bağlantıyı kur", description: "Ekstansör zincir ve stabilite" },
  { id: "case", title: "Vakaya uygula", description: "Dört vaka, 12 karar" },
  { id: "exam", title: "Kendini sına", description: "Üç istasyonda 10 soru" },
  { id: "result", title: "Sonucunu incele", description: "Hedefli tekrar" },
] as const;
export type KneeCourseStep = (typeof KNEE_COURSE_STEPS)[number]["id"];
export const KNEE_SOURCES = {
  motion: {
    label: "Diz hareketleri · Texas Tech Üniversitesi",
    url: "https://anatomy.ttuhscep.edu/modules/lower_limb_module/lower_limb_06.html",
  },
  chain: {
    label: "Ekstansör zincir · AAOS",
    url: "https://www.orthoinfo.org/diseases--conditions/patellar-tendon-tear/",
  },
  muscle: {
    label: "Rectus femoris · Washington Üniversitesi",
    url: "https://rad.uw.edu/muscle-atlas/rectus-femoris",
  },
  acl: {
    label: "Ön çapraz bağ · AAOS",
    url: "https://www.orthoinfo.org/diseases--conditions/anterior-cruciate-ligament-acl-injuries/",
  },
  pcl: {
    label: "Arka çapraz bağ · AAOS",
    url: "https://www.orthoinfo.org/diseases--conditions/posterior-cruciate-ligament-injuries/",
  },
  collateral: {
    label: "Yan bağlar · AAOS",
    url: "https://www.orthoinfo.org/diseases--conditions/collateral-ligament-injuries/",
  },
  meniscus: {
    label: "Menisküsler · AAOS",
    url: "https://www.orthoinfo.org/diseases--conditions/meniscus-tears/",
  },
};
export const KNEE_STRUCTURES = [
  {
    key: "femur",
    label: "Femur",
    group: "Kemikler",
    text: "Uyluk kemiği. Distal ucu tibia ve patella ile eklemleşir.",
    source: KNEE_SOURCES.acl,
  },
  {
    key: "tibia",
    label: "Tibia",
    group: "Kemikler",
    text: "Kaval kemiği. Tuberositas tibiae, patellar bağlantının distal tutunma bölgesidir.",
    source: KNEE_SOURCES.chain,
  },
  {
    key: "fibula",
    label: "Fibula",
    group: "Kemikler",
    text: "Alt bacağın dış tarafındaki kemik. Fibula başı dış yan bağın distal bağlantısını anlamak için bir referanstır.",
    source: KNEE_SOURCES.collateral,
  },
  {
    key: "patella",
    label: "Patella",
    group: "Kemikler",
    text: "Diz kapağı. Quadriceps tendonu üstüne, patellar bağlantı alt kutbuna tutunur.",
    source: KNEE_SOURCES.chain,
  },
  {
    key: "rectus femoris",
    label: "Rectus femoris",
    group: "Kas ve tendonlar",
    text: "Quadriceps grubunun bir üyesidir. Diz ekstansiyonuna ve kalça fleksiyonuna katılır; motor siniri n. femoralistir.",
    source: KNEE_SOURCES.muscle,
  },
  {
    key: "quadriceps tendon",
    label: "Quadriceps tendonu",
    group: "Kas ve tendonlar",
    text: "Quadriceps kaslarından patellanın üst bölümüne kuvvet aktarır. Patellar bağlantıdan farklıdır.",
    source: KNEE_SOURCES.chain,
  },
  {
    key: "patellar ligament",
    label: "Patellar tendon",
    group: "Kas ve tendonlar",
    text: "Patellanın alt kutbu ile tuberositas tibiae arasında uzanır. İki kemiği bağladığından patellar ligament adı da kullanılır.",
    source: KNEE_SOURCES.chain,
  },
  {
    key: "anterior cruciate ligament",
    label: "Ön çapraz bağ · ÖÇB",
    group: "Bağlar",
    text: "Tibianın femura göre aşırı öne kaymasını sınırlar; dönme stabilitesine de katkı sağlar.",
    source: KNEE_SOURCES.acl,
  },
  {
    key: "posterior cruciate ligament",
    label: "Arka çapraz bağ · AÇB",
    group: "Bağlar",
    text: "Eklem içinde ÖÇB’nin arkasındadır. Tibianın femura göre aşırı arkaya kaymasını sınırlar.",
    source: KNEE_SOURCES.pcl,
  },
  {
    key: "medial collateral ligament",
    label: "İç yan bağ · MCL",
    group: "Bağlar",
    text: "Dizin iç tarafında femur ile tibia arasında uzanır. Yandan gelen zorlanmalara karşı stabiliteye katkıda bulunur.",
    source: KNEE_SOURCES.collateral,
  },
  {
    key: "lateral collateral ligament",
    label: "Dış yan bağ · LCL",
    group: "Bağlar",
    text: "Dizin dış tarafında femur ile fibula arasında uzanır. MCL’den farklı distal kemiğe tutunur.",
    source: KNEE_SOURCES.collateral,
  },
  {
    key: "medial meniscus",
    label: "İç menisküs",
    group: "Menisküsler",
    text: "Femur ile tibia arasındaki iç fibrokartilaj yapıdır. Yük aktarımı ve eklem stabilitesine katkı sağlar; bağ veya tendon değildir.",
    source: KNEE_SOURCES.meniscus,
  },
  {
    key: "lateral meniscus",
    label: "Dış menisküs",
    group: "Menisküsler",
    text: "Femur ile tibia arasındaki dış fibrokartilaj yapıdır. Yük dağılımına katkı sağlar; eklem yüzeyi kıkırdağından ayrı bir yapıdır.",
    source: KNEE_SOURCES.meniscus,
  },
] as const;
export interface CourseQuestion {
  prompt: string;
  options: readonly string[];
  correct: number;
  why: string;
  source: { label: string; url: string };
  review: KneeCourseStep;
  station?: string;
  visualKey?: string;
}
export const KNEE_CHECKS: CourseQuestion[] = [
  {
    prompt: "Gösterilen 0° konumu nasıl adlandırılır?",
    options: ["Diz ekstansiyon konumu", "Diz fleksiyon konumu", "Kalça abduksiyonu"],
    correct: 0,
    why: "Diz bu başlangıç pozunda açık, yani ekstansiyon konumundadır. Bu açı, dersin gösterim konumudur.",
    source: KNEE_SOURCES.motion,
    review: "motion",
  },
  {
    prompt: "0° konumundan bu 60° konumuna geçiş hangi harekettir?",
    options: ["Ekstansiyon", "Fleksiyon", "Abduksiyon"],
    correct: 1,
    why: "Alt bacağın uyluğa doğru bükülmesi diz fleksiyonudur. Hamstring kasları başlıca fleksör örnekleridir.",
    source: KNEE_SOURCES.motion,
    review: "motion",
  },
  {
    prompt: "Bu 120° konumundan 60° konumuna dönüş hangi harekettir?",
    options: ["Fleksiyon", "İç rotasyon", "Ekstansiyon"],
    correct: 2,
    why: "Fleksiyon açısının azalması ekstansiyon yönüdür. Quadriceps diz ekstansiyonuna katılır.",
    source: KNEE_SOURCES.motion,
    review: "motion",
  },
];
export const KNEE_CHAIN_QUESTION: CourseQuestion = {
  prompt: "Patellanın alt kutbunu tuberositas tibiaeye hangi yapı bağlar?",
  options: ["Quadriceps tendonu", "Patellar tendon / ligament", "Ön çapraz bağ"],
  correct: 1,
  why: "Quadriceps tendonu patellanın üstündedir. Patellar bağlantı patellanın alt kutbu ile tibia arasındadır.",
  source: KNEE_SOURCES.chain,
  review: "chain",
};
export const KNEE_CASE_QUESTION: CourseQuestion = {
  prompt:
    "Sıçrama sonrası akut diz travması yaşayan kurgusal hastada aktif diz ekstansiyonu kayboluyor. İlk olarak hangi işlevsel zincir değerlendirilmelidir?",
  options: [
    "Yalnız ayak bileği plantar fleksörleri",
    "Quadriceps–patella–patellar bağlantı zinciri",
    "Yalnız kalça abduktörleri",
  ],
  correct: 1,
  why: "Aktif ekstansiyon kaybı ekstansör mekanizma açısından değerlendirme gerektirir. Bu bulgu tek başına hangi dokunun yaralandığını veya hasarın derecesini belirlemez; akut travma tıbbi değerlendirme gerektirir.",
  source: KNEE_SOURCES.chain,
  review: "case",
};
export const KNEE_EXAM: CourseQuestion[] = [
  {
    station: "1. istasyon · Yapı bulma",
    prompt: "İsimleri gizlenmiş modelde patellar tendon / ligamenti seç.",
    options: ["Patellar tendon / ligament", "Quadriceps tendonu", "Başka yapı"],
    correct: 0,
    why: "Patellar bağlantı patellanın altında, patella ile tuberositas tibiae arasında uzanır.",
    source: KNEE_SOURCES.chain,
    review: "anatomy",
  },
  {
    station: "1. istasyon · Tutunma",
    prompt: "Quadriceps tendonu hangi yapıya doğrudan tutunur?",
    options: ["Patellanın üst bölümü", "Tuberositas tibiae", "Fibula başı"],
    correct: 0,
    why: "Quadriceps tendonu patellanın üst bölümüne tutunur. Tibiaya uzanan alt bağlantı patellar tendon / ligamenttir.",
    source: KNEE_SOURCES.chain,
    review: "chain",
  },
  {
    station: "2. istasyon · Sinir ve kas",
    prompt: "Rectus femorisin motor innervasyonu hangisidir?",
    options: ["N. tibialis", "N. obturatorius", "N. femoralis"],
    correct: 2,
    why: "Rectus femoris quadriceps grubundadır ve n. femoralis tarafından innerve edilir.",
    source: KNEE_SOURCES.muscle,
    review: "anatomy",
  },
  {
    station: "2. istasyon · Hareket",
    prompt: "Diz ekstansiyonunun başlıca kas grubu hangisidir?",
    options: ["Hamstringler", "Quadriceps femoris", "Kalça adduktorları"],
    correct: 1,
    why: "Quadriceps femoris diz ekstansiyonuna katılır. Hamstringler diz fleksiyonu için başlıca örneklerdir.",
    source: KNEE_SOURCES.motion,
    review: "motion",
  },
  {
    ...KNEE_CASE_QUESTION,
    station: "3. istasyon · Klinik bağlantı",
    prompt: "Akut ön diz travması ve aktif ekstansiyon kaybı, tek başına hangisini belirlemez?",
    options: [
      "Aktif dizi açmada güçlük bulunduğunu",
      "Hangi dokunun ne ölçüde hasarlı olduğunu",
      "Ekstansör zincirin değerlendirilmesi gerektiğini",
    ],
    why: "İşlev kaybı ekstansör zincirin değerlendirilmesini gerektirir. Öyküdeki bu iki bulgu, tek başına doku tanısını veya hasarın derecesini belirlemez.",
  },
];
const q = (
  prompt: string,
  options: readonly string[],
  correct: number,
  why: string,
  source: CourseQuestion["source"],
  review: KneeCourseStep,
  visualKey?: string,
): CourseQuestion => ({ prompt, options, correct, why, source, review, visualKey });
export const KNEE_ANATOMY_CHECKS = [
  q(
    "Menisküsleri bağ ve tendonlardan ayıran tanım hangisidir?",
    [
      "Kemikler arasındaki fibrokartilaj yapılar",
      "Kasları kemiğe bağlayan yapılar",
      "Yalnız kemiklerin üzerindeki eklem kıkırdağı",
    ],
    0,
    "Menisküsler yük aktarımına katkı sağlayan fibrokartilaj yapılardır.",
    KNEE_SOURCES.meniscus,
    "anatomy",
  ),
  q(
    "ÖÇB ve AÇB eşleştirmelerinden hangisi doğrudur?",
    [
      "ÖÇB arkaya, AÇB öne kaymayı sınırlar",
      "ÖÇB öne, AÇB arkaya kaymayı sınırlar",
      "İkisi de quadriceps tendonunun parçasıdır",
    ],
    1,
    "ÖÇB ve AÇB, tibianın femura göre farklı yönlerde aşırı kaymasını sınırlar.",
    KNEE_SOURCES.acl,
    "anatomy",
  ),
];
export const KNEE_CHAIN_CHECKS = [
  KNEE_CHAIN_QUESTION,
  q(
    "İç ve dış yan bağların distal kemik bağlantısı hangisidir?",
    ["MCL fibula, LCL tibia", "İkisi de patella", "MCL tibia, LCL fibula"],
    2,
    "MCL femur–tibia, LCL femur–fibula bağlantısı kurar.",
    KNEE_SOURCES.collateral,
    "chain",
  ),
  q(
    "Tibianın femura göre arkaya kaymasını sınırlayan temel bağ hangisidir?",
    ["Arka çapraz bağ", "Patellar tendon", "Ön çapraz bağ"],
    0,
    "Arka çapraz bağ, tibianın aşırı arkaya kaymasını sınırlar.",
    KNEE_SOURCES.pcl,
    "chain",
  ),
];
export const KNEE_CASES = [
  {
    id: "extensor",
    title: "Sıçrama sonrası açamama",
    visualKey: "patellar ligament",
    history:
      "Basketbolcu sıçrama sonrası düşüyor. Ön dizde ağrı ve şişlik var; dizi aktif açamıyor. Henüz doku tanısı yok.",
    stages: [
      {
        title: "Öykü ve işlev",
        text: "İşlev kaybını anatomik zincire bağla.",
        question: KNEE_CASE_QUESTION,
      },
      {
        title: "Muayene ve çıkarım",
        text: "Ek yaralanmalar ve yaralanma yeri henüz değerlendirilmedi.",
        question: q(
          "Bu bulguyla hangi sonuç güvenle çıkarılamaz?",
          [
            "Ekstansör zincirin değerlendirilmesi gerektiği",
            "Kesin olarak patellar tendonun tam yırtık olduğu",
            "Dizi aktif açmanın bozulduğu",
          ],
          1,
          "İşlev kaybı tek başına kesin doku tanısı değildir.",
          KNEE_SOURCES.chain,
          "case",
        ),
      },
      {
        title: "Yönetim ve egzersiz",
        text: "Tanı, doku bütünlüğü ve tedavi planı netleşmedi.",
        question: q(
          "Bu aşamada en uygun yaklaşım hangisidir?",
          [
            "Hemen ağır diz ekstansiyonu yaptırmak",
            "Ağrıya rağmen sıçrama testiyle spora dönüş vermek",
            "Tıbbi değerlendirmeyi sağlamak; yükleme ve egzersizi tanı sonrası planlamak",
          ],
          2,
          "Egzersiz ve dönüş planı değerlendirme ve tedaviye göre değişir.",
          KNEE_SOURCES.chain,
          "case",
        ),
      },
    ],
  },
  {
    id: "acl",
    title: "Yön değiştirmede boşalma",
    visualKey: "anterior cruciate ligament",
    history:
      "Futbolcu ani yön değiştirmede dizinin boşaldığını ve bir ses duyduğunu anlatıyor. Sonrasında şişlik gelişmiş.",
    stages: [
      {
        title: "Öykü ve hipotez",
        text: "Mekanizma bir olasılığı öne çıkarır; tek başına tanı koydurmaz.",
        question: q(
          "Değerlendirmeye hangi yapı ve eşlik eden yaralanmalar eklenmelidir?",
          [
            "Yalnız patellar tendon",
            "ÖÇB ve eşlik edebilen menisküs/bağ yaralanmaları",
            "Yalnız fibula başı",
          ],
          1,
          "Yön değiştirme ve boşalma öyküsü ÖÇB değerlendirmesini destekler; eşlik eden yapılar da incelenir.",
          KNEE_SOURCES.acl,
          "case",
        ),
      },
      {
        title: "Muayene ve görüntüleme",
        text: "Öykü, iki tarafın muayenesi ve gerektiğinde görüntüleme birlikte değerlendirilir.",
        question: q(
          "Normal bir düz grafi hangi sonucu göstermez?",
          [
            "Kemik değerlendirmesine katkı sunduğunu",
            "ÖÇB yaralanmasının kesin olarak dışlandığını",
            "Yumuşak doku için farklı inceleme gerekebileceğini",
          ],
          1,
          "Düz grafi bağ dokusunu doğrudan göstermez.",
          KNEE_SOURCES.acl,
          "case",
        ),
      },
      {
        title: "Rehabilitasyon ve hedef",
        text: "ÖÇB yaralanması doğrulanmış. Kişinin hedefleri ve tedavi yolu klinik ekiple belirleniyor.",
        question: q(
          "Rehabilitasyon planını seçerken hangi yaklaşım daha uygundur?",
          [
            "Herkese aynı takvim ve aynı egzersiz yükünü vermek",
            "Yalnız ağrı azalınca tüm sporlara izin vermek",
            "İnstabilite, eşlik eden yaralanmalar ve kişinin hedeflerine göre işlevsel ilerleme planlamak",
          ],
          2,
          "Plan, kişinin bulgularına ve hedeflerine göre düzenlenir.",
          KNEE_SOURCES.acl,
          "case",
        ),
      },
    ],
  },
  {
    id: "mcl",
    title: "Yandan darbe sonrası iç ağrı",
    visualKey: "medial collateral ligament",
    history:
      "Sporcu dizinin dış tarafından darbe alıyor. İç tarafta ağrı gelişiyor. Yaralanmanın derecesi henüz bilinmiyor.",
    stages: [
      {
        title: "Konum ve yapı",
        text: "Ağrı konumunu yan bağların anatomisiyle ilişkilendir.",
        question: q(
          "İç taraftaki bağ için doğru kemik ilişkisi hangisidir?",
          ["Femur–tibia, MCL", "Femur–fibula, LCL", "Patella–tibia, patellar tendon"],
          0,
          "İç yan bağ femur ile tibia arasında uzanır.",
          KNEE_SOURCES.collateral,
          "case",
        ),
      },
      {
        title: "Muayene ve kapsam",
        text: "Öykü MCL’yi düşündürüyor. Birden fazla yapı yaralanmış olabilir.",
        question: q(
          "Muayene kapsamı nasıl olmalıdır?",
          [
            "Yalnız ağrıyan noktaya bakmak",
            "MCL’yi ve eşlik eden bağ/menisküs yaralanmalarını değerlendirmek",
            "Ağrı konumundan yırtık derecesini kesinleştirmek",
          ],
          1,
          "Eşlik eden yaralanmalar tedavi planını etkiler.",
          KNEE_SOURCES.collateral,
          "case",
        ),
      },
      {
        title: "Egzersiz ve spora dönüş",
        text: "Klinik değerlendirme sonrasında hareket ve kuvvetin geri kazanılması hedefleniyor.",
        question: q(
          "Spora dönüş için en uygun ilke hangisidir?",
          [
            "Yalnız yaralanmadan geçen gün sayısı",
            "Yalnız şişliğin ilk kez azalması",
            "Hareket, kuvvet ve işlevin değerlendirilmesiyle kademeli ilerleme",
          ],
          2,
          "Dönüş, işlevsel ilerleme ve yaralanmanın özellikleriyle planlanır.",
          KNEE_SOURCES.collateral,
          "case",
        ),
      },
    ],
  },
  {
    id: "meniscus",
    title: "Dönmeyle ağrı ve takılma",
    visualKey: "medial meniscus",
    history:
      "Kişi bükülü diz üzerinde döndükten sonra eklem hattında ağrı ve aralıklı takılma hissi anlatıyor.",
    stages: [
      {
        title: "Öykü ve hipotez",
        text: "Takılma ve eklem hattı ağrısı, menisküs değerlendirmesine yön verebilir.",
        question: q(
          "Bu öykünün en uygun yorumu hangisidir?",
          [
            "Menisküs mutlaka tamamen yırtıktır",
            "Menisküs değerlendirilmelidir; bulgular tek başına kesin tanı değildir",
            "Menisküsün kas olduğu anlaşılır",
          ],
          1,
          "Benzer yakınmalar farklı diz yaralanmalarında görülebilir.",
          KNEE_SOURCES.meniscus,
          "case",
        ),
      },
      {
        title: "Muayene ve klinik test",
        text: "Eklem hattı ve hareket değerlendirilir. McMurray gibi testler diğer bulgularla yorumlanır.",
        question: q(
          "Bir klinik testin sonucu nasıl kullanılmalıdır?",
          [
            "Tek başına yırtığın bütün ayrıntılarını belirler",
            "Öykü, muayene ve gerektiğinde görüntülemeyle birlikte yorumlanır",
            "Diğer yapıların değerlendirilmesini gereksiz kılar",
          ],
          1,
          "Klinik test değerlendirmenin bir parçasıdır.",
          KNEE_SOURCES.meniscus,
          "case",
        ),
      },
      {
        title: "Tedavi ve yükleme",
        text: "Menisküs onarımı veya parsiyel menisektomi sonrası egzersiz planlanacağı belirtiliyor.",
        question: q(
          "Bu iki işlem sonrası hangi yaklaşım uygundur?",
          [
            "Aynı yükleme planını otomatik uygulamak",
            "Yalnız ağrı azlığına göre sınırsız yük vermek",
            "İşlem, doku iyileşmesi ve klinik planı dikkate almak",
          ],
          2,
          "Onarım ve menisektomi sonrası iyileşme ve yükleme gereksinimleri aynı değildir.",
          KNEE_SOURCES.meniscus,
          "case",
        ),
      },
    ],
  },
];
export const KNEE_CASE_CHECKS = KNEE_CASES.flatMap((c) => c.stages.map((s) => s.question));
export const LEGACY_KNEE_EXAM_IDS = [
  "locate-patellar",
  "quad-insertion",
  "rectus-nerve",
  "extensor-group",
  "trauma-limits",
];
export type KneeBankQuestion = CourseQuestion & {
  id: string;
  domain: "structure" | "motion" | "clinical";
  locate?: boolean;
};
export const KNEE_QUESTION_BANK: KneeBankQuestion[] = [
  ...KNEE_EXAM.map((question, i) => ({
    ...question,
    id: LEGACY_KNEE_EXAM_IDS[i],
    domain: (i < 2 ? "structure" : i < 4 ? "motion" : "clinical") as KneeBankQuestion["domain"],
    locate: i === 0,
    visualKey: [
      "patellar ligament",
      "quadriceps tendon",
      "rectus femoris",
      "quadriceps group",
      "patellar ligament",
    ][i],
  })),
  ...KNEE_ANATOMY_CHECKS.map((question, i) => ({
    ...question,
    id: "anatomy-" + i,
    domain: "structure" as const,
    visualKey: i === 0 ? "medial meniscus" : "anterior cruciate ligament",
  })),
  {
    ...KNEE_CHAIN_CHECKS[1],
    id: "collateral-bones",
    domain: "structure",
    visualKey: "lateral collateral ligament",
  },
  {
    ...KNEE_CHAIN_CHECKS[2],
    id: "pcl-direction",
    domain: "structure",
    visualKey: "posterior cruciate ligament",
  },
  {
    ...KNEE_CHAIN_QUESTION,
    id: "patellar-connection",
    domain: "structure",
    visualKey: "patellar ligament",
  },
  ...KNEE_CHECKS.map((question, i) => ({
    ...question,
    prompt: [
      "Dizin açık 0° konumu nasıl adlandırılır?",
      "Dizin 0° konumundan 60° konumuna geçişi hangi harekettir?",
      "Dizin 120° konumundan 60° konumuna dönüşü hangi harekettir?",
    ][i],
    id: "movement-" + i,
    domain: "motion" as const,
    visualKey: "tibia",
  })),
  {
    ...q(
      "Hangi kas grubu diz fleksiyonuna katılır?",
      ["Quadriceps femoris", "Hamstringler", "Deltoid"],
      1,
      "Hamstringler diz fleksiyonuna katılır.",
      KNEE_SOURCES.motion,
      "motion",
    ),
    id: "flexor-group",
    domain: "motion",
    visualKey: "hamstrings group",
  },
  {
    ...q(
      "Bu dersteki 0°, 60° ve 120° durakları neyi ifade eder?",
      [
        "Her kişinin normal hareket açıklığını",
        "Klinik ölçümün zorunlu sınırlarını",
        "Öğrenme için seçilmiş gösterim konumlarını",
      ],
      2,
      "Yaklaşık gösterim klinik hareket açıklığı ölçümü değildir.",
      KNEE_SOURCES.motion,
      "motion",
    ),
    id: "pose-limits",
    domain: "motion",
    visualKey: "tibia",
  },
  ...KNEE_CASE_CHECKS.map((question, i) => ({
    ...question,
    id: "clinical-" + i,
    domain: "clinical" as const,
    visualKey: KNEE_CASES[Math.floor(i / 3)].visualKey,
  })),
];
export function kneeQuestion(id: string) {
  return KNEE_QUESTION_BANK.find((q) => q.id === id);
}
export function makeKneeExam(round = 0): string[] {
  const pick = (domain: KneeBankQuestion["domain"]) => {
    const pool = KNEE_QUESTION_BANK.filter((q) => q.domain === domain && !q.locate);
    return Array.from({ length: 3 }, (_, i) => pool[(round * 3 + i) % pool.length].id);
  };
  // Three distinct case contexts per round; stage selection advances every four rounds.
  const clinical = Array.from({ length: 3 }, (_, i) => {
    const caseIndex = (round + i) % KNEE_CASES.length,
      stage = Math.floor(round / 4) % 3;
    return caseIndex === 0 && stage === 2 && round % 2 === 0
      ? "trauma-limits"
      : `clinical-${caseIndex * 3 + stage}`;
  });
  return ["locate-patellar", ...pick("structure"), ...pick("motion"), ...clinical];
}
