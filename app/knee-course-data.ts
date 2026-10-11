import { sideOf } from "./innervation";
import { muscleKeyMatches } from "./education-data";
import { tendonParts } from "./tendon-model";
import { clinicalStructure } from "./clinical-structures";
import type { Atlas, Part } from "./anatomy";
import {
  KNEE_COURSE_ID,
  KNEE_COURSE_STEPS,
  KNEE_STRUCTURES,
  KNEE_CHECKS,
  KNEE_ANATOMY_CHECKS,
  KNEE_CHAIN_CHECKS,
  KNEE_CASE_CHECKS,
  KNEE_CASES,
  KNEE_EXAM,
  LEGACY_KNEE_EXAM_IDS,
  makeKneeExam,
  kneeQuestion,
  type KneeCourseStep,
  type CourseQuestion,
} from "./knee-course-content";
export * from "./knee-course-content";
export function kneeCourseParts(atlas: Atlas, key: string, side: "right" | "left") {
  if (key === "hamstrings group")
    return atlas.parts.filter(
      (p) =>
        sideOf(p.name) === side &&
        p.system === "muscular" &&
        ["biceps femoris", "semitendinosus", "semimembranosus"].some((k) =>
          muscleKeyMatches(p.name, k),
        ),
    );
  if (key === "quadriceps group")
    return atlas.parts.filter(
      (p) =>
        sideOf(p.name) === side &&
        p.system === "muscular" &&
        ["rectus femoris", "vastus lateralis", "vastus medialis", "vastus intermedius"].some((k) =>
          muscleKeyMatches(p.name, k),
        ),
    );
  const connective = tendonParts(atlas, key, side);
  if (connective.length) return connective;
  return atlas.parts.filter(
    (p) =>
      sideOf(p.name) === side &&
      (key === "rectus femoris"
        ? p.system === "muscular" && muscleKeyMatches(p.name, key)
        : p.name.toLowerCase() === side + " " + key),
  );
}
export function kneeCourseContext(atlas: Atlas, side: "right" | "left") {
  const ids = new Set(
    [
      ...KNEE_STRUCTURES.flatMap((x) => kneeCourseParts(atlas, x.key, side)),
      ...kneeCourseParts(atlas, "quadriceps group", side),
    ].map((x) => x.id),
  );
  return atlas.parts.filter(
    (p) =>
      ids.has(p.id) ||
      (sideOf(p.name) === side &&
        p.system === "muscular" &&
        ["biceps femoris", "semitendinosus", "semimembranosus"].some((k) =>
          muscleKeyMatches(p.name, k),
        )),
  );
}
export interface KneeCourseProgress {
  version: 2;
  courseId: typeof KNEE_COURSE_ID;
  step: KneeCourseStep;
  side: "right" | "left";
  observed: string[];
  lastStructure: string | null;
  motionStop: number;
  view: "3d" | "2d";
  anatomyAnswers: (number | null)[];
  checks: (number | null)[];
  chainAnswers: (number | null)[];
  caseAnswers: (number | null)[];
  caseIndex: number;
  caseStage: number;
  examQuestionIds: string[];
  exam: (number | null)[];
  examIndex: number;
  examRound: number;
  examPickId: string | null;
  examFinished: boolean;
  expandedFromV1: boolean;
  updatedAt?: number;
  revision?: number;
}
export const freshKneeCourse = (): KneeCourseProgress => ({
  version: 2,
  courseId: KNEE_COURSE_ID,
  step: "anatomy",
  side: "right",
  observed: [],
  lastStructure: null,
  motionStop: 0,
  view: "3d",
  anatomyAnswers: KNEE_ANATOMY_CHECKS.map(() => null),
  checks: KNEE_CHECKS.map(() => null),
  chainAnswers: KNEE_CHAIN_CHECKS.map(() => null),
  caseAnswers: KNEE_CASE_CHECKS.map(() => null),
  caseIndex: 0,
  caseStage: 0,
  examQuestionIds: makeKneeExam(),
  exam: makeKneeExam().map(() => null),
  examIndex: 0,
  examRound: 0,
  examPickId: null,
  examFinished: false,
  expandedFromV1: false,
});
export function restartKneeExam(p: KneeCourseProgress) {
  const ids = makeKneeExam(p.examRound + 1);
  return {
    ...p,
    step: "exam" as const,
    examQuestionIds: ids,
    exam: ids.map(() => null),
    examIndex: 0,
    examRound: p.examRound + 1,
    examPickId: null,
    examFinished: false,
  };
}
export function isKneeCourseStep(v: unknown): v is KneeCourseStep {
  return KNEE_COURSE_STEPS.some((x) => x.id === v);
}
const validAnswer = (a: unknown, q: CourseQuestion) =>
  a === null || (Number.isInteger(a) && Number(a) >= 0 && Number(a) < q.options.length);
