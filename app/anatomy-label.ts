import {clinicalStructure} from './clinical-structures';
import {muscleFor} from './education-data';
const labels:Record<string,string>={scapula:'Scapula · kürek kemiği',clavicle:'Clavicula · köprücük kemiği',humerus:'Humerus · kol kemiği',radius:'Radius',ulna:'Ulna',femur:'Femur · uyluk kemiği',tibia:'Tibia · kaval kemiği',fibula:'Fibula',patella:'Patella · diz kapağı',calcaneus:'Calcaneus · topuk kemiği',talus:'Talus',sacrum:'Sacrum · sakrum',coccyx:'Coccyx · koksiks',heart:'Kalp',lung:'Akciğer',brain:'Beyin',liver:'Karaciğer',kidney:'Böbrek',sternum:'Sternum · göğüs kemiği',pelvis:'Pelvis · leğen kemiği'};
export function anatomyLabel(name:string){
 const side=/\bleft\b/i.test(name)?'Sol':/\bright\b/i.test(name)?'Sağ':'';
 const bare=name.replace(/^(left|right)\s+/i,'').toLowerCase();
 const label=clinicalStructure(name)?.name??muscleFor(name)?.name??labels[bare];
 return label?(side?side+' · ':'')+label:name;
}
