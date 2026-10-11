import {Button} from '@/components/ui/button';

export function MobileReadingButton({expanded,onChange}:{expanded:boolean;onChange:(value:boolean)=>void}){
 return <Button className="mobile-reading-button" variant={expanded?'default':'ghost'} aria-label={expanded?'Model ve bilgiyi birlikte göster':'Bilgi alanını genişlet'} aria-pressed={expanded} onClick={()=>onChange(!expanded)}>{expanded?'Modele dön':'Bilgi'}</Button>;
}
