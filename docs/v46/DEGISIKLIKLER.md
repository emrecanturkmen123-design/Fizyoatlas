# V46 · Bölgesel baştan sona öğrenme yolları

Kullanıcı isteği: Diz modülü gibi en az beş farklı grup oluşturmak ve bunları Kendini Sına → Baştan Sona Öğren içinde toplamak.

## Sunulan akış

Mevcut diz modülüne omuz, dirsek–önkol, el–el bileği, kalça ve ayak–ayak bileği eklendi. Ortak seçim ekranı `#ogren`; bölgesel adresler `#bolge-dersi?kurs=<courseId>&adim=<step>`. Eski `#diz-dersi` bağlantıları korunur. Altı modül de Kendini Sına altında açılır.

Her yeni modül altı adım içerir: yapıları tanı, hareketi oku, bağlantıyı kur, vakaya uygula, kendini sına, sonuçları incele. Modül başına 10–11 incelenebilir yapı, üç anatomi kontrolü, üç hareket kontrolü, üç bağlantı kontrolü, iki vaka/altı karar bulunur. Her modülün 20 soruluk bankası ve bir modelde bulma görevi vardır. Bitirme testi modelde bulma + bankadan bölümler dengeli seçilen dokuz sorudan oluşur. Yeni tur seçkiyi değiştirir. Yeni soru bankaları genel anatomi testinin 692 sorusundan ayrı kurs bankalarıdır; bu sayı artırılmış gibi sunulmaz.

Doğru tamamlanan ders kontrolleri ile yalnız yanıtlanmış dersler ayrılır. Yanlış yanıtlar açıklama ve kaynak içerir. Bitirme sırasında açıklamalar gizlidir; sonuçta yanıtlar ve hedefli tekrar bağlantıları gösterilir. Yeni tur yalnız sınavı, sıfırlama yalnız ilgili modülü etkiler.

## Modeller ve kayıt

Mevcut kaynak geometri kullanıldı; yeni ağ yüzeyi veya patoloji modeli üretilmedi. Sağ/sol hedefler gerçek Atlas parçasına bağlanır. 2D kaynak projeksiyonu ile 3D aynı parça seçimini kullanır. Kemik hareketi mevcut omuz/dirsek/kalça/ayak bileği mekanizmalarını kullanır. El ve bazı lateral tendon çalışma durakları statik kaynak ilişkilerini gösterir; parmak animasyonu ve tendon kayması simüle edilmez. Bu ayrım arayüzde yazılıdır.

Bölgesel görünürlük sınırı hem hareket yüzeylerine hem indirilecek parçaların seçimine uygulanır. Standart hareketlerde gizli yapı listesi boşsa önceki davranış korunur. Kaynak ağlar ve mevcut deformasyon hesapları değiştirilmedi.

Her kurs D1 `course_progress` tablosunda kendi `course_id` altında, kullanıcıya özel ve revision kontrolüyle saklanır. Yeni şema veya veri silme yoktur. Çoklu kurs GET yanıtında diz hook'u ilk kaydı almak yerine kendi kimliğini seçer. Yeni hook da yalnız kendi modülünün kaydını seçer. 409 çakışması açık seçim gerektirir; 503 misafir yazma izni sayılmaz. Girişsiz çalışma sekme taslağıdır. Hesap yazısı beklerken bölge paneli kapanırsa kurtarılabilir taslak tutulur; başarılı yazı sonrası kaldırılır.

## Kaynaklar

OpenStax anatomi/hareket bölümleri; AAOS rotator manşet, lateral epikondil, karpal tünel, Aşil ve ayak bileği bağları; Texas Tech el/önkol rehberleri; Washington Üniversitesi gluteal kas kaynağı; Kim ve arkadaşlarının tek ayak desteği çalışması (PMID 26079865). Kaynak bağlantıları ders, soru açıklamaları ve kaynaklar alanında bulunur. Eğitim içerikleri klinik uzman incelemesi yapılmış olarak sunulmaz.

## Doğrulama

`scripts/validate-regional-courses.mjs` beş modülün gerçek React bileşenlerini anatomi → hareket → bağlantı → iki vaka → 10 soru → sonuç → yeniden açma → yeni tur akışında çalıştırır. Sağ/sol anatomik hedefler, komşuluk kapsamı, hareket matrisleri, indirilecek bölgesel veriler, soru seçenekleri, yanlış kayıt reddi, ayrı D1 kayıtları, kullanıcı ayrımı, revision çakışması, ders taslağı ayrımı, 503 engeli ve depolama hatasında yeniden deneme kontrol edilir. Eski diz kaydı çoklu kurs yanıtıyla da kontrol edilir.

Tam kaynak doğrulama sonucu `validation-results.json` içindedir. TypeScript ve üretim derlemesi ayrıca yayın öncesi çalıştırılır.

Bu kontroller tarayıcı görüntüsü, gerçek WebGL çalışması veya fiziksel telefon performansı kanıtı değildir. Yönetilen önizleme kuralının gerektirdiği control-browser becerisi kullanılabilir olmadığından alternatif bir tarayıcı yolu kullanılmadı.
