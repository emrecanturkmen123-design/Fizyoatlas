import { useEffect, useRef, useState } from "react";
import * as T from "./three-math";
import type { Atlas, Part, View, SceneState } from "./anatomy";
import { decodeModelResponse } from "./model-download";
import { regionalTransform } from "./regional-course-data";
import { pickFinding, type FindingTriangle } from "./model-finding";

import { Button } from "@/components/ui/button";

const chunks = new Map<string, Promise<ArrayBuffer>>(),
  sizes = new Map<string, number>();
type Mesh = { part: Part; positions: Float32Array; indices: Uint32Array };
export default function RegionalCourseProjection({
  atlas,
  parts,
  state,
  disabled = false,
  label,
  selected,
  motion,

  onSelect,
}: {
  atlas: Atlas;
  parts: Part[];
  state: SceneState;
  disabled?: boolean;
  label: string;
  selected: string[];
  motion: boolean;

  onSelect: (id: string) => void;
}) {
  const [meshes, setMeshes] = useState<Mesh[]>([]),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [view, setView] = useState<View>(motion ? "side" : "front");
  const canvas = useRef<HTMLCanvasElement>(null),
    triangles = useRef<FindingTriangle[]>([]),
    ids = parts.map((p) => p.id).join(",");
  useEffect(() => {
    let active = true;
    setMeshes([]);
    setError("");

    void Promise.all(
      parts.map(async (part) => {
        const chunk = atlas.chunks[part.chunk],
          url = chunk.gzip ?? chunk.url;
        let task = chunks.get(url);
        if (!task) {
          task = fetch(url)
            .then((r) => decodeModelResponse(r, chunk.bytes, !!chunk.gzip))
            .catch((e) => {
              chunks.delete(url);
              sizes.delete(url);
              throw e;
            });
          chunks.set(url, task);
          sizes.set(url, chunk.bytes);
          while (
            chunks.size > 1 &&
            [...sizes.values()].reduce((a, b) => a + b, 0) > 24 * 1024 * 1024
          ) {
            const key = chunks.keys().next().value!;
            chunks.delete(key);
            sizes.delete(key);
          }
        }
        const data = await task;
        return {
          part,
          positions: new Float32Array(data, part.positions, part.vertexCount * 3),
          indices: new Uint32Array(data, part.indices, part.indexCount),
        };
      }),
    )
      .then((data) => {
        if (active) setMeshes(data);
      })
      .catch(() => {
        if (active) setError("Kaynak görünüm yüklenemedi. Bağlantını kontrol edip yeniden dene.");
      });
    return () => {
      active = false;
    };
  }, [atlas, ids, attempt]);
  useEffect(() => {
    const el = canvas.current;
    if (!el || !meshes.length) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const w = 720,
      h = 600;
    el.width = w;
    el.height = h;
    const project = (p: T.Vector3) =>
      view === "side" ? [-p.z, p.y, p.x] : view === "back" ? [-p.x, p.y, -p.z] : [p.x, p.y, p.z];
    const visible = meshes.filter((m) => !motion || m.part.system === "skeletal");
    const v = new T.Vector3();
    const projected = visible.map((m) => ({
      mesh: m,
      points: (() => {
        const transform = motion ? regionalTransform(atlas, state, m.part) : undefined;
        return Array.from({ length: m.positions.length / 3 }, (_, i) => {
          v.fromArray(m.positions, i * 3);
          if (transform) v.applyMatrix4(transform);
          return project(v);
        });
      })(),
    }));
    const focused = projected.filter((m) => selected.includes(m.mesh.part.id)),
      all = (focused.length ? focused : projected).flatMap((m) => m.points);
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const p of all) {
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minY = Math.min(minY, p[1]);
      maxY = Math.max(maxY, p[1]);
    }
    const scale = Math.min(
        (w - 96) / Math.max(0.16, maxX - minX),
        (h - 96) / Math.max(0.2, maxY - minY),
      ),
      cx = (maxX + minX) / 2,
      cy = (maxY + minY) / 2;
    const result: FindingTriangle[] = [];
    for (const item of projected) {
      const points = item.points.map((p) => [
        w / 2 + (p[0] - cx) * scale,
        h / 2 - (p[1] - cy) * scale,
        p[2],
      ]);
      for (let i = 0; i < item.mesh.indices.length; i += 3) {
        const p = [
          points[item.mesh.indices[i]],
          points[item.mesh.indices[i + 1]],
          points[item.mesh.indices[i + 2]],
        ];
        result.push({
          partId: item.mesh.part.id,
          system: item.mesh.part.system,
          p,
          depth: (p[0][2] + p[1][2] + p[2][2]) / 3,
        });
      }
    }
    result.sort((a, b) => a.depth - b.depth);
    triangles.current = result;
    ctx.fillStyle = "#f2f3f3";
    ctx.fillRect(0, 0, w, h);
    for (const t of result) {
      const active = selected.includes(t.partId);
      ctx.globalAlpha = selected.length && !active ? 0.22 : 0.95;
      ctx.fillStyle = active
        ? "#176b86"
        : t.system === "muscular"
          ? "#ad6357"
          : t.system === "connective"
            ? "#829f99"
            : "#d8cfb2";
      ctx.beginPath();
      ctx.moveTo(t.p[0][0], t.p[0][1]);
      ctx.lineTo(t.p[1][0], t.p[1][1]);
      ctx.lineTo(t.p[2][0], t.p[2][1]);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [meshes, view, selected.join(","), motion, JSON.stringify(state), atlas]);
  return (
    <div className="course-projection">
      <div className="course-view-options" aria-label="2D bakış yönü">
        {(["front", "back", "side"] as const).map((v, i) => (
          <Button
            key={v}
            disabled={disabled}
            variant={view === v ? "default" : "outline"}
            aria-pressed={view === v}
            onClick={() => setView(v)}
          >
            {["Ön", "Arka", "Yan"][i]}
          </Button>
        ))}
      </div>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <Button variant="outline" onClick={() => setAttempt((a) => a + 1)}>
            Yeniden dene
          </Button>
        </div>
      ) : !meshes.length ? (
        <p role="status">Kaynak yüzeyler yükleniyor…</p>
      ) : (
        <canvas
          ref={canvas}
          aria-label={
            label + " kaynak geometrisinin 2D izdüşümü. Yapı seçimi düğmelerden de yapılabilir."
          }
          onClick={(e) => {
            if (disabled) return;
            const r = e.currentTarget.getBoundingClientRect(),
              id = pickFinding(
                triangles.current,
                ((e.clientX - r.left) * 720) / r.width,
                ((e.clientY - r.top) * 600) / r.height,
              );
            if (id) onSelect(id);
          }}
        />
      )}
      <p className="course-caption">
        {motion
          ? "Kaynak kemik yüzeyleri · yaklaşık sabit eksen · 2D gösterim"
          : "Kaynak anatomi yüzeyleri · 2D izdüşüm"}
      </p>
    </div>
  );
}
