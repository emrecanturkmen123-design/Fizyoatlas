import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import React from "react";
import { create, act } from "react-test-renderer";
import { REGIONAL_COURSES, regionalBank, regionalExam } from "../app/regional-course-content.ts";
import {
  freshRegionalCourse,
  parseRegionalCourse,
  regionalCompletion,
  regionalParts,
  regionalContext,
  regionalMotionState,
  regionalTransform,
  regionalExamQuestions,
  regionalDraftKey,
  mergeRegionalDraft,
  restartRegionalExam,
} from "../app/regional-course-data.ts";
import { freshKneeCourse, parseKneeCourse } from "../app/knee-course-data.ts";
import { useKneeCourse } from "../app/use-knee-course.ts";
import { useRegionalCourse } from "../app/use-regional-course.ts";
import { parseWorkspaceRoute, workspaceHash } from "../app/workspace-route.ts";
import worker from "../server/worker.ts";
import RegionalCourse from "../app/regional-course.tsx";
import Projection from "../app/regional-course-projection.tsx";
import Catalog from "../app/course-catalog.tsx";
import PracticeMenu from "../app/practice-menu.tsx";
import { Button } from "../components/ui/button.tsx";
import { sideOf } from "../app/innervation.ts";
import { requiredChunks } from "../app/model-demand.ts";
const atlas = JSON.parse(fs.readFileSync("public/models/atlas.json"));
assert.equal(REGIONAL_COURSES.length, 5);
assert.equal(new Set(REGIONAL_COURSES.map((c) => c.id)).size, 5);
for (const c of REGIONAL_COURSES) {
  assert.equal(regionalBank(c).length, 20);
  assert.equal(c.cases.length, 2);
  assert(c.cases.every((x) => x.questions.length === 3));
  assert.equal(new Set(c.structures.map((s) => s.key)).size, c.structures.length);
  for (const side of ["left", "right"]) {
    const ctx = regionalContext(atlas, c, side);
    assert(ctx.length);
    assert(ctx.every((p) => sideOf(p.name) === side));
    for (const s of c.structures) {
      const parts = regionalParts(atlas, s.key, side);
      assert(parts.length, c.id + " " + side + " " + s.key);
      assert(parts.every((p) => ctx.includes(p)));
    }
    if (c.id === "hand-foundations")
      assert(!ctx.some((p) => /toe|metatarsal|calcaneus|talus/i.test(p.name)));
    for (let stop = 0; stop < c.motions.length; stop++) {
      const state = regionalMotionState(c, {
        ...freshRegionalCourse(c.id),
        side,
        motionStop: stop,
      });
      for (const part of ctx) {
        const matrix = regionalTransform(atlas, state, part);
        if (matrix) assert(matrix.elements.every(Number.isFinite));
      }
      const scene = {
        ...state,
        visible: ["skeletal", "muscular", "connective"],
        selected: [],
        hidden: atlas.parts.filter((p) => !ctx.includes(p)).map((p) => p.id),
        isolate: false,
        explode: 0,
        rotate: false,
        reset: 0,
        view: "front",
      };
      const chunks = requiredChunks(atlas, scene);
      assert(
        chunks.every((i) => ctx.some((p) => p.chunk === i)),
        "region hides also constrain requested model chunks",
      );
    }
  }
  const p = freshRegionalCourse(c.id);
  assert(parseRegionalCourse(p));
  assert.deepEqual(regionalCompletion(p).slice(0, 4), [false, false, false, false]);
  const completed = {
    ...p,
    observed: c.structures.map((s) => s.key),
    anatomyAnswers: c.anatomy.map((q) => q.correct),
    checks: c.motion.map((q) => q.correct),
    chainAnswers: c.chain.map((q) => q.correct),
    caseAnswers: c.cases.flatMap((x) => x.questions.map((q) => q.correct)),
  };
  assert(parseRegionalCourse(completed));
  assert(regionalCompletion(completed).slice(0, 4).every(Boolean));
  assert(
    !regionalCompletion({
      ...completed,
      checks: [(c.motion[0].correct + 1) % 3, ...completed.checks.slice(1)],
    })[1],
  );
  for (const bad of [
    { ...p, courseId: "not-a-course" },
    { ...p, examFinished: true },
    { ...p, step: "result" },
    { ...p, checks: [3, null, null] },
    { ...p, observed: ["unknown"] },
    { ...p, examRound: -1 },
    { ...p, caseStage: 3 },
  ])
    assert.equal(parseRegionalCourse(bad), null);
  assert.equal(regionalExamQuestions(p).length, 10);
  assert.equal(new Set(regionalExam(c)).size, 9);
  assert.notDeepEqual(regionalExam(c), regionalExam(c, 1));
  for (const q of regionalBank(c))
    assert(q.options[q.correct] && q.source.url.startsWith("https://") && q.why);
  const route = { lesson: "regional-course", courseId: c.id, courseStep: "case" };
  assert.deepEqual(parseWorkspaceRoute(workspaceHash(route)), route);
  assert.equal(parseWorkspaceRoute(workspaceHash({ lesson: "courses" })).lesson, "courses");
  const a = {
      ...completed,
      exam: [0, null, null, null, null, null, null, null, null, null],
      revision: 4,
    },
    b = { ...p, checks: [null, null, 0], examRound: 1 };
  const merged = mergeRegionalDraft(a, b);
  assert.equal(merged.revision, 4);
  assert.deepEqual(merged.checks, a.checks);
  assert.deepEqual(merged.exam, a.exam);
  assert.equal(merged.examRound, 0);
  assert(parseRegionalCourse(restartRegionalExam(a)));
}
assert.equal(parseWorkspaceRoute("#bolge-dersi?kurs=bad").lesson, "courses");
assert.equal(parseWorkspaceRoute("#diz-dersi?adim=motion").courseStep, "motion");
const db = new DatabaseSync(":memory:");
for (const f of fs
  .readdirSync("drizzle")
  .filter((f) => f.endsWith(".sql"))
  .sort())
  db.exec(fs.readFileSync("drizzle/" + f, "utf8"));
