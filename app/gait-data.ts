// Teaching summaries; phase duration and muscle activity vary with speed and person.
export const GAIT_PHASES=[
 {name:'İlk temas',en:'Initial contact',period:'Basmanın başlangıç olayı',event:'Referans ayak yere değdiğinde döngü başlar.',action:'Ayak bileği bir sonraki yüklenmeye hazırlanır.',keys:['tibialis anterior']},
 {name:'Yüklenme yanıtı',en:'Loading response',period:'Basma · çift destek',event:'İlk temastan karşı ayağın yerden ayrılmasına.',action:'Dorsifleksörler ayağın inişini, quadriceps diz bükülmesini eksantrik kontrol eder.',keys:['tibialis anterior','vastus medialis','vastus lateralis','rectus femoris']},
 {name:'Orta basma',en:'Midstance',period:'Basma · tek destek',event:'Gövde destek ayağının üzerine ilerler.',action:'Plantar fleksörler tibianın ilerlemesini, kalça abdüktörleri pelvisin kontrolünü destekler.',keys:['soleus','gastrocnemius','gluteus medius']},
 {name:'Terminal basma',en:'Terminal stance',period:'Basma · tek destek',event:'Topuk yükselir; evre karşı ayağın temasıyla biter.',action:'Plantar fleksörler ön ayak üzerinden ilerleme sırasında destek sağlar.',keys:['soleus','gastrocnemius']},
 {name:'Salınım öncesi',en:'Pre-swing',period:'Basma · çift destek',event:'Karşı ayak temasından referans ayağın yerden ayrılmasına.',action:'Plantar fleksörlerin ve kalça fleksörlerinin katkısıyla salınıma geçilir.',keys:['soleus','gastrocnemius','iliacus']},
 {name:'İlk salınım',en:'Initial swing',period:'Salınım',event:'Ayak yerden ayrılır; diz bükülerek ayak ilerler.',action:'Kalça fleksörleri ilerlemeye, dorsifleksörler yerden açıklığa katkı verir.',keys:['iliacus','tibialis anterior']},
 {name:'Orta salınım',en:'Midswing',period:'Salınım',event:'Bacak öne taşınır; tibia düşey konuma yaklaşır.',action:'Dorsifleksörler ayağın yere takılmadan taşınmasına yardım eder.',keys:['tibialis anterior']},
 {name:'Terminal salınım',en:'Terminal swing',period:'Salınım',event:'Tibianın düşey konumundan aynı ayağın yeni temasına.',action:'Hamstringler bacağın ilerlemesini yavaşlatır; dorsifleksörler ayağı temasa hazırlar.',keys:['semitendinosus','semimembranosus','tibialis anterior']}
] as const;
export function nextGaitStep(step:number){return Math.min(GAIT_PHASES.length-1,Math.max(0,step)+1);}
