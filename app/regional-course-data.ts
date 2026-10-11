import {handPose,type HandMoveId} from './hand-motion';
import type { Atlas, Part, SceneState } from "./anatomy";
import { sideOf } from "./innervation";
import { muscleKeyMatches } from "./education-data";
import { tendonParts } from "./tendon-model";
import { isKneeCourseStep, type KneeCourseStep, type CourseQuestion } from "./knee-course-data";
import {
  regionalCourse,
  regionalBank,
  regionalExam,
  type RegionalCourseId,
  type RegionalCourseDefinition,
} from "./regional-course-content";
import { poseMatrices, motionSegment } from "./shoulder-motion";
import { elbowMatrices, elbowSegment } from "./elbow-motion";
import { lowerMatrices, lowerSegment } from "./lower-motion";
export interface RegionalCourseProgress {
  version: 1;
  courseId: RegionalCourseId;
  step: KneeCourseStep;
  side: "right" | "left";
  view: "3d" | "2d";
  observed: string[];
  lastStructure: string | null;
  motionStop: number;
  anatomyAnswers: (number | null)[];
  checks: (number | null)[];
  chainAnswers: (number | null)[];
  caseAnswers: (number | null)[];
  caseIndex: number;
  caseStage: number;
  exam: (number | null)[];
  examIndex: number;
  examRound: number;
  examPickId: string | null;
  examFinished: boolean;
  revision?: number;
  updatedAt?: number;
}
export const regionalDraftKey = (id: RegionalCourseId) => "atlas-course-draft-" + id;
export const freshRegionalCourse = (id: RegionalCourseId): RegionalCourseProgress => ({
  version: 1,
  courseId: id,
  step: "anatomy",
  side: "right",
  view: "3d",
  observed: [],
  lastStructure: null,
  motionStop: 0,
  anatomyAnswers: [null, null, null],
  checks: [null, null, null],
  chainAnswers: [null, null, null],
  caseAnswers: [null, null, null, null, null, null],
  caseIndex: 0,
  caseStage: 0,
  exam: Array(10).fill(null),
  examIndex: 0,
  examRound: 0,
  examPickId: null,
  examFinished: false,
});
export function regionalExamQuestions(p: RegionalCourseProgress): CourseQuestion[] {
  const c = regionalCourse(p.courseId)!;
  return [
    {
      prompt: `İsimleri gizlenmiş kaynak modelde ${c.locateLabel.toLocaleLowerCase("tr")} yapısını bul.`,
      options: [c.locateLabel, "Başka yapı"],
      correct: 0,
      why: c.structures.find((s) => s.key === c.locateKey)!.text,
      source: c.structures.find((s) => s.key === c.locateKey)!.source,
      review: "anatomy",
      station: "1. istasyon · Modelde bulma",
    },
    ...regionalExam(c, p.examRound).map((i) => {
      const q = regionalBank(c)[i];
      return {
        ...q,
        station:
          q.review === "anatomy"
            ? "1. istasyon · Anatomi"
            : q.review === "motion" || q.review === "chain"
              ? "2. istasyon · Hareket ve bağlantı"
              : "3. istasyon · Klinik düşünme",
      };
    }),
  ];
}
const inRange = (v: unknown, n: number) => Number.isInteger(v) && Number(v) >= 0 && Number(v) < n;
const answers = (v: unknown, qs: CourseQuestion[]): v is (number | null)[] =>
  Array.isArray(v) &&
  v.length === qs.length &&
  v.every((x, i) => x === null || inRange(x, qs[i].options.length));
