import { useEffect, useRef, useState } from "react";
import { readBrowserDraft, writeBrowserDraft, removeBrowserDraft } from "./browser-drafts";
import {
  freshRegionalCourse,
  regionalDraftKey,
  parseRegionalCourse,
  hasRegionalWork,
  mergeRegionalDraft,
  type RegionalCourseProgress,
} from "./regional-course-data";
import type { RegionalCourseId } from "./regional-course-content";
export function useRegionalCourse(id: RegionalCourseId) {
  const DRAFT_KEY = regionalDraftKey(id);
  const RECOVERY_KEY = DRAFT_KEY + ":pending-account";
  const freshRegional = () => freshRegionalCourse(id);
  const parseRegional = (v: unknown) => {
    const p = parseRegionalCourse(v);
    return p?.courseId === id ? p : null;
  };
  function draft() {
    try {
      return (
        readBrowserDraft(DRAFT_KEY, parseRegional, mergeRegionalDraft) ?? freshRegional()
      );
    } catch {
      return freshRegional();
    }
  }

  const [progress, setProgress] = useState(freshRegional),
    [status, setStatus] = useState<"loading" | "guest" | "ready" | "saving" | "error">("loading"),
    [error, setError] = useState(""),
    [conflict, setConflict] = useState(false),
    [pendingDraft, setPendingDraft] = useState<RegionalCourseProgress | null>(null);
  const revision = useRef(0),
    conflictProgress = useRef<RegionalCourseProgress | null>(null);
  const authenticated = useRef(false),
    loadFailed = useRef(false),
    pending = useRef<RegionalCourseProgress | null>(null),
    busy = useRef(false),
    alive = useRef(true),
    importingDraft = useRef<RegionalCourseProgress | null>(null),
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
      const body = (await r.json()) as {
        authenticated?: boolean;
        progress?: unknown[];
        warnings?: number;
      };
      if (!alive.current || generation !== loadGeneration.current) return;
      if (body.authenticated !== true || !Array.isArray(body.progress)) throw Error();
      const own = body.progress.find((x) => !!parseRegional(x));
      const stored = own ? parseRegional(own) : freshRegional();
      if (!stored) throw Error();
      authenticated.current = true;
      loadFailed.current = false;
      revision.current = stored.revision ?? 0;
      setProgress(stored);
      let recovery: RegionalCourseProgress | null = null;
      try { recovery = parseRegional(JSON.parse(sessionStorage.getItem(RECOVERY_KEY) ?? "null")); } catch {}
      const localDraft = recovery ?? draft();
      setPendingDraft(hasRegionalWork(localDraft) ? localDraft : null);
      setError(
        body.warnings ? "Bazı eski ders kayıtları okunamadı. Okunabilen kayıtların açıldı." : "",
      );
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
        const next: RegionalCourseProgress = pending.current,
          r = await fetch("/api/courses", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...next, revision: revision.current }),
          });
        if (r.status === 409) {
          const body = (await r.json()) as { progress?: unknown };
          const latest = parseRegional(body.progress);
          if (latest) {
            conflictProgress.current = latest;
            setConflict(true);
          }
          throw Error(
            "Ders başka bir sekmede veya cihazda değişti. Bendeki ilerlemeyi kaydet seçeneği bu sayfadaki cevapları kaydeder; diğer cihazdaki gözlemler de korunur. Hesaptaki kaydı aç seçeneği buradaki değişiklikleri bırakır.",
          );
        }
        if (!r.ok)
          throw Error(
            r.status === 401
              ? "Oturum sona erdi. Kalıcı kayıt için yeniden giriş yap."
              : "Ders kaydedilemedi; yaptıkların açık sayfada korunuyor.",
          );
        const body = (await r.json()) as { progress: unknown };
        const stored = parseRegional(body.progress);
        if (!stored) throw Error("Ders kayıt yanıtı doğrulanamadı.");
        revision.current = stored.revision ?? 0;
        if (pending.current === next) {
          pending.current = null;
          setProgress(stored);
        }
      }
      if (importingDraft.current) {
        // Remove the guest copy only after the account write succeeds.
        removeBrowserDraft(DRAFT_KEY, importingDraft.current, parseRegional);
        importingDraft.current = null;
        setPendingDraft(null);
      }
      try {
        sessionStorage.removeItem(RECOVERY_KEY);
      } catch {}
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
  function save(next: RegionalCourseProgress) {
    if (
      loadFailed.current ||
      status === "loading" ||
      conflictProgress.current ||
      !parseRegional(next)
    )
      return;
    setProgress(next);
    if (!authenticated.current) {
      try {
        writeBrowserDraft(DRAFT_KEY, next);
        unsavedGuest.current = false;
        setError("");
        setStatus("guest");
      } catch {
        unsavedGuest.current = true;
        setError("Taslak bu tarayıcıda saklanamadı; açık sayfada korunuyor. Sekmeyi kapatmadan yeniden dene.");
        setStatus("error");
      }
      return;
    }
    // Keep a recoverable draft if the panel closes during an account write.
    try {
      sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(next));
    } catch {}
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
      importingDraft.current = pendingDraft;
      const merged = mergeRegionalDraft(progress, pendingDraft);
      save(merged);
      return merged;
    },
    dismissDraft: () => setPendingDraft(null),
    conflict,
    useAccount: () => {
      if (!conflictProgress.current) return;
      setProgress(conflictProgress.current);
      revision.current = conflictProgress.current.revision ?? 0;
      pending.current = null;
      importingDraft.current = null;
      try {
        sessionStorage.removeItem(RECOVERY_KEY);
      } catch {}
      conflictProgress.current = null;
      setConflict(false);
      setError("");
      setStatus("ready");
    },
    retry: () => {
      if (loadFailed.current) return refresh();
      if (!authenticated.current) return save(progress);
      if (conflictProgress.current && pending.current) {
        revision.current = conflictProgress.current.revision ?? 0;
        pending.current = {
          ...pending.current,
          observed: [
            ...new Set([...conflictProgress.current.observed, ...pending.current.observed]),
          ],
        };
        setProgress(pending.current);
        conflictProgress.current = null;
        setConflict(false);
      }
      return drain();
    },
    authenticated: authenticated.current,
    canWork: status !== "loading" && !loadFailed.current && !conflict,
  };
}
export type RegionalCourseController = ReturnType<typeof useRegionalCourse>;
