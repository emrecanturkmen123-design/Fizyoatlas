import { buttonVariants } from '@/components/ui/button';
import { workspaceHash, type WorkspaceRoute } from './workspace-route';
import type { ClinicalMode } from './clinical-model';

const sections = [
  { id: 'tests', label: 'Klinik testler', route: { lesson: 'clinical', clinicalMode: 'tests' } },
  { id: 'dermatomes', label: 'Dermatom', route: { lesson: 'clinical', clinicalMode: 'dermatomes' } },
  { id: 'myotomes', label: 'Miyotom', route: { lesson: 'clinical', clinicalMode: 'myotomes' } },
  { id: 'reflexes', label: 'Refleksler', route: { lesson: 'reflexes' } },
  { id: 'measures', label: 'Ölçüm', route: { lesson: 'measures' } },
  { id: 'compare', label: 'Karşılaştırma', route: { lesson: 'neuro-compare' } },
] as const satisfies ReadonlyArray<{ id: ClinicalMode | 'compare' | 'measures' | 'reflexes'; label: string; route: WorkspaceRoute }>;

export function ClinicalLink({ route, children, className }: { route: WorkspaceRoute; children: React.ReactNode; className?: string }) {
  return <a href={workspaceHash(route)} className={buttonVariants({variant:'outline',size:'sm',className})}>{children}</a>;
}

export default function ClinicalNavigation({ active, level, side }: { active: ClinicalMode | 'compare' | 'measures' | 'reflexes'; level?: string; side?: WorkspaceRoute['side'] }) {
  return <nav className="index-tabs clinical-navigation" aria-label="Klinik bölümler">
    {sections.map(({id, label, route}) => {
      const destination: WorkspaceRoute = { ...route };
      if (id === 'myotomes' || id === 'dermatomes') {
        destination.clinicalLevel = level;
        destination.side = side;
      }
      return <a key={id} href={workspaceHash(destination)} aria-current={id === active ? 'page' : undefined}>{label}</a>;
    })}
  </nav>;
}
