# Rehberli diz dersi · 2026-10-03

Mevcut beyaz/petrol çalışma arayüzü ve Atlas, Hareketler, Kendini Sına gezinmesi korunur. Yeni ders, Atlas'ın ilk ekranından ve diz filtresinden, hareket menüsünden, sınama menüsünden ve Çalışmalarım'dan açılır. Ana model ders boyunca kapatılır; ders kendi çerçevesinde tek bir model açar. Ders modülü gerektiğinde yüklenir.

`#diz-dersi` kaydedilmiş adımı açar; `?adim=anatomy|motion|chain|case|exam|result` belirli çalışma adımını taşır. Tamamlanmamış sınavın sonuç adresi sınav adımına döner. Ders adımları tarayıcı geçmişinde ayrı kimliklere sahiptir.

## Kapsam

- Femur, tibia, patella, rectus femoris ve patellar bağlantıyı aynı model üzerinde seçerek inceleme.
- 0°, 60° ve 120° gösterim durakları, durak başına açıklama ve soru. Kısa geçiş sonunda oynatma durur; azaltılmış hareket tercihi geçişi kaldırır.
- Quadriceps kası, quadriceps tendonu, patella, patellar bağlantı ve tibia arasında seçim.
- Akut travma/aktif ekstansiyon kaybına ilişkin kurgusal vaka; doku tanısını bulgudan tek başına çıkarmama.
- Üç istasyonda beş soruluk pratik sınav: modelden yapı seçme, tutunma, innervasyon, hareket ve klinik çıkarım. Açıklamalar sonuçta açılır; yanlışlar ilgili ders adımına bağlanır. Sınavı tekrar çözme ve tüm dersi onayla sıfırlama ayrıdır.
- Sağ ve sol taraf; kaynak 3D yüzeyler ve Canvas 2D izdüşümü. 2D hareket gösterimi kaynak kemik yüzeylerine aynı yaklaşık sabit ekseni uygular. Sınavın 2D yapı sorusu mevcut anonim kaynak izdüşümünü ve numaralı seçimleri kullanır.
- Kaslı görünüm ve şematik patella/tendon hareketi isteğe bağlıdır. Agonist/antagonist veya düzlem otomatik açılmaz.

Anatomi kaynakları: Texas Tech University hareket modülü, University of Washington rectus femoris kartı ve AAOS patellar tendon anatomisi. Modelin geometrisi ve mevcut hareketlerin kinematik hesabı değiştirilmedi. Açı durakları normal eklem hareket açıklığı ölçümü, klinik kinematik veya kuvvet/temas hesabı değildir.

## Kayıt

Yeni `course_progress` tablosu ve `/api/courses` GET/PUT uçları. Kimlik, mevcut Sites oturum başlıklarından alınır; kullanıcı ve ders kimliği birleşik anahtardır. İlerleme sürümü, adım, taraf, incelenen yapılar ve soru seçimleri sunucuda doğrulanır. Skor istemciden kabul edilmez; bilinen doğru seçeneklerden hesaplanır. Aynı kaynak denetimi, JSON ve gövde sınırları uygulanır. Başarısız ilk okuma, mevcut kaydı yanlışlıkla sıfırlayacak yazmayı durdurur; başarısız yazma açık sayfada tutulur ve yeniden denenir.

Giriş yapan kullanıcının kaydı D1'de saklanır. Misafirin geçici taslağı sessionStorage'dadır; kalıcı veya cihazlar arası kayıt olarak sunulmaz, hesaba otomatik aktarılmaz. Kayıt durumu ve giriş bağlantısı dersin içinde bulunur.

Yeni, sınırlı şema değişikliği: `drizzle/0004_gifted_plazm.sql`. Önceki SQL/snapshot dosyaları korunur.

## Doğrulama

- TypeScript ve üretim derlemesi; 74 mevcut okuma sayfası.
- `validate-knee-course.mjs`: gerçek modelden iki tarafın beş yapısı; clinicalKey taşımayan Z-Anatomy patellar yüzeyinin doğru sınav yanıtı olması; altı adres; gerçek SQLite göçleri, adım/soru devamı, sonuç/sıfırlama, geçersiz veri, kullanıcı ayrımı ve CSRF; altı React ekranının sunucu çıktısı ve sınav açıklamalarının sonuçtan önce açılmaması.
- Mevcut gezinme, çalışma alanı, model talebi ve vaka kayıt kontrolleri.
- Diz: iki taraflı kemik/rol kontrolleri; 32 poz/111104 kas yüzeyi koruma kontrolü; 204 tendon pozu/52632 tutunma noktası kontrolü. Kaynak model verisi değişmedi.
- `validate-knee.mjs` eski yalnız-kas fibularis denetimi, önceki sürümde eklenmiş dört açıkça adlandırılmış tendon gövdesini de kabul edecek şekilde düzeltildi. Kas etiketlerinin doğruluğu korunur; rastgele bağ dokusu etiketi kabul edilmez.

## Kontrol sınırı

Bu oturumda gerekli control-browser becerisi bulunmadığından yönetilen tarayıcı önizlemesi kullanılmadı. React çıktı/işlev/veri kontrolleri görsel tarayıcı veya fiziksel cihaz testi yerine sunulmaz. Yeni 3D çerçevenin GPU görünümü, fare/dokunma akışı, mobil piksel düzeni ve FPS burada doğrulanmadı. Sites yayın sonucu ayrıca terminal durumla doğrulanır.

Yeni ekranın CSS'i 44 px kontroller, okunabilir gövde, dar ekranda tek sütun ve yatay kaydırılan ders adımları içerir. Bunlar uygulanmış düzen kurallarıdır; gerçek cihazda geçmiş bir görsel test iddiası değildir.
