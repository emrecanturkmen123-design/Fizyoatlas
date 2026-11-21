import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { makeStudyBackup, parseStudyBackup, restoreStudyBackup } from './study-backup';

export default function StudyBackupPanel() {
  const [status,setStatus]=useState('');
  const [backup,setBackup]=useState<ReturnType<typeof parseStudyBackup>|null>(null);
  function download(){
    try {
      const value=makeStudyBackup(localStorage);
      if(!Object.keys(value.records).length){setStatus('Bu cihazda henüz yedeklenecek çalışma kaydı yok.');return;}
      const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
      const link=document.createElement('a');
      link.href=url;
      link.download='fizyo-atlas-calisma-yedegi.json';
      link.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      setStatus('Çalışma yedeği hazırlandı.');
    } catch { setStatus('Bu tarayıcı çalışma dosyasını hazırlayamadı.'); }
  }
  async function choose(file:File|undefined){
    setBackup(null);
    if(!file)return;
    try {
      if(file.size>2*1024*1024)throw Error();
      const parsed=parseStudyBackup(await file.text());
      setBackup(parsed);
      setStatus(Object.keys(parsed.records).length+' çalışma kaydı içe aktarılmaya hazır.');
    } catch { setStatus('Geçerli bir Fizyo Atlas çalışma yedeği seç.'); }
  }
  function restore(){
    if(!backup)return;
    try {
      restoreStudyBackup(localStorage,backup);
      location.reload();
    } catch { setStatus('Kayıtlar içe aktarılamadı. Tarayıcının depolama alanını kontrol et.'); }
  }
  return <section className="study-backup">
    <h3>Çalışma yedeği</h3>
    <p>Bu cihazdaki favorileri, cevapları ve ders ilerlemesini bir dosyaya al. Diğer cihazda dosyayı seçerek kayıtları birleştir.</p>
    <Button variant="outline" onClick={download}>Çalışmayı dışa aktar</Button>
    <label>Yedek dosyası<input type="file" accept=".json,application/json" onChange={e=>void choose(e.target.files?.[0])}/></label>
    {status&&<p role="status">{status}</p>}
    {backup&&<Button onClick={restore}>Çalışma kayıtlarını birleştir</Button>}
  </section>;
}
