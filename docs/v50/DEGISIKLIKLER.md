# V50 — Grup seçimlerinin okunabilirliği

Çok kaslı serbest atlas seçimleri artık bütün parçaları aynı maviye boyamaz. Kas üyeleri ayırt edilebilir renklerle gösterilir. Quadriceps ve hamstring kartlarındaki numaralı renk işaretleri model renkleriyle eşleşir; sağ ve soldaki aynı kas aynı renk kullanır. Diğer çok kaslı kart seçimleri için de adlandırılmış renk açıklaması bulunur. Tek bir kas seçildiğinde mavi vurgu korunur. Tutunma kemikleri kendi kemik rengini korur.

Grup ve grup üyesi kas kartları varsayılan olarak mevcut vücut modelini saydam bağlamıyla korur. Önceki otomatik yerel gizleme kaldırıldı. Gruplar için “Yalnız grubu göster” isteğe bağlıdır; “Ana modelde göster” ile geri dönülür. Bu tercih bağlantıda taşınır ve yenilemede, sağ/sol değişiminde, tarayıcı geri dönüşünde korunur. Kaynak geometri değiştirilmedi.

Hareketlerin agonist/antagonist renkleri, omurga bölgeleri, bağlantı izleri ve adı gizli model bulma çalışmalarının renk sistemi korunur. Seçim değişiminde önceki renk verileri temizlenir. Render alanı veya etkileşim düzeni değiştirilmedi.

Doğrulama: TypeScript kontrolü ve 68 doğrulama betiği geçti. Yeni kontroller kas–renk eşleşmelerini, iki tarafın aynı renk kullanmasını, farklı kasların ayrılmasını, tek kasın mavi kalmasını, kemik renklerini, GPU dokusuna doğrusal RGB yazılmasını ve seçimin temizlenmesini kapsar. Three.js standart shader dönüşümü ve gerçek Home bileşeninde renk açıklamaları, isteğe bağlı izolasyon, yenileme, taraf değişimi ve geri dönüş sınandı. GPU sahnesi ve DOM portalları etkileşim testinde taklittir; gerçek tarayıcı/cihazda WebGL görsel kontrolü yapılmadı.
