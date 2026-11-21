import { useId, useState, type MouseEvent } from 'react';
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
const framing = { front: '0 0 331 704', back: '331 0 334 704', both: '0 0 665 704' };
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
  const [selection, setSelection] = useState<Selection | null>(null);
  const shown = frame === 'both' ? views : [frame];
  const overlap = selection && selection.levels.length > 1 && selection.levels.includes(level) && selection.side === side
    ? selection
    : null;

  return (
    <figure className={`dermatome-map ${className ?? ''}`} aria-label="Etkileşimli dermatom haritası" data-frame={frame}>
      <div className="dermatome-map-header">
        <h2>Dermatom haritası</h2>
        <div className="dermatome-map-views" aria-label="Harita açısı">
          {(['both', ...views] as const).map(view => (
            <Button key={view} variant={frame === view ? 'default' : 'outline'} aria-pressed={frame === view} onClick={() => setFrame(view)}>
              {labels[view]}
            </Button>
          ))}
        </div>
      </div>
      <div className="dermatome-map-art">
        <svg viewBox={framing[frame]} aria-hidden="true">
          <defs>
            {views.map(view => {
              const useRightHalf = (side === 'left') === (view === 'front');
              const x = useRightHalf ? centers[view] : bounds[view][0];
              const end = useRightHalf ? bounds[view][1] : centers[view];
              return <clipPath key={view} id={`${id}-${view}`}><rect x={x} width={end - x} height="704" /></clipPath>;
            })}
          </defs>
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
        </svg>
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
      <figcaption>
        <a href={source} target="_blank" rel="noreferrer">Goran tek-en</a>
        {' · '}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
        {' · Harita kırpıldı ve etkileşim eklendi.'}
      </figcaption>
    </figure>
  );
}
