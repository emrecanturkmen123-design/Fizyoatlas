import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { DatabaseSync } from "node:sqlite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import worker from "../server/worker.ts";
import KneeCourse from "../app/knee-course.tsx";
import KneeCourseProjection from "../app/knee-course-projection.tsx";
import {
  KNEE_COURSE_STEPS,
  KNEE_STRUCTURES,
  KNEE_EXAM,
  KNEE_CHECKS,
  KNEE_ANATOMY_CHECKS,
  KNEE_CHAIN_CHECKS,
  KNEE_CASE_CHECKS,
  KNEE_QUESTION_BANK,
  examQuestions,
  mergeKneeCourseDraft,
  kneeCourseNeedsReview,
  freshKneeCourse,
  restartKneeExam,
  parseKneeCourse,
  kneeCourseParts,
  kneeCourseContext,
  kneeCourseCompletion,
  kneeExamChoice,
} from "../app/knee-course-data.ts";
import { parseWorkspaceRoute, workspaceHash, routeIdentity } from "../app/workspace-route.ts";
import { findingScene } from "../app/model-finding.ts";
const atlas = JSON.parse(fs.readFileSync("public/models/atlas.json"));
const provenance = JSON.parse(fs.readFileSync("public/models/knee-course-source.json"));
assert.equal(provenance.license, "CC-BY-SA-4.0");
assert.equal(provenance.parts.length, 10);
const binary = fs.readFileSync("public/models/knee-course.bin");
assert.equal(createHash("sha256").update(binary).digest("hex"), provenance.sha256);
assert.deepEqual(gunzipSync(fs.readFileSync("public/models/knee-course.bin.gz")), binary);
for (const p of provenance.parts) {
  assert.deepEqual(
    atlas.parts.find((x) => x.id === p.id),
    p,
  );
  assert(p.sourceObjects.length);
  assert.equal(p.indexCount % 3, 0);
  const pos = new Float32Array(binary.buffer, binary.byteOffset + p.positions, p.vertexCount * 3);
  const normals = new Int16Array(binary.buffer, binary.byteOffset + p.normals, p.vertexCount * 3);
  assert.equal(normals.length, p.vertexCount * 3);
  for (let axis = 0; axis < 3; axis++) {
    const values = Array.from({ length: p.vertexCount }, (_, i) => pos[i * 3 + axis]);
    assert(Math.abs(Math.min(...values) - p.bounds[0][axis]) < 1e-6);
    assert(Math.abs(Math.max(...values) - p.bounds[1][axis]) < 1e-6);
  }
}
const motionProjection = renderToStaticMarkup(
  React.createElement(KneeCourseProjection, {
    atlas,
    side: "right",
    selected: [],
    motion: true,
    pose: 50,
    onSelect() {},
  }),
);
assert.match(
  motionProjection,
  /<button[^>]*aria-pressed="true"[^>]*>Yan<\/button>/,
  "sagittal motion starts in side projection",
);
for (const side of ["left", "right"]) {
  const context = new Set(kneeCourseContext(atlas, side).map((p) => p.id));
  for (const item of KNEE_STRUCTURES) {
    const parts = kneeCourseParts(atlas, item.key, side);
    assert(parts.length, item.key + " has actual geometry on " + side);
    assert(parts.every((p) => context.has(p.id) && p.name.toLowerCase().includes(side)));
  }
  const finding = findingScene(atlas, "locate:patellar ligament:" + side);
  assert(finding?.targetIds.length);
  for (const id of finding.targetIds)
    assert.equal(
      kneeExamChoice(atlas.parts.find((p) => p.id === id)),
      0,
      "patellar source without clinicalKey is a correct pick",
    );
  for (const part of kneeCourseParts(atlas, "quadriceps tendon", side))
    assert.equal(kneeExamChoice(part), 1);
  assert.equal(kneeExamChoice(kneeCourseParts(atlas, "femur", side)[0]), 2);
}
for (const { id } of KNEE_COURSE_STEPS) {
  const hash = workspaceHash({ lesson: "knee-course", courseStep: id });
  assert.deepEqual(parseWorkspaceRoute(hash), { lesson: "knee-course", courseStep: id });
}
assert.equal(parseWorkspaceRoute("#diz-dersi?adim=unknown").courseStep, undefined);
assert.equal(parseWorkspaceRoute("#diz?adim=motion").courseStep, undefined);
assert.notEqual(
  routeIdentity({ lesson: "knee-course", courseStep: "anatomy" }),
  routeIdentity({ lesson: "knee-course", courseStep: "exam" }),
);
const sqlite = new DatabaseSync(":memory:");
for (const name of fs
  .readdirSync("drizzle")
  .filter((n) => n.endsWith(".sql"))
  .sort())
  sqlite.exec(fs.readFileSync("drizzle/" + name, "utf8"));
