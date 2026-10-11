# Fizyo Atlas V47

## Kullanıcı isteği
- Her bölümden önceki bölüme dönebilmek için görünür Geri düğmesi.
- Atlas içindeki Dizi baştan sona öğren girişinin kaldırılması.
- Karşılaştırma ve kesit bölümünü incelemek, sınamak ve hatalarını düzeltmek.
- Çalışmalarım'daki kaydedilen soru kayıtlarını sıfırlama seçeneği.

## Değişiklikler
- Ana gezinmede Geri düğmesi. Bölüm adresleri ve filtreler geçmişte korunur; yenileme sonrasında da önceki site bölümü geri açılır. Doğrudan açılan bağlantılar uygun üst bölüme döner ve ziyaretçiyi site dışına göndermez.
- Laboratuvar içindeki yapı, taraf, kamera, görünüm ve kesit ayarları aynı geçmiş kaydını günceller. Geri, son açılan bölüme döner. Laboratuvardan sınava geçip geri dönmek yapı çiftini, tarafı ve inceleme biçimini korur.
- Adresten geri/ileri geri yükleme sırasında laboratuvarın eski yerel ayarları yeni adresin üzerine yazılmaz. Aramadan geri dönmek önceki bölüm adresini ve filtresini korur.
- Atlas'taki diz dersi girişini kaldırdık. Ders Kendini Sına → Baştan Sona Öğren kataloğunda kalır.
- Sagittal kesitte üst-alt yönü artık dikeydir. Üç kesit düzlemine uygun dört kenar yön etiketi ve metin açıklaması eklendi.
- Omuz, dirsek ve diz kesitlerinde sağ/sol seçimi. Karşı taraftaki adlandırılmış parçalar kesit hacmine alınmaz.
- Görsel karşılaştırmada aynı yapı ikinci seçenek olarak seçilemez; yinelenen veya geçersiz bağlantı uygun farklı yapıya döner. Her figürde taraf ve kaynak geometrisinin kapsamı yazılıdır.
- Bilgi karşılaştırmasında taraf kontrolü ve tarafı koruyan Atlas bağlantıları. Kesit boşsa açıklayıcı durum mesajı. Kesit çizgileri yeniden boyutlandırma için tekrar hesaplanmaz.
- Çalışmalarım → Tekrar ve ilerleme içinde Soru kayıtlarını sıfırla. Onay penceresi kapsamı açıklar. Hesapta yanıtlar, denemeler ve genel test oturumları kullanıcı kimliğine göre tek D1 batch işlemiyle silinir. Tarayıcı kayıtlarında ilgili yanıt ve test oturumları temizlenir. Favoriler, defter, vaka ve ders ilerlemesi korunur.
- Sıfırlama yükleme ve kayıt işlemi sırasında engellenir; hata durumunda tekrar denenebilir. Oturum sona ererse hesap sıfırlaması cihaz kaydına geçmez.

## Bölümün anlamı
- Görsel karşılaştırma: iki kaynak yapıyı ortak kamera açısı ve fiziksel ölçekte gösterir. Yapıları merkezle, şekilleri karşılaştırmak içindir. Anatomik konum ortak vücut koordinatlarını korur.
- Bilgiyi karşılaştır: anatomik bağlantı, işlev ve eğitim değerlendirmesi farklarını tabloda gösterir; Atlas kartlarına ve soru çalışmalarına bağlanır.
- Kaynak model kesiti: omuz, dirsek ve diz yüzeyleri ile seçilen düzlemin kesişim çizgileridir. MR/BT görüntüsü, tüm iç dokular veya patoloji görüntüsü değildir.

## Doğrulama ve sınır
- Yeni laboratuvar testi: 38 yapının iki tarafında 76 karşılaştırma; 3 bölge × 2 taraf × 3 düzlem × 5 konum = 90 gerçek kaynak kesit düzlemi ve 85.131 kırpılmış çizgi. Sonlu koordinatlar, doğru düzlem, bölge içinde kırpma ve sagittal yön doğrulanır.
- Gerçek React bileşeni: karşılaştırma, bilgi tablosu, sağ/sol, yerleşim, Atlas ve soru bağlantıları; indirme hatası/yeniden deneme; kesit konumu ve yeniden açma. Canvas 2D çizim çağrıları ve temizlik doğrulanır.
- Gerçek Home yöneticisi: filtreli Atlas → laboratuvar → sol taraflı bilgi karşılaştırması → sınav → aynı karşılaştırma → filtreli Atlas; tarayıcı geri/ileri ve arama dönüşü. GPU sahnesi ve DOM portalları bu testte yerine konan bileşenlerle ayrılır.
- Sıfırlama: gerçek SQLite şeması, batch geri alma, onay/kimlik/istek kaynağı, diğer hesabın korunması; gerçek React hesap/tarayıcı kontrolü, hata/yeniden deneme, yenileme ve onay denetleyicisi.
- Tam kontrol sonuçları validation-results.json içindedir.
- Tarayıcıdaki gerçek piksel çıktısı, onay penceresinin DOM odak davranışı ve cihaz/WebGL görüntüsü sınanmadı. Yönetilen Sites önizlemesi control-browser becerisini şart koşuyor; bu beceri ortamda mevcut değil ve başka tarayıcı yolu kullanılması yasak.
- Mevcut model geometrisi ve veri şeması değiştirilmedi.
