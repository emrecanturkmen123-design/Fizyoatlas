import {Button} from '@/components/ui/button';
import {Disclosure} from './disclosure';
export function MuscleStudyActions({onQuiz,onFind,onCompare,onMotion,onCase,onFavorite,onRetry,favorite,pending,error,compact=false,onSave}:{compact?:boolean;onSave?:()=>void;onQuiz:()=>void;onFind?:()=>void;onCompare?:()=>void;onMotion?:()=>void;onCase?:()=>void;onFavorite:()=>void;onRetry:()=>void;favorite:boolean;pending:boolean;error?:string}){
 return <section className="muscle-study-actions" aria-label="Bu kasla çalış">
  <div className="structure-study-actions">{onMotion&&<Button onClick={onMotion}>Hareketini incele</Button>}</div>
  <Disclosure title={compact?"Çalış":"Bu kasla çalış"}><div className="card-secondary-actions">{onSave&&<Button variant="outline" onClick={onSave}>Deftere kaydet</Button>}<Button variant="outline" onClick={onQuiz}>Bu kası çalış · 5 soru</Button>{onFind&&<Button variant="outline" onClick={onFind}>Model üzerinde sına</Button>}{onCompare&&<Button variant="outline" onClick={onCompare}>Kasları karşılaştır</Button>}{onCase&&<Button variant="outline" onClick={onCase}>İlgili vakaya geç</Button>}<Button variant="outline" disabled={pending} aria-pressed={favorite} onClick={onFavorite}>{pending?'Kaydediliyor…':favorite?'Favorilerden çıkar':'Favorilere ekle'}</Button></div></Disclosure>
  {error&&<div role="alert"><p>{error}</p><Button variant="outline" disabled={pending} onClick={onRetry}>Kaydı yeniden dene</Button></div>}
 </section>;
}
