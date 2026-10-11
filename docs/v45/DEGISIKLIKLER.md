# Fizyo Atlas V45 — V44 denetimi sonrası düzeltmeler

Kaynak tabanı: V44, 62e4f9f4d12305ef976ffc026923df962c275c2e.

| Bulgu | Uygulanan değişiklik | Doğrulama |
|---|---|---|
| F01–F02 | Öğrenme kaydı yüklenmeden yanıt onayı kapalı. Yalnız 401 misafir modunu açıyor; 503 cihaz kaydına dönüştürülmüyor. | Gerçek React hook ve test onayı; bekletilmiş GET, 503 ve kayıt hatası tekrar denemesi |
| F03 | Başarısız misafir vaka kaydı bellekte korunuyor, tekrar denemede yerel depoya yazılıyor; kapatma uyarısı mevcut. | Depolama kotası hatası, tekrar deneme, beforeunload |
| F04 | Genel, kas, yapı ve tekrar testlerinin soru sırası, seçenekleri, seçimleri, onayları ve konumu saklanıyor. Hesap oturumu D1, misafir oturumu cihazda. Bekleyen yanıt aynı deneme kimliğiyle tekrar gönderiliyor. | Oturum doğrulayıcısı, gerçek SQLite API, React yeniden açma ve mükerrer deneme kontrolü |
| F05 | 2D ve 3D seçimleri ortak seçili parça kullanıyor; onaylanan model sorusunda seçim kilitleniyor. Modeldeki yanlış adaylar da geçerli test oturumu olarak saklanıyor. | Gerçek QuizPanel/FindingProjection etkileşimi ve callback; GPU çizimi kapsam dışı |
| F06 | Her defter notunun ayrı taslağı ve etkin taslak saklanıyor. A notundan B'ye geçince A'nın değişikliği korunuyor. Depolama hatası görünür ve tekrar denenebilir. | İki taslak arasında geçiş, yeniden mount ve depolama hatası |
| F07 | Ders, vaka, not ve test oturumlarında atomik revision kontrolü. Eski cihaz yazımı 409 ile duruyor; kullanıcı yerel/hesap sürümünü seçiyor. | Dört depoda iki eski snapshot, çatışma ve açık çözüm; hesap ayrımı |
| F08 | Eski sabit sayı, yüzey seçimi, açılır içerik ve API kayıt testleri güncel kapsamı doğruluyor. Tarihsel geometri karşılaştırmaları korunuyor. | Tüm doğrulama dizisi |
| F09 | AÇB, MCL, LCL ve iki menisküs Atlas listesi, kart, arama, favori, modelde bul ve bilgi sayfasında. Menisküs ayrı doku grubu. | İki tarafın kaynak yüzeyleri, kartlar, soru ve arama testleri |
| F10 | 28 eksik yapı grubuna 140 soru; kalça, omurga ve sinir sistemi için 30 temel soru. Toplam 692 soru, 38 yapı grubunun her birine 5 özel soru, 76 model sorusu. | Her sorunun tanımı, seçenekleri, kaynak adresi ve tüm filtre kombinasyonları |
| F11 | El/ayak falanksları adlandırma ve modüle göre ayrılıyor. Destek dokularında komşu tendonlar, fleksör retinakulumlarda aynı taraftaki kaynak sinir yüzeyleri gösteriliyor. | 19 distal grubun iki tarafı; karşı taraf ve el/ayak sızıntısı yok |
| F12 | Çalışma panelleri ve 3D renderer gerektiğinde yükleniyor. İlk arayüz için yalnız Three math modülleri. 2D model cache sınırı 24 MiB. | Üretim bundle boyutları; model talep testleri. Tam kaslı Atlas geometrisi hâlâ yaklaşık 16.2 MB gzip; gerçek açılış süresi/FPS ölçülmedi. |
| F13 | Bozuk ders/vaka/not JSON'u yalnız o kaydı etkiliyor; diğer kayıtlar açılıyor ve okuma uyarısı gösteriliyor. | Gerçek SQLite'da bozuk ve sağlam satır birlikte |
| F14 | Kart açıklamaları koyulaştırıldı ve 14 px oldu; tendon lejandı yeşili koyulaştırıldı. Dar tablet ve yatay ekran için iki satırlı başlık. | Kaynak/CSS kontrolü. Görsel reflow ve ekran okuyucu testi yapılmadı. |
| F15–F17 | BodyParts3D bağlantısı /desc.html, arama limiti tek sabit 60, katman erişilebilir adları Türkçe. | Kaynak adresi ve arama doğrulamaları |

## Veri geçişi

Drizzle 0005 migration: üç mevcut tabloda revision INTEGER NOT NULL DEFAULT 0 ve quiz_sessions tablosu. Eski migrations değiştirilmedi; kullanıcı kayıtları silinmedi. Eski açık sekmeler, bir başka yazımdan sonra çatışma alabilir; yeni sürümü açmak gerekir.

## Sınırlar

- Geometri hash, tutunma, iki taraflı poz ve seçim matematiği kontrolleri çalıştırıldı. Gerçek telefon, GPU/FPS, ekran okuyucu, dokunmatik hedef ve görüntü kontrolleri yapılmadı.
- Sites managed Linux önizleme yönergesi control-browser yoksa başka bir tarayıcı yolunu kullanmamayı gerektiriyor. Beceri mevcut değil; tarayıcı testi tamamlanmış sayılmıyor.
- Ana JavaScript boyutunun küçülmesi tüm 3D model verisinin küçüldüğü anlamına gelmez. Bundle ölçümü build-size.json, kontroller validation-results.json içinde.
- İçerik eğitim amaçlı kaynaklandırıldı; yeni uzman klinik onayı yapıldığı iddia edilmiyor. AAOS, OpenStax ve mevcut üniversite anatomi kaynakları kullanıldı.
