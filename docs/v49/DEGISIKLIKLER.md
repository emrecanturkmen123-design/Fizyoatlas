# V49 — Quadriceps ve hamstring grup kartları

Grup adları, taraflı bağlantılar ve tutunma işaretleri aynı grup kimliğini korur. İki kart artık boş eğitim kartı yerine grup üyelerini ve iki taraf / sağ / sol seçimini içerir. Arama ve Atlas listesi de bu grup kartlarına bağlanır.

Grup veya üye kas açıldığında kamera ilgili bölgeye odaklanır; quadriceps önden, hamstring arkadan açılır. Yalnız seçilen kaslar ve aynı taraftaki ilgili kemikler gösterilir; kemik bağlamı saydamdır. Üye kartları diğer kaslar örtmeden incelenebilir. Başka bölgeye geçerken yerel gizleme temizlenir. Kaynak geometri değiştirilmedi.

Doğrulama: TypeScript kontrolü ve 67 doğrulama betiği geçti. Yeni grup testi iki taraftaki 16 yüzeyin verilerini, indekslerini, kamera sınırlarının yüzeyleri kapsamasını ve gereken veri parçalarının seçilmesini doğrular. Gerçek Home bileşeninde grup seçimi, sağ/sol değişimi, yenileme, derin üye kartı, geri dönüş, başka bölgeye geçiş ve tutunma işaretlerinin taraf değiştirmesi/kapatılması sınandı. Bu etkileşim testinde GPU sahnesi ve DOM portalları taklittir; gerçek tarayıcı veya cihaz üzerinde WebGL görsel kontrolü yapılmadı.