const DB = {
  prepare(sql) {
    const stmt = sqlite.prepare(sql);
    let args = [];
    return {
      bind(...v) {
        args = v;
        return this;
      },
      async all() {
        return { results: stmt.all(...args) };
      },
      async run() {
        return stmt.run(...args);
      },
    };
  },
};
const call = async(user, p, origin = "https://atlas.test") => {
  if(p){const row=sqlite.prepare('SELECT revision FROM course_progress WHERE user_id = ? AND course_id = ?').get(user,p.courseId);p={...p,revision:row?.revision??0};}
  return worker.fetch(
    new Request("https://atlas.test/api/courses", {
      method: p ? "PUT" : "GET",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        ...(user
          ? {
              "oai-authenticated-user-id": user,
              "oai-authenticated-user-email": user + "@test.dev",
            }
          : {}),
      },
      ...(p ? { body: JSON.stringify(p) } : {}),
    }),
    { DB },
  );};
let p = freshKneeCourse();
assert(parseKneeCourse(p));
assert.equal((await call("", p)).status, 401);
assert.equal((await call("a", p, "https://other.test")).status, 403);
const bads = [
  { ...p, version: 99 },
  { ...p, courseId: "unknown" },
  { ...p, step: "unknown" },
  { ...p, side: "x" },
  { ...p, observed: ["femur", "femur"] },
  { ...p, observed: ["brain"] },
  { ...p, checks: [0, 0] },
  { ...p, checks: [0, 0, 99] },
  { ...p, exam: [0] },
  { ...p, examIndex: 10 },
  { ...p, examFinished: true },
  { ...p, step: "result" },
  { ...p, chainAnswers: [-1, null, null] },
  { ...p, caseAnswers: ["1", ...p.caseAnswers.slice(1)] },
  { ...p, motionStop: 3 },
  { ...p, view: "flat" },
  { ...p, examQuestionIds: p.examQuestionIds.toReversed() },
  { ...p, examPickId: "<invalid>" },
];
for (const bad of bads) {
  assert.equal(parseKneeCourse(bad), null);
  assert.equal((await call("a", bad)).status, 400);
}
p.observed = KNEE_STRUCTURES.map((x) => x.key);
p.step = "motion";
p.side = "left";
p.checks = [0, 1, null];
assert.equal((await call("a", p)).status, 200);
let stored = (await (await call("a")).json()).progress[0];
assert.deepEqual(parseKneeCourse(stored), {...p,revision:stored.revision});
assert.equal((await (await call("b")).json()).progress.length, 0);
p = {
  ...p,
  step: "exam",
  checks: KNEE_CHECKS.map((q) => q.correct),
  anatomyAnswers: KNEE_ANATOMY_CHECKS.map((q) => q.correct),
  chainAnswers: KNEE_CHAIN_CHECKS.map((q) => q.correct),
  caseAnswers: KNEE_CASE_CHECKS.map((q) => q.correct),
  exam: [0, 0, 2, ...p.exam.slice(3)],
  examIndex: 3,
};
await call("a", p);
stored = (await (await call("a")).json()).progress[0];
assert.equal(stored.examIndex, 3);
assert.deepEqual(stored.exam, p.exam);
p = {
  ...p,
  step: "result",
  exam: examQuestions(p).map((q) => q.correct),
  examIndex: 9,
  examFinished: true,
};
assert.equal((await call("a", p)).status, 200);
assert.deepEqual(kneeCourseCompletion(p), [true, true, true, true, true, true]);
for (const step of KNEE_COURSE_STEPS) {
  const state = step.id === "result" ? p : { ...freshKneeCourse(), step: step.id };
  const course = {
    progress: state,
    status: "guest",
    error: "",
    canWork: true,
    authenticated: false,
    save() {},
    retry() {},
    pendingDraft: null,
    importDraft() {},
    dismissDraft() {},
  };
  const html = renderToStaticMarkup(
    React.createElement(KneeCourse, {
      atlas,
      course,
      routeStep: step.id,
      onStep() {},
      onClose() {},
    }),
  );
  assert(html.includes("Dizi baştan sona öğren"));
  assert(html.includes('aria-label="Ders adımları"'));
  assert(html.includes(step.title));
  if (step.id === "result") {
    assert(html.includes("10 / 10 doğru"));
    assert(!html.includes("3D görünüm hazırlanıyor"));
  }
  if (step.id === "exam") assert(!html.includes("Doğru yanıt:"));
}
const course = {
  pendingDraft: null,
  importDraft() {},
  dismissDraft() {},
  progress: freshKneeCourse(),
  status: "error",
  error: "Kayıt kullanılamıyor",
  canWork: false,
  authenticated: false,
  save() {},
  retry() {},
};
const html = renderToStaticMarkup(
  React.createElement(KneeCourse, {
    atlas,
    course,
    routeStep: "anatomy",
    onStep() {},
    onClose() {},
  }),
);
assert(html.includes('role="alert"'));
assert(html.includes("Yeniden dene"));
assert(html.includes("disabled"));
assert.equal(
  (
    await worker.fetch(
      new Request("https://atlas.test/api/courses", {
        headers: { "oai-authenticated-user-id": "a", "oai-authenticated-user-email": "a@test.dev" },
      }),
      {},
    )
  ).status,
  503,
);
const restarted = restartKneeExam(p);
assert(parseKneeCourse(restarted));
assert.equal(restarted.step, "exam");
assert.equal(restarted.examIndex, 0);
assert(restarted.exam.every((a) => a === null));
assert.deepEqual(restarted.observed, p.observed);
assert.deepEqual(restarted.checks, p.checks);
assert.deepEqual(kneeCourseCompletion(restarted), [true, true, true, true, false, false]);
assert.equal((await call("a", restarted)).status, 200);
assert.equal((await (await call("a")).json()).progress[0].examFinished, false);
assert.equal((await call("a", freshKneeCourse())).status, 200);
assert.equal((await (await call("a")).json()).progress[0].step, "anatomy");
assert.equal((await (await call("a")).json()).progress.length, 1);

