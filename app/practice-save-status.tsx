import { Button } from '@/components/ui/button';
import type { LearningController } from './use-learning';

export function PracticeSaveStatus({learning}:{learning:LearningController}) {
  if(!learning.error)return null;
  return <p role="alert">{learning.error} <Button onClick={()=>void learning.retry()} disabled={learning.pending}>Kaydı yeniden dene</Button></p>;
}
