export const LESSON_CAPABILITIES={
 shoulder:{short:'6 hareket · iskelet/kas · skapula',text:'İskelet veya kaslı görünümde 6 hareketi oynat. Kas karşılaştırması sabit pozdadır; skapula katkısı seçili hareketlerde açılabilir.'},
 elbow:{short:'4 hareket · iskelet/kas · kasılma',text:'Dirsek ve önkolun 4 hareketini iskelet veya kaslı görünümde incele. Biceps–triceps şeması ve kasılma senaryoları fleksiyon–ekstansiyon içindir.'},
 hip:{short:'6 hareket · iskelet/kas · karşılaştırma',text:'6 kalça hareketinde iskelet veya kaslı görünümü seç. Pelvis sabit, diz düzdür; kas karşılaştırması sabit pozdadır.'},
 knee:{short:'2 hareket · iskelet/kas · karşılaştırma',text:'Diz fleksiyon ve ekstansiyonunu iskelet veya kaslı görünümde incele. Patella–tendon şemasını isteğe bağlı aç; kas karşılaştırması sabit pozdadır.'},
 ankle:{short:'2 hareket · iskelet/kas · karşılaştırma',text:'Dorsifleksiyon ve plantar fleksiyonu iskelet veya kaslı görünümde incele. Ayak kemikleri birlikte döner; yer teması modellenmez.'},
 gait:{short:'8 poz · ayak teması · yumuşak geçiş',text:'Sekiz yürüyüş pozunu seç veya döngüyü oynat. Topuk, taban ve ön ayak temasını izle; kasları ve sagittal düzlemi istersen aç.'}
};
export function LessonIntro({lesson}:{lesson:keyof typeof LESSON_CAPABILITIES}){return <p className="lesson-intro">{LESSON_CAPABILITIES[lesson].text}</p>;}
