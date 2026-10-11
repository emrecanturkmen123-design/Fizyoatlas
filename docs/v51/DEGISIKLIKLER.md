# V51 — Kesit aracının kaldırılması

Kaynak model kesiti sekmesi, düzlem/bölge/konum kontrolleri, kesit çizimi ve kullanılmayan geometri hesapları kaldırıldı. Atlas girişinin ve panelin adı Karşılaştırma oldu. Görsel karşılaştırma, ortak kamera ve ölçek, anatomik konum/merkezleme, taraf seçimi, bilgi karşılaştırması, Atlas kartına geçiş ve soru çalışmaları korunur.

Eski `gosterim=section` bağlantıları görsel karşılaştırmaya dönüştürülür. Yapı ve taraf seçimleri korunur; kaldırılan kesit parametreleri yeniden üretilmez. İki karşılaştırma seçeneği mobilde eşit sütunlarda kalır. Model kaynakları ve kayıtlı çalışma verileri değiştirilmedi.

Doğrulama: TypeScript kontrolü ve dört ilgili doğrulama betiği geçti. Gerçek AnatomyLab bileşeninde karşılaştırma/taraf/yerleşim, kaynak geometri yükleme, hata/yeniden deneme, bilgi tabloları/soru bağlantıları, kesit kontrollerinin yokluğu, eski bağlantı dönüşümü ve yeniden açılış sınandı. Gerçek Home koordinatöründe Atlas → karşılaştırma → test → geri/ileri ve filtreye dönüş kontrol edildi. Testler gerçek tarayıcı piksellerini, WebGL çizimini veya cihaz performansını kapsamaz.

Mevcut kapsamın kaynak sayımı: 2.391 model parçası, 40 kas kartı, 24 sinir kartı, 38 bağ/tendon/menisküs/retinakulum/kılıf kartı, altı bölgesel öğrenme modülü, 16 interaktif vaka ve 692 tanımlı soru. Bunların 190'ı tendon sorusu ve 76'sı model bulma çalışmasıdır. Bu sayılar anatomik modelin eksiksizliğini veya klinik doğruluğunun bağımsız olarak incelendiğini göstermez.

Sonraki çalışma için görülen boşluklar: Çalışmalarım ders özeti yalnız dize bağlı; dokuz kas kartının hareket bağlantısı yok; lateral/medial pektoral ve inferior gluteal sinir kartlarının bağımsız 3D geometrisi yok. Hakkında bölümündeki 50 tendon sorusu ifadesi mevcut 190 soruluk veriyi yansıtmıyor. Bunlar bu sürümde değiştirilmedi.
