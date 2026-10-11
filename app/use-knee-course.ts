import { useEffect, useRef, useState } from "react";
import {
  freshKneeCourse,
  parseKneeCourse,
  hasKneeCourseWork,
  mergeKneeCourseDraft,
  type KneeCourseProgress,
} from "./knee-course-data";
const DRAFT_KEY = "atlas-knee-course-draft";
function draft() {
  try {
    return (
      parseKneeCourse(JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null")) ?? freshKneeCourse()
    );
  } catch {
    return freshKneeCourse();
  }
}
export function useKneeCourse() {
  const [progress, setProgress] = useState(freshKneeCourse),
    [status, setStatus] = useState<"loading" | "guest" | "ready" | "saving" | "error">("loading"),
    [error, setError] = useState(""),
    [conflict,setConflict]=useState(false),
    [pendingDraft, setPendingDraft] = useState<KneeCourseProgress | null>(null);
  const revision=useRef(0),conflictProgress=useRef<KneeCourseProgress|null>(null);
  const authenticated = useRef(false),
    loadFailed = useRef(false),
    pending = useRef<KneeCourseProgress | null>(null),
    busy = useRef(false),
    alive = useRef(true),
    importingDraft = useRef(false),
    unsavedGuest = useRef(false),
    loadGeneration = useRef(0);
  async function refresh() {
    if (busy.current || pending.current) return;
    const generation = ++loadGeneration.current;
    setStatus("loading");
    try {
      const r = await fetch("/api/courses", { cache: "no-store" });
      if (!alive.current || generation !== loadGeneration.current) return;
      if (r.status === 401) {
        authenticated.current = false;
        loadFailed.current = false;
        setProgress(draft());
        setError("");
        setStatus("guest");
        return;
      }
      if (!r.ok) throw Error();
      const body = (await r.json()) as { authenticated?: boolean; progress?: unknown[];warnings?:number };
      if (!alive.current || generation !== loadGeneration.current) return;
      if (body.authenticated !== true || !Array.isArray(body.progress)) throw Error();
      const own = body.progress.find(x => !!parseKneeCourse(x));
      const stored = own ? parseKneeCourse(own) : freshKneeCourse();
      if (!stored) throw Error();
      authenticated.current = true;
      loadFailed.current = false;
      revision.current=stored.revision??0;setProgress(stored);
      const localDraft = draft();
      setPendingDraft(hasKneeCourseWork(localDraft) ? localDraft : null);
      setError(body.warnings?"Bazı eski ders kayıtları okunamadı. Okunabilen kayıtların açıldı.":"");
      setStatus("ready");
    } catch {
      if (!alive.current || generation !== loadGeneration.current) return;
      loadFailed.current = true;
      setError("Ders kaydı yüklenemedi. Kaldığın yeri korumak için yeniden dene.");
      setStatus("error");
    }
  }
  async function drain() {
    if (busy.current || !authenticated.current || !pending.current) return;
    busy.current = true;
    setStatus("saving");
    try {
      while (pending.current) {
        const next: KneeCourseProgress = pending.current,
          r = await fetch("/api/courses", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({...next,revision:revision.current}),
          });
        if(r.status===409){const body=await r.json() as {progress?:unknown};const latest=parseKneeCourse(body.progress);if(latest){conflictProgress.current=latest;setConflict(true);}throw Error('Ders başka bir sekmede veya cihazda değişti. Bendeki ilerlemeyi kaydet seçeneği bu sayfadaki cevapları kaydeder; diğer cihazdaki gözlemler de korunur. Hesaptaki kaydı aç seçeneği buradaki değişiklikleri bırakır.');}
        if (!r.ok)
          throw Error(
            r.status === 401
              ? "Oturum sona erdi. Kalıcı kayıt için yeniden giriş yap."
              : "Ders kaydedilemedi; yaptıkların açık sayfada korunuyor.",
          );
        const body = (await r.json()) as { progress: unknown };
        const stored=parseKneeCourse(body.progress);if (!stored) throw Error("Ders kayıt yanıtı doğrulanamadı.");
        revision.current=stored.revision??0;if (pending.current === next) {pending.current = null;setProgress(stored);}
      }
      if (importingDraft.current) {
        // Remove the guest copy only after the account write succeeds.
        try {
          sessionStorage.removeItem(DRAFT_KEY);
        } catch {}
        importingDraft.current = false;
        setPendingDraft(null);
      }
      setError("");
      if (alive.current) setStatus("ready");
    } catch (e) {
      if (alive.current) {
        setError(e instanceof Error ? e.message : "Ders kaydedilemedi.");
        setStatus("error");
      }
    } finally {
      busy.current = false;
    }
  }
  useEffect(() => {
    alive.current = true;
    void refresh();
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current || unsavedGuest.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      alive.current = false;
      loadGeneration.current++;
      window.removeEventListener("beforeunload", warn);
    };
  }, []);
  function save(next: KneeCourseProgress) {
    if (loadFailed.current || status === "loading" || conflictProgress.current || !parseKneeCourse(next)) return;
    setProgress(next);
    if (!authenticated.current) {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
        unsavedGuest.current = false;
        setError("");
        setStatus("guest");
      } catch {
        unsavedGuest.current = true;
        setError("Taslak bu sekmede saklanamadı; açık sayfada korunuyor.");
        setStatus("error");
      }
      return;
    }
    pending.current = next;
    void drain();
  }
  return {
    progress,
    status,
    error,
    save,
    pendingDraft,
    importDraft: () => {
      if (!pendingDraft || !authenticated.current || loadFailed.current || status === "loading")
        return;
      importingDraft.current = true;
      const merged = mergeKneeCourseDraft(progress, pendingDraft);
      save(merged);
      return merged;
    },
    dismissDraft: () => setPendingDraft(null),
    conflict,
    useAccount:()=>{if(!conflictProgress.current)return;setProgress(conflictProgress.current);revision.current=conflictProgress.current.revision??0;pending.current=null;conflictProgress.current=null;setConflict(false);setError('');setStatus('ready');},
    retry: () => {if(loadFailed.current)return refresh();if(!authenticated.current)return save(progress);if(conflictProgress.current&&pending.current){revision.current=conflictProgress.current.revision??0;pending.current={...pending.current,observed:[...new Set([...conflictProgress.current.observed,...pending.current.observed])]};setProgress(pending.current);conflictProgress.current=null;setConflict(false);}return drain();},
    authenticated: authenticated.current,
    canWork: status !== "loading" && !loadFailed.current&&!conflict,
  };
}
export type KneeCourseController = ReturnType<typeof useKneeCourse>;
