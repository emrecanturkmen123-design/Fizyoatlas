import type { Concept } from './anatomy';
import { normalizeSearch, SEARCH_RESULT_LIMIT } from './anatomy-search';
import { levels, sensoryLevels, tests } from './clinical-model';
import { CASE_JOURNEYS } from './case-journeys';
import type { WorkspaceRoute } from './workspace-route';

export type WorkspaceSearchResult = Concept & { route?: WorkspaceRoute; category?: string };

function destination(category: string, name: string, route: WorkspaceRoute, ...aliases: string[]) {
  return { result: { id: category + ':' + name, name, category, route, elements: [] } satisfies WorkspaceSearchResult,
    words: [name, ...aliases].map(normalizeSearch) };
}

const levelAliases = (id: string, description: string) => [
  id, id.replace('–', '-'), description,
];
const caseAliases: Record<string, string[]> = {
  'foot-drop': ['L5', 'düşük ayak', 'fibularis', 'peroneal'],
  'lumbar-foot-drop': ['L5', 'düşük ayak'],
  'ulnar-hand': ['C8', 'T1', 'ulnar sinir', 'küçük parmak'],
};
const destinations = [
  ...tests.map(test => destination('Klinik test', test.title,
    { lesson: 'clinical', clinicalMode: 'tests', clinicalTest: test.id },
    test.focus, test.tag, test.region, ...(test.id === 'slr' ? ['SLR', 'Lasegue', 'Straight leg raise'] : []))),
  ...sensoryLevels.map(level => destination('Dermatom', level.id + ' dermatomu',
    { lesson: 'clinical', clinicalMode: 'dermatomes', clinicalLevel: level.id }, ...levelAliases(level.id, level.sensory))),
  ...levels.map(level => destination('Miyotom', level.id + ' miyotomu',
    { lesson: 'clinical', clinicalMode: 'myotomes', clinicalLevel: level.id }, ...levelAliases(level.id, level.motor ?? ''))),
  ...CASE_JOURNEYS.map(c => destination('Vaka', c.title, { lesson: 'cases', caseId: c.id }, c.region, c.diagnosis, ...(caseAliases[c.id] ?? []))),
  destination('Karşılaştırma', 'L5 ve fibular sinir', { lesson: 'neuro-compare' }, 'L5', 'ayak düşmesi', 'düşük ayak', 'peroneal'),
  destination('Alıştırma', 'Nörolojik uygulama', { lesson: 'neuro-exam' }, 'sinir kas hareket'),
  destination('Dersler', 'Baştan Sona Öğren', { lesson: 'courses' }, 'bölgesel ders omuz diz dirsek el kalça ayak bileği'),
  destination('Ders', 'Diz anatomisi dersi', { lesson: 'knee-course' }, 'diz', 'ön çapraz bağ', 'ÖÇB'),
  destination('Hareket', 'Yürüyüş evreleri', { lesson: 'gait' }, 'yürüme gait'),
  destination('Hareket', 'El ve parmak hareketleri', { lesson: 'hand' }, 'el bileği parmak'),
  destination('Muayene', 'Derin tendon refleksleri', { lesson: 'reflexes' }, 'refleks aşil patellar biseps triseps'),
  destination('Ölçüm', 'Gonyometri · diz fleksiyonu', { lesson: 'measures',compare:'rom' }, 'gonyometri', 'ROM'),
  destination('Ölçüm', 'Manuel kas testi', { lesson: 'measures',compare:'mmt' }, 'MMT'),
  destination('Ölçüm', 'Timed Up and Go', { lesson: 'measures',compare:'tug' }, 'TUG'),
  destination('Ölçüm', '5 Kez Otur-Kalk', { lesson: 'measures',compare:'sts' }, '5xSTS', '5 kez otur kalk'),
  destination('İstasyon', 'Uygulama sınavı', { lesson: 'osce' }, 'OSCE'),
  destination('Karşılaştırma', 'C8–T1 ve ulnar sinir', { lesson: 'neuro-compare',compare:'c8-t1' }, 'C8', 'T1', 'ulnar'),
  destination('Tekrar', 'Çalışmalarım', { lesson: 'learning' }, 'tekrar', 'favoriler', 'ilerleme'),
];

export function workspaceSearch(query: string, anatomy: Concept[]): WorkspaceSearchResult[] {
  const name = normalizeSearch(query);
  if (!name) return anatomy;
  const tokens = name.split(' ');
  const matches = destinations.filter(item => tokens.every(token =>
    item.words.some(label => label.split(' ').some(word => word.startsWith(token)))));
  matches.sort((a,b) => Number(b.words.includes(name)) - Number(a.words.includes(name)));
  return [...matches.filter(x => x.words.includes(name)).map(x => x.result),
    ...anatomy, ...matches.filter(x => !x.words.includes(name)).map(x => x.result)].slice(0, SEARCH_RESULT_LIMIT);
}
