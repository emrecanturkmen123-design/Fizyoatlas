import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {AlertDialog,AlertDialogContent,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel} from '@/components/ui/alert-dialog';
import type {LearningController} from './use-learning';

export default function LearningReset({learning}:{learning:LearningController}){
 const [open,setOpen]=useState(false),[done,setDone]=useState(false);
 const disabled=learning.loading||learning.pending||!learning.canWork||learning.retryPending||!learning.data.answers.length&&!learning.data.history?.length;
 const reset=async()=>{setDone(false);if(await learning.reset()){setOpen(false);setDone(true);}};
 return <div className="learning-reset">
  <div><strong>Soru kayıtları</strong><p>Yeni bir başlangıç için yanıt geçmişini ve tekrar planını sıfırla.</p></div>
  <Button variant="outline" disabled={disabled} onClick={()=>{setDone(false);setOpen(true);}}>Soru kayıtlarını sıfırla</Button>
  {done&&<p className="learning-reset-status" role="status">Soru kayıtların sıfırlandı.</p>}
  <AlertDialog open={open} onOpenChange={next=>{if(!learning.pending)setOpen(next);}}>
   <AlertDialogContent className="learning-reset-dialog">
    <AlertDialogTitle>Soru kayıtların sıfırlansın mı?</AlertDialogTitle>
    <AlertDialogDescription>{learning.data.authenticated?'Hesabındaki':'Bu tarayıcıdaki'} doğru/yanlış yanıtlar, soru denemeleri, tekrar planı ve kaydedilen test oturumları silinecek. Favoriler, defter notları, vaka ve ders ilerlemeleri korunacak. Bu işlem geri alınamaz.</AlertDialogDescription>
    {learning.error&&<p role="alert">{learning.error}</p>}
    <AlertDialogFooter><AlertDialogCancel disabled={learning.pending}>Vazgeç</AlertDialogCancel><Button variant="destructive" disabled={learning.pending||learning.loading||!learning.canWork} onClick={()=>void reset()}>{learning.pending?'Sıfırlanıyor…':'Evet, soru kayıtlarını sıfırla'}</Button></AlertDialogFooter>
   </AlertDialogContent>
  </AlertDialog>
 </div>;
}
