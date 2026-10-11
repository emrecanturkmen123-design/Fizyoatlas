import { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { Atlas, View } from "./anatomy";
import { decodeModelResponse } from "./model-download";
import {
  findingScene,
  projectFinding,
  pickFinding,
  type FindingMesh,
  type FindingTriangle,
} from "./model-finding";
const cache = new Map<string, Promise<ArrayBuffer>>(),cacheBytes=new Map<string,number>();
export default function FindingProjection({
  atlas,
  id,
  disabled,
  onPick,
  selectedId,
}: {
  atlas: Atlas;
  id: string;
  disabled: boolean;
  selectedId?: string;
  onPick: (id: string) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    triangles = useRef<FindingTriangle[]>([]),
    [meshes, setMeshes] = useState<FindingMesh[]>([]),
    [view, setView] = useState<View>("front"),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [localSelected, setSelected] = useState("");
  const selected = selectedId ?? localSelected;
  const study = useMemo(() => findingScene(atlas, id), [atlas, id]);
  const candidateIds = study?.candidateIds ?? [];
  useEffect(() => {
    let active = true;
    setMeshes([]);
    setError("");
    setSelected("");
    const scene = study;
    if (!scene) {
      setError("Bu yapı için seçilebilir kaynak geometrisi bulunamadı.");
      return;
    }
    setView(scene.view);
    const load = async () => {
      const chunks = await Promise.all(
        [...new Set(scene.parts.map((p) => p.chunk))].map(async (i) => {
          const c = atlas.chunks[i],
            key = c.url + ":" + c.bytes;
          let task = cache.get(key);
          if (!task) {
            task = fetch(c.gzip ?? c.url).then((r) => decodeModelResponse(r, c.bytes, !!c.gzip));
            cache.set(key, task);cacheBytes.set(key,c.bytes);while(cache.size>1&&[...cacheBytes.values()].reduce((a,b)=>a+b,0)>24*1024*1024){const old=cache.keys().next().value!;cache.delete(old);cacheBytes.delete(old);}
            task.catch(() => {cache.delete(key);cacheBytes.delete(key);});
          }
          return [i, await task] as const;
        }),
      );
      if (!active) return;
      const buffers = new Map(chunks);
      setMeshes(
        scene.parts.map((part) => ({
          part,
          positions: new Float32Array(
            buffers.get(part.chunk)!,
            part.positions,
            part.vertexCount * 3,
          ),
          indices: new Uint32Array(buffers.get(part.chunk)!, part.indices, part.indexCount),
        })),
      );
    };
    void load().catch(() => {
      if (active) setError("Model izdüşümü yüklenemedi. Bağlantını kontrol edip yeniden dene.");
    });
    return () => {
      active = false;
    };
  }, [atlas, study, attempt]);
  useEffect(() => {
    const el = canvas.current;
    if (!el || !meshes.length) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    el.width = 600;
    el.height = 420;
    const ts = projectFinding(meshes, view, 600, 420, candidateIds);
    triangles.current = ts;
    ctx.clearRect(0, 0, 600, 420);
    ctx.fillStyle = "#f1f5f4";
    ctx.fillRect(0, 0, 600, 420);
    for (const t of ts.filter((t) => !candidateIds.includes(t.partId))) {
      ctx.fillStyle = t.system === "skeletal" ? "rgba(143,151,139,.16)" : "rgba(158,74,70,.10)";
      ctx.beginPath();
      ctx.moveTo(t.p[0][0], t.p[0][1]);
      ctx.lineTo(t.p[1][0], t.p[1][1]);
      ctx.lineTo(t.p[2][0], t.p[2][1]);
      ctx.closePath();
      ctx.fill();
    }
    for (const t of ts.filter((t) => candidateIds.includes(t.partId))) {
      ctx.fillStyle = t.partId === selected ? "#cb8848" : "#287c85";
      ctx.beginPath();
      ctx.moveTo(t.p[0][0], t.p[0][1]);
      ctx.lineTo(t.p[1][0], t.p[1][1]);
      ctx.lineTo(t.p[2][0], t.p[2][1]);
      ctx.closePath();
      ctx.fill();
    }
    const candidates = meshes.filter((m) => candidateIds.includes(m.part.id));
    candidates.forEach((m, i) => {
      const own = ts.filter((t) => t.partId === m.part.id),
        t = own[Math.floor(own.length / 2)];
      if (!t) return;
      const x = t.p.reduce((n, p) => n + p[0], 0) / 3,
        y = t.p.reduce((n, p) => n + p[1], 0) / 3,
        lx = i % 2 ? 550 : 50,
        ly = 40 + Math.floor(i / 2) * (340 / Math.max(1, Math.ceil(candidates.length / 2) - 1));
      ctx.strokeStyle = "#164e5d";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(lx, ly, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#164e5d";
      ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), lx, ly);
    });
  }, [meshes, view, selected, study]);
  const pick = (partId: string) => {
    if (disabled) return;
    setSelected(partId);
    onPick(partId);
  };
  return (
    <div className="finding-projection">
      <p className="edu-footnote">
        Kaynak modelin 2D izdüşümü · İsimler gizli. İstenen yapıya dokun veya numaralı bölgeyi seç.
        Üç boyutlu görünüm açıksa aynı yapıyı modelden de seçebilirsin.
      </p>
      <div className="learning-options" aria-label="İzdüşüm yönü">
        {(["front", "back", "side"] as View[]).map((v, i) => (
          <Button key={v} variant={view === v ? "default" : "outline"} onClick={() => setView(v)}>
            {["Ön", "Arka", "Yan"][i]}
          </Button>
        ))}
      </div>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <Button onClick={() => setAttempt((a) => a + 1)}>Yeniden dene</Button>
        </div>
      ) : !meshes.length ? (
        <p role="status">Bölge geometrisi yükleniyor…</p>
      ) : (
        <>
          <canvas
            ref={canvas}
            aria-label="İsimleri gizlenmiş anatomik kaynak model izdüşümü"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect(),
                partId = pickFinding(
                  triangles.current,
                  ((e.clientX - r.left) * 600) / r.width,
                  ((e.clientY - r.top) * 420) / r.height,
                  candidateIds,
                );
              if (partId) pick(partId);
            }}
          />
          <div className="finding-regions" aria-label="İzdüşümdeki numaralı yapılar">
            {meshes
              .filter((m) => candidateIds.includes(m.part.id))
              .map((m, i) => (
                <Button
                  key={m.part.id}
                  variant="outline"
                  disabled={disabled}
                  aria-pressed={selected === m.part.id}
                  onClick={() => pick(m.part.id)}
                >
                  {i + 1}. bölge
                </Button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