const DB = {
  prepare(sql) {
    const stmt = db.prepare(sql);
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
const api = (body, user = "student") =>
  worker.fetch(
    new Request("https://atlas.test/api/courses", {
      method: body ? "PUT" : "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://atlas.test",
        "oai-authenticated-user-id": user,
        "oai-authenticated-user-email": user + "@test.dev",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
    { DB },
  );
for (const p of [freshKneeCourse(), ...REGIONAL_COURSES.map((c) => freshRegionalCourse(c.id))]) {
  const r = await api(p);
  assert.equal(r.status, 200);
  const saved = (await r.json()).progress;
  assert.equal(saved.courseId, p.courseId);
  assert.equal(saved.revision, 1);
  assert.equal((await api({ ...saved, step: "motion" })).status, 200);
  assert.equal((await api(saved)).status, 409, "stale course writes rejected");
}
let records = (await (await api()).json()).progress;
assert.equal(records.length, 6);
assert.equal((await (await api(undefined, "different")).json()).progress.length, 0);
assert.equal(
  (await api({ ...freshRegionalCourse("hip-foundations"), checks: [100, null, null] })).status,
  400,
);
console.log(
  "PASS: five content banks, bilateral anatomy targets, bounded regional model contexts/transforms, completion and malformed record checks, routes, six independent D1 records, stale writes and account isolation.",
);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const listeners = new Map();
globalThis.window = {
  addEventListener: (k, f) => listeners.set(k, f),
  removeEventListener: (k) => listeners.delete(k),
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
};
globalThis.document = { activeElement: null, addEventListener() {}, removeEventListener() {} };
function storage() {
  const data = new Map();
  return {
    fail: false,
    getItem: (k) => data.get(k) ?? null,
    setItem(k, v) {
      if (this.fail) throw Error("quota");
      data.set(k, v);
    },
    removeItem: (k) => data.delete(k),
    clear: () => data.clear(),
    data,
  };
}
globalThis.sessionStorage = storage();
globalThis.localStorage = storage();
const guestFetch = async (url) =>
  typeof url === "string" && url.startsWith("/models/")
    ? new Response(fs.readFileSync("public" + url))
    : new Response("{}", { status: 401 });
globalThis.fetch = guestFetch;
const text = (n) =>
  typeof n === "string" || typeof n === "number"
    ? String(n)
    : Array.isArray(n)
      ? n.map(text).join("")
      : n?.props
        ? text(n.props.children)
        : "";
async function hook(fn) {
  let value;
  function Probe() {
    value = fn();
    return null;
  }
  let root;
  await act(async () => {
    root = create(React.createElement(Probe));
  });
  return {
    get value() {
      return value;
    },
    root,
  };
}
// Newest record belongs to another module: the original knee hook must choose its own.
globalThis.fetch = async () =>
  new Response(
    JSON.stringify({
      authenticated: true,
      progress: [
        ...records.filter((p) => !parseKneeCourse(p)),
        ...records.filter((p) => parseKneeCourse(p)),
      ],
    }),
  );
const knee = await hook(useKneeCourse);
assert.equal(knee.value.progress.courseId, "knee-foundations");
assert.equal(knee.value.progress.step, "motion");
await act(async () => knee.root.unmount());
const account = await hook(() => useRegionalCourse("hand-foundations"));
assert.equal(account.value.progress.courseId, "hand-foundations");
assert.equal(account.value.progress.step, "motion");
await act(async () => account.root.unmount());
let finish;
globalThis.fetch = () => new Promise((resolve) => (finish = resolve));
const blocked = await hook(() => useRegionalCourse("hip-foundations"));
await act(async () =>
  blocked.value.save({ ...freshRegionalCourse("hip-foundations"), observed: ["femur"] }),
);
assert(!sessionStorage.data.size);
await act(async () => finish(new Response("{}", { status: 503 })));
assert(!blocked.value.canWork);
await act(async () =>
  blocked.value.save({ ...freshRegionalCourse("hip-foundations"), observed: ["femur"] }),
);
assert(!sessionStorage.data.size);
globalThis.fetch = guestFetch;
await act(async () => blocked.value.retry());
assert(blocked.value.canWork);
sessionStorage.fail = true;
await act(async () => blocked.value.save({ ...blocked.value.progress, observed: ["femur"] }));
assert.equal(blocked.value.status, "error");
sessionStorage.fail = false;
await act(async () => blocked.value.retry());
assert.equal(blocked.value.status, "guest");
await act(async () => blocked.root.unmount());
sessionStorage.clear();
for (const c of REGIONAL_COURSES) {
  sessionStorage.setItem(
    regionalDraftKey(c.id),
    JSON.stringify({ ...freshRegionalCourse(c.id), view: "2d" }),
  );
  let root, route;
  const props = { atlas, id: c.id, onStep: (s) => (route = s), onClose() {} };
  await act(async () => {
    root = create(React.createElement(RegionalCourse, props));
  });
  const buttons = () => root.root.findAllByType(Button);
  const click = async (label) => {
    const b = buttons().find((b) => text(b) === label);
    assert(b, "button " + label);
    assert(!b.props.disabled, "enabled " + label);
    await act(async () => b.props.onClick());
  };
  const go = async (title) => {
    const nav = root.root
        .findAllByType("nav")
        .find((n) => n.props["aria-label"] === "Ders adımları"),
      button = nav.findAllByType("button").find((n) => text(n).includes(title));
    assert(button && !button.props.disabled);
    await act(async () => button.props.onClick());
  };
  const answer = async (q) => {
    const section = root.root
        .findAllByType("section")
        .find((n) => n.props.className === "course-question" && text(n).includes(q.prompt)),
      b = section?.findAllByType(Button).find((n) => text(n).endsWith(q.options[q.correct]));
    assert(b && !b.props.disabled, q.prompt);
    await act(async () => b.props.onClick());
  };
  const read = () => JSON.parse(sessionStorage.getItem(regionalDraftKey(c.id)));
  for (const s of c.structures) await click(s.label);
  for (const q of c.anatomy) await answer(q);
  assert(regionalCompletion(read())[0]);
  await click("Sonraki adım");
  assert.equal(route, "motion");
  for (let i = 0; i < 3; i++) {
    await click(c.motions[i].label);
    await answer(c.motion[i]);
  }
  const savedChecks=[...read().checks];
  for(let i=3;i<c.motions.length;i++){
    await click(c.motions[i].label);
    assert.equal(read().motionStop,i);
    assert.equal(root.root.findAll(n=>n.type==='section'&&n.props.className==='course-question').length,0);
    assert.deepEqual(read().checks,savedChecks,'extra anatomical stops preserve the original three checks');
    assert(parseRegionalCourse(read()));
    const projection=root.root.findByType(Projection);
    assert(projection.props.selected.length);
    assert(projection.props.selected.every(id=>regionalParts(atlas,c.motions[i].visualKey,'right').some(p=>p.id===id)));
  }
  assert(regionalCompletion(read())[1]);
  await click("Sonraki adım");
  for (const q of c.chain) await answer(q);
  assert(regionalCompletion(read())[2]);
  await click("Sonraki adım");
  for (let i = 0; i < 2; i++) {
    await click("Vaka " + (i + 1));
    for (let j = 0; j < 3; j++) {
      await click("Karar " + (j + 1));
      await answer(c.cases[i].questions[j]);
    }
  }
  assert(regionalCompletion(read())[3]);
  await click("Sonraki adım");
  assert.equal(route, "exam");
  let projection = root.root.findByType(Projection),
    target = regionalParts(atlas, c.locateKey, "right")[0].id,
    wrong = regionalContext(atlas, c, "right").find((p) => p.id !== target).id;
  await act(async () => projection.props.onSelect(wrong));
  assert.equal(read().exam[0], 1);
  assert(
    !JSON.stringify(root.toJSON()).includes("Bu bağlantıyı tekrar incele."),
    "exam feedback stays hidden",
  );
  await act(async () => projection.props.onSelect(target));
  assert.equal(read().exam[0], 0);
  assert.equal(root.root.findByType(Projection).props.selected[0], target);
  await click("Sonraki soru");
  for (let i = 1; i < 10; i++) {
    await answer(regionalExamQuestions(read())[i]);
    if (i < 9) await click("Sonraki soru");
  }
  await click("Testi bitir");
  assert.equal(route, "result");
  assert(read().examFinished);
  assert(root.root.findAllByType("h3").some((n) => text(n).includes("10 / 10 doğru")));
  await act(async () => root.unmount());
  await act(async () => {
    root = create(React.createElement(RegionalCourse, props));
  });
  assert(
    root.root.findAllByType("h3").some((n) => text(n).includes("10 / 10 doğru")),
    "module result resumes after remount",
  );
  await click("Farklı sorularla tekrar çöz");
  assert.equal(read().examRound, 1);
  assert(read().exam.every((x) => x === null));
  await act(async () => root.unmount());
  console.log(
    "PASS actual UI: " +
      c.title +
      " anatomy → motion → chain → two cases → 10-question exam → result/reload → new round.",
  );
}
assert.equal(sessionStorage.data.size, 5, "each module has its own guest draft");
let root;
await act(async () => {
  root = create(React.createElement(Catalog, { onOpen() {}, onClose() {} }));
});
assert.equal(root.root.findAllByType("article").length, 6);
await act(async () => root.unmount());
await act(async () => {
  root = create(React.createElement(PracticeMenu, { ready: true, onOpen() {}, onCourse() {} }));
});
assert(root.root.findAllByType(Button).some((b) => text(b).includes("Baştan Sona Öğren")));
await act(async () => root.unmount());
db.close();
console.log(
  "PASS: actual guest/account hooks, 503 gating and retry, storage failure recovery, six-module catalog and requested Practice entry. No browser, WebGL or real-device rendering was simulated.",
);
