import {signInUrl} from './auth-link';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Check, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Disclosure } from "./disclosure";
import type { Atlas, SceneState } from "./anatomy";
import { KNEE_COURSE_STEPS, type KneeCourseStep, type CourseQuestion } from "./knee-course-content";
import { regionalCourse, regionalBank, type RegionalCourseId } from "./regional-course-content";
import {
  regionalCompletion,
  regionalNeedsReview,
  regionalParts,
  regionalContext,
  regionalMotionState,
  regionalExamQuestions,
  restartRegionalExam,
  freshRegionalCourse,
  type RegionalCourseProgress,
} from "./regional-course-data";
import { useRegionalCourse } from "./use-regional-course";
import RegionalCourseProjection from "./regional-course-projection";
const AnatomyScene = lazy(() => import("./scene"));
function Question({
  q,
  answer,
  locked,
  onAnswer,
  exam = false,
}: {
  q: CourseQuestion;
  answer: number | null;
  locked: boolean;
  exam?: boolean;
  onAnswer: (n: number | null) => void;
}) {
  return (
    <section className="course-question">
      <h3>{q.prompt}</h3>
      <div className="course-answers">
        {q.options.map((x, i) => (
          <Button
            key={x}
            variant="outline"
            className={answer === i ? "course-choice-selected" : ""}
            disabled={locked || (answer !== null && !exam)}
            aria-pressed={answer === i}
            onClick={() => onAnswer(i)}
          >
            <span className="course-letter" aria-hidden="true">
              {String.fromCharCode(65 + i)}
            </span>
            <span>{x}</span>
          </Button>
        ))}
      </div>
      {answer !== null && !exam && (
        <div className="course-feedback" role="status">
          <strong>{answer === q.correct ? "Doğru." : "Bu bağlantıyı tekrar incele."}</strong>
          <p>{q.why}</p>
          <a href={q.source.url} target="_blank" rel="noreferrer">
            {q.source.label}
          </a>
          <Button variant="outline" disabled={locked} onClick={() => onAnswer(null)}>
            Soruyu tekrar dene
          </Button>
        </div>
      )}
    </section>
  );
}
export default function RegionalCourse({
  atlas,
  id,
  routeStep,
  routeMotion,
  routeSide,
  onPosition,
  onStep,
  onClose,
}: {
  atlas: Atlas;
  id: RegionalCourseId;
  routeStep?: KneeCourseStep;
  routeMotion?: number;
  routeSide?: "left" | "right";
  onPosition?: (stop: number, side: "left" | "right", replace?: boolean) => void;
  onStep: (s: KneeCourseStep, replace?: boolean) => void;
  onClose: () => void;
}) {
  const c = regionalCourse(id)!,
    course = useRegionalCourse(id),
    p = course.progress,
    step = routeStep === "result" && !p.examFinished ? "exam" : (routeStep ?? p.step),
    index = KNEE_COURSE_STEPS.findIndex((x) => x.id === step),
    complete = regionalCompletion(p),
    needsReview = regionalNeedsReview(p),
    exam = regionalExamQuestions(p),
    heading = useRef<HTMLHeadingElement>(null);
  const [focus, setFocus] = useState(0),
    [chainKey, setChainKey] = useState(c.chainKeys[0]),
    [modelError, setModelError] = useState(""),
    [modelProgress, setModelProgress] = useState(0),
    [modelAttempt, setModelAttempt] = useState(0),
    [restart, setRestart] = useState(false);
  const save = (changes: Partial<RegionalCourseProgress>) =>
    course.save({ ...p, step, ...changes });
  function go(next: KneeCourseStep) {
    if (!course.canWork || (next === "result" && !p.examFinished)) return;
    course.save({ ...p, step: next });
    onStep(next);
  }
  useEffect(() => {
    if (!course.canWork) return;
    const stop = routeMotion ?? p.motionStop, side = routeSide ?? p.side;
    if (p.step !== step || stop !== p.motionStop || side !== p.side)
      course.save({...p,step,motionStop:stop,side});
    if (!routeStep) onStep(p.step,true);
    else if (routeStep === "result" && !p.examFinished) onStep("exam",true);
    if (routeMotion === undefined || routeSide === undefined) onPosition?.(stop,side,true);
  }, [course.canWork,routeStep,routeMotion,routeSide,p.step]);
  useEffect(() => {
    heading.current?.focus();
    setRestart(false);
    setFocus((x) => x + 1);
  }, [step]);
  const activeCase = c.cases[p.caseIndex],
    caseOffset = p.caseIndex * 3 + p.caseStage,
    locate = step === "exam" && p.examIndex === 0;
  const visualKey =
    step === "anatomy"
      ? (p.lastStructure ?? c.structures[0].key)
      : step === "motion"
        ? c.motions[p.motionStop].visualKey
        : step === "chain"
          ? chainKey
          : step === "case"
            ? activeCase.visualKey
            : (exam[p.examIndex].visualKey ?? "");
  const context = useMemo(() => regionalContext(atlas, c, p.side), [atlas, c, p.side]);
  const motionState = step === "motion" ? regionalMotionState(c, p) : {},
    moving = !!(motionState.shoulder || motionState.elbow || motionState.lower);
  const scene = useMemo<SceneState>(() => {
    const allowed = new Set(context.map((x) => x.id));
    return {
      visible: ["skeletal", "muscular", "connective"],
      hidden: atlas.parts.filter((x) => !allowed.has(x.id)).map((x) => x.id),
      selected: locate
        ? p.examPickId
          ? [p.examPickId]
          : []
        : moving
          ? []
          : regionalParts(atlas, visualKey, p.side).map((x) => x.id),
      hideNames: locate,
      contextOpacity: locate || moving ? 1 : 0.22,
      isolate: false,
      view: moving ? "side" : "front",
      explode: 0,
      rotate: false,
      reset: focus,
      focus: locate || moving ? 0 : focus,
      ...motionState,
    };
  }, [atlas, context, p.side, visualKey, locate, moving, p.motionStop, p.examPickId, focus]);
  function selectStructure(key: string) {
    if (!course.canWork) return;
    setChainKey(key);
    setFocus((n) => n + 1);
    if (step === "anatomy")
      save({ lastStructure: key, observed: [...new Set([...p.observed, key])] });
  }
  function pick(partId: string) {
    if (!course.canWork || (step === "exam" && p.examFinished)) return;
    if (locate) {
      if (!context.some((x) => x.id === partId)) return;
      save({
        examPickId: partId,
        exam: [
          regionalParts(atlas, c.locateKey, p.side).some((x) => x.id === partId) ? 0 : 1,
          ...p.exam.slice(1),
        ],
      });
      return;
    }
    const item = c.structures.find((x) =>
      regionalParts(atlas, x.key, p.side).some((p) => p.id === partId),
    );
    if (item) selectStructure(item.key);
  }
  const questions =
    step === "anatomy"
      ? c.anatomy
      : step === "motion"
        ? c.motion[p.motionStop] ? [c.motion[p.motionStop]] : []
        : step === "chain"
          ? c.chain
          : step === "case"
            ? [activeCase.questions[p.caseStage]]
            : [];
  const answerList =
    step === "anatomy"
      ? p.anatomyAnswers
      : step === "motion"
        ? p.checks
        : step === "chain"
          ? p.chainAnswers
          : p.caseAnswers;
  function answer(i: number, n: number | null) {
    const offset = step === "motion" ? p.motionStop : step === "case" ? caseOffset : i,
      a = [...answerList];
    a[offset] = n;
    save(
      step === "anatomy"
        ? { anatomyAnswers: a }
        : step === "motion"
          ? { checks: a }
          : step === "chain"
            ? { chainAnswers: a }
            : { caseAnswers: a },
    );
  }
  const canNext =
    step === "anatomy"
      ? p.observed.length === c.structures.length && p.anatomyAnswers.every((x) => x !== null)
      : step === "motion"
        ? p.checks.every((x) => x !== null)
        : step === "chain"
          ? p.chainAnswers.every((x) => x !== null)
          : step === "case"
            ? p.caseAnswers.every((x) => x !== null)
            : false;
  const weak = [...new Set(exam.filter((q, i) => p.exam[i] !== q.correct).map((q) => q.review))];
  const descriptions = [
    `${c.structures.length} yapı · üç kontrol`,
    `${c.motions.length} çalışma durağı · üç kontrol`,
    "Kas, tendon ve destek ilişkileri",
    "İki vaka · altı karar",
    "Üç istasyonda 10 soru",
    "Açıklamalar ve hedefli tekrar",
  ];
  return (
    <section
      className="knee-course regional-course"
      aria-label={c.title + " baştan sona öğren"}
      aria-busy={course.status === "loading"}
    >
      <header className="course-header">
        <div>
          <h2>{c.title} · Baştan sona öğren</h2>
          <p>{c.summary}</p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          Tüm modüller
        </Button>
      </header>
      {course.status === "loading" ? (
        <p role="status">Ders kaydın yükleniyor…</p>
      ) : (
        <>
          {course.error && (
            <div className="course-save-error" role="alert">
              <span>{course.error}</span>
              <Button variant="outline" onClick={() => void course.retry()}>
                {course.conflict ? "Bendeki ilerlemeyi kaydet" : "Yeniden dene"}
              </Button>
              {course.conflict && (
                <Button variant="outline" onClick={course.useAccount}>
                  Hesaptaki kaydı aç
                </Button>
              )}
            </div>
          )}
          <div className="course-savebar">
            <span role="status">
              {!course.canWork && !course.conflict
                ? "Kayıt bağlantısı bekleniyor"
                : course.status === "saving"
                  ? "Hesabına kaydediliyor…"
                  : course.authenticated
                    ? course.status === "error"
                      ? "Kayıt bekliyor"
                      : "Hesabında kayıtlı"
                    : course.status === "error"
                      ? "Taslak açık sayfada · kayıt bekliyor"
                      : "Bu sekmede taslak"}
            </span>
            {!course.authenticated && (
              <a
                href={
                  signInUrl("/#bolge-dersi?kurs=" + id)
                }
                target="_top"
              >
                Kalıcı kayıt için giriş yap
              </a>
            )}
          </div>
          {course.pendingDraft && (
            <div className="course-draft-offer">
              <strong>Bu modüle ait taslak bulundu.</strong>
              <p>
                Hesabındaki yanıtlar korunur; boş yanıtlar taslaktan tamamlanır. Başlamış hesap
                sınavın korunur.
              </p>
              <Button
                disabled={!course.canWork || course.status === "saving"}
                onClick={() => {
                  const merged = course.importDraft();
                  if (merged) onStep(merged.step);
                }}
              >
                Taslağı hesaba ekle
              </Button>
              <Button variant="ghost" onClick={course.dismissDraft}>
                Şimdi değil
              </Button>
            </div>
          )}
          <div className="course-layout">
            <nav className="course-outline" aria-label="Ders adımları">
              <p className="course-progress-label">
                {complete.slice(0, 4).filter(Boolean).length} / 4 ders kontrolü doğru tamamlandı
              </p>
              {KNEE_COURSE_STEPS.map((s, i) => (
                <button
                  key={s.id}
                  aria-current={step === s.id ? "step" : undefined}
                  disabled={!course.canWork || (s.id === "result" && !p.examFinished)}
                  onClick={() => go(s.id)}
                >
                  <span className="course-step-mark">
                    {needsReview[i] ? (
                      <RotateCcw size={16} aria-label="Tekrar gerekli" />
                    ) : complete[i] ? (
                      <Check size={16} aria-label="Tamamlandı" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span>
                    <strong>{s.title}</strong>
                    <small>{descriptions[i]}</small>
                  </span>
                </button>
              ))}
              <p className="course-outline-note">
                Adımları serbestçe inceleyebilirsin. İşaretler yanıtlarının durumunu gösterir.
              </p>
            </nav>
            <div className="course-main">
              <div className="course-stage-heading">
                <span>{index + 1} / 6</span>
                <h3 ref={heading} tabIndex={-1}>
                  {KNEE_COURSE_STEPS[index].title}
                </h3>
              </div>
              {step === "result" ? (
                <div className="course-results">
                  <CheckCircle2 size={32} />
                  <h3>
                    Bitirme testi: {p.exam.filter((x, i) => x === exam[i].correct).length} / 10
                    doğru
                  </h3>
                  <p>
                    {weak.length
                      ? "Yanlışlarının açıklamalarını incele ve ilgili derse dön."
                      : "Bu turdaki bağlantıları doğru kurdun. Farklı sorularla tekrar çalışabilirsin."}
                  </p>
                  <div className="course-review-actions">
                    {weak.map((s) => (
                      <Button
                        key={s}
                        variant="outline"
                        disabled={!course.canWork}
                        onClick={() => go(s)}
                      >
                        {KNEE_COURSE_STEPS.find((x) => x.id === s)?.title}
                      </Button>
                    ))}
                  </div>
                  <div className="course-result-list">
                    {exam.map((q, i) => (
                      <section key={i}>
                        <strong>
                          {i + 1}. {p.exam[i] === q.correct ? "Doğru" : "Tekrar gerekli"} ·{" "}
                          {q.station}
                        </strong>
                        <p>{q.prompt}</p>
                        <p>Yanıtın: {q.options[p.exam[i]!]}</p>
                        <p>
                          <b>Doğru yanıt:</b> {q.options[q.correct]}
                        </p>
                        <p>{q.why}</p>
                        <a href={q.source.url} target="_blank" rel="noreferrer">
                          {q.source.label}
                        </a>
                      </section>
                    ))}
                  </div>
                  <Button
                    disabled={!course.canWork}
                    onClick={() => {
                      course.save(restartRegionalExam(p));
                      onStep("exam");
                    }}
                  >
                    Farklı sorularla tekrar çöz
                  </Button>
                  <p className="course-caption">
                    Bir modelde bulma görevi ve {regionalBank(c).length} soruluk bankadan seçilen
                    dokuz soru. Eğitim sonucu, klinik yetkinlik belgesi değildir.
                  </p>
                </div>
              ) : (
                <>
                  <div className="course-work">
                    <div className="course-visual-column">
                      <div className="course-visual-controls">
                        <div className="course-view-options" aria-label="Model görünümü">
                          {(["3d", "2d"] as const).map((v) => (
                            <Button
                              key={v}
                              disabled={!course.canWork}
                              variant={p.view === v ? "default" : "outline"}
                              aria-pressed={p.view === v}
                              onClick={() => save({ view: v })}
                            >
                              {v === "3d" ? "3D" : "2D kaynak"}
                            </Button>
                          ))}
                        </div>
                        <div className="course-view-options" aria-label="Ders tarafı">
                          {(["right", "left"] as const).map((side) => (
                            <Button
                              key={side}
                              disabled={!course.canWork || step === "exam"}
                              variant={p.side === side ? "default" : "outline"}
                              aria-pressed={p.side === side}
                              onClick={() => {
                                save({ side });
                                onPosition?.(p.motionStop,side);
                                setFocus((n) => n + 1);
                              }}
                            >
                              {side === "right" ? "Sağ" : "Sol"}
                            </Button>
                          ))}
                        </div>
                      </div>
                      {p.view === "3d" ? (
                        <div className="course-model">
                          <Suspense fallback={<p role="status">3D görünüm hazırlanıyor…</p>}>
                            <AnatomyScene
                              embedded
                              key={modelAttempt}
                              atlas={atlas}
                              state={scene}
                              onSelect={pick}
                              onProgress={(n) => {
                                setModelProgress(n);
                                if (n === 100) setModelError("");
                              }}
                              onError={setModelError}
                            />
                          </Suspense>
                          {modelError ? (
                            <div className="course-model-message" role="alert">
                              <p>{modelError}</p>
                              <Button onClick={() => save({ view: "2d" })}>2D kaynağı aç</Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setModelError("");
                                  setModelProgress(0);
                                  setModelAttempt((n) => n + 1);
                                }}
                              >
                                3D’yi yeniden dene
                              </Button>
                            </div>
                          ) : (
                            modelProgress < 100 && (
                              <div className="course-model-loading" role="status">
                                Model yükleniyor · %{modelProgress}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <RegionalCourseProjection
                          atlas={atlas}
                          parts={context}
                          state={scene}
                          selected={scene.selected}
                          motion={moving}
                          disabled={!course.canWork}
                          label={c.title}
                          onSelect={pick}
                        />
                      )}
                      {step === "anatomy" && (
                        <div className="course-structure-groups" aria-label="İncelenecek yapılar">
                          {[...new Set(c.structures.map((s) => s.group))].map((group) => (
                            <fieldset key={group}>
                              <legend>{group}</legend>
                              <div className="course-structure-list">
                                {c.structures
                                  .filter((s) => s.group === group)
                                  .map((s) => (
                                    <Button
                                      key={s.key}
                                      disabled={!course.canWork}
                                      variant={p.lastStructure === s.key ? "default" : "outline"}
                                      aria-pressed={p.lastStructure === s.key}
                                      onClick={() => selectStructure(s.key)}
                                    >
                                      {p.observed.includes(s.key) && (
                                        <Check size={16} aria-hidden="true" />
                                      )}
                                      {s.label}
                                    </Button>
                                  ))}
                              </div>
                            </fieldset>
                          ))}
                        </div>
                      )}
                      {step === "chain" && (
                        <div className="course-chain" aria-label="İşlev zinciri">
                          {c.chainKeys.map((key) => (
                            <Button
                              key={key}
                              disabled={!course.canWork}
                              variant={chainKey === key ? "default" : "outline"}
                              aria-pressed={chainKey === key}
                              onClick={() => selectStructure(key)}
                            >
                              {c.structures.find((s) => s.key === key)!.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      {step === "motion" && (
                        <>
                          <div className="course-stops" aria-label="Hareket durakları">
                            {c.motions.map((m, i) => (
                              <Button
                                key={m.label}
                                disabled={!course.canWork}
                                variant={p.motionStop === i ? "default" : "outline"}
                                aria-pressed={p.motionStop === i}
                                onClick={() => {
                                  save({ motionStop: i });
                                  onPosition?.(i,p.side);
                                  setFocus((n) => n + 1);
                                }}
                              >
                                {c.motion[i] && p.checks[i] === c.motion[i].correct && (
                                  <Check size={16} aria-hidden="true" />
                                )}
                                {m.label}
                              </Button>
                            ))}
                          </div>
                          <p className="course-caption">
                            {moving
                              ? "Yaklaşık kemik hareketi gösterilir; açılar klinik hareket açıklığı ölçümü değildir. Kas ve tendon gerilimi hesaplanmaz."
                              : "Bu durakta kaynak anatomi vurgulanır. Eklem hareketi ve tendon kayması animasyonu gösterilmez."}
                          </p>
                        </>
                      )}
                      {locate && (
                        <>
                          <p className="course-caption">
                            Modelden seç veya isimleri gizlenmiş bölge düğmelerini kullan. Vurgu
                            yalnız seçimini gösterir.
                          </p>
                          <div className="course-structure-list" aria-label="İsimsiz yapı seçimi">
                            {c.structures.map((s, i) => {
                              const part = regionalParts(atlas, s.key, p.side)[0];
                              return (
                                <Button
                                  key={s.key}
                                  disabled={!part || !course.canWork || p.examFinished}
                                  aria-pressed={!!part && p.examPickId === part.id}
                                  variant={part && p.examPickId === part.id ? "default" : "outline"}
                                  onClick={() => part && pick(part.id)}
                                >
                                  Bölge {i + 1}
                                </Button>
                              );
                            })}
                          </div>
                          <p role="status">
                            {p.examPickId
                              ? "Seçimin kaydedildi. Sonraki soruya geçebilir veya seçimini değiştirebilirsin."
                              : "Henüz bir yapı seçilmedi."}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="course-explanation">
                      {step === "anatomy" && (
                        <>
                          <h3>
                            {c.structures.find((s) => s.key === p.lastStructure)?.label ??
                              "Bir yapı seçerek başla"}
                          </h3>
                          <p>
                            {c.structures.find((s) => s.key === p.lastStructure)?.text ??
                              "Kemik, kas ve bağlantıları modelden veya düğmelerden sırayla incele."}
                          </p>
                          <p className="course-task-status">
                            {p.observed.length} / {c.structures.length} yapı incelendi
                          </p>
                        </>
                      )}
                      {step === "motion" && (
                        <>
                          <h3>{c.motions[p.motionStop].label}</h3>
                          <p>{c.motions[p.motionStop].text}</p>
                          <p className="course-task-status">
                            {p.checks.filter((x) => x !== null).length} / 3 durak yanıtlandı
                          </p>
                        </>
                      )}
                      {step === "chain" && (
                        <>
                          <h3>Kas, bağlantı ve kemik</h3>
                          <p>{c.chainText}</p>
                        </>
                      )}
                      {step === "case" && (
                        <>
                          <div className="course-review-actions" aria-label="Vaka seçimi">
                            {c.cases.map((x, i) => (
                              <Button
                                key={x.title}
                                disabled={!course.canWork}
                                variant={p.caseIndex === i ? "default" : "outline"}
                                aria-pressed={p.caseIndex === i}
                                onClick={() => save({ caseIndex: i, caseStage: 0 })}
                              >
                                Vaka {i + 1}
                              </Button>
                            ))}
                          </div>
                          <h3>{activeCase.title}</h3>
                          <p>{activeCase.text}</p>
                          <p>Karar {p.caseStage + 1} / 3</p>
                          <nav className="course-review-actions" aria-label="Vaka kararları">
                            {activeCase.questions.map((_, i) => (
                              <Button
                                key={i}
                                disabled={!course.canWork}
                                variant={p.caseStage === i ? "default" : "outline"}
                                aria-pressed={p.caseStage === i}
                                onClick={() => save({ caseStage: i })}
                              >
                                Karar {i + 1}
                              </Button>
                            ))}
                          </nav>
                        </>
                      )}
                      {questions.map((q, i) => (
                        <Question
                          key={q.prompt}
                          q={q}
                          answer={
                            answerList[
                              step === "motion" ? p.motionStop : step === "case" ? caseOffset : i
                            ]
                          }
                          locked={!course.canWork}
                          onAnswer={(n) => answer(i, n)}
                        />
                      ))}
                      {step === "exam" && (
                        <>
                          <p className="course-task-status">
                            Soru {p.examIndex + 1} / 10 · {exam[p.examIndex].station}
                          </p>
                          {locate ? (
                            <h3>{exam[0].prompt}</h3>
                          ) : (
                            <Question
                              q={exam[p.examIndex]}
                              answer={p.exam[p.examIndex]}
                              locked={!course.canWork || p.examFinished}
                              exam
                              onAnswer={(n) => {
                                const a = [...p.exam];
                                a[p.examIndex] = n;
                                save({ exam: a });
                              }}
                            />
                          )}
                          <p className="course-caption">
                            Açıklamalar testi bitirdiğinde açılır. Yanıtlarını bitirmeden
                            değiştirebilirsin.
                          </p>
                          <div className="course-review-actions">
                            <Button
                              variant="outline"
                              disabled={!course.canWork || p.examIndex === 0}
                              onClick={() => save({ examIndex: p.examIndex - 1 })}
                            >
                              Önceki soru
                            </Button>
                            {p.examIndex < 9 ? (
                              <Button
                                disabled={!course.canWork || p.exam[p.examIndex] === null}
                                onClick={() => save({ examIndex: p.examIndex + 1 })}
                              >
                                Sonraki soru
                              </Button>
                            ) : (
                              <Button
                                disabled={!course.canWork || p.exam.some((x) => x === null)}
                                onClick={() => {
                                  course.save({ ...p, step: "result", examFinished: true });
                                  onStep("result");
                                }}
                              >
                                Testi bitir
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {step !== "exam" && (
                    <footer className="course-review-actions">
                      <Button
                        variant="outline"
                        disabled={!course.canWork || index === 0}
                        onClick={() => go(KNEE_COURSE_STEPS[index - 1].id)}
                      >
                        Önceki adım
                      </Button>
                      <Button
                        disabled={!course.canWork || !canNext}
                        onClick={() => go(KNEE_COURSE_STEPS[index + 1].id)}
                      >
                        Sonraki adım
                      </Button>
                      {!canNext && (
                        <p className="course-caption">
                          {step === "anatomy"
                            ? "Tüm yapıları incele ve üç soruyu yanıtla."
                            : step === "motion"
                              ? "Üç durağın sorularını yanıtla."
                              : step === "case"
                                ? "İki vakanın altı kararını yanıtla."
                                : "Üç bağlantı sorusunu yanıtla."}
                        </p>
                      )}
                    </footer>
                  )}
                </>
              )}
            </div>
          </div>
          <Disclosure title="Kaynaklar ve model kapsamı">
            <p>
              Kaynak anatomi eğitim amaçlıdır. Sağlıklı doku ilişkileri kişiye ait hasarı veya kesin
              tanıyı göstermez.
            </p>
            <ul>
              {c.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </Disclosure>
          <Disclosure title="Bu modülün kaydını yönet">
            <p>
              Yalnız {c.title.toLocaleLowerCase("tr")} modülündeki yanıt ve ilerlemeyi sıfırlar.
            </p>
            {restart ? (
              <div className="course-review-actions">
                <Button
                  disabled={!course.canWork}
                  onClick={() => {
                    course.save({ ...freshRegionalCourse(id), revision: p.revision });
                    onStep("anatomy");
                    setRestart(false);
                  }}
                >
                  Bu modülü sıfırla
                </Button>
                <Button variant="ghost" onClick={() => setRestart(false)}>
                  Vazgeç
                </Button>
              </div>
            ) : (
              <Button variant="outline" disabled={!course.canWork} onClick={() => setRestart(true)}>
                Baştan başlamak istiyorum
              </Button>
            )}
          </Disclosure>
        </>
      )}
    </section>
  );
}
