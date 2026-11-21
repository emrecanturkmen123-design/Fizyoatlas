import { useId } from 'react';
import { clinicalTestIllustrations } from './clinical-test-illustration-data';

type Props = { testId: string };

export default function ClinicalTestIllustration({ testId }: Props) {
  const arrowId = useId();
  const illustration = clinicalTestIllustrations[testId];
  if (!illustration) return null;

  const hasHands = illustration.drawing.some(item => item.kind === 'hand');
  const hasArrows = illustration.drawing.some(item => item.kind === 'arrow');

  return (
    <figure className="clinical-test-illustration" data-test-illustration={testId}>
      <div className="clinical-test-illustration-art">
        <div className="clinical-test-illustration-view">{illustration.view}</div>
        <svg viewBox="0 0 320 188" aria-hidden="true" focusable="false">
          <defs>
            <marker id={arrowId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
              <path className="clinical-diagram-arrowhead" d="M0 0 8 4 0 8 2 4Z" />
            </marker>
          </defs>
          {illustration.drawing.map((item, index) => {
            if (item.kind === 'limb') {
              return <g key={index} className="clinical-diagram-limb">
                <path d={item.path} strokeWidth={item.width + 2.6} />
                <path d={item.path} strokeWidth={item.width} />
              </g>;
            }

            if ('path' in item) {
              return <path key={index}
                className={'clinical-diagram-' + item.kind}
                d={item.path}
                markerEnd={item.kind === 'arrow' ? `url(#${arrowId})` : undefined} />;
            }

            const transform = `translate(${item.x} ${item.y}) rotate(${item.angle}) scale(${item.scale})`;
            if (item.kind === 'head') {
              return <g key={index} transform={transform}>
                <path className="clinical-diagram-shape" d="M-16-1C-18-16-9-23 2-22Q15-21 18-10L18-5 21 1 17 4 16 11Q11 17 2 16L-5 22-15 17-10 10Q-16 7-16-1Z" />
                <path className="clinical-diagram-detail" d="M-14-7Q-8-12-4-6M9-6h3M-3 0q-5-5-7 0t6 4" />
              </g>;
            }
            if (item.kind === 'front-head' || item.kind === 'back-head') {
              return <g key={index} transform={transform}>
                <path className="clinical-diagram-shape" d="M-16-3C-19-29 18-29 16-3Q22-8 20 3Q19 8 16 8Q14 15 7 16L9 22H-9L-7 16Q-13 15-16 8Q-20 8-20 3Q-22-8-16-3Z" />
                {item.kind === 'front-head'
                  ? <path className="clinical-diagram-detail" d="M-11-3H-7M7-3H11M0-1-2 5H1M-4 9Q0 11 4 9" />
                  : <path className="clinical-diagram-detail" d="M-13 2Q0 12 13 2M-6 16Q0 18 6 16" />}
              </g>;
            }
            if (item.kind === 'hand') {
              return <g key={index} transform={transform}>
                <path className="clinical-diagram-hand" d="M-22-7H-8Q-4-11 1-10L9-9Q13-8 12-6Q12-4 9-4L4-5 13-2Q16-1 15 2Q14 4 10 3L14 5Q16 7 13 9L9 9Q11 12 7 13L-4 10Q-8 9-11 6H-22Z" />
                <path className="clinical-diagram-hand-seams" d="M-13-7V6M6 2l4 1M4 7l5 2" />
              </g>;
            }
            return <g key={index} transform={transform} className="clinical-diagram-target">
              <circle r="8" />
              <circle r="3" />
            </g>;
          })}
        </svg>
        {(hasHands || hasArrows) && (
          <div className="clinical-test-illustration-legend">
            {hasHands && <span data-key="hand">Klinisyenin eli</span>}
            {hasArrows && <span data-key="arrow">Yön</span>}
          </div>
        )}
      </div>
      <figcaption>{illustration.caption}</figcaption>
    </figure>
  );
}
