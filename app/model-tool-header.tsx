import {useEffect,useRef} from 'react';
import {X} from 'lucide-react';
import {Button} from '@/components/ui/button';

export default function ModelToolHeader({title,closeLabel,onClose,returnToCard}:{title:string;closeLabel:string;onClose:()=>void;returnToCard:boolean}){
 const titleRef=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{titleRef.current?.focus();},[]);
 return <div className="panel-heading"><h2 ref={titleRef} tabIndex={-1}>{title}</h2><Button variant="ghost" onClick={onClose} aria-label={closeLabel}><span className="tool-return-label">{returnToCard?'Karta dön':'Kapat'}</span><X size={18}/></Button></div>;
}
