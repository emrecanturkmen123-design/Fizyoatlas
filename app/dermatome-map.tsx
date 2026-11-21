import { useEffect, useId, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClinicalSide } from './clinical-model';
import regions from './dermatome-map-regions.json';

export type MapView = 'front' | 'back';
type Framing = MapView | 'both';
type Area = { levels: string[]; offset: number[]; profile?: boolean; path: string };
type Selection = { levels: string[]; view: MapView; side: ClinicalSide };
type Props = {
  className?: string;
  initialFrame: Framing;
  level: string;
  side: ClinicalSide;
  onPick: (level: string, side: ClinicalSide, view: MapView) => void;
};

const views: MapView[] = ['front', 'back'];
const labels = { front: 'Ön', back: 'Arka', both: 'Ön ve arka' } as const;
const framing = { front: { x: 0, width: 331 }, back: { x: 331, width: 334 }, both: { x: 0, width: 665 } };
const mapHeight = 704;
const zoomLevels = [1, 1.25, 1.5, 2, 2.5, 3];
type Camera = { step: number; x: number; y: number };
const initialCamera: Camera = { step: 0, x: 0, y: 0 };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function viewport(frame: Framing, step: number, aspect: number) {
  const box = framing[frame];
  const ratio = aspect || box.width / mapHeight;
  const zoom = zoomLevels[step];
  const width = Math.max(box.width, mapHeight * ratio) / zoom;
  const height = Math.max(mapHeight, box.width / ratio) / zoom;
  return { width, height, x: (box.width - width) / 2, y: (mapHeight - height) / 2 };
}

function constrain(frame: Framing, camera: Camera): Camera {
  if (camera.step === 0) return initialCamera;
  // Allow panning to the edge, while keeping the camera center over the artwork.
  const x = framing[frame].width / 2;
  const y = mapHeight / 2;
  return { ...camera, x: clamp(camera.x, -x, x), y: clamp(camera.y, -y, y) };
}

type ZoomAnchor = { x: number; y: number };
const center: ZoomAnchor = { x: .5, y: .5 };

function zoomAt(frame: Framing, camera: Camera, aspect: number, delta: number, target: ZoomAnchor): Camera {
  const current = constrain(frame, camera);
  const step = clamp(current.step + delta, 0, zoomLevels.length - 1);
  if (step === current.step) return current;
  const previous = viewport(frame, current.step, aspect);
  const next = viewport(frame, step, aspect);
  return constrain(frame, {
    step,
    x: current.x + (target.x - .5) * (previous.width - next.width),
    y: current.y + (target.y - .5) * (previous.height - next.height),
  });
}

function zoomAnchor(bounds: DOMRect, clientX: number, clientY: number): ZoomAnchor {
  return {
    x: clamp((clientX - bounds.left) / bounds.width, 0, 1),
    y: clamp((clientY - bounds.top) / bounds.height, 0, 1),
  };
}

type Drag = { pointer: number; x: number; y: number; scale: number; camera: Camera; moved: boolean };
const source = 'https://commons.wikimedia.org/wiki/File:Dermatomes_labeled,_female_front-back_3d-shaded.svg';
const illustration = '/clinical/dermatom-map.png';
const centers = { front: 166, back: 500 };
const bounds = { front: [0, 331], back: [331, 665] };

function clickedSide(event: MouseEvent<SVGPathElement>, view: MapView, area: Area): ClinicalSide {
  if (area.profile) return 'right';
  const svg = event.currentTarget.ownerSVGElement;
  const frame = svg?.getScreenCTM();
  if (!frame) return 'right';
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(frame.inverse());
  const rightHalf = point.x >= centers[view];
  return rightHalf === (view === 'front') ? 'left' : 'right';
}

