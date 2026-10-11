export const STUDY_REGIONS={all:'Tüm bölgeler',shoulder:'Omuz ve gövde',elbow:'Dirsek, önkol ve el',hip:'Kalça',knee:'Diz ve uyluk',ankle:'Ayak bileği ve ayak',spine:'Omurga'} as const;
const regions:Record<string,string[]>={
 shoulder:['deltoid','supraspinatus','infraspinatus','subscapularis','teres minor','teres major','serratus anterior','pectoralis major','latissimus dorsi','coracobrachialis'],
 elbow:['biceps brachii','brachialis','brachioradialis','triceps brachii','anconeus','pronator teres','pronator quadratus','supinator','flexor carpi radialis','flexor carpi ulnaris','extensor carpi radialis longus','extensor carpi radialis brevis'],
 ankle:['soleus','gastrocnemius','tibialis anterior','tibialis posterior','fibularis longus','fibularis brevis'],
 hip:['gluteus maximus','gluteus medius','gluteus minimus','iliacus','psoas major','adductor longus','adductor magnus','sartorius','tensor fasciae latae'],
 spine:['multifidus','erector spinae','rectus abdominis','external oblique','internal oblique','transversus abdominis']
};
export function muscleRegion(key:string){return (Object.entries(regions).find(([,keys])=>keys.includes(key))?.[0]??'knee') as Exclude<keyof typeof STUDY_REGIONS,'all'>;}
