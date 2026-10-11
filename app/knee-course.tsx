import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Disclosure } from "./disclosure";
import type { Atlas, SceneState } from "./anatomy";
import FindingProjection from "./finding-projection";
import { findingScene } from "./model-finding";
import KneeCourseProjection from "./knee-course-projection";
import {
  KNEE_COURSE_STEPS,
  KNEE_STRUCTURES,
  KNEE_CHECKS,
  KNEE_SOURCES,
  KNEE_ANATOMY_CHECKS,
  KNEE_CHAIN_CHECKS,
  KNEE_CASES,
  KNEE_CASE_CHECKS,
  KNEE_QUESTION_BANK,
  examQuestions,
  kneeCourseNeedsReview,
  freshKneeCourse,
  restartKneeExam,
  kneeCourseParts,
  kneeCourseContext,
  kneeCourseCompletion,
  kneeExamChoice,
  type KneeCourseStep,
  type CourseQuestion,
} from "./knee-course-data";
import type { KneeCourseController } from "./use-knee-course";
import { useCoursePose } from "./use-course-pose";
const AnatomyScene = lazy(() => import("./scene"));
function CourseScene({
  atlas,
  scene,
  onSelect,
  onProgress,
  onError,
}: {
  atlas: Atlas;
  scene: SceneState;
  onSelect: (id: string) => void;
  onProgress: (n: number) => void;
  onError: (error: string) => void;
}) {
  const progress = useCoursePose(scene.knee?.progress ?? 0, !!scene.knee);
  return (
    <AnatomyScene
      embedded
      atlas={atlas}
      state={scene.knee ? { ...scene, knee: { ...scene.knee, progress } } : scene}
      onSelect={onSelect}
      onProgress={onProgress}
      onError={onError}
    />
  );
}
function Question({
  q,
  answer,
  onAnswer,
  exam = false,
  locked = false,
}: {
  q: CourseQuestion;
  answer: number | null;
  onAnswer: (i: number | null) => void;
  exam?: boolean;
  locked?: boolean;
}) {
  return (
    <div className="course-question">
      <h3>{q.prompt}</h3>
      <div className="course-answers">
        {q.options.map((option, i) => (
          <Button
            key={option}
            variant="outline"
            disabled={locked || (answer !== null && !exam)}
            aria-pressed={answer === i}
            className={answer === i ? "course-choice-selected" : ""}
            onClick={() => onAnswer(i)}
          >
            <span className="course-letter" aria-hidden="true">
              {String.fromCharCode(65 + i)}
            </span>
            <span>{option}</span>
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
    </div>
  );
}
export default function KneeCourse({
  atlas,
  course,
  routeStep,
  onStep,
  onClose,
}: {
  atlas: Atlas;
  course: KneeCourseController;
  routeStep?: KneeCourseStep;
  onStep: (step: KneeCourseStep, replace?: boolean) => void;
  onClose: () => void;
}) {
  const p = course.progress,
    step = routeStep === "result" && !p.examFinished ? "exam" : (routeStep ?? p.step),
    index = KNEE_COURSE_STEPS.findIndex((x) => x.id === step),
    complete = kneeCourseCompletion(p),
    needsReview = kneeCourseNeedsReview(p),
    examQs = examQuestions(p),
    heading = useRef<HTMLHeadingElement>(null);
  const [chainKey, setChainKey] = useState<string>("quadriceps tendon"),
    [focus, setFocus] = useState(1),
    [showTendons, setShowTendons] = useState(false),
    [showMuscles, setShowMuscles] = useState(false),
    [modelError, setModelError] = useState(""),
    [modelProgress, setModelProgress] = useState(0),
    [modelAttempt, setModelAttempt] = useState(0),
    [restartConfirm, setRestartConfirm] = useState(false),
    [motionDemo, setMotionDemo] = useState<number | null>(null);
  const pose = p.motionStop,
    view = p.view,
    selectedKey = step === "anatomy" ? (p.lastStructure ?? "") : chainKey,
    activeCase = KNEE_CASES[p.caseIndex],
    activeCaseStage = activeCase.stages[p.caseStage],
    caseAnswerIndex = p.caseIndex * 3 + p.caseStage;
  useEffect(() => {
    if (course.canWork) {
      if (!routeStep) onStep(p.step, true);
      else if (routeStep === "result" && !p.examFinished) onStep("exam", true);
      else if (routeStep && p.step !== step) course.save({ ...p, step });
    }
  }, [course.canWork, routeStep, p.step]);
  useEffect(() => {
    heading.current?.focus();
    setChainKey("quadriceps tendon");
    setMotionDemo(null);
    setFocus((n) => n + 1);
    setRestartConfirm(false);
  }, [step, course.status === "loading"]);
  const save = (changes: Partial<typeof p>) => course.save({ ...p, step, ...changes });
  const setView = (next: "3d" | "2d") => save({ view: next });
  function go(next: KneeCourseStep) {
    if (next === "result" && !p.examFinished) return;
    course.save({ ...p, step: next });
    onStep(next);
  }
  function selectStructure(key: string) {
    setChainKey(key);
    setFocus((n) => n + 1);
    if (step === "anatomy" && KNEE_STRUCTURES.some((x) => x.key === key))
      save({
        lastStructure: key,
        observed: p.observed.includes(key) ? p.observed : [...p.observed, key],
      });
  }
  const structure = KNEE_STRUCTURES.find((x) => x.key === selectedKey);
  const motion = step === "motion",
    examLocate = step === "exam" && p.examIndex === 0 && !p.examFinished,
    findingId = "locate:patellar ligament:" + p.side;
  const visualKey =
    step === "exam"
      ? (examQs[p.examIndex].visualKey ?? "femur")
      : step === "case"
        ? activeCase.visualKey
        : selectedKey;
  const scene = useMemo<SceneState>(() => {
    const context = kneeCourseContext(atlas, p.side),
      allowed = new Set(context.map((x) => x.id)),
      finding = examLocate ? findingScene(atlas, findingId) : undefined;
    return {
      visible: ["skeletal", "muscular", "connective"],
      selected:
        (finding ? (p.examPickId ? [p.examPickId] : finding.candidateIds) : undefined) ??
        (motion ? [] : kneeCourseParts(atlas, visualKey, p.side).map((x) => x.id)),
      hidden:
        finding?.hidden ??
        (motion ? [] : atlas.parts.filter((x) => !allowed.has(x.id)).map((x) => x.id)),
      hideNames: examLocate,
      contextOpacity: motion ? 1 : 0.22,
      isolate: false,
      view: motion ? "side" : "front",
      explode: 0,
      rotate: false,
      reset: focus,
      focus: motion ? 0 : focus,
      knee: motion
        ? {
            id: "flexion",
            side: p.side,
            progress: motionDemo ?? pose * 50,
            playing: false,
            motion: true,
            anatomicalMuscles: showMuscles,
            antagonists: false,
            plane: false,
            tendons: showTendons,
          }
        : undefined,
    };
  }, [
    atlas,
    p.side,
    step,
    visualKey,
    focus,
    pose,
    motionDemo,
    showMuscles,
    showTendons,
    p.examIndex,
    p.examFinished,
    p.examPickId,
  ]);
  function pick(id: string) {
    const part = atlas.parts.find((x) => x.id === id);
    if (!part || !course.canWork) return;
    if (examLocate) {
      if (findingScene(atlas, findingId)?.parts.some((x) => x.id === id))
        save({ examPickId: id, exam: [kneeExamChoice(part), ...p.exam.slice(1)] });
      return;
    }
    const item = KNEE_STRUCTURES.find((x) =>
      kneeCourseParts(atlas, x.key, p.side).some((p) => p.id === id),
    );
    if (item) selectStructure(item.key);
  }
  const score = p.exam.filter((a, i) => a === examQs[i].correct).length,
    weak = [...new Set(examQs.filter((q, i) => p.exam[i] !== q.correct).map((q) => q.review))];
  const checksAnswered = p.checks.every((a) => a !== null),
    canNext =
      step === "anatomy"
        ? p.observed.length === KNEE_STRUCTURES.length && p.anatomyAnswers.every((a) => a !== null)
        : step === "motion"
          ? checksAnswered
          : step === "chain"
            ? p.chainAnswers.every((a) => a !== null)
            : step === "case"
              ? p.caseAnswers.every((a) => a !== null)
              : false;
  const source =
    step === "motion"
      ? KNEE_SOURCES.motion
      : step === "anatomy"
        ? (structure?.source ?? KNEE_SOURCES.acl)
        : KNEE_SOURCES.chain;
  const examQ = examQs[p.examIndex];
  return (
    <section
      className="knee-course"
      aria-label="Dizi baştan sona öğren"
      aria-busy={course.status === "loading"}
    >
      <header className="course-header">
        <div>
          <h2>Dizi baştan sona öğren</h2>
          <p>Kemikler, kaslar, bağlar, menisküsler ve klinik bağlantılar</p>
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
                {course.conflict?'Bendeki ilerlemeyi kaydet':'Yeniden dene'}
              </Button>
            </div>
          )}
          {course.conflict&&<Button variant="outline" onClick={course.useAccount}>Hesaptaki kaydı aç</Button>}
          <div className="course-savebar">
            <span role="status">
              {course.authenticated
                ? course.status === "saving"
                  ? "Hesabına kaydediliyor…"
                  : course.status === "error"
                    ? "Kayıt bekliyor"
                    : "Hesabında kayıtlı"
                : course.status === "error"
                  ? "Taslak açık sayfada · Kayıt bekliyor"
                  : "Bu sekmede taslak"}
            </span>
            {!course.authenticated && (
              <a href="/signin-with-chatgpt?return_to=%2F%23diz-dersi" target="_top">
                Kalıcı kayıt için giriş yap
              </a>
            )}
          </div>
          {course.pendingDraft && (
            <div className="course-draft-offer">
              <strong>Giriş yapmadan başladığın çalışma bulundu.</strong>
              <p>
                Taslağını hesaba ekleyebilirsin. Hesabındaki yanıtlar korunur; boş kalan yanıtlar
                taslaktan tamamlanır. Hesabında başlamış bir sınav varsa o sınav korunur.
              </p>
              <div className="course-review-actions">
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
            </div>
          )}
          {p.expandedFromV1 && (
            <div className="course-update-note">
              <p>
                Önceki ders ve sınav kayıtların korundu. Yeni bağlar, menisküsler ve vakalar
                eklendi; bunların kontrolleri henüz tamamlanmadı.
              </p>
              <Button
                variant="outline"
                disabled={!course.canWork}
                onClick={() => save({ expandedFromV1: false })}
              >
                Anladım
              </Button>
            </div>
          )}
          <div className="course-layout">
            <nav className="course-outline" aria-label="Ders adımları">
              <p className="course-progress-label">
                {complete.slice(0, 4).filter(Boolean).length} / 4 ders kontrolü doğru tamamlandı
              </p>
              {KNEE_COURSE_STEPS.map((item, i) => (
                <button
                  key={item.id}
                  aria-current={step === item.id ? "step" : undefined}
                  disabled={!course.canWork || (item.id === "result" && !p.examFinished)}
                  onClick={() => go(item.id)}
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
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                </button>
              ))}
              <p className="course-outline-note">
                Adımları serbestçe inceleyebilirsin. İşaretler yanıtlarının durumunu gösterir.
              </p>
            </nav>
            <div className="course-main" key={step}>
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
                    Pratik sınav: {score} / {examQs.length} doğru
                  </h3>
                  <p>
                    {weak.length
                      ? "Aşağıdaki bağlantılara dönüp yanlışlarının açıklamalarını inceleyebilirsin."
                      : "Bu turdaki bağlantıları doğru kurdun. Yeni sorularla tekrar çalışabilirsin."}
                  </p>
                  <div className="course-review-actions">
                    {weak.map((s) => (
                      <Button variant="outline" key={s} onClick={() => go(s)}>
                        {KNEE_COURSE_STEPS.find((x) => x.id === s)?.title}
                      </Button>
                    ))}
                  </div>
                  <div className="course-result-list">
                    {examQs.map((q, i) => (
                      <section key={p.examQuestionIds[i]}>
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
                      course.save(restartKneeExam(p));
                      onStep("exam");
                    }}
                  >
                    Yeni sorularla tekrar çöz
                  </Button>
                  <p className="course-caption">
                    {examQs.length === 5
                      ? "Önceki sürümdeki beş soruluk sonucun korundu. Yeni tur 10 sorudan oluşur. "
                      : ""}
                    {KNEE_QUESTION_BANK.length} soruluk bankadan her turda farklı bir seçki
                    kullanılır. Bu sonuç eğitim sorularına aittir; klinik yetkinlik belgesi
                    değildir.
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
                              variant={view === v ? "default" : "outline"}
                              aria-pressed={view === v}
                              onClick={() => setView(v)}
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
                                save({
                                  side,
                                  ...(!p.examFinished
                                    ? { examPickId: null, exam: [null, ...p.exam.slice(1)] }
                                    : {}),
                                });
                                setFocus((n) => n + 1);
                              }}
                            >
                              {side === "right" ? "Sağ" : "Sol"}
                            </Button>
                          ))}
                        </div>
                      </div>
                      {view === "3d" ? (
                        <div className="course-model">
                          <Suspense fallback={<p role="status">3D görünüm hazırlanıyor…</p>}>
                            <CourseScene
                              key={modelAttempt}
                              atlas={atlas}
                              scene={scene}
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
                              <Button onClick={() => setView("2d")}>2D kaynağı aç</Button>
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
                      ) : examLocate ? (
                        <FindingProjection
                          key={findingId}
                          atlas={atlas}
                          id={findingId}
                          selectedId={p.examPickId ?? undefined}
                          disabled={!course.canWork}
                          onPick={pick}
                        />
                      ) : (
                        <KneeCourseProjection
                          atlas={atlas}
                          side={p.side}
                          selected={scene.selected}
                          motion={motion}
                          pose={motionDemo ?? pose * 50}
                          onSelect={pick}
                        />
                      )}
                      {step === "anatomy" && (
                        <div className="course-structure-groups" aria-label="İncelenecek yapılar">
                          {[...new Set(KNEE_STRUCTURES.map((s) => s.group))].map((group) => (
                            <fieldset key={group}>
                              <legend>{group}</legend>
                              <div className="course-structure-list">
                                {KNEE_STRUCTURES.filter((s) => s.group === group).map((item) => (
                                  <Button
                                    key={item.key}
                                    disabled={!course.canWork}
                                    variant={selectedKey === item.key ? "default" : "outline"}
                                    aria-pressed={selectedKey === item.key}
                                    onClick={() => selectStructure(item.key)}
                                  >
                                    {p.observed.includes(item.key) && (
                                      <Check size={16} aria-hidden="true" />
                                    )}
                                    {item.label}
                                  </Button>
                                ))}
                              </div>
                            </fieldset>
                          ))}
                        </div>
                      )}
                      {step === "chain" && (
                        <div className="course-chain" aria-label="Ekstansör zincir">
                          {[
                            { key: "quadriceps group", label: "Quadriceps grubu" },
                            { key: "quadriceps tendon", label: "Quadriceps tendonu" },
                            { key: "patella", label: "Patella" },
                            { key: "patellar ligament", label: "Patellar tendon" },
                            { key: "tibia", label: "Tibia" },
                            { key: "posterior cruciate ligament", label: "Arka çapraz bağ" },
                            { key: "medial collateral ligament", label: "İç yan bağ" },
                            { key: "lateral collateral ligament", label: "Dış yan bağ" },
                          ].map((x) => (
                            <Button
                              key={x.key}
                              disabled={!course.canWork}
                              variant={selectedKey === x.key ? "default" : "outline"}
                              aria-pressed={selectedKey === x.key}
                              onClick={() => selectStructure(x.key)}
                            >
                              {x.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      {motion && (
                        <>
                          <div className="course-stops" aria-label="Hareket durakları">
                            {["Başlangıç · 0°", "Orta · 60°", "Son · 120°"].map((label, i) => (
                              <Button
                                key={label}
                                disabled={!course.canWork}
                                variant={pose === i ? "default" : "outline"}
                                aria-pressed={pose === i}
                                onClick={() => {
                                  save({ motionStop: i });
                                  setMotionDemo(null);
                                  setFocus((n) => n + 1);
                                }}
                              >
                                {p.checks[i] === KNEE_CHECKS[i].correct && (
                                  <Check size={16} aria-hidden="true" />
                                )}
                                {label}
                              </Button>
                            ))}
                          </div>
                          <p className="course-caption">
                            Açılar dersin gösterim konumlarıdır; normal hareket açıklığı ölçümü
                            değildir.
                          </p>
                          {view === "3d" && (
                            <Disclosure title="Kas ve tendon seçenekleri">
                              <label className="plane-toggle">
                                Kaslı görünüm
                                <Switch checked={showMuscles} onCheckedChange={setShowMuscles} />
                              </label>
                              <label className="plane-toggle">
                                Patella ve tendonların şematik hareketi
                                <Switch checked={showTendons} onCheckedChange={setShowTendons} />
                              </label>
                              <p className="course-caption">
                                Yaklaşık hareket gösterimidir. Doku teması, kuvvet ve tendon
                                gerilimi hesaplanmaz.
                              </p>
                            </Disclosure>
                          )}
                        </>
                      )}
                    </div>
                    <div className="course-explanation">
                      {step === "anatomy" && (
                        <>
                          <h3>{structure?.label ?? "Bir yapı seçerek başla"}</h3>
                          <p>
                            {structure?.text ??
                              "Kemikler, kas ve tendonlar, bağlar ve menisküsleri sırayla incele. İlk seçimden sonra açıklama burada açılır."}
                          </p>
                          <p>
                            Modelden veya düğmelerden yapıları seç. Seçtiğin yapı vurgulanır;
                            komşuları saydam kalır.
                          </p>
                          <p className="course-task-status">
                            {p.observed.length} / {KNEE_STRUCTURES.length} yapı incelendi
                          </p>
                          {KNEE_ANATOMY_CHECKS.map((q, i) => (
                            <Question
                              key={q.prompt}
                              q={q}
                              answer={p.anatomyAnswers[i]}
                              locked={!course.canWork}
                              onAnswer={(a) =>
                                save({
                                  anatomyAnswers: p.anatomyAnswers.map((v, j) => (i === j ? a : v)),
                                })
                              }
                            />
                          ))}
                        </>
                      )}
                      {motion && (
                        <>
                          <h3>
                            {
                              [
                                "Diz açık konumda",
                                "Fleksiyon yönünde ilerle",
                                "Bükülü konumdan geri dön",
                              ][pose]
                            }
                          </h3>
                          <p>
                            {
                              [
                                "Açık diz konumunu femur ve tibia ilişkisi üzerinden incele.",
                                "Alt bacağın uyluğa yaklaşmasına dikkat et. Hamstringler diz fleksiyonuna katılır.",
                                "Ekstansiyon, bükülü dizi açma yönüdür. Bu yönde başlıca kas grubu quadricepstir.",
                              ][pose]
                            }
                          </p>
                          {pose === 2 && (
                            <div className="course-motion-demo">
                              <Button
                                disabled={!course.canWork}
                                variant="outline"
                                onClick={() => setMotionDemo(motionDemo === null ? 50 : null)}
                              >
                                {motionDemo === null ? "60°’ye dönüşü göster" : "120° konumuna dön"}
                              </Button>
                              {motionDemo !== null && (
                                <p role="status">
                                  Model 60° konumunda. Açı azalması ekstansiyon yönünü gösterir.
                                </p>
                              )}
                            </div>
                          )}
                          <Question
                            q={KNEE_CHECKS[pose]}
                            answer={p.checks[pose]}
                            locked={!course.canWork}
                            onAnswer={(a) =>
                              save({ checks: p.checks.map((v, i) => (i === pose ? a : v)) })
                            }
                          />
                          <p className="course-task-status">
                            {p.checks.filter((a) => a !== null).length} / 3 durak yanıtlandı
                          </p>
                          {p.checks[pose] !== null && pose < 2 && (
                            <Button
                              variant="outline"
                              disabled={!course.canWork}
                              onClick={() => {
                                save({ motionStop: pose + 1 });
                                setMotionDemo(null);
                              }}
                            >
                              Sonraki durak
                            </Button>
                          )}
                        </>
                      )}
                      {step === "chain" && (
                        <>
                          <h3>İşlev ve stabilite bağlantılarını ayır</h3>
                          <p>
                            Quadriceps grubunun dört kası patellanın üstündeki ortak tendon
                            bağlantısına kuvvet aktarır. Patellar tendon bu zinciri tibiaya taşır.
                          </p>
                          <p>
                            Çapraz ve yan bağlar farklı yönlerde stabilite sağlar. Düğmelerle kas
                            grubunu ve bağların kemik ilişkilerini karşılaştır.
                          </p>
                          {KNEE_CHAIN_CHECKS.map((q, i) => (
                            <Question
                              key={q.prompt}
                              q={q}
                              answer={p.chainAnswers[i]}
                              locked={!course.canWork}
                              onAnswer={(a) =>
                                save({
                                  chainAnswers: p.chainAnswers.map((v, j) => (i === j ? a : v)),
                                })
                              }
                            />
                          ))}
                        </>
                      )}
                      {step === "case" && (
                        <>
                          <p className="course-case-label">Kurgusal eğitim vakaları</p>
                          <div className="course-case-options" aria-label="Vaka seçimi">
                            {KNEE_CASES.map((c, i) => (
                              <Button
                                key={c.id}
                                variant={p.caseIndex === i ? "default" : "outline"}
                                aria-pressed={p.caseIndex === i}
                                disabled={!course.canWork}
                                onClick={() => {
                                  const first = p.caseAnswers
                                    .slice(i * 3, i * 3 + 3)
                                    .findIndex((a) => a === null);
                                  save({ caseIndex: i, caseStage: first < 0 ? 0 : first });
                                  setFocus((n) => n + 1);
                                }}
                              >
                                {i + 1}. {c.title} ·{" "}
                                {
                                  p.caseAnswers.slice(i * 3, i * 3 + 3).filter((a) => a !== null)
                                    .length
                                }
                                /3
                              </Button>
                            ))}
                          </div>
                          <h3>{activeCase.title}</h3>
                          <p>{activeCase.history}</p>
                          <div className="course-case-stages" aria-label="Vaka aşamaları">
                            {activeCase.stages.map((s, i) => (
                              <Button
                                key={s.title}
                                variant={p.caseStage === i ? "default" : "outline"}
                                aria-pressed={p.caseStage === i}
                                disabled={
                                  !course.canWork ||
                                  (i > 0 && p.caseAnswers[p.caseIndex * 3 + i - 1] === null)
                                }
                                onClick={() => save({ caseStage: i })}
                              >
                                {i + 1}. {s.title}
                              </Button>
                            ))}
                          </div>
                          <p>{activeCaseStage.text}</p>
                          <Question
                            q={activeCaseStage.question}
                            answer={p.caseAnswers[caseAnswerIndex]}
                            locked={!course.canWork}
                            onAnswer={(a) =>
                              save({
                                caseAnswers: p.caseAnswers.map((v, i) =>
                                  i === caseAnswerIndex ? a : v,
                                ),
                              })
                            }
                          />
                          {p.caseAnswers[caseAnswerIndex] !== null && (
                            <Button
                              variant="outline"
                              disabled={!course.canWork}
                              onClick={() =>
                                p.caseStage < 2
                                  ? save({ caseStage: p.caseStage + 1 })
                                  : p.caseIndex < 3
                                    ? (save({ caseIndex: p.caseIndex + 1, caseStage: 0 }),
                                      setFocus((n) => n + 1))
                                    : go("exam")
                              }
                            >
                              {p.caseStage < 2
                                ? "Sonraki vaka aşaması"
                                : p.caseIndex < 3
                                  ? "Sonraki vaka"
                                  : "Pratik sınava geç"}
                            </Button>
                          )}
                          <p className="course-task-status">
                            {p.caseAnswers.filter((a) => a !== null).length} /{" "}
                            {KNEE_CASE_CHECKS.length} vaka kararı yanıtlandı
                          </p>
                        </>
                      )}
                      {step === "exam" &&
                        (p.examFinished ? (
                          <>
                            <h3>Sınav tamamlandı</h3>
                            <Button onClick={() => go("result")}>Sonucu aç</Button>
                          </>
                        ) : (
                          <>
                            <p className="course-exam-station">{examQ.station}</p>
                            <p className="course-task-status">
                              Soru {p.examIndex + 1} / {examQs.length} · Yanıtlar sınav sonunda
                              açıklanır.
                            </p>
                            {examLocate ? (
                              <div className="course-question">
                                <h3>{examQ.prompt}</h3>
                                <p>
                                  3D modelde yapıya dokun veya 2D kaynak görünümündeki numaralı
                                  bölgeyi seç.
                                </p>
                                {p.exam[0] !== null && (
                                  <p role="status">
                                    Seçimin kaydedildi; onaylamadan önce değiştirebilirsin.
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Question
                                q={examQ}
                                answer={p.exam[p.examIndex]}
                                exam
                                locked={!course.canWork}
                                onAnswer={(a) =>
                                  save({ exam: p.exam.map((v, i) => (i === p.examIndex ? a : v)) })
                                }
                              />
                            )}
                            <Button
                              disabled={
                                p.exam[p.examIndex] === null ||
                                !course.canWork ||
                                (p.examIndex === examQs.length - 1 &&
                                  p.exam.some((a) => a === null))
                              }
                              onClick={() => {
                                if (p.examIndex === examQs.length - 1) {
                                  course.save({ ...p, step: "result", examFinished: true });
                                  onStep("result");
                                } else save({ examIndex: p.examIndex + 1 });
                              }}
                            >
                              {p.examIndex === examQs.length - 1
                                ? "Yanıtı onayla ve sınavı bitir"
                                : "Yanıtı onayla ve ilerle"}
                            </Button>
                            <Button
                              variant="ghost"
                              disabled={p.examIndex === 0 || !course.canWork}
                              onClick={() => save({ examIndex: p.examIndex - 1 })}
                            >
                              Önceki soru
                            </Button>
                          </>
                        ))}
                      {step !== "exam" && (
                        <a
                          className="course-source"
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {source.label}
                        </a>
                      )}
                    </div>
                  </div>
                  {step !== "exam" && (
                    <footer className="course-footer">
                      <Button
                        variant="ghost"
                        disabled={index === 0 || !course.canWork}
                        onClick={() => go(KNEE_COURSE_STEPS[index - 1].id)}
                      >
                        Önceki adım
                      </Button>
                      <span>
                        {!canNext
                          ? step === "anatomy"
                            ? "13 yapıyı incele ve iki soruyu yanıtla"
                            : step === "motion"
                              ? "Üç durağın sorusunu yanıtla"
                              : step === "case"
                                ? "Dört vakadaki 12 kararı yanıtla"
                                : "Üç soruyu yanıtla"
                          : needsReview[index]
                            ? "Yanıtlandı · Tekrar gerekli"
                            : complete[index]
                              ? "Kontroller doğru tamamlandı"
                              : "Yanıtlandı"}
                      </span>
                      <Button
                        disabled={!canNext || !course.canWork}
                        onClick={() => go(KNEE_COURSE_STEPS[index + 1].id)}
                      >
                        {step === "case" ? "Pratik sınava geç" : "Devam et"}
                      </Button>
                    </footer>
                  )}
                </>
              )}
            </div>
          </div>
          <Disclosure title="Ders kaydı ve baştan başlama">
            <p>
              {course.authenticated
                ? "Ders adımın, seçimin, hareket durağın ve yanıtların hesabında saklanır."
                : "Giriş yapmadan çalışabilirsin. Taslak bu sekmede korunur; sekme veya tarayıcı verileri kapatıldığında kaybolabilir. Kalıcı kayıt için giriş yap."}
            </p>
            {restartConfirm ? (
              <div className="course-restart">
                <p>Bu dersin ilerlemesi ve sınav yanıtları sıfırlanacak.</p>
                <Button
                  disabled={!course.canWork}
                  onClick={() => {
                    course.save(freshKneeCourse());
                    onStep("anatomy");
                    setShowTendons(false);
                    setShowMuscles(false);
                    setRestartConfirm(false);
                  }}
                >
                  Dersi sıfırla
                </Button>
                <Button variant="outline" onClick={() => setRestartConfirm(false)}>
                  Vazgeç
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                disabled={!course.canWork}
                onClick={() => setRestartConfirm(true)}
              >
                <RotateCcw size={16} />
                Baştan başla
              </Button>
            )}
          </Disclosure>
        </>
      )}
    </section>
  );
}
