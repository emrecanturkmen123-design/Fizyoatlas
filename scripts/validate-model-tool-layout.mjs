import assert from 'node:assert/strict';
import {modelToolLayout} from '../app/model-tool-layout.ts';
import {modelViewport,viewportUsable} from '../app/model-viewport.ts';

const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
let cases=0;
for(const [width,height] of [[320,568],[320,640],[390,844],[600,480],[667,375],[844,390],[768,1024],[900,700],[1024,768],[1100,900],[1101,501],[1101,900],[1280,720],[1366,768],[1440,900],[1920,1080]]){
 for(const cardWidth of [240,340,360,480,560]){
  const layout=modelToolLayout(width,height,cardWidth),tool=layout.rect;
  assert(tool.left>=0&&tool.right<=width&&tool.top>=0&&tool.bottom<=height,'tool stays inside the viewport');
  assert(tool.right>tool.left&&tool.bottom>tool.top,'usable tool rectangle');
  const panels=[tool];
  if(!layout.replaceCard){
   const card={left:width-20-cardWidth,right:width-20,top:100,bottom:height-96};
   assert(!overlaps(tool,card),'tool and card do not share screen space');panels.push(card);
  }else assert(width<1101||height<=500||width-cardWidth-330-40-48<320,'small free areas show one reading panel');
  const controlsBottom=height<=500&&width>=600&&width<=1024?124:width<768?176:width<=900?128:80;
  const viewport=modelViewport(width,height,panels,controlsBottom);
  assert(viewportUsable(viewport),`model retains space at ${width}x${height}, card ${cardWidth}`);
  if(!layout.replaceCard)assert(viewport.right-viewport.left>=320,'resizable cards preserve readable model width');
  assert(panels.every(panel=>!overlaps(viewport,panel)),'camera frames a free area instead of the tools');
  cases++;
 }
}
console.log(`PASS: ${cases} viewport/card-width combinations; separate wide columns, one narrow reading panel, finite in-bounds tools and unobstructed model space. Rectangle math, not browser pixels.`);
