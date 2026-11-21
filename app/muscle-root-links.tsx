import { ClinicalLink } from './clinical-navigation';
import { levels } from './clinical-model';
import { muscleReview } from './muscle-review';
import { innervationRoots } from './myotome-muscles';

export default function MuscleRootLinks({ muscleKey, side }: { muscleKey: string; side?: 'left' | 'right' }) {
  const roots = innervationRoots(muscleReview(muscleKey).roots ?? '').filter(id => levels.some(level => level.id === id));
  if (!roots.length) return null;
  return <section className="muscle-lesson-links">
    <h3>İlişkili miyotomlar</h3>
    <div className="clinical-reference-views">
      {roots.map(id => <ClinicalLink key={id} route={{lesson:'clinical',clinicalMode:'myotomes',clinicalLevel:id,clinicalMuscle:muscleKey,side}}>{id} miyotomu</ClinicalLink>)}
    </div>
  </section>;
}
