import type {SceneState} from './anatomy';
import {muscleFor} from './education-data';
import {SHOULDER_MOVES,oppositeMove} from './shoulder';
import {angleFor} from './shoulder-motion';
import {ELBOW_MOVES,elbowAngle} from './elbow-motion';
import {KNEE_MOVES,kneeAngle} from './knee-motion';
import {LOWER_MOVES,lowerMove,lowerAngle} from './lower-motion';
import {HAND_MOVES,handAngles} from './hand-motion';
import {GAIT_PHASES} from './gait-data';
import {gaitPhase} from './gait-motion';

const limit='Anatomik katkıyı açıklar; görüntü kas aktivasyonu veya kuvvet ölçümü değildir.';
const unique=(keys:readonly string[])=>[...new Set(keys)].filter(key=>!!muscleFor(key));
export function interpretationKeys(s:Partial<SceneState>):string[]{
 if(s.hand?.motion)return unique(HAND_MOVES.find(m=>m.id===s.hand!.id)?.keys??[]);
 if(s.shoulder?.motion){const move=SHOULDER_MOVES.find(m=>m.id===s.shoulder!.id)!;return unique([...move.muscles,...oppositeMove(move).muscles].map(m=>m[0]));}
 if(s.elbow?.motion)return unique([...ELBOW_MOVES.find(m=>m.id===s.elbow!.id)!.keys,...ELBOW_MOVES.flatMap(m=>m.keys)]);
 if(s.knee?.motion)return unique([...KNEE_MOVES.find(m=>m.id===s.knee!.id)!.keys,...KNEE_MOVES.flatMap(m=>m.keys)]);
 if(s.lower?.motion){const m=lowerMove(s.lower);return unique([...m.keys,...lowerMove({...s.lower,id:m.opposite}).keys]);}
 if(s.gait)return unique([...GAIT_PHASES[gaitPhase(s.gait.progress)].keys,...GAIT_PHASES.flatMap(p=>p.keys)]);
 return [];
}
export interface MotionMeaning{title:string;phase:string;position:string;body:string;note:string;source:string}
const phase=(p:number)=>p<=0?'Başlangıç':p>=100?'Son konum':p<34?'Geçişin başı':p<67?'Geçişin ortası':'Geçişin sonu';
const degree=(v:number)=>Math.round(v)+'°';
export function motionMeaning(s:Partial<SceneState>,key:string,name=key):MotionMeaning|undefined{
 const muscle=muscleFor(key);if(!muscle)return;
 const motion=s.hand??s.shoulder??s.elbow??s.knee??s.lower;
 if(s.gait&&!motion){const left=/\bleft\b|\bsol\b/i.test(name),position=(s.gait.progress+(left?50:0))%100,p=GAIT_PHASES[gaitPhase(position)],related=(p.keys as readonly string[]).includes(key);
  const roles:Record<string,string>={
   '0:tibialis anterior':'Ayağı ilk temas için dorsifleksiyonda hazırlamaya katkı verir.',
   '1:tibialis anterior':'İlk temastan sonra ayağın kontrollü inişinde dorsifleksörlerin eksantrik katkısını düşün.',
   '1:rectus femoris':'Quadriceps grubunun yük kabulünde diz bükülmesini kontrol etme katkısına katılır.',
   '1:vastus medialis':'Yük kabulünde diz bükülmesinin kontrolüne quadriceps grubuyla katkı verir.',
   '1:vastus lateralis':'Yük kabulünde diz bükülmesinin kontrolüne quadriceps grubuyla katkı verir.',
   '2:soleus':'Gövde destek ayağının üzerinden ilerlerken tibianın öne ilerlemesini kontrol etmeye katkı verir.',
   '2:gastrocnemius':'Plantar fleksör grubuyla destek ayağı üzerinde ilerleme ve tibianın kontrolüne katkı verir.',
   '2:gluteus medius':'Tek ayak destek sırasında pelvisin kontrolüne katkı verir.',
   '3:soleus':'Topuk yükselirken ön ayak üzerinden ilerlemeye plantar fleksör grubuyla destek verir.',
   '3:gastrocnemius':'Topuk yükselirken ön ayak üzerinden ilerlemeye plantar fleksör grubuyla destek verir.',
   '4:iliacus':'Kalça fleksörleriyle bacağın salınıma geçişine katkı verir.',
   '4:soleus':'Plantar fleksörlerin salınıma geçişteki katkısının bir parçasıdır.',
   '4:gastrocnemius':'Plantar fleksörlerin salınıma geçişteki katkısının bir parçasıdır.',
   '5:iliacus':'Kalça fleksiyonuna katkısıyla bacağın öne taşınmasına yardım eder.',
   '5:tibialis anterior':'Dorsifleksiyon katkısıyla ayağın yerden açıklığına yardım eder.',
   '6:tibialis anterior':'Ayağın yere takılmadan taşınması için dorsifleksiyon konumuna katkı verir.',
   '7:tibialis anterior':'Ayağı bir sonraki ilk temasa hazırlamaya katkı verir.',
   '7:semitendinosus':'Hamstring grubuyla bacağın ileri hareketini yavaşlatmaya katkı verir.',
   '7:semimembranosus':'Hamstring grubuyla bacağın ileri hareketini yavaşlatmaya katkı verir.',
  };
  return {title:'Yürüyüş',phase:(left?'Sol':'Sağ')+' · '+(position===0&&s.gait.progress===100?'Yeni ilk temas':p.name),position:'Bu ayağın döngüsü %'+Math.round(position),body:related?(roles[gaitPhase(position)+':'+key]??p.action):'Bu evrenin öne çıkarılan kas örnekleri arasında yer almıyor. Bu, kasın sessiz veya devre dışı olduğu anlamına gelmez. Genel işlevi: '+muscle.action,note:limit+' Evre katkıları hız ve kişiye göre değişir.',source:'https://now.aapmr.org/biomechanics-normal-gait/'};
 }
 if(!motion?.motion)return;
 const p=Math.max(0,Math.min(100,motion.progress??0)),stage=phase(p);
 let title='',position='',body='',keys:readonly string[]=[],opposite:readonly string[]=[];
 if(s.hand){const h=s.hand,m=HAND_MOVES.find(m=>m.id===h.id)!,a=handAngles(h);title=m.name;keys=m.keys;
  position=m.group==='wrist'?(a.wrist?'Bilek '+degree(Math.abs(a.wrist)): 'Deviasyon '+degree(Math.abs(a.deviation))):m.group==='fingers'?`MCP ${degree(a.mcp)} · PIP ${degree(a.pip)} · DIP ${degree(a.dip)}`:h.id==='thumb-abduction'?'CMC palmar abdüksiyon '+degree(a.thumbAbduction):h.id==='thumb-opposition'?'Birleşik CMC geçişi %'+Math.round(p):`MCP ${degree(a.thumbMcp)} · IP ${degree(a.thumbIp)}`;
  const role:Record<string,string>={
   'flexor digitorum superficialis':h.id==='dip-flexion'?'Orta falanksa tutunduğu için DIP fleksiyonuna doğrudan katkı vermez.':'Orta falanks bağlantısıyla PIP fleksiyonuna; ayrıca MCP fleksiyonuna katkı verir. DIP eklemine doğrudan tutunmaz.',
   'flexor digitorum profundus':'Distal falanksa kadar uzanan tendonuyla DIP fleksiyonuna katkı verir. Parmakların birlikte bükülmesinde PIP ve MCP katkısı da vardır.',
   'extensor digitorum':'Ekstansör genişleme üzerinden başlıca MCP açılmasına katkı verir. IP eklemlerinin açılmasında lumbrikaller ve interosseiler de rol alır.',
   'flexor pollicis longus':'Başparmak distal falanksına tutunur; IP fleksiyonuna kuvvet aktarır. MCP fleksiyonuna da katkı verir.',
   'extensor pollicis longus':'Başparmak distal falanksına ulaşır; IP ekleminin açılmasına katkı verir.',
   'extensor pollicis brevis':'Proksimal falanks bağlantısıyla MCP açılmasına katkı verir. IP eklemine doğrudan tutunmaz.',
   'abductor pollicis brevis':h.id==='thumb-opposition'?'Başparmağı avuç düzleminden uzaklaştırarak birleşik opozisyona yardım eder.':'Başparmağı avuç düzleminden öne uzaklaştırmaya katkı verir.',
   'opponens pollicis':'Birinci metakarpın yönünü ve dönüşünü değiştirerek opozisyona katkı verir; doğrudan IP fleksörü değildir.',
  };
  body=!keys.includes(key)&&!(h.id==='dip-flexion'&&key==='flexor digitorum superficialis')?'Bu hareketin başlıca kas örneklerinden biri değil. Genel işlevi: '+muscle.action:role[key]??`${muscle.name}, ${m.name.toLocaleLowerCase('tr')} yönüne katkı verir. ${muscle.action}`;
 }
 else if(s.shoulder){const m=SHOULDER_MOVES.find(m=>m.id===s.shoulder!.id)!;title='Omuz · '+m.name;position=degree(angleFor(s.shoulder));keys=m.muscles.map(m=>m[0]);opposite=oppositeMove(m).muscles.map(m=>m[0]);
  const part=m.muscles.find(m=>m[0]===key);body=part?`${part[2]} bu hareket yönüne katkı verir. ${['supraspinatus','infraspinatus','subscapularis','teres minor'].includes(key)?'Rotator manşet üyesi olarak humerus başının stabilizasyonuna da katılır.':muscle.action}`:'';
  if(key==='deltoid'&&part){const actual=/clavicular|acromial|spinal/i.exec(name)?.[0]?.toLowerCase();if(actual&&actual!==part[1])body=`Seçili deltoid bölümü ile bu hareket için öne çıkan ${part[2].toLocaleLowerCase('tr')} aynı bölüm değildir. Kart tüm deltoidin görevlerini birlikte açıklar.`;}
 }
 else if(s.elbow){const e=s.elbow,m=ELBOW_MOVES.find(m=>m.id===e.id)!;title='Dirsek/önkol · '+m.name;position=degree(elbowAngle(e));keys=m.keys;opposite=ELBOW_MOVES.find(m=>m.id===({flexion:'extension',extension:'flexion',pronation:'supination',supination:'pronation'}[e.id]))!.keys;
  if(e.contraction){title='Biceps · '+({concentric:'Konsantrik',eccentric:'Eksantrik',isometric:'İzometrik'}[e.contraction]);keys=['biceps brachii'];opposite=[];body=key==='biceps brachii'?e.contraction==='isometric'?'Dirsek 90°’de sabit tutulur. Bu senaryo bicepsin sabit açıdaki yüklenmesini öğretir; gösterimde eklem hareketi yoktur.':e.contraction==='eccentric'?'Dirsek açılırken biceps uzayarak yükü kontrollü bırakma senaryosunu temsil eder. Ekstansiyon görülmesi bicepsin devre dışı kaldığı anlamına gelmez.':'Dirsek bükülürken bicepsin kısalarak yükü kaldırma senaryosu gösterilir.':`Bu kasılma senaryosu biceps için kurulmuştur. ${muscle.name} aktivasyonu bu görüntüden çıkarılamaz. Genel işlevi: ${muscle.action}`;}
  else if(keys.includes(key))body=`${muscle.name}, ${m.name.toLocaleLowerCase('tr')} yönüne katkı verir. ${key==='biceps brachii'?'Radius bağlantısı nedeniyle fleksiyon yanında supinasyona da katkısı vardır.':key==='brachialis'?'Ulna bağlantısıyla önkolun farklı rotasyon konumlarında fleksiyona katkı verir.':muscle.action}`;
 }
 else if(s.knee){const k=s.knee,m=KNEE_MOVES.find(m=>m.id===k.id)!;title='Diz · '+m.name;position='Diz fleksiyon açısı '+degree(kneeAngle(k));keys=m.keys;opposite=KNEE_MOVES.find(m=>m.id!==k.id)!.keys;if(keys.includes(key))body=`${muscle.name}, diz ${m.name.toLocaleLowerCase('tr')} yönüne katkı verir. ${key==='biceps femoris'?'Kısa baş kalçayı geçmez; uzun baş kalça ekstansiyonuna da katkı verir.':key==='rectus femoris'?'Kalçayı da geçtiği için tek eklemli vastuslardan farklı olarak kalça fleksiyonu katkısı vardır.':muscle.action}`;}
 else if(s.lower){const l=s.lower,m=lowerMove(l);title=(l.joint==='hip'?'Kalça':'Ayak bileği')+' · '+m.name;position=(l.id==='adduction'?'Abdüksiyon açısı ':m.name+' ')+degree(lowerAngle(l));keys=m.keys;opposite=lowerMove({...l,id:m.opposite}).keys;if(keys.includes(key))body=`${muscle.name}, ${m.name.toLocaleLowerCase('tr')} yönüne katkı verir. ${key==='gastrocnemius'?'Dizi de geçtiği için diz pozisyonu kasın uzunluk ilişkisini etkiler.':key==='soleus'?'Diz eklemini geçmez; diz açısı üst bağlantısını doğrudan değiştirmez.':l.joint==='hip'&&l.id==='internal'?'Gluteal kasların ön lifleri öne çıkar; bu katkı bütün liflere genellenmez.':muscle.action}`;}
 if(!body)body=opposite.includes(key)?`${muscle.name} karşı yöndeki harekete katkı veren bir kas örneğidir. Kontrollü dönüşte veya yük altında katkısı olabilir; görüntüden gevşek olduğu sonucu çıkarılamaz.`:keys.includes(key)?`${muscle.name} bu hareket yönüne katkı verir. ${muscle.action}`:`Bu hareketin başlıca kas örnekleri arasında yer almıyor. Genel işlevi: ${muscle.action}`;
 const ending=p===0?'Bu kare hareketin başlangıç konumudur. ':p===100?'Gösterim bu konumda tamamlanır. ':'';
 return {title,phase:stage,position,body:ending+body,note:limit,source:muscle.source};
}
