import { useEffect, useId, useState, type CSSProperties } from 'react';
import { Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { clinicalTestIllustrations } from './clinical-test-illustration-data';

type Props = { testId: string; title: string };

const closeupViewBoxes: Record<string, string> = {
  lachman: '16 60 288 126',
  knee_anterior: '20 35 278 148',
  knee_posterior: '20 38 278 145',
  clarke: '20 71 278 112',
  ankle_anterior: '20 67 278 111',
  thompson: '17 69 285 118',
  speed: '53 12 233 173',
  yergason: '53 20 213 164',
  femoral_stretch: '18 34 282 146',
};

const stepTitles = ['Pozisyon', 'El yerleşimi', 'Manevra', 'Pozitiflik'] as const;

const testSteps: Record<string, readonly [string, string, string, string]> = {
  lachman: [
    'Sırtüstü yatışta diz yaklaşık 20–30° fleksiyonda, kaslar gevşek.',
    'Bir el distal femuru sabitler. Diğer el proksimal tibiayı arkadan kavrar.',
    'Femur sabit kalırken tibia öne çekilir. Ok, tibianın hareket yönünü gösterir.',
    'Karşı tarafa göre artmış öne kayma veya yumuşak son his, ÖÇB yaralanması olasılığını destekler.',
  ],
  hawkins: [
    'Otururken omuz ve dirseği yaklaşık 90° fleksiyonda konumlandır.',
    'Bir elle dirseği destekle. Diğer elle distal önkolu tut.',
    'Önkolu aşağı yönlendirerek omuzda pasif iç rotasyon oluştur.',
    'Kişinin tanıdığı ön-yan omuz ağrısının ortaya çıkması subakromiyal ağrı olasılığını destekler.',
  ],
  spurling: [
    'Kişi oturur. Baş ve boyun, semptom tarafına kontrollü biçimde konumlandırılır.',
    'Klinisyen bir eliyle başı kontrol eder ve uygulamayı semptom yanıtına göre yönetir.',
    'Gösterilen varyantta hafif aksiyel kompresyon uygulanır.',
    'Kola yayılan tanıdık radiküler semptom pozitifliği destekler. Yalnız yerel boyun ağrısı yeterli değildir.',
  ],
  slr: [
    'Kişi sırtüstü yatar. Test edilen diz ekstansiyonda kalır.',
    'Klinisyen bacağı topuk veya distal bacaktan destekler.',
    'Diz bükülmeden kalça pasif fleksiyona getirilir. Semptomun yeri ve başladığı açı kaydedilir.',
    'Bacağa yayılan tanıdık semptom nöral mekanosensitivite ile uyumlu olabilir. Sadece arka uyluk gerilmesi farklı bir bulgudur.',
  ],
  thomas: [
    'Kişi sırtüstü, masanın kenarına yakın konumlanır.',
    'Karşı diz göğse doğru tutulur. Pelvisin konumu izlenir.',
    'Test edilen uyluk serbest bırakılır. Uyluk hizası ve diz fleksiyonu ayrı ayrı gözlenir.',
    'Pelvis kontrol altında iken uyluğun yükselmesi kalça ekstansiyon kısıtını düşündürür. Diz açısı ayrıca yorumlanır.',
  ],
  phalen: [
    'Kişi önkollarını kendisi için rahat bir konuma getirir.',
    'El sırtları birleştirilir ve her iki bilek fleksiyona getirilir.',
    'Bilekler bu konumda 60 saniyeye kadar tutulur. Tanıdık uyuşma veya karıncalanma izlenir.',
    'Median sinir duyu alanında tanıdık parestezi karpal tünel olasılığını destekleyebilir.',
  ],
  ankle_anterior: [
    'Ayak rahat ve hafif plantar fleksiyondadır.',
    'Bir el distal tibia ve fibulayı sabitler. Diğer el topuğu kavrar.',
    'Topuk öne çekilir. Karşı tarafla hareket miktarı ve son his karşılaştırılır.',
    'Artmış öne hareket veya yumuşak son his lateral bağ, özellikle ATFL, tutulumuyla uyumlu olabilir.',
  ],
  thompson: [
    'Yüzüstü yatışta ayak, masanın kenarından serbestçe sarkar.',
    'Klinisyenin elleri baldır kas kütlesine yerleşir.',
    'Baldır sıkılır. Mavi ok, sağlam Aşil tendonu ile beklenen plantar fleksiyon yönünü gösterir.',
    'Baldır sıkıldığında plantar fleksiyonun gerçekleşmemesi Aşil tendonu rüptürü şüphesini destekler.',
  ],
};

function ClinicalDiagram({ testId, step }: { testId: string; step?: number }) {
  const id = useId();
  const illustration = clinicalTestIllustrations[testId];
  const drawing = illustration.drawing.filter(item=>{
    if(step===undefined)return true;
    if(item.kind==='hand')return step>=1;
    if(item.kind==='arrow'||item.kind==='resistance'||item.kind==='ghost')return step>=2;
    if(item.kind==='label'||item.kind==='target')return step===3;
    return true;
  });
  const hasHands = drawing.some(item => item.kind === 'hand');
  const hasArrows = drawing.some(item => item.kind === 'arrow');
  const hasResistance = drawing.some(item => item.kind === 'resistance');
  const hasGhost = drawing.some(item => item.kind === 'ghost');

  return (
      <div className="clinical-test-illustration-art">
        <svg viewBox={closeupViewBoxes[testId] ?? '0 0 320 188'} aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={id + '-skin'} x1="0" y1="10" x2="62" y2="180" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fcdfca" />
              <stop offset=".57" stopColor="#efbea4" />
              <stop offset="1" stopColor="#de9c82" />
            </linearGradient>
            <linearGradient id={id + '-hand'} x1="-18" y1="-16" x2="13" y2="15" gradientUnits="userSpaceOnUse">
              <stop stopColor="#b5d8e3" />
              <stop offset="1" stopColor="#6ca4bb" />
            </linearGradient>
            {(['arrow', 'resistance'] as const).map(kind => (
              <marker key={kind} id={id + '-' + kind} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
                <path className={'clinical-diagram-arrowhead-' + kind} d="M0 0 8 4 0 8 1.7 4Z" />
              </marker>
            ))}
          </defs>
          <g style={{ '--diagram-skin': `url(#${id}-skin)`, '--diagram-hand': `url(#${id}-hand)` } as CSSProperties}>
          {drawing.map((item, index) => {
            if (item.kind === 'limb') {
              return <g key={index} className="clinical-diagram-limb">
                <path d={item.path} strokeWidth={item.width + 2.6} />
                <path d={item.path} strokeWidth={item.width} />
              </g>;
            }

            if (item.kind === 'label') {
              const textWidth = item.text.length * 5.6;
              const leaderX = Math.min(Math.max(item.toX, item.x), item.x + textWidth);
              return <g key={index} className="clinical-diagram-label">
                <path d={`M${leaderX} ${item.y + 3} L${item.toX} ${item.toY}`} />
                <circle cx={item.toX} cy={item.toY} r="2" />
                <text x={item.x} y={item.y}>{item.text}</text>
              </g>;
            }

            if ('path' in item) {
              return <path key={index}
                className={'clinical-diagram-' + item.kind}
                data-motion={step===2 && (item.kind==='arrow'||item.kind==='resistance') || undefined}
                pathLength={step===2 && (item.kind==='arrow'||item.kind==='resistance') ? 1 : undefined}
                d={item.path}
                markerEnd={item.kind === 'arrow' || item.kind === 'resistance' ? `url(#${id}-${item.kind})` : undefined} />;
            }

            const transform = `translate(${item.x} ${item.y}) rotate(${item.angle}) scale(${item.scale})`;
            if (item.kind === 'head') {
              return <g key={index} transform={transform}>
                <path className="clinical-diagram-shape" d="M-16-1C-18-16-9-23 2-22Q15-21 18-10L18-5 21 1 17 4 16 11Q11 17 2 16L-5 22-15 17-10 10Q-16 7-16-1Z" />
                <path className="clinical-diagram-detail" d="M-14-7Q-8-12-4-6M9-6h3M-3 0q-5-5-7 0t6 4" />
              </g>;
            }
            if (item.kind === 'front-head' || item.kind === 'back-head') {
              return <g key={index} transform={transform}>
                <path className="clinical-diagram-shape" d="M-16-3C-19-29 18-29 16-3Q22-8 20 3Q19 8 16 8Q14 15 7 16L9 22H-9L-7 16Q-13 15-16 8Q-20 8-20 3Q-22-8-16-3Z" />
                {item.kind === 'front-head'
                  ? <path className="clinical-diagram-detail" d="M-11-3H-7M7-3H11M0-1-2 5H1M-4 9Q0 11 4 9" />
                  : <path className="clinical-diagram-detail" d="M-13 2Q0 12 13 2M-6 16Q0 18 6 16" />}
              </g>;
            }
            if (item.kind === 'hand') {
              return <g key={index} transform={transform}>
                <path className="clinical-diagram-hand" d="M-22-7H-8Q-4-11 1-10L9-9Q13-8 12-6Q12-4 9-4L4-5 13-2Q16-1 15 2Q14 4 10 3L14 5Q16 7 13 9L9 9Q11 12 7 13L-4 10Q-8 9-11 6H-22Z" />
                <path className="clinical-diagram-hand-seams" d="M-13-7V6M6 2l4 1M4 7l5 2" />
              </g>;
            }
            return <g key={index} transform={transform} className="clinical-diagram-target">
              <circle r="8" />
              <circle r="3" />
            </g>;
          })}
          </g>
        </svg>
        {(hasHands || hasArrows || hasResistance || hasGhost) && (
          <div className="clinical-test-illustration-legend">
            {hasHands && <span data-key="hand">Klinisyenin eli</span>}
            {hasArrows && <span data-key="arrow">Hareket yönü</span>}
            {hasResistance && <span data-key="resistance">Basınç veya direnç</span>}
            {hasGhost && <span data-key="ghost">Referans konum</span>}
          </div>
        )}
      </div>
  );
}

function ClinicalSteps({ testId, steps }: { testId: string; steps: typeof testSteps[string] }) {
  const [step,setStep] = useState(0);
  const [playing,setPlaying] = useState(false);
  useEffect(()=>{
    if(!playing)return;
    const timer=window.setTimeout(()=>{
      if(step===stepTitles.length-1){setPlaying(false);return;}
      setStep(step+1);
    },3600);
    return ()=>window.clearTimeout(timer);
  },[playing,step]);

  return <div className="clinical-animation">
    <ClinicalDiagram key={step} testId={testId} step={step}/>
    <div className="clinical-animation-steps" role="group" aria-label="İllüstrasyon adımları">
      {stepTitles.map((title,index)=><Button key={title} size="sm" variant={index===step?'default':'outline'}
        aria-pressed={index===step} onClick={()=>{setPlaying(false);setStep(index);}}>{title}</Button>)}
    </div>
    <p role="status"><strong>{stepTitles[step]}</strong> · {steps[step]}</p>
    <Button size="sm" variant="outline" onClick={()=>{
      if(playing){setPlaying(false);return;}
      if(step===stepTitles.length-1)setStep(0);
      setPlaying(true);
    }}>{playing?'Duraklat':'Adımları oynat'}</Button>
  </div>;
}

export default function ClinicalTestIllustration({ testId, title }: Props) {
  const illustration = clinicalTestIllustrations[testId];
  if (!illustration) return null;

  return (
    <Dialog>
      <figure className="clinical-test-illustration" data-test-illustration={testId}>
        <div className="clinical-test-illustration-header">
          <div className="clinical-test-illustration-view">{illustration.view}</div>
          <DialogTrigger render={<Button variant="ghost" size="sm" aria-label="İllüstrasyonu büyüt" />}>
            <Maximize2 size={14} /> Büyüt
          </DialogTrigger>
        </div>
        {testSteps[testId]?<ClinicalSteps testId={testId} steps={testSteps[testId]}/>:<ClinicalDiagram testId={testId} />}
        {!testSteps[testId]&&<figcaption>{illustration.caption}</figcaption>}
      </figure>
      <DialogContent className="clinical-test-illustration-dialog" showCloseButton={false}>
        <DialogClose render={<Button className="clinical-test-illustration-close" variant="ghost" size="icon-sm" aria-label="Kapat" />}>
          <X size={19} />
        </DialogClose>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{illustration.view}</DialogDescription>
        {testSteps[testId]?<ClinicalSteps testId={testId} steps={testSteps[testId]}/>:<ClinicalDiagram testId={testId} />}
        {!testSteps[testId]&&<p>{illustration.caption}</p>}
      </DialogContent>
    </Dialog>
  );
}
