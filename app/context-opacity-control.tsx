import {useId} from 'react';
import {Slider} from '@/components/ui/slider';
import {Button} from '@/components/ui/button';

export default function ContextOpacityControl({value,disabled=false,motion=false,onChange,onReveal}:{value:number;disabled?:boolean;motion?:boolean;onChange:(value:number)=>void;onReveal?:()=>void}){
 const id=useId();
 return <div className="context-control">
  <label id={id}>Kas saydamlığı <output>%{Math.round((1-value)*100)}</output></label>
  <Slider aria-labelledby={id} aria-describedby={id+'-hint'} min={0} max={95} step={5} disabled={disabled} value={[Math.round((1-value)*100)]} onValueChange={v=>onChange(1-(Array.isArray(v)?v[0]:v)/100)}/>
  {disabled&&onReveal?<Button variant="outline" onClick={onReveal}>Çevreyi göster</Button>:<div className="context-presets"><Button variant="ghost" disabled={disabled} aria-pressed={value<=.25} onClick={()=>onChange(.2)}>Çevreyi saydamlaştır</Button><Button variant="ghost" disabled={disabled} aria-pressed={value===1} onClick={()=>onChange(1)}>Net göster</Button></div>}
  <p id={id+'-hint'} className="context-hint">{disabled?'Yalnız seçili yapı gösteriliyor; ayarlamak için çevreyi aç.':motion?'Seçili kas net kalır; çevredeki yapıları saydamlaştır.':'Seçili yapı net kalır; çevredeki kasları ve diğer yapıları saydamlaştır.'}</p>
 </div>;
}