export default function DermatomeMap({ className, initialFrame, level, side, onPick }: Props) {
  const id = useId();
  const [frame, setFrame] = useState<Framing>(initialFrame);
  const [camera, setCamera] = useState(initialCamera);
  const dragStart = useRef<Drag | null>(null);
  const lastTarget = useRef<ZoomAnchor>(center);
  const art = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(0);
  useEffect(() => {
    const element = art.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setAspect(width / height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const zoom = zoomLevels[camera.step];
  const shownCamera = constrain(frame, camera);
  const window = viewport(frame, camera.step, aspect);
  const windowX = framing[frame].x + window.x + shownCamera.x;
  const windowY = window.y + shownCamera.y;
  const clipX = Math.max(framing[frame].x, windowX);
  const clipRight = Math.min(framing[frame].x + framing[frame].width, windowX + window.width);
  const clipId = id + '-window';
  const [selection, setSelection] = useState<Selection | null>(null);
  const shown = frame === 'both' ? views : [frame];
  const overlap = selection && selection.levels.length > 1 && selection.levels.includes(level) && selection.side === side
    ? selection
    : null;

  useEffect(() => {
    const element = art.current;
    if (!element) return;
    let previous = -Infinity;
    let previousDirection = 0;
    const wheel = (event: WheelEvent) => {
      if (!event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;
      if (direction === previousDirection && event.timeStamp - previous < 100) return;
      previous = event.timeStamp;
      previousDirection = direction;
      const target = zoomAnchor(element.getBoundingClientRect(), event.clientX, event.clientY);
      lastTarget.current = target;
      setCamera(current => zoomAt(frame, current, aspect, direction, target));
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [frame, aspect]);

  const changeZoom = (delta: number) => {
    const target = lastTarget.current;
    setCamera(current => zoomAt(frame, current, aspect, delta, target));
  };

  const resetZoom = () => {
    lastTarget.current = center;
    setCamera(initialCamera);
  };
  const startDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    dragStart.current = null;
    lastTarget.current = zoomAnchor(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
    if (zoom === 1) return;
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix?.a) return;
    dragStart.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, scale: Math.abs(matrix.a), camera: shownCamera, moved: false };
  };
  const moveDrag = (event: PointerEvent<SVGSVGElement>) => {
    const start = dragStart.current;
    if (!start || start.pointer !== event.pointerId || !event.buttons) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved) {
      if (Math.hypot(dx, dy) < 5) return;
      start.moved = true;
      lastTarget.current = center;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setCamera(constrain(frame, { ...start.camera, x: start.camera.x - dx / start.scale, y: start.camera.y - dy / start.scale }));
  };

  return (
    <figure className={`dermatome-map ${className ?? ''}`} aria-label="Etkileşimli dermatom haritası" data-frame={frame}>
      <div className="dermatome-map-header">
        <h2>Dermatom haritası</h2>
        <div className="dermatome-map-views" aria-label="Harita açısı">
          {(['both', ...views] as const).map(view => (
            <Button key={view} variant={frame === view ? 'default' : 'outline'} aria-pressed={frame === view} onClick={() => { if (frame !== view) { setFrame(view); resetZoom(); } }}>
              {labels[view]}
            </Button>
          ))}
        </div>
      </div>
      <div ref={art} className="dermatome-map-art" data-zoomed={zoom > 1}
        aria-label="Dermatom haritası. Bir noktaya dokunup + veya − kullan ya da fare tekerleğini çevir."
        role="region" tabIndex={zoom > 1 ? 0 : undefined}
        onKeyDown={event => {
          if (zoom === 1) return;
          const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
          const move = moves[event.key];
          if (!move) return;
          event.preventDefault();
          setCamera(constrain(frame, { ...shownCamera, x: shownCamera.x + move[0] * 30, y: shownCamera.y + move[1] * 30 }));
        }}>
        <svg viewBox={`${windowX} ${windowY} ${window.width} ${window.height}`} aria-hidden="true"
          onPointerDown={startDrag} onPointerMove={moveDrag} onPointerCancel={() => { dragStart.current = null; }}>
          <defs>
            <clipPath id={clipId}><rect x={clipX} y={Math.max(0, windowY)} width={clipRight - clipX} height={Math.min(mapHeight, windowY + window.height) - Math.max(0, windowY)} /></clipPath>
            {views.map(view => {
              const useRightHalf = (side === 'left') === (view === 'front');
              const x = useRightHalf ? centers[view] : bounds[view][0];
              const end = useRightHalf ? bounds[view][1] : centers[view];
              return <clipPath key={view} id={`${id}-${view}`}><rect x={x} width={end - x} height="704" /></clipPath>;
            })}
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <image href={illustration} width="665" height="704" />
            {shown.map(view => (
              <g key={view} data-map-view={view}>
                {(regions[view] as Area[]).map((area, index) => {
                  const selected = area.levels.includes(level) && (!area.profile || side === 'right');
                  const transform = `${regions.sourceTransform} translate(${area.offset.join(' ')})`;
                  return (
                    <g key={index}>
                      {selected && (
                        <g clipPath={area.profile ? undefined : `url(#${id}-${view})`}>
                          <path className="dermatome-map-highlight" d={area.path} transform={transform} vectorEffect="non-scaling-stroke" />
                        </g>
                      )}
                      <path className="dermatome-map-area" d={area.path} transform={transform}
                        vectorEffect="non-scaling-stroke" data-roots={area.levels.join(' ')}
                        onClick={event => {
                          if (dragStart.current?.moved) return;
                          const side = clickedSide(event, view, area);
                          const next = area.levels.includes(level) ? level : area.levels[0];
                          setSelection({ levels: area.levels, view, side });
                          onPick(next, side, view);
                        }}>
                        <title>{area.levels.join(' / ')}</title>
                      </path>
                    </g>
                  );
                })}
              </g>
            ))}
          </g>
        </svg>
      </div>
      <div className="dermatome-map-status">
        <div className="dermatome-map-zoom" role="group" aria-label="Harita yakınlaştırma">
          <Button type="button" variant="outline" size="icon-sm" onClick={() => changeZoom(-1)} disabled={!camera.step}
            aria-label="Uzaklaştır" title="Uzaklaştır"><Minus size={17} /></Button>
          <output aria-label="Yakınlaştırma düzeyi">{Math.round(zoom * 100)}%</output>
          <Button type="button" variant="outline" size="icon-sm" onClick={() => changeZoom(1)} disabled={camera.step === zoomLevels.length - 1}
            aria-label="Yakınlaştır" title="Yakınlaştır"><Plus size={17} /></Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={resetZoom} disabled={!camera.step}
            aria-label="Yakınlaştırmayı sıfırla" title="Yakınlaştırmayı sıfırla"><RotateCcw size={16} /></Button>
        </div>
        <div className="dermatome-map-selection" aria-live="polite">
          {overlap ? (
            <div className="dermatome-map-overlap">
              <span>Örtüşen alan</span>
              {overlap.levels.map(root => (
                <Button key={root} variant={root === level ? 'default' : 'outline'} aria-pressed={root === level}
                  onClick={() => onPick(root, overlap.side, overlap.view)}>
                  {root}
                </Button>
              ))}
            </div>
          ) : <strong>{level} · {side === 'left' ? 'Sol' : 'Sağ'}</strong>}
        </div>
      </div>
      <figcaption>
        <span className="dermatome-map-zoom-hint">Bir noktaya dokun, ardından + veya − kullan. Fare tekerleği imlecin olduğu yeri yakınlaştırır.</span>
        <a href={source} target="_blank" rel="noreferrer">Goran tek-en</a>
        {' · '}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
        {' · Harita kırpıldı ve etkileşim eklendi.'}
      </figcaption>
    </figure>
  );
}
