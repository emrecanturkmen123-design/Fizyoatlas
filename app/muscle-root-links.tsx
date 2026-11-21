import { ClinicalLink } from './clinical-navigation';
import { levels } from './clinical-model';
import { muscleReview } from './muscle-review';
import { innervationRoots } from './myotome-muscles';

const relatedTests:Record<string,{id:string;name:string}>={
  'psoas major':{id:'thomas',name:'Thomas testi'},
  'tensor fasciae latae':{id:'ober',name:'Ober testi'},
};
export default function MuscleRootLinks({ muscleKey, side }: { muscleKey: string; side?: 'left' | 'right' }) {
  const roots = innervationRoots(muscleReview(muscleKey).motorRoots ?? '').filter(id => levels.some(level => level.id === id));
  const test=relatedTests[muscleKey];
  if (!roots.length&&!test) return null;
  return <section className="muscle-lesson-links">
    <h3>İlişkili miyotomlar</h3>
    <div className="clinical-reference-views">
      {roots.map(id => <ClinicalLink key={id} route={{lesson:'clinical',clinicalMode:'myotomes',clinicalLevel:id,clinicalMuscle:muscleKey,side}}>{id} miyotomu</ClinicalLink>)}
      {test&&<ClinicalLink route={{lesson:'clinical',clinicalMode:'tests',clinicalTest:test.id,side}}>{test.name}</ClinicalLink>}
    </div>
  </section>;
}