const answers = (a: unknown, qs: readonly CourseQuestion[]): a is (number | null)[] =>
  Array.isArray(a) && a.length === qs.length && a.every((v, i) => validAnswer(v, qs[i]));
const between = (v: unknown, n: number) => Number.isInteger(v) && Number(v) >= 0 && Number(v) < n;
export function parseKneeCourse(value: unknown): KneeCourseProgress | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (v.version === 1) {
    if (
      v.courseId !== KNEE_COURSE_ID ||
      !isKneeCourseStep(v.step) ||
      !["right", "left"].includes(String(v.side)) ||
      !Array.isArray(v.observed) ||
      v.observed.length > 5 ||
      new Set(v.observed).size !== v.observed.length ||
      !v.observed.every((k) =>
        ["femur", "tibia", "patella", "rectus femoris", "patellar ligament"].includes(String(k)),
      ) ||
      !answers(v.checks, KNEE_CHECKS) ||
      !validAnswer(v.chain, KNEE_CHAIN_CHECKS[0]) ||
      !validAnswer(v.caseAnswer, KNEE_CASE_CHECKS[0]) ||
      !answers(v.exam, KNEE_EXAM) ||
      !between(v.examIndex, 5) ||
      typeof v.examFinished !== "boolean" ||
      (v.examFinished && v.exam.some((a) => a === null)) ||
      (v.step === "result" && !v.examFinished)
    )
      return null;
    return {
      ...freshKneeCourse(),
      step: v.step,
      side: v.side as "left" | "right",
      observed: [...v.observed] as string[],
      lastStructure: (v.observed.at(-1) as string) ?? null,
      checks: [...v.checks],
      chainAnswers: [v.chain as number | null, null, null],
      caseAnswers: [v.caseAnswer as number | null, ...KNEE_CASE_CHECKS.slice(1).map(() => null)],
      examQuestionIds: [...LEGACY_KNEE_EXAM_IDS],
      exam: [...v.exam],
      examIndex: Number(v.examIndex),
      examFinished: v.examFinished,
      expandedFromV1: true,
    };
  }
  const p = value as KneeCourseProgress;
  const legacy =
    Array.isArray(p.examQuestionIds) &&
    p.examQuestionIds.length === 5 &&
    p.examQuestionIds.every((id, i) => id === LEGACY_KNEE_EXAM_IDS[i]);
  const current =
    Array.isArray(p.examQuestionIds) &&
    between(p.examRound, 100000) &&
    p.examQuestionIds.length === 10 &&
    p.examQuestionIds.every((id, i) => id === makeKneeExam(p.examRound)[i]);
  if (
    p.version !== 2 ||
    p.courseId !== KNEE_COURSE_ID ||
    !isKneeCourseStep(p.step) ||
    !["right", "left"].includes(p.side) ||
    !Array.isArray(p.observed) ||
    p.observed.length > KNEE_STRUCTURES.length ||
    new Set(p.observed).size !== p.observed.length ||
    !p.observed.every((k) => KNEE_STRUCTURES.some((s) => s.key === k)) ||
    (p.lastStructure !== null && !KNEE_STRUCTURES.some((s) => s.key === p.lastStructure)) ||
    !between(p.motionStop, 3) ||
    !["3d", "2d"].includes(p.view) ||
    !answers(p.anatomyAnswers, KNEE_ANATOMY_CHECKS) ||
    !answers(p.checks, KNEE_CHECKS) ||
    !answers(p.chainAnswers, KNEE_CHAIN_CHECKS) ||
    !answers(p.caseAnswers, KNEE_CASE_CHECKS) ||
    !between(p.caseIndex, KNEE_CASES.length) ||
    !between(p.caseStage, 3) ||
    !between(p.examRound, 100000) ||
    (!legacy && !current) ||
    !answers(
      p.exam,
      p.examQuestionIds.map((id) => kneeQuestion(id)!),
    ) ||
    !between(p.examIndex, p.exam.length) ||
    (p.examPickId !== null &&
      (typeof p.examPickId !== "string" || !/^[-a-zA-Z0-9_]{1,80}$/.test(p.examPickId))) ||
    typeof p.examFinished !== "boolean" ||
    typeof p.expandedFromV1 !== "boolean" ||
    (p.examFinished && p.exam.some((a) => a === null)) ||
    (p.step === "result" && !p.examFinished)
  )
    return null;
  return {
    ...(Number.isInteger(p.revision)&&Number(p.revision)>=0?{revision:p.revision}:{}),
    version: 2,
    courseId: KNEE_COURSE_ID,
    step: p.step,
    side: p.side,
    observed: [...p.observed],
    lastStructure: p.lastStructure,
    motionStop: p.motionStop,
    view: p.view,
    anatomyAnswers: [...p.anatomyAnswers],
    checks: [...p.checks],
    chainAnswers: [...p.chainAnswers],
    caseAnswers: [...p.caseAnswers],
    caseIndex: p.caseIndex,
    caseStage: p.caseStage,
    examQuestionIds: [...p.examQuestionIds],
    exam: [...p.exam],
    examIndex: p.examIndex,
    examRound: p.examRound,
    examPickId: p.examPickId,
    examFinished: p.examFinished,
    expandedFromV1: p.expandedFromV1,
  };
}
const correct = (a: (number | null)[], qs: readonly CourseQuestion[]) =>
  a.every((v, i) => v === qs[i].correct);
