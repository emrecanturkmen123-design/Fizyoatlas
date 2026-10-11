import {useState,useId} from 'react';
import {Button} from '@/components/ui/button';
import {muscleLessons,type MuscleLesson} from './muscle-lessons';
export default function MuscleMovementLinks({name,onOpen}:{name:string;onOpen:(link:MuscleLesson)=>void}){
 const links=muscleLessons(name),[expanded,setExpanded]=useState(false),id=useId();if(!links.length)return null;
 return <div className="muscle-lesson-links"><Button variant="ghost" onClick={()=>onOpen(links[0])}>Hareketini incele · {links[0].label} →</Button>{links.length>1&&<><Button className="muscle-other-movements" variant="ghost" aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(v=>!v)}>{expanded?'Diğer hareketleri kapat':`Diğer hareketler (${links.length-1})`}</Button>{expanded&&<div id={id} className="muscle-more-movements">{links.slice(1).map(link=><Button key={link.lesson+link.id} variant="ghost" onClick={()=>onOpen(link)}>{link.label} →</Button>)}</div>}</>}</div>;
}
