import {lazy,Suspense,useEffect,useRef,type ReactNode} from 'react';
import {Button} from '@/components/ui/button';
export type StudyTab='overview'|'notebook'|'favorites';
const StudyCourseProgress=lazy(()=>import('./study-course-progress'));
export default function StudyHub({tab,onTab,onClose,children}:{tab:StudyTab;onTab:(tab:StudyTab)=>void;onClose:()=>void;children:ReactNode}){
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus();},[tab]);
 return <section className="study-hub glass" aria-label="Çalışmalarım">
  <div className="panel-heading"><h2 ref={heading} tabIndex={-1}>Çalışmalarım</h2><Button variant="ghost" aria-label="Çalışmalarımı kapat" onClick={onClose}>Kapat</Button></div>
  <nav className="study-hub-tabs" aria-label="Çalışmalarım bölümleri">
   {([{id:'overview',label:'Tekrar ve ilerleme',hash:'#calismalarim'},{id:'notebook',label:'Defter',hash:'#defter'},{id:'favorites',label:'Favoriler',hash:'#calismalarim?bolum=favoriler'}] as const).map(x=><a key={x.id} href={x.hash} aria-current={tab===x.id?'page':undefined} onClick={e=>{if(e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();onTab(x.id);}}>{x.label}</a>)}
  </nav>
  <div className="study-hub-content">{children}</div>
  {tab==='overview'&&<Suspense fallback={<p role="status">Ders özetlerin yükleniyor…</p>}><StudyCourseProgress/></Suspense>}
 </section>;
}
