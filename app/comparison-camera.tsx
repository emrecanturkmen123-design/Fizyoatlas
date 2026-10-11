import {useId} from 'react';
import {Button} from '@/components/ui/button';

export default function ComparisonCamera({yaw,pitch,zoom,context,onYaw,onPitch,onZoom,onContext,onReset}:{
 yaw:number;pitch:number;zoom:number;context:boolean;
 onYaw:(value:number)=>void;onPitch:(value:number)=>void;onZoom:(value:number)=>void;
 onContext:(value:boolean)=>void;onReset:()=>void;
}){
 const id=useId();
 const controls=[
  {key:'yaw',label:'Dönüş',aria:'Ortak kamera dönüşü',value:yaw,min:-180,max:180,step:1,text:`${yaw}°`,spoken:`${yaw} derece`,change:onYaw},
  {key:'pitch',label:'Eğim',aria:'Ortak kamera eğimi',value:pitch,min:-80,max:80,step:1,text:`${pitch}°`,spoken:`${pitch} derece`,change:onPitch},
  {key:'zoom',label:'Yakınlık',aria:'Ortak kamera yakınlığı',value:zoom,min:.5,max:2,step:.05,text:`${zoom.toFixed(2)}×`,spoken:`${zoom.toFixed(2)} kat`,change:onZoom},
 ];
 return <aside className="lab-camera-bar" aria-label="Ortak kamera ayarları">
  <h3 className="lab-camera-title">Kamera</h3>
  <div className="lab-camera-sliders">{controls.map(c=><div className="lab-camera-control" key={c.key}>
   <label htmlFor={id+'-'+c.key}><span>{c.label}</span><output htmlFor={id+'-'+c.key}>{c.text}</output></label>
   <input id={id+'-'+c.key} aria-label={c.aria} aria-valuetext={c.spoken} type="range" min={c.min} max={c.max} step={c.step} value={c.value} onChange={e=>c.change(Number(e.target.value))}/>
  </div>)}</div>
  <div className="lab-camera-tools"><label className="lab-camera-context"><input type="checkbox" checked={context} onChange={e=>onContext(e.target.checked)}/><span>Çevre yapıları göster</span></label>
   <Button variant="outline" onClick={onReset}>Kamerayı sıfırla</Button>
  </div>
 </aside>;
}
