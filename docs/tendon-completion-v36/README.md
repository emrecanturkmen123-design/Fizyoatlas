# Tendon paketinin kaynak ve doğrulama kapsamı

Bu paket mevcut klinik Atlas kapsamını tamamlar; insan vücudundaki bütün tendonları modellediği iddiasını taşımaz.

## Kaynak yüzeyler

Z-Anatomy arşivi yeniden indirildi ve önceki kaynak kaydıyla aynı SHA-256 doğrulandı. Blender 4.2.0, otomatik betik çalıştırması kapalıyken yalnız seçilen nesneleri yükledi. Kaynağın `Tendon` materyalli yüzeyleri ve isimlendirilmiş ortak ekstansör origo yüzeyi kullanıldı. Proksimal/distal biseps bileşenleri ayrıldı; quadriceps bölgesi önceki patellar çıkarımın kesim sınırının üstünden alındı. Yeni yüzeyler kaynak şekilleri korunarak referans kemiklere ölçek ve öteleme ile hizalandı.

| Yapı | Sağ ve sol model kapsamı |
| --- | --- |
| Biseps uzun baş | Kaynak proksimal tendon bileşeni; labrum, pulley ve kılıf ayrıntıları tamamlanmış değildir |
| Distal biseps | Kaynak distal tendon bileşeni; tüm bicipital aponevroz gösterilmez |
| Quadriceps | Rectus femoris, vastus intermedius ve vastus lateralis kaynak distal tendon bölgeleri; dört kas ve bütün tendon katmanlarının yeniden oluşturulması değildir |
| Ortak ekstansör | Kaynak origo tutunma yüzeyi; tam tendon gövdesi değildir |
| Supraspinatus, subscapularis, teres minor | Önceki kaynak insertio yüzeyleri korunmuştur; kaynak kas nesnelerinde tendon materyalli tam gövde bulunmadı |

Sekiz yeni parça eklendi. `tendon-completion-source.json` arşiv kimliğini, nesne seçimlerini, kayıt dönüşümlerini, yazarları, CC-BY-SA-4.0 lisansını ve tam dizi hashlerini içerir. `validate-tendon-completion.mjs`, önceki 2.323 parçanın pozisyon, normal ve üçgen indeks dizilerini `88365d1913ad0bf8e398dd3560ba5a91c5509e49` ile byte düzeyinde karşılaştırır. Görsel inceleme `reference-surfaces.png` üzerindedir; kemikler yarı saydamdır.

`attachment-distances.json` ilgili kaynak uç yamalarının referans kemik üçgenlerine BVH uzaklıklarını kaydeder. Bu sayılar anatomik yerleşim kontrolüdür; klinik doğruluk ölçümü, gerilim veya hasta verisi değildir.

## Hareket doğrulaması

120 üretim pozu sağ/sol ve %0/%50/%100 örneklerinde incelendi: omuz 36, dirsek 24, kalça 36, diz 12, ayak bileği 12. Üretimdeki dönüşmüş kaynak üçgenleri CPU üzerinde çizildi; tüm pozisyonlar sonlu ve rijit kemik dönüşümlerinin determinantı 1 idi. Yeni kaynak biseps uçları dirsek fleksiyonunda ve quadriceps distal yaması patella takibinde ayrıca sınandı. İlk poza dönüş kaynak yüzeylerini değiştirmiyor. Tendon katmanı quadriceps bağlamını antagonist anahtarından bağımsız yükler.

Yürüyüşün sekiz evresinin kaslı üretim pozları ön/yan izdüşümde incelendi. PNG'ler WebGL ekran görüntüleri değildir. Önceki canlı kontrolde bulut tarayıcısında WebGL kullanılamadığı için GPU görüntü doğrulaması yapılmış sayılmaz. Bütün deformasyonlar eğitim amaçlı yaklaşık hareketlerdir; doku çarpışması, strain, rüptür veya iyileşme simülasyonu değildir.

## Öğrenme ve gezinme

- Atlas içinde 14 klinik yapı kartı; tendon çalışması ayrı üst bölüm değildir. Karşılaştırma kaynak karttan açılır ve kapanınca aynı yapı/tarafa döner. Eski karşılaştırma bağlantıları desteklenir.
- 50 açıklamalı tendon sorusu, beş karşılaştırma, sağ/sol 28 model bulma sorusu. Model bulmada aynı bölgenin tüm adayları aynı renkte gösterilir; hedef seçiciye gizlice verilmez. Gerçek kaynak üçgenleri Canvas2D izdüşümünde de seçilebilir; numaralı bölgeler klavye alternatifi sağlar. İsimler cevap onayına kadar gizlenir.
- Altı vaka ailesinde üç karar yolu ve toplam 36 takip sorusu. Takip senaryoları kurgusal eğitim verisidir. Sınav modu ana senaryoyu korur.
- 474 özgün soru için konu bazında son cevap, yanlış ve tekrar zamanı takibi. Tekrarlanan denemeler konu kapsamını şişirmez. Tendon/bağ ve eski kas favorileri aynı kayıtta korunur.
- Gerçek SQLite üzerinde yeni soru puanlama, tekrar isteğinin tek kayda dönüşmesi, eski isteğin son doğru cevabı ezmemesi, kullanıcı ayrımı, geçersiz seçimlerin reddi ve eski/yeni favoriler sınandı.
- Türkçe arama, model talep yüklemesi, kaynak kartlar, paylaşım/geri dönüş adresleri ve 320/390 piksel model alanı sınırları kontrol edildi. Fiziksel telefon veya canlı GPU denemesi yapıldığı iddia edilmez.

Çalıştırma: `npm run check`; `node --import ./scripts/register-typescript.mjs scripts/validate-tendon-completion.mjs`; `node --import ./scripts/register-typescript.mjs scripts/validate-topic-learning.mjs`. Panel testleri `register-ui.mjs` kullanır. Kaynak dışa aktarımı Blender ister; kaynak ithali sistem Python/Numpy/Scipy, görsel çizim Matplotlib ister.
