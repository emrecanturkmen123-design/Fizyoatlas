export const studyPagePath=(kind:'kas'|'yapi',key:string)=>'/ogren/'+kind+'/'+key.replaceAll(' ','-')+'/';

export const clinicalTestPagePath=(id:string)=>'/ogren/klinik-test/'+id.replaceAll('_','-')+'/';
