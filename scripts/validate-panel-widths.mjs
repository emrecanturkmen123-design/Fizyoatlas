import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import Handles from '../app/workspace-panel-handles.tsx';
import {PANEL_WIDTH_KEY,PANEL_LAYOUT_EVENT,clampPanelWidth,panelWidthKey,parsePanelWidths} from '../app/panel-widths.ts';
import {modelViewport,viewportUsable} from '../app/model-viewport.ts';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
assert.deepEqual(parsePanelWidths({left:Infinity,right:-8}),{left:360,right:240});
assert.equal(panelWidthKey('ArrowLeft','right',360,280,560),376);
assert.equal(panelWidthKey('ArrowRight','left',360,280,560,true),400);
assert.equal(panelWidthKey('Home','left',500,280,560),360);
for(const width of [768,900,1101,1280,1440,1920])for(const l of [240,360,560,9999])for(const r of [240,360,560,9999]){
 const right=width>1100?clampPanelWidth(r,width):0;
 const left=clampPanelWidth(l,width,right),finalRight=width>1100?clampPanelWidth(r,width,left):0;
 const panels=[{left:20,right:20+left,top:100,bottom:804},...(finalRight?[{left:width-20-finalRight,right:width-20,top:100,bottom:804}]:[])];
 const free=modelViewport(width,900,panels);assert(viewportUsable(free));assert(free.right-free.left>=320,'bounded panel widths reserve model space');
}
const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
const surface=new EventTarget();Object.assign(surface,{innerWidth:1440,innerHeight:900});globalThis.window=surface;
class Style{setProperty(k,v){this[k]=v;}removeProperty(k){delete this[k];}}
class Element extends EventTarget{
 constructor(kind){super();this.kind=kind;this.style=new Style();this.dataset={};this.attributes=new Map();this.captured=new Set();}
 getClientRects(){return this.kind==='left'&&rightPanel&&window.innerWidth<=1100?[]:[this.getBoundingClientRect()];}
 getBoundingClientRect(){const width=this.dataset.resizablePanel?Number.parseFloat(this.style['--panel-width']??'360'):this.kind==='right'?340:360,left=this.kind==='right'?window.innerWidth-20-width:20;return {left,right:left+width,top:100,bottom:window.innerHeight-96,width,height:window.innerHeight-196};}
 setAttribute(k,v){this.attributes.set(k,v);}getAttribute(k){return this.attributes.get(k);}focus(){this.focused=true;}
 setPointerCapture(id){this.captured.add(id);}hasPointerCapture(id){return this.captured.has(id);}releasePointerCapture(id){this.captured.delete(id);}
}
const rootElement=new Element('root'),leftElement=new Element('left'),rightElement=new Element('right');rootElement.dataset.readingOnly='false';let leftPanel=leftElement,rightPanel=rightElement;
const classes=new Set(),body={classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}};
globalThis.document={body,querySelector:selector=>selector==='.workspace-layout'?rootElement:selector.startsWith('.workspace-layout >')?leftPanel:selector.startsWith('.detail-sheet')?rightPanel:null};
let mutation,disconnected=false;
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){disconnected=true;}};
globalThis.MutationObserver=class{constructor(fn){mutation=fn;}observe(){}disconnect(){}};
const nodes={};let updates=0;window.addEventListener(PANEL_LAYOUT_EVENT,()=>updates++);
async function mount(){let root;await act(async()=>{root=create(React.createElement(Handles),{createNodeMock:p=>{if(p.props.role==='separator'){const side=p.props.className.includes('panel-resize-left')?'left':'right';return nodes[side]=new Element('handle');}return null;}});});return root;}
const send=(node,type,props={})=>{const e=new Event(type,{cancelable:true});Object.assign(e,props);node.dispatchEvent(e);return e;};
let app=await mount();assert.equal(nodes.left.style.display,'flex');assert.equal(nodes.right.style.display,'flex');
assert(send(nodes.left,'keydown',{key:'ArrowRight',shiftKey:false}).defaultPrevented);assert.equal(leftElement.style['--panel-width'],'376px');
send(nodes.left,'pointerdown',{button:0,pointerId:4,clientX:396});assert(nodes.left.captured.has(4));assert(classes.has('resizing-workspace-panel'));
send(nodes.left,'pointermove',{pointerId:9,clientX:496});assert.equal(leftElement.style['--panel-width'],'376px','another pointer cannot resize');
send(nodes.left,'pointermove',{pointerId:4,clientX:496});assert.equal(leftElement.style['--panel-width'],'476px');
send(nodes.left,'pointerup',{pointerId:4});assert(!classes.has('resizing-workspace-panel'));assert(!nodes.left.captured.size);assert.equal(JSON.parse(data.get(PANEL_WIDTH_KEY)).left,476);assert(updates>=3,'completed changes notify the model framing');
send(nodes.right,'keydown',{key:'ArrowLeft',shiftKey:true});assert.equal(rightElement.style['--panel-width'],'400px');assert.equal(nodes.right.getAttribute('aria-valuenow'),'400');
const saved=data.get(PANEL_WIDTH_KEY);await act(async()=>app.unmount());assert(disconnected);assert(!leftElement.dataset.resizablePanel);assert(!leftElement.style['--panel-width']);
app=await mount();assert.equal(data.get(PANEL_WIDTH_KEY),saved);assert.equal(leftElement.style['--panel-width'],'476px','remount restores the chosen width');
send(nodes.left,'dblclick');assert.equal(leftElement.style['--panel-width'],'360px');
window.innerWidth=900;send(window,'resize');assert.equal(nodes.left.style.display,'none','tablet detail card reserves the model area');assert.equal(nodes.right.style.display,'flex');
window.innerWidth=390;send(window,'resize');assert.equal(nodes.left.style.display,'none');assert.equal(nodes.right.style.display,'none');assert(!leftElement.dataset.resizablePanel);assert(!rightElement.dataset.resizablePanel);
window.innerWidth=1440;send(window,'resize');assert.equal(nodes.right.style.display,'flex');
rootElement.dataset.readingOnly='true';mutation();assert.equal(nodes.right.style.display,'none','full reading surfaces do not gain resize controls');
await act(async()=>app.unmount());
console.log('PASS: actual panel handle component keyboard/drag/capture/persistence/reset/cleanup, narrow and reading layouts; 96 width combinations keep usable model space. DOM rectangles are fixtures, browser pixels and GPU are not tested.');
