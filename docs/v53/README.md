# Fizyo Atlas V53 — sinir kartı ve mobil kamera

Başlangıç V52, commit `e30f5b0c8b80cc94ac88f3e7a5458ad165634acb`. Kullanıcının devam talebi üzerine açık sinir kaynağı ve mobil/3D maddeleri incelendi.

## Değişiklikler

- Sinir kartında **İki taraf / Sağ / Sol** seçimi vardır. Sinirin kendisi veya seçili motor hedef kasları gösterilebilir; etkin düğme belirtilir. Taraf değiştirilince seçili görünüm korunur.
- Sinir/kas görünümü `sinirgosterim=kaslar` ile bağlantıya yazılır. Yenileme ve geri/ileri aynı kart, taraf ve görünümü geri açar. Bu ayarlar yeni geçmiş sayfaları oluşturmaz.
- Üst ve alt gluteal sinir kartları arkadan açılır. Önceki çalışma görünümünün gizlediği dokular veya ayrıştırma ayarı yeni sinir kartına taşınmaz.
- Kamera alanı, görünen paneller çıkarıldıktan sonra kalan uygun dikdörtgenden hesaplanır. Eski minimum alan zorlaması, çok kısa ekranlarda çerçeveyi kartın arkasına taşıyordu; artık kapalı alan genişletilmez. Kullanılabilir alan yoksa sonlu kamera korunur ve seçime odaklanma ertelenir.
- Seçili yapının sınırları kamera koordinatlarında hesaplanır; ön, arka ve yan açılarda derinlik de dikkate alınır. Ekran boyutu/yönü veya mobil bilgi paneli değişince seçim yeniden çerçevelenir.
- Mobil tarafta sinir seçicisi en az 44 px yüksekliğinde ve 16 px yazıyla gösterilir.

## Doğrulama

`npm run check` başarılıdır. Genel çalıştırmada **75/75 JavaScript doğrulama betiği geçti**; tam çıktı `validation-results.json` içindedir. İlgili 11 kontrolün bağımsız sonucu `targeted-validation.json` içindedir.

Yeni kontroller 24 sinirin her iki taraftaki gerçek kaynak kimliklerini, gerçek Home bileşenindeki taraf ve görünüm kontrollerini, yenileme/geri/ileri davranışını, etkin düğmeleri ve kaynak yokluğu açıklamasını sınar. Kamera kontrolü kısa ekranı, genişletilmiş kartı, klavye ile azalan alanı ve çoklu paneli kapsar; aynı Three kamerası farklı ekran oranlarında ön/arka/yan açılara geçirilip sınır kutusunun sekiz köşesi gerçek projeksiyon matematiğiyle denetlenir.

React akışlarında GPU sahnesi ve DOM portalları taklit edilir. Bu sonuçlar **tarayıcı piksel düzeni, GPU çizimi veya fiziksel iOS/Android sınaması değildir**. Gerekli tarayıcı kontrol becerisi ortamda bulunmadığı için alternatif bir otomasyon yolu kullanılmadı. Fiziksel cihaz sınaması açık kalır.

## Anatomik kapsam

Bu sürüm atlas geometri verilerini değiştirmez. Alt gluteal sinirin bağımsız yüzeyi mevcut Z-Anatomy kaynağında bulunmaz; kullanılabilir yeni bir kaynak yüzeyi doğrulanamadı. Kart gerçek gluteus maximus hedef kasını gösterir ve ayrı sinir modelinin bulunmadığını açıklar. Bağımsız alt gluteal sinir modellemesi tamamlanmış sayılmaz. V52'deki dört gerçek pektoral sinir yüzeyi ve kaynak/hizalama kayıtları korunur.
