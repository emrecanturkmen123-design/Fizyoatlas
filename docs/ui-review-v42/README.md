# Çalışma arayüzü güncellemesi — 2026-10-02

Kartlarda anatomi bilgisi önce gelir. Hareket ve beş soruluk çalışma görünür; karşılaştırma, favoriler, vaka, model görünümü ve kaynak sınırları açılır bölümlerdedir. 33 bağ/tendon/retinakulum/kılıf kartı bölge ve doku türüne göre gruplanır.

Görsel ve klinik karşılaştırma ile kaynak kesiti tek inceleme alanında bulunur. Varsayılan eşleşme aynı bölgeden seçilir. Yapılar ayrı merkezlerde, ortak fiziksel ölçekte gösterilir; özgün anatomik konum ayrı seçenektir. Çevre yapılar saydamdır. Görsel ve klinik Atlas bağlantıları ve soru dönüşü seçilen tarafı korur. Eski tendon karşılaştırma adresleri yeni alana taşınır.

Çalışmalarım; tekrar/ilerleme, Defter ve Favoriler için ortak, geniş çalışma alanıdır. Bugünkü çalışma ilk sıradadır; hesap açıklamaları daha aşağıdadır. Boş Defterde gereksiz arşiv ve koleksiyon kontrolleri gösterilmez. Taslak metin kapatma ve yenilemede korunur. Doğrudan okuma adresleri ana WebGL sahnesini başlatmaz.

## Doğrulama

- TypeScript kontrolü ve kaynak farkında boşluk kontrolü geçti.
- `node --import tsx scripts/validate-study-workspace.mjs`: 33 karşılaştırma × iki taraf; ortak ölçek, merkezleme, anatomik konum, kamera/çevre/sekme bağlantıları.
- `validate-workspace-routes.mjs`: yapı, taraf, hareket, yürüyüş, vaka ve test adresleri; geri/ileri kimliği ve arama.
- `validate-atlas-expansion.mjs`: mevcut 2343 kaynak dizisi değişmedi; 38 distal yüzey ve gerçek SQLite Defter oluşturma/güncelleme/arşivleme/geri alma/kullanıcı ayrımı.
- `validate-connective-study.mjs`: 33 yapı × iki taraf.
- `validate-tendon-learning.mjs`: 50 açıklamalı soru, 5 klinik karşılaştırma, tekrar planı, 18 karar yolu/36 takip sorusu ve SQLite vaka ilerlemesi.
- Tarayıcı: masaüstü Çalışmalarım/Favoriler/Defter ve geri düğmesi; Aşil kartında bilgi ve temel eylemler; görsel/klinik karşılaştırma; eski bağlantı; sol tarafın Atlas/test/dönüşte korunması; Defter taslağının yenilemede korunması.
- 390×844 ve 844×390 CSS görünüm alanları: Çalışmalarım/karşılaştırma taşması yok; başlıklar altında kaydırılabilir alan. Mobil kartın net okuma alanı 325 px; genişletilmiş görünüm 513 px. Kart altı eylemler en az 44 px; mobil Paylaş görünür.

## Sınırlar

Bu tarayıcıda WebGL kapalıdır. Ana 3D sahnesinin GPU, dokunma jesti, FPS ve fiziksel telefon/tablet performansı doğrulanmadı. Karşılaştırma kaynak yüzeylerinin Canvas 2D izdüşümü görüntülendi. Oturum açılmış bulut Defter kaydı burada denenmedi; kayıt davranışı SQLite üzerinde doğrulandı. Anatomi geometrisi, hareket modelleri ve klinik içerik değiştirilmedi.

Ekran kayıtları: `desktop-study-hub.jpg`, `mobile-study-hub.jpg`. Geçici iframe kontrol sayfası yayın kaynaklarından kaldırıldı.