// Accuracy and mastery differ from merely answering.
const wrong = { ...p, checks: KNEE_CHECKS.map((q) => (q.correct + 1) % q.options.length) };
assert.equal(kneeCourseCompletion(wrong)[1], false);
assert.equal(kneeCourseNeedsReview(wrong)[1], true);
assert.equal(KNEE_STRUCTURES.length, 13);
assert.equal(KNEE_CASE_CHECKS.length, 12);
assert.equal(new Set(KNEE_QUESTION_BANK.map((q) => q.id)).size, KNEE_QUESTION_BANK.length);
for (let round = 0; round < 30; round++) {
  let state = freshKneeCourse();
  for (let i = 0; i < round; i++) state = restartKneeExam(state);
  assert(parseKneeCourse(state));
  assert.equal(state.exam.length, 10);
  assert.equal(new Set(state.examQuestionIds).size, 10);
  assert.equal(examQuestions(state).filter((q) => q.domain === "clinical").length, 3);
  assert.equal(
    new Set(
      examQuestions(state)
        .filter((q) => q.domain === "clinical")
        .map((q) => q.visualKey),
    ).size,
    3,
  );
}
assert.notDeepEqual(restarted.examQuestionIds, p.examQuestionIds);
for (const side of ["left", "right"])
  assert.equal(kneeCourseParts(atlas, "quadriceps group", side).length, 4);
const legacy = {
  version: 1,
  courseId: p.courseId,
  step: "result",
  side: "left",
  observed: ["femur", "tibia", "patella", "rectus femoris", "patellar ligament"],
  checks: [0, 1, 2],
  chain: 1,
  caseAnswer: 1,
  exam: [0, 0, 2, 1, 1],
  examIndex: 4,
  examFinished: true,
};
const migrated = parseKneeCourse(legacy);
assert(migrated);
assert.equal(migrated.exam.length, 5);
assert.deepEqual(migrated.exam, legacy.exam);
assert.equal(migrated.expandedFromV1, true);
assert.equal(migrated.examFinished, true);
assert.equal(examQuestions(migrated).filter((q, i) => migrated.exam[i] === q.correct).length, 5);
const legacyHtml = renderToStaticMarkup(
  React.createElement(KneeCourse, {
    atlas,
    course: {
      progress: migrated,
      status: "ready",
      authenticated: true,
      canWork: true,
      error: "",
      pendingDraft: null,
      save() {},
      retry() {},
      importDraft() {},
      dismissDraft() {},
    },
    routeStep: "result",
    onStep() {},
    onClose() {},
  }),
);
assert(legacyHtml.includes("5 / 5 doğru"));
assert(legacyHtml.includes("Önceki sürümdeki"));
assert(parseKneeCourse(migrated));
assert.equal(restartKneeExam(migrated).exam.length, 10);
assert.equal((await call("legacy", legacy)).status, 200);
assert.equal((await (await call("legacy")).json()).progress[0].exam.length, 5);
const oldRow = sqlite.prepare(
  "INSERT INTO course_progress (user_id,course_id,payload,updated_at) VALUES (?,?,?,?)",
);
oldRow.run("legacy-raw", legacy.courseId, JSON.stringify(legacy), Date.now());
assert.equal((await (await call("legacy-raw")).json()).progress[0].version, 2);
const account = {
  ...freshKneeCourse(),
  observed: ["femur"],
  checks: [0, null, null],
  exam: [1, ...freshKneeCourse().exam.slice(1)],
};
const draft = {
  ...freshKneeCourse(),
  observed: ["tibia"],
  checks: [1, 1, null],
  motionStop: 2,
  view: "2d",
};
const merged = mergeKneeCourseDraft(account, draft);
assert(parseKneeCourse(merged));
assert.deepEqual(merged.observed, ["femur", "tibia"]);
assert.deepEqual(merged.checks, [0, 1, null]);
assert.equal(merged.exam[0], 1);
const emptyMerge = mergeKneeCourseDraft(freshKneeCourse(), draft);
assert.equal(emptyMerge.motionStop, 2);
assert.equal(emptyMerge.view, "2d");
assert(Buffer.byteLength(JSON.stringify(p)) < 4096);
console.log(
  "PASS: actual bilateral source geometry and source-only patellar picks; six lesson deep links; real SQLite resume, finished exam, restart, validation, identity isolation and CSRF; all six rendered lesson stages; 13 structures, four staged cases, rotating 10-question exams, legacy migration, mastery and merge rules. Browser/GPU QA is separate.",
);