export function kneeCourseCompletion(p: KneeCourseProgress) {
  return [
    p.observed.length === KNEE_STRUCTURES.length && correct(p.anatomyAnswers, KNEE_ANATOMY_CHECKS),
    correct(p.checks, KNEE_CHECKS),
    correct(p.chainAnswers, KNEE_CHAIN_CHECKS),
    correct(p.caseAnswers, KNEE_CASE_CHECKS),
    p.examFinished,
    p.examFinished,
  ];
}
export function kneeCourseNeedsReview(p: KneeCourseProgress) {
  return [p.anatomyAnswers, p.checks, p.chainAnswers, p.caseAnswers, p.exam].map((a, i) =>
    a.some(
      (v, j) =>
        v !== null &&
        v !==
          [KNEE_ANATOMY_CHECKS, KNEE_CHECKS, KNEE_CHAIN_CHECKS, KNEE_CASE_CHECKS, examQuestions(p)][
            i
          ][j].correct,
    ),
  );
}
export function examQuestions(p: KneeCourseProgress) {
  return p.examQuestionIds.map((id, i) => ({
    ...kneeQuestion(id)!,
    station:
      i === 0
        ? "1. istasyon · Yapı bulma"
        : kneeQuestion(id)!.domain === "structure"
          ? "1. istasyon · Anatomi"
          : kneeQuestion(id)!.domain === "motion"
            ? "2. istasyon · Hareket ve sinir"
            : "3. istasyon · Klinik karar",
  }));
}
export function kneeExamChoice(part: Part) {
  const key = part.clinicalKey ?? clinicalStructure(part.name)?.key;
  return part.system === "connective" && key === "patellar ligament"
    ? 0
    : part.system === "connective" && key === "quadriceps tendon"
      ? 1
      : 2;
}
export function hasKneeCourseWork(p: KneeCourseProgress) {
  return !!(
    p.observed.length ||
    [...p.anatomyAnswers, ...p.checks, ...p.chainAnswers, ...p.caseAnswers, ...p.exam].some(
      (a) => a !== null,
    )
  );
}
export function mergeKneeCourseDraft(
  account: KneeCourseProgress,
  draft: KneeCourseProgress,
): KneeCourseProgress {
  const hasAccount = hasKneeCourseWork(account),
    keepExam = account.examFinished || account.exam.some((a) => a !== null),
    fill = (a: (number | null)[], b: (number | null)[]) => a.map((v, i) => v ?? b[i]);
  return {
    ...(hasAccount ? account : draft),
    observed: [...new Set([...account.observed, ...draft.observed])],
    anatomyAnswers: fill(account.anatomyAnswers, draft.anatomyAnswers),
    checks: fill(account.checks, draft.checks),
    chainAnswers: fill(account.chainAnswers, draft.chainAnswers),
    caseAnswers: fill(account.caseAnswers, draft.caseAnswers),
    ...(keepExam
      ? {
          examQuestionIds: account.examQuestionIds,
          exam: account.exam,
          examIndex: account.examIndex,
          examRound: account.examRound,
          examPickId: account.examPickId,
          examFinished: account.examFinished,
        }
      : {
          examQuestionIds: draft.examQuestionIds,
          exam: draft.exam,
          examIndex: draft.examIndex,
          examRound: draft.examRound,
          examPickId: draft.examPickId,
          examFinished: draft.examFinished,
        }),
    step: hasAccount ? account.step : draft.step,
  };
}
