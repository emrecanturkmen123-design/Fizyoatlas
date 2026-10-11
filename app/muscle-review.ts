// Individually cross-checked against UW Muscle Atlas on 2026-09-14.
const uw='https://rad.uw.edu/muscle-atlas/';
const roots:Record<string,string>={
'gluteus minimus':'L4–S1','tibialis posterior':'L4–L5','fibularis longus':'L5–S2','fibularis brevis':'L5–S2','flexor carpi radialis':'C6–C7','flexor carpi ulnaris':'C7–T1','extensor carpi radialis longus':'C6–C7','extensor carpi radialis brevis':'C7–C8','gluteus maximus':'L5–S2','iliacus':'L2–L4','adductor longus':'L2–L4','soleus':'S1–S2','teres minor':'C5–C6','subscapularis':'C5–C7','teres major':'C6–C7','coracobrachialis':'C5–C7','pectoralis major':'Klaviküler baş C5–C6; sternokostal baş C7–T1','latissimus dorsi':'C6–C8','deltoid':'C5–C6','supraspinatus':'C4–C6','infraspinatus':'C5–C6','serratus anterior':'C5–C7','gluteus medius':'L4–S1','rectus femoris':'L2–L4','tibialis anterior':'L4–S1','gastrocnemius':'S1–S2','biceps brachii':'C5–C6','brachialis':'C5–C6','brachioradialis':'C5–C7','triceps brachii':'C6–C8','anconeus':'C7–T1','pronator teres':'C6–C7','pronator quadratus':'C8–T1','supinator':'C5–C6','vastus lateralis':'L2–L4','vastus medialis':'L2–L4','vastus intermedius':'L2–L4','semitendinosus':'L5–S2','semimembranosus':'L5–S2','biceps femoris':'L5–S2 · her iki baş'
};
const notes:Record<string,string>={
subscapularis:'UW kas atlası C5–C7 verir; UAMS subscapular sinir tablosunda C5–C6 bulunur.',
'teres major':'UW kas atlası C6–C7 verir; UAMS alt subscapular sinir için C5–C6 bildirir.',
'latissimus dorsi':'UW kas atlası C6–C8 verir; UAMS thoracodorsal sinir tablosunda C7–C8 bulunur.',
supraspinatus:'UW kas atlası C4–C6 verir; UAMS suprascapular sinir tablosunda C5–C6 bulunur.',
'tibialis anterior':'UW kaynağının L4–S1 aralığı kullanılmıştır. Baskın klinik miyotomla aynı şey değildir.',
iliacus:'Kaynak iliopsoas kompleksini ele alır. Bazı atlaslar iliacus için L2–L3 verir; burada L2–L4 katkı aralığı kullanılır.'
};
export function muscleReview(key:string){
const source=uw+(key==='biceps femoris'?'biceps-femoris-long-head':key.replace('fibularis','peroneus').replaceAll(' ','-'));
const rootSource=key==='iliacus'?'https://www.ncbi.nlm.nih.gov/books/NBK531508/':['adductor longus','rectus femoris','vastus lateralis','vastus medialis','vastus intermedius'].includes(key)?'https://www.ncbi.nlm.nih.gov/books/NBK482445/':['semitendinosus','semimembranosus','biceps femoris'].includes(key)?'https://pmc.ncbi.nlm.nih.gov/articles/PMC4223289/':source;
return {roots:roots[key],source,rootSource,note:notes[key],reviewed:['gluteus minimus','tibialis posterior','fibularis longus','fibularis brevis','flexor carpi radialis','flexor carpi ulnaris','extensor carpi radialis longus','extensor carpi radialis brevis'].includes(key)?'30 Eylül 2026':'14 Eylül 2026'};
}
