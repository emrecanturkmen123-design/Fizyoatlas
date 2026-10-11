import {KNEE_CONNECTIVE_KEYS} from './knee-connective-data';
import {NERVES,nerveParts,sideOf} from './innervation';
import {DISTAL_STUDIES} from './distal-tendons';
import type {Atlas,View} from './anatomy';
import {tendonContextParts} from './tendon-context';
import {clinicalStructure} from './clinical-structures';
import {tendonParts} from './tendon-model';
export type ConnectiveSide='right'|'left';
type Study={bones:string[];view:View;muscles?:string[];neighbors?:string[];nerve?:string;caseId?:string;caseLabel?:string;motion?:'achilles'|'knee'|'elbow-flexion'|'abduction'|'external'|'internal'};
export const CONNECTIVE_STUDIES:Record<string,Study>={
 ...Object.fromEntries(KNEE_CONNECTIVE_KEYS.map(key=>[key,{bones:['femur','tibia',...(key==='lateral collateral ligament'?['fibula']:[])],view:key==='posterior cruciate ligament'?'back':'front'} as Study])),
 ...Object.fromEntries(DISTAL_STUDIES.map(s=>[s.key,{bones:s.bones,muscles:s.muscles,view:s.key.includes('extensor')?'back':'front'} as Study])),
 'calcaneal tendon':{bones:['calcaneus','tibia','fibula','talus'],view:'back',caseId:'achilles',caseLabel:'Koşu sonrası Aşil ağrısı',motion:'achilles'},
 'quadriceps tendon':{bones:['patella','femur','tibia'],muscles:['rectus femoris','vastus lateralis','vastus medialis','vastus intermedius'],view:'front',motion:'knee'},
 'patellar ligament':{bones:['patella','tibia','femur'],view:'front',motion:'knee',caseId:'patellar-tendon',caseLabel:'Sıçramayla artan patellar tendon ağrısı'},
 'biceps distal tendon':{bones:['humerus','radius','ulna'],muscles:['biceps brachii'],view:'front',motion:'elbow-flexion'},
 'biceps long head tendon':{bones:['scapula','humerus'],muscles:['long head of {side} biceps brachii'],view:'front',motion:'elbow-flexion',caseId:'biceps-tendon',caseLabel:'Yük kaldırırken ön omuz ağrısı'},
 'common extensor tendon':{bones:['humerus','radius','ulna'],muscles:['extensor carpi radialis brevis','extensor digitorum','extensor digiti minimi','extensor carpi ulnaris'],view:'back',caseId:'lateral-elbow',caseLabel:'Kavramayla artan dirsek ağrısı'},
 'anterior cruciate ligament':{bones:['femur','tibia'],view:'front',caseId:'acl-rehab',caseLabel:'ÖÇB ameliyatı sonrası sahaya dönüş'},
 'anterior talofibular ligament':{bones:['fibula','talus','calcaneus','tibia'],view:'three-quarter',caseId:'ankle-sprain',caseLabel:'Lateral ayak bileği burkulması'},
 'calcaneofibular ligament':{bones:['fibula','calcaneus','talus','tibia'],view:'three-quarter',caseId:'ankle-sprain',caseLabel:'Lateral ayak bileği burkulması'},
 'posterior talofibular ligament':{bones:['fibula','talus','calcaneus','tibia'],view:'back',caseId:'ankle-sprain',caseLabel:'Lateral ayak bileği burkulması'},
 ...Object.fromEntries(['infraspinatus tendon','supraspinatus tendon insertion surface','subscapularis tendon insertion surface','teres minor tendon insertion surface'].map(key=>[key,{bones:['humerus','scapula','clavicle'],view:key.startsWith('subscapularis')?'front':'back',caseId:'rotator-cuff',caseLabel:'Rotator manşet ilişkili omuz ağrısı',motion:key.startsWith('subscapularis')?'internal':key.startsWith('supraspinatus')?'abduction':'external'} as Study])),
};
const support:Record<string,Pick<Study,'neighbors'|'nerve'>>={
 'wrist flexor retinaculum':{neighbors:['flexor digitorum profundus tendon','flexor digitorum superficialis tendon','flexor pollicis longus tendon'],nerve:'median'},
 'wrist extensor retinaculum':{neighbors:['extensor digitorum tendon','extensor pollicis longus tendon']},
 'digital fibrous sheath':{neighbors:['flexor digitorum profundus tendon','flexor digitorum superficialis tendon']},
 'digital synovial sheath':{neighbors:['flexor digitorum profundus tendon','flexor digitorum superficialis tendon']},
 'common flexor tendon sheath':{neighbors:['flexor digitorum profundus tendon','flexor digitorum superficialis tendon']},
 'ankle flexor retinaculum':{neighbors:['tibialis posterior tendon'],nerve:'tibial'},
 'ankle extensor retinacula':{neighbors:['tibialis anterior tendon']},
 'fibular retinacula':{neighbors:['fibularis longus tendon','fibularis brevis tendon']},
 'tibialis tendon sheaths':{neighbors:['tibialis anterior tendon','tibialis posterior tendon']},
 'fibular tendon sheaths':{neighbors:['fibularis longus tendon','fibularis brevis tendon']},
};
for(const [key,neighbors] of Object.entries(support))Object.assign(CONNECTIVE_STUDIES[key],neighbors);
export function connectiveSelection(atlas:Atlas,key:string,side:ConnectiveSide){
 const study=CONNECTIVE_STUDIES[key];
 const structures=tendonParts(atlas,key,side).map(p=>p.id);
 const distal=DISTAL_STUDIES.find(s=>s.key===key);
 const bones=atlas.parts.filter(p=>p.system==='skeletal'&&(study.bones.some(b=>p.name.toLowerCase()===`${side} ${b}`)||distal&&sideOf(p.name)===side&&/phalanx/.test(p.name.toLowerCase())&&(distal.module==='hand'?/finger|thumb/.test(p.name.toLowerCase()):/toe/.test(p.name.toLowerCase())))).map(p=>p.id);
 const muscles=atlas.parts.filter(p=>p.system==='muscular'&&new RegExp(`\\b${side}\\b`,'i').test(p.name)&&study.muscles?.some(key=>(key==='biceps brachii'?p.name.toLowerCase().includes('biceps brachii'):p.name.toLowerCase().replace(/ muscle$/,'').endsWith(key.replace('{side}',side))))).map(p=>p.id);
 const neighbors=(study.neighbors??[]).flatMap(k=>tendonParts(atlas,k,side).map(p=>p.id));const nerve=study.nerve?NERVES.find(n=>n.id===study.nerve):undefined;const nerves=nerve?nerveParts(atlas,nerve,side).filter(p=>{const y=(p.bounds[0][1]+p.bounds[1][1])/2;return distal?.module==='hand'?y<1.15&&y>.55:y<.5;}).map(p=>p.id):[];
 const context=[...new Set([...bones,...muscles,...neighbors,...nerves,...tendonContextParts(atlas,structures)])];
 // Context-only cards select real related anatomy without claiming a tendon mesh.
 const selected=structures.length?structures:muscles.length?muscles:bones;
 return {study,structures,selected,context,hidden:atlas.parts.filter(p=>![...selected,...context].includes(p.id)).map(p=>p.id)};
}
export function selectedConnectiveSide(atlas:Atlas,ids:string[],fallback:ConnectiveSide='right'):ConnectiveSide{
 const p=atlas.parts.find(p=>ids.includes(p.id)&&p.system==='connective'&&clinicalStructure(p.name))??atlas.parts.find(p=>ids.includes(p.id));
 return /\bleft\b/i.test(p?.name??'')?'left':/\bright\b/i.test(p?.name??'')?'right':fallback;
}
