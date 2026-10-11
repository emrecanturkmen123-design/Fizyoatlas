import {useEffect,useRef} from "react";
import {Button} from "@/components/ui/button";
import {useCourseOverview} from "./use-course-overview";
import type {CourseId} from "./course-overview";
export default function CourseCatalog({
  onOpen,
  onClose,
}: {
  onOpen: (id: CourseId) => void;
  onClose: () => void;
}) {
  const {courses:cards,status,warnings,retry}=useCourseOverview();
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{heading.current?.focus();},[]);
  return (
    <section className="knee-course course-catalog" aria-label="Baştan sona öğren">
      <header className="course-header">
        <div>
          <h2 ref={heading} tabIndex={-1}>
            Baştan sona öğren
          </h2>
          <p>Bölgeni seç; anatomi, hareket, bağlantı ve vakaları sırayla çalış.</p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          Kendini Sına’ya dön
        </Button>
      </header>
      {status === "loading" && <p role="status">Modül kayıtların yükleniyor…</p>}
      {status === "error" && (
        <div className="course-save-error" role="alert">
          <p>
            Modül özetlerin yüklenemedi. Dersin içinde kayıt bağlantısını yeniden deneyebilirsin.
          </p>
          <Button variant="outline" onClick={retry}>
            Özetleri yeniden yükle
          </Button>
        </div>
      )}
      {warnings&&<p role="status">Bazı eski ders kayıtları okunamadı. Okunabilen özetler gösteriliyor.</p>}
      <div className="course-catalog-grid">
        {cards.map((c, i) => {
          return (
            <article key={c.id} className="course-catalog-item">
              <span className="course-catalog-number">{String(i + 1).padStart(2, "0")}</span>
              <h3>{c.title}</h3>
              <p>{c.summary}</p>
              <span className="course-catalog-meta">
                {c.structures} yapı · {c.cases} vaka · 10 soruluk bitirme testi
              </span>
              {status!=="loading"&&status!=="error"&&<div
                className="course-catalog-progress"
                role="progressbar"
                aria-label={c.title + " ders kontrolü"}
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuenow={c.done}
              >
                <span style={{ width: (c.done / 4) * 100 + "%" }} />
              </div>}
              <p className="course-catalog-status">
                {status === "loading"
                  ? "Kayıt yükleniyor…"
                  : status === "error"
                    ? "İlerleme özeti alınamadı"
                    : `${c.done} / 4 ders kontrolü doğru · ${c.step}${c.examFinished ? ` · Bitirme testi: ${c.examCorrect} / 10 doğru` : ""}`}
              </p>
              <Button variant="outline" onClick={() => onOpen(c.id)}>
                {c.started
                  ? "Kaldığım yerden devam et"
                  : "Modülü aç"}
              </Button>
            </article>
          );
        })}
      </div>
      <p className="course-caption">
        Her modülün kaydı ayrıdır.{" "}
        {status === "account"
          ? "İlerleme hesabında saklanır."
          : "Giriş yapmadan çalışman bu tarayıcıda saklanır; cihazlar arasında devam etmek için ders içinden giriş yapabilirsin."}
      </p>
    </section>
  );
}
