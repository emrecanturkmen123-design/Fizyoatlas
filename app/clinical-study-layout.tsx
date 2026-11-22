import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export function ClinicalStudyPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section id="atlas-content" tabIndex={-1} className="case-panel case-reading glass neuro-study clinical-workbench" aria-label={title}>
    <h2>{title}</h2>
    {children}
  </section>;
}

export function StudySplit({ visual, children }: { visual:ReactNode; children:ReactNode }) {
  return <div className="clinical-study-split">
    <div className="clinical-study-visual">{visual}</div>
    <div className="clinical-study-content">{children}</div>
  </div>;
}

export type StudySpot = { id:string; x:number; y:number; label?:string; symbol?:string };

export function SpotButtons({ spots, bounds, selected, correct, disabled, onPick }: {
  spots:readonly StudySpot[]; bounds:readonly [number,number,number,number];
  selected?:string; correct?:string; disabled?:boolean; onPick:(id:string)=>void;
}) {
  const [x,y,width,height]=bounds;
  return <div className="clinical-spot-layer" role="group" aria-label="Şemadaki işaretler">{spots.map((spot,index)=>
    <Button key={spot.id} className="clinical-study-spot" variant="outline"
      aria-label={spot.label??`${index+1}. nokta`} aria-pressed={selected===spot.id}
      data-correct={correct===spot.id||undefined}
      style={{left:`${100*(spot.x-x)/width}%`,top:`${100*(spot.y-y)/height}%`}}
      disabled={!!selected||disabled} onClick={()=>onPick(spot.id)}>{spot.symbol??index+1}</Button>
  )}</div>;
}
