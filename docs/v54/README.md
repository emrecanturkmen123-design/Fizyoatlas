# V54 — Kas/sinir sınaması ve kas karşılaştırması

V53 kaynak sürümünün üzerine, kullanıcının onayladığı 1 ve 2 numaralı geliştirmeler eklendi.

## 1. Model üzerinde kas ve sinir sınaması

- 40 kas için 80 sağ/sol bulma sorusu. Kas kartındaki **Model üzerinde sına** iki adımlı çalışma açar: seçili taraftaki kaynak kası bul, ardından mevcut hareket katkısı sorusunu çöz.
- 23 sinirin gerçek kaynak yüzeyleri için 46 bulma sorusu; 24 sinir kartının seçili motor hedefleri için 48 soru. Genel bulma havuzu önceki 76 destek doku sorusuyla birlikte 250 sorudur.
- Sinir kartındaki çalışma siniri bul → seçili motor hedeflerinden birini bul → ilgili kasın hareket sorusu sırasını kullanır. Birden çok motor hedef varsa listedeki bütün kaynak hedefler doğru kabul edilir; hareket sorusu kendi kasını açıkça adlandırır.
- Inferior gluteal sinirin bağımsız kaynak yüzeyi bulunmadığı için sahte sinir bulma sorusu eklenmedi; motor hedef ve mevcut kas hareketi çalışması bulunur. Göz sinirleri için mevcut olmayan hareket sorusu üretilmedi.
- Kendini Sına içindeki **Modelde bulma grubu** kas, sinir/motor hedef ve destek doku filtrelerini sunar. Eski soru kimlikleri korunur. Yeni karta özel oturumlar sağ/sol ayrı kaydedilir; yenileme ve karta dönüş tarafı korur.
- Aynı görev/bölge/taraf için kaynak aday ve çevre hesapları ortaklaştırıldı; cevap ve hedef kimlikleri her soruya özeldir. Otomatik başlayan karta özel çalışmada kullanılmayan genel havuz sayımı atlanır.
- Kaynak yüzeylerin 2D izdüşümü, gizli adlar, eşit aday renkleri ve numaralı seçimler korunur. İzdüşüm çizimi ve seçim hesabı gerçek kaynak üçgenleriyle doğrulandı.

## 2. Kasları yan yana karşılaştırma

- Atlas kas sekmesindeki **Karşılaştırma**, tek kas ve grup kartlarındaki **Kasları karşılaştır** mevcut karşılaştırma alanının Kaslar görünümünü açar.
- 40 kas ve iki grup seçilebilir. Altı hazır çift: quadriceps/hamstring; gastrocnemius/soleus; biceps/brachialis; supraspinatus/deltoid; gluteus medius/minimus; tibialis anterior/posterior.
- İki kaynak izdüşümünde açı ve fiziksel ölçek ortaktır. Bağımsız merkezleme ve ortak anatomik konum seçenekleri vardır. Kaynak sınırlarının küresel çapı, başlangıç yakınlığında döndürme sırasında seçili kasların kırpılmasını önler.
- Grup üyelerinin renkleri farklıdır; açıklamalar kaynak parça renkleriyle eşleşir ve taraf/seçim sırası değişince korunur.
- Mevcut kaynaklı kas kartlarından işlev ve motor innervasyon tablosu, açılır origo/insertio ve kaynak bağlantıları kullanılır. Biceps femoris kısa başının ek kaynağı korunur.
- Çift, taraf, görüntüleme biçimi, kadraj ve kamera URL'de saklanır. Kontroller geri geçmişine yeni sayfa eklemez. Atlas kartı açılırken gerçek kas/grup ve seçili taraf taşınır; geri/ileri ve yenileme aynı karşılaştırmayı getirir.
- Mevcut bağ/tendon karşılaştırmaları ve eski bağlantılar korunur. Kaldırılmış kaynak model kesiti geri eklenmedi.

## Doğrulama

- Birinci paket: 8 veri/sunucu kontrolü ve gerçek Home/QuizPanel akış kontrolü geçti; `phase-1-data.json`, `phase-1-flow.json`.
- İkinci paket: 10 hedefli kontrol geçti; `phase-2.json`. Gerçek Canvas 2D kaynak üçgen çizimleri, üye renkleri, ortak ölçekte dönme sınırları ve Home geri/ileri/kart akışları kapsanır.
- Son birleşik kaynak: **79/79** doğrulama betiği geçti; `validation-results.json`. TypeScript `npm run check` ve `git diff --check` geçti.
- Yayın akışı aynı kaynak durumundan üretim derlemesi, git kaydı ve paketleme yapar; derleme başarısızsa sürüm yayınlanmaz.

Soru havuzu için tek CPU ölçümünde ilk hesap yaklaşık 5 saniyeden 0,9 saniyeye indi; sonraki hesap 35 ms idi. Bunlar Node veri hazırlama ölçümleridir; tarayıcı açılış süresi veya kontrollü cihaz karşılaştırması değildir.

## Kapsam sınırları

Kaynak anatomik geometri ve veri indirme parçaları değişmedi. Yeni karşılaştırma mevcut 3D yüzeylerin Canvas 2D izdüşümüdür; yeni bir GPU motoru veya üretilmiş anatomi değildir. Yazılım akış kontrollerinde GPU sahnesi ve DOM portalları taklit edilir. Gerçek tarayıcı pikselleri, fiziksel telefon ve GPU etkileşimi bu sürümde sınanmadı. Aralıklı tekrar ve sunucu soru doğrulaması birleşik kontrolde kapsanır; canlı kullanıcı verisi değiştirilmedi.
