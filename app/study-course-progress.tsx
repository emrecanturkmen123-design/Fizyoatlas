import {Button} from '@/components/ui/button';
import {useCourseOverview} from './use-course-overview';
import {workspaceHash} from './workspace-route';
export default function StudyCourseProgress(){
 const {courses,status,warnings,retry}=useCourseOverview();
 return <section className="hub-courses" aria-label="Bölge derslerim"><h3>Bölge derslerim</h3>
  {status==='loading'?<p role="status">Altı modülün ilerlemesi yükleniyor…</p>:status==='error'?<div role="alert"><p>Ders özetlerin yüklenemedi. Kayıtların korunuyor; yeniden dene.</p><Button variant="outline" onClick={retry}>Ders özetlerini yeniden yükle</Button></div>:<>
   <p className="hub-course-storage">{status==='account'?'Ders ilerlemen hesabında kayıtlı.':'Ders ilerlemen bu sekmede taslak olarak saklanır.'}</p>
   {warnings&&<p role="status">Bazı eski ders kayıtları okunamadı. Okunabilen özetler gösteriliyor.</p>}
   <ul className="hub-course-list">{courses.map(c=><li key={c.id}><div><h4>{c.title}</h4><p>{c.started?`Kaldığın adım: ${c.step}`:'Henüz başlanmadı'}</p><span>{c.done} / 4 ders kontrolü doğru{c.examFinished?` · Bitirme testi: ${c.examCorrect} / 10 doğru`:c.examAnswered?` · Bitirme testi: ${c.examAnswered} / 10 yanıtlandı`:''}</span>{c.needsReview&&<span className="hub-course-review">Yanlış yanıtların tekrar bekliyor.</span>}</div><a className="hub-course-link" href={workspaceHash(c.route)} aria-label={`${c.title} modülü: ${c.started?'kaldığım yerden devam et':'başla'}`}>{c.started?'Devam et':'Başla'}</a></li>)}</ul>
  </>}
 </section>;
}
