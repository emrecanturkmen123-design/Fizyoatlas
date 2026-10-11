# V55 — Hareket üzerinde kas kartı ve karşılaştırma kamerası

V54 kaynağının üzerine iki kullanıcı isteği uygulandı.

- Karşılaştırmanın ortak dönüş, eğim ve yakınlık kontrolleri modellerin altındaki açılır bölümden sol tarafta sürekli görünen çubuğa taşındı. Derece ve yakınlık değerleri görünür; sıfırlama ve çevre yapıları kontrolü aynı yerde. Dar ekranda çubuk modellerin üzerinde üç sütun olur; model alanının genişliği korunur.
- Omuz, dirsek, diz, kalça, ayak bileği ve yürüyüş modelindeki kaynak kasa tıklamak artık hareket durumunu silmez. Oynatma durur, kaynak parça seçilir ve mevcut poz üzerinde kas kartı açılır. Kas listesindeki kart bağlantıları da aynı yolu kullanır ve eklem çalışmalarında seçili tarafı korur.
- Hareket, konum, taraf, kas katmanı, yardımcı katmanlar ve yürüyüş hızı bağlantıya kaydedilir. Model tıklamasında tam kaynak parça kimliği korunur; yenilemede kasın başka parçaları veya karşı taraf kendiliğinden seçilmez. Katman ayarları geçmişe yeni sayfa eklemez.
- Kartı açmadan önce mevcut konum geçmişe yazılır; hızlı kaydırma veya oynatma sırasında karta girilip geri dönüldüğünde eski konuma dönülmez. Kart kapatma, uygulama geri düğmesi ve tarayıcı geri/ileri aynı hareket konumuna döner. Doğrudan kart bağlantısının önceki geçmişi yoksa aynı hareket görünümü üst sayfadır.
- Yürüyüş paneli kapanırken evreyi temizleyen işlem, yürüyüş kas kartını açık tutacak şekilde düzeltildi. Yürüyüş paneli geri geldiğinde konum, kas/düzlem katmanları ve hız yeniden alınır.
- Modelde göster odağı hareket sırasında nötr katalog sınırları yerine görünür ve deforme edilmiş kaynak yüzeyin dünya sınırlarını kullanır. Görünür yüzey bulunamazsa hareket kadrajına döner.
- Statik Atlas'a ait seçileni gizleme ve yalnız seçili yapıyı gösterme araçları hareket kartlarında sunulmaz; bu araçlar hareket yüzeylerini doğru yönetmediği için boş veya yanıltıcı model oluşturabiliyordu. Atlas'ta kullanılabilirler.

## Doğrulama

- Son birleşik kaynakta **80/80** doğrulama betiği geçti: `validation-results.json`. Atlas, anatomik geometri/rigler, arama, dersler, sınama, karşılaştırma, kayıt/kurtarma ve gezinme kontrollerini içerir.
- Yeni `validate-movement-card-flow.mjs`, gerçek Home koordinatörüyle altı hareket alanını iki tarafta sınar: model tıklaması, tam parça seçimi, poz/yan/katman korunması, hızlı konum değişikliği, kemik dönüşüm matrisleri, odak düğmesi, kapatma, ileri/geri, yeni açılan doğrudan bağlantı ve panel kas bağlantısı. Deforme edilmiş örnek geometri sınırları ve kamera kadrajı sayısal olarak doğrulanır.
- Karşılaştırmanın kaynak üçgen çizimi, renkleri, ortak fiziksel ölçeği, kamera ayarları ve geçmiş akışları mevcut kontrollerle doğrulandı; ilk altı hedefli kontrol ayrıca `camera-checks.json` içinde.
- TypeScript `npm run check` ve `git diff --check` geçti. Yayın yardımcısı aynı kaynağı üretim için derler, git deposuna kaydeder ve paketler; derleme başarısızsa yayın yapılmaz.

## Sınırlar

Kontroller yazılım ve CPU geometri doğrulamasıdır. Home akışlarında GPU sahnesi ve DOM portalları taklit edilir; karşılaştırma testleri gerçek kaynak üçgenlerini taklit Canvas bağlamında çizer. Bu oturumda control-browser becerisi bulunmadığından canlı tarayıcı görüntüsü, gerçek GPU etkileşimi, fiziksel telefon ve piksel yerleşimi sınanmadı. Kaynak anatomi geometrisi, içerik kapsamı ve canlı kullanıcı kayıtları değiştirilmedi.