export function parseRegionalCourse(value: unknown): RegionalCourseProgress | null {
  if (!value || typeof value !== "object") return null;
  const p = value as RegionalCourseProgress,
    c = regionalCourse(p.courseId);
  if (
    !c ||
    p.version !== 1 ||
    !isKneeCourseStep(p.step) ||
    !["right", "left"].includes(p.side) ||
    !["2d", "3d"].includes(p.view) ||
    !Array.isArray(p.observed) ||
    p.observed.length > c.structures.length ||
    new Set(p.observed).size !== p.observed.length ||
    p.observed.some((k) => !c.structures.some((s) => s.key === k)) ||
    (p.lastStructure !== null && !c.structures.some((s) => s.key === p.lastStructure)) ||
    !inRange(p.motionStop, c.motions.length) ||
    !answers(p.anatomyAnswers, c.anatomy) ||
    !answers(p.checks, c.motion) ||
    !answers(p.chainAnswers, c.chain) ||
    !answers(
      p.caseAnswers,
      c.cases.flatMap((x) => x.questions),
    ) ||
    !inRange(p.caseIndex, c.cases.length) ||
    !inRange(p.caseStage, 3) ||
    !inRange(p.examRound, 100000) ||
    !answers(p.exam, regionalExamQuestions(p)) ||
    !inRange(p.examIndex, 10) ||
    typeof p.examFinished !== "boolean" ||
    (p.examFinished && p.exam.some((x) => x === null)) ||
    (p.step === "result" && !p.examFinished) ||
    (p.examPickId !== null &&
      (typeof p.examPickId !== "string" || !/^[-a-zA-Z0-9_]{1,80}$/.test(p.examPickId)))
  )
    return null;
  return {
    version: 1,
    courseId: p.courseId,
    step: p.step,
    side: p.side,
    view: p.view,
    observed: [...p.observed],
    lastStructure: p.lastStructure,
    motionStop: p.motionStop,
    anatomyAnswers: [...p.anatomyAnswers],
    checks: [...p.checks],
    chainAnswers: [...p.chainAnswers],
    caseAnswers: [...p.caseAnswers],
    caseIndex: p.caseIndex,
    caseStage: p.caseStage,
    exam: [...p.exam],
    examIndex: p.examIndex,
    examRound: p.examRound,
    examPickId: p.examPickId,
    examFinished: p.examFinished,
    ...(Number.isSafeInteger(p.revision) && Number(p.revision) >= 0
      ? { revision: p.revision }
      : {}),
  };
}
export function regionalCompletion(p: RegionalCourseProgress) {
  const c = regionalCourse(p.courseId)!,
    correct = (a: (number | null)[], qs: CourseQuestion[]) =>
      a.every((x, i) => x === qs[i].correct);
  return [
    p.observed.length === c.structures.length && correct(p.anatomyAnswers, c.anatomy),
    correct(p.checks, c.motion),
    correct(p.chainAnswers, c.chain),
    correct(
      p.caseAnswers,
      c.cases.flatMap((x) => x.questions),
    ),
    p.examFinished,
    p.examFinished,
  ];
}
export function regionalNeedsReview(p: RegionalCourseProgress) {
  const c = regionalCourse(p.courseId)!;
  return [p.anatomyAnswers, p.checks, p.chainAnswers, p.caseAnswers, p.exam].map((a, i) =>
    a.some(
      (x, j) =>
        x !== null &&
        x !==
          [
            c.anatomy,
            c.motion,
            c.chain,
            c.cases.flatMap((x) => x.questions),
            regionalExamQuestions(p),
          ][i][j].correct,
    ),
  );
}
export const hasRegionalWork = (p: RegionalCourseProgress) =>
  !!(
    p.observed.length ||
    [...p.anatomyAnswers, ...p.checks, ...p.chainAnswers, ...p.caseAnswers, ...p.exam].some(
      (x) => x !== null,
    )
  );
