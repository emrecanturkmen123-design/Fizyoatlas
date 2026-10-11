export const TOPICS={all:'Karma test',name:'Yapı tanıma',attachments:'Origo ve insertio',nerve:'İnnervasyon',action:'Hareket ve biyomekanik',clinical:'Klinik akıl yürütme',tendon:'Bağ, tendon ve destek dokuları',locate:'Modelde bul'} as const;
export type Topic=keyof typeof TOPICS;
export function questionTopic(kind:string):Exclude<Topic,'all'>{return (kind==='origin'||kind==='insertion'?'attachments':kind) as Exclude<Topic,'all'>;}
