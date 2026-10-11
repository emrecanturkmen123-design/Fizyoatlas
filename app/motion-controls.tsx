import {Button} from '@/components/ui/button';
import {Slider} from '@/components/ui/slider';
export function motionStep(progress:number,delta:number,maximum=100){return Math.max(0,Math.min(maximum,progress+delta));}
export function MotionControls({progress,playing,onChange,label,maximum=100,increment=10,phases=false}:{progress:number;playing?:boolean;onChange:(next:{progress:number;playing:boolean})=>void;label:string;maximum?:number;increment?:number;phases?:boolean}){
 const go=(p:number)=>onChange({progress:motionStep(p,0,maximum),playing:false});
 return <div className="motion-controls"><Slider aria-label={label} min={0} max={maximum} step={1} value={[progress]} onValueChange={v=>go(Array.isArray(v)?v[0]:v)}/><div className="learning-options"><Button variant="outline" disabled={progress<=0} onClick={()=>go(progress-increment)}>{phases?'Önceki evre':'Önceki adım'}</Button><Button onClick={()=>onChange({progress:progress>=maximum?0:progress,playing:!playing})}>{playing?'Duraklat':phases?'Sırayla göster':'Oynat'}</Button><Button variant="outline" disabled={progress>=maximum} onClick={()=>go(progress+increment)}>{phases?'Sonraki evre':'Sonraki adım'}</Button><Button variant="ghost" onClick={()=>go(0)}>Başa dön</Button></div></div>;
}