export function mergeRegionalDraft(a: RegionalCourseProgress, b: RegionalCourseProgress) {
  if (a.courseId !== b.courseId) return a;
  const fill = (x: (number | null)[], y: (number | null)[]) => x.map((v, i) => v ?? y[i]);
  const keep = a.examFinished || a.exam.some((x) => x !== null);
  return {
    ...(hasRegionalWork(a) ? a : b),
    revision: a.revision,
    observed: [...new Set([...a.observed, ...b.observed])],
    anatomyAnswers: fill(a.anatomyAnswers, b.anatomyAnswers),
    checks: fill(a.checks, b.checks),
    chainAnswers: fill(a.chainAnswers, b.chainAnswers),
    caseAnswers: fill(a.caseAnswers, b.caseAnswers),
    ...(keep
      ? {
          exam: a.exam,
          examIndex: a.examIndex,
          examRound: a.examRound,
          examPickId: a.examPickId,
          examFinished: a.examFinished,
        }
      : {
          exam: b.exam,
          examIndex: b.examIndex,
          examRound: b.examRound,
          examPickId: b.examPickId,
          examFinished: b.examFinished,
        }),
  };
}
export const restartRegionalExam = (p: RegionalCourseProgress): RegionalCourseProgress => ({
  ...p,
  step: "exam",
  exam: Array(10).fill(null),
  examRound: (p.examRound + 1) % 100000,
  examIndex: 0,
  examPickId: null,
  examFinished: false,
});
export function regionalParts(atlas: Atlas, key: string, side: "left" | "right") {
  if (!key) return [];
  const tendon = tendonParts(atlas, key, side);
  if (tendon.length) return tendon;
  return atlas.parts.filter(
    (p) =>
      sideOf(p.name) === side &&
      (p.system === "muscular"
        ? muscleKeyMatches(p.name, key)
        : p.system === "skeletal" && p.name.toLowerCase() === side + " " + key),
  );
}
export function regionalContext(atlas: Atlas, c: RegionalCourseDefinition, side: "left" | "right") {
  const ids = new Set(
    [...c.structures.map((s) => s.key),...c.motions.map((m) => m.visualKey)]
      .flatMap((key) => regionalParts(atlas, key, side)).map((p) => p.id),
  );
  const upper =
    c.id === "shoulder-foundations" || c.id === "elbow-foundations" || c.id === "hand-foundations";
  for (const p of atlas.parts) {
    if (sideOf(p.name) !== side || p.system !== "skeletal") continue;
    const n = p.name.toLowerCase();
    if (
      upper
        ? /\b(clavicle|scapula|humerus|radius|ulna|scaphoid|lunate|capitate|hamate|trapezium|trapezoid|triquetral|triquetrum|pisiform|metacarpal)\b|phalanx.*(finger|thumb)/.test(
            n,
          )
        : /\b(hip bone|femur|tibia|fibula|patella|talus|calcaneus|navicular|cuneiform|cuboid|metatarsal)\b|phalanx.*toe/.test(
            n,
          )
    ) {
      if (
        (c.id === "hand-foundations" && /\b(clavicle|scapula|humerus)\b/.test(n)) ||
        (c.id === "shoulder-foundations" &&
          /metacarpal|phalanx|scaphoid|lunate|capitate|hamate|trapez|triquetr|pisiform/.test(n)) ||
        (c.id === "hip-foundations" &&
          /talus|calcaneus|navicular|cuneiform|cuboid|metatarsal|phalanx/.test(n)) ||
        (c.id === "ankle-foundations" && /hip bone|femur|patella/.test(n))
      )
        continue;
      ids.add(p.id);
    }
  }
  return atlas.parts.filter((p) => ids.has(p.id));
}
export function regionalMotionState(
  c: RegionalCourseDefinition,
  p: RegionalCourseProgress,
): Partial<SceneState> {
  const m = c.motions[p.motionStop],
    base = {
      side: p.side,
      progress: m.progress ?? 0,
      motion: true,
      playing: false,
      plane: false,
      antagonists: false,
      anatomicalMuscles: false,
    };
  if (m.joint === "shoulder")
    return { shoulder: { ...base, id: m.id as "abduction", scapula: true } };
  if (m.joint === "hand") return { hand: { ...base, id: m.id as HandMoveId, digit: "all", anatomicalMuscles: true, tendons: true } };
  if (m.joint === "elbow") return { elbow: { ...base, id: m.id as "flexion" } };
  if (m.joint === "hip" || m.joint === "ankle")
    return { lower: { ...base, joint: m.joint, id: m.id! } };
  return {};
}
export function regionalTransform(atlas: Atlas, state: Partial<SceneState>, part: Part) {
  if (state.hand) return handPose(atlas,state.hand).matrices.get(part.id);
  const pose = state.shoulder
    ? poseMatrices(atlas, state.shoulder)
    : state.elbow
      ? elbowMatrices(atlas, state.elbow)
      : state.lower
        ? lowerMatrices(atlas, state.lower)
        : null;
  const segment = state.shoulder
    ? motionSegment(part, state.shoulder)
    : state.elbow
      ? elbowSegment(part, state.elbow)
      : state.lower
        ? lowerSegment(part, state.lower)
        : 0;
  return pose && segment
    ? segment === 1
      ? pose.upper
      : segment === 2
        ? pose.lower
        : pose.scapula
    : undefined;
}
