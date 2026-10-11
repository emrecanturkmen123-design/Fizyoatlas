# Diz dersinin genişletilmesi ve kayıt düzeltmeleri · V44

Ders 13 yapı, üç hareket durağı, üç bağlantı sorusu ve dört vakadaki 12 kararı kapsar. Yeni kaynak modeller: bilateral arka çapraz bağ, iç/dış yan bağlar, iç/dış menisküsler. Ekstansör zincirde quadriceps grubu dört kası gösterir. Kaynak modellerin lisansı, nesne adları ve kayıt dönüşümleri `public/models/knee-course-source.json` içinde yer alır. Eski geometri ve veri parçaları değiştirilmedi.

Öğrenme soruları açıklamayı gördükten sonra ayrı ayrı tekrar çözülebilir. Bir adımın başarı işareti tüm kontrollerin doğru yanıtlanmasını gerektirir; yanlış cevaplar “Tekrar gerekli” olarak gösterilir. Adımlar serbestçe açılabilir. Sınavda yanıtlar bitirmeden önce değiştirilebilir; 3D/2D seçim vurgusu ve önceki soruya dönüş aynı kaydı kullanır. 27 soruluk bankadan 10 soru seçilir; her turda üç farklı vaka bağlamı bulunur. Tekrar sınavı ders kayıtlarını silmez.

İlerleme sürümü 2. Eski sürümdeki beş soruluk sınavın kimliği, yanıtları, sonucu ve ders kayıtları korunarak okunur; yeni kontroller boş başlar. Hareket durağı, son yapı, 2D/3D görünümü, vaka aşaması ve sınav sorusu saklanır. Kayıt bilgisi dar ekranda da görünür. Giriş sonrası misafir taslağı kullanıcı seçimiyle birleştirilir; hesapta dolu yanıtlar ve başlamış sınav korunur. Taslak ancak hesap yazımı başarılı olunca silinir. Depolama veya hesap yazımı hatasında açık sayfadaki çalışma korunur ve tekrar kayıt denenebilir.

## Doğrulama

- `npm run check` ve Sites üretim derlemesi.
- `node --import ./scripts/register-ui.mjs scripts/validate-knee-course.mjs`: gerçek SQLite/Worker API, kimlik ayrımı, CSRF, geçersiz veri, sürüm geçişi, iki tarafın kaynak modelleri, sıkıştırılmış veri/hash, soru bankası ve altı adımın sunucu çıktısı.
- Atlas tamponları, Türkçe arama, bölüme göre model indirme, bölüm bağlantıları, diz hareketi, mevcut patella/tendon hareketi ve WebGL hata kurtarma kontrolleri.
- Geçici React bileşen/hook etkileşim çalışması: tam ders, yanlış yanıtı yeniden çözme, 10/10 sonuç, önceki sınav yanıtını değiştirme, sağ model seçimleri, gerçek 2D kaynak yükleme/numaralı seçim, yeni sınav, misafir yenileme, aktarım, başarısız yazma/okuma ve depolama tekrar denemeleri. Yalnız WebGL sahnesi test karşılığıyla değiştirilmiştir; kaynak 2D bileşenleri ve kayıt hook'u çalıştırılmıştır.

Bu oturumda yönetilen tarayıcı kontrolü bulunmadığından piksel/GPU/touch ve fiziksel cihaz doğrulaması yapılmadı. Yeni bağ ve menisküs yüzeyleri sağlıklı, statik referans anatomidir; şematik hareket rigine eklenmemiştir. Dersteki 0°/60°/120° duraklar öğretim konumlarıdır. Klinik vakalar eğitim içindir; model temas, yük, hasar veya iyileşme hesaplamaz.
