import {parseWorkspaceRoute,routeIdentity,workspaceHash,type WorkspaceRoute} from './workspace-route';

type Entry={hash:string;trail:string[]};
type Browser={location:{hash:string};history:{state:unknown;pushState:(state:unknown,title:string,url:string)=>void;replaceState:(state:unknown,title:string,url:string)=>void;back:()=>void};dispatchEvent:(event:Event)=>boolean};
const key='fizyoNavigation';
function entry(state:unknown):Entry|undefined{
 const value=(state as Record<string,unknown>|null)?.[key] as Entry|undefined;
 return value&&typeof value.hash==='string'&&value.hash.startsWith('#')&&Array.isArray(value.trail)&&value.trail.length<=80&&value.trail.every(h=>typeof h==='string'&&h.startsWith('#'))?value:undefined;
}
// A camera or a selector is an adjustment to the current page, not another page.
export function navigationIdentity(route:WorkspaceRoute){
 if(route.lesson==='lab')return 'lab';
 if(route.lesson==='study')return workspaceHash({lesson:'study',tab:route.tab,region:route.region,concept:route.concept,muscle:route.muscle,nerve:route.nerve,structure:route.structure});
 return routeIdentity(route);
}
export function parentWorkspaceRoute(route:WorkspaceRoute):WorkspaceRoute|undefined{
 if(route.lesson==='study'){
  if(route.concept||route.muscle||route.nerve||route.structure)return {lesson:'study',tab:route.tab,region:route.region};
  if(route.tab&&route.tab!=='muscles'||route.region&&route.region!=='all')return {lesson:'study'};
  return;
 }
 if(route.lesson==='lab'||route.lesson==='tendons'||route.lesson==='spine')return {lesson:'study'};
 if(['shoulder','elbow','knee','hip','ankle','gait'].includes(route.lesson))return {lesson:'movements'};
 if(route.lesson==='knee-course'||route.lesson==='regional-course')return {lesson:'courses'};
 if(route.lesson==='movements'||route.lesson==='practice')return {lesson:'study'};
 return {lesson:'practice'};
}
export class WorkspaceHistory{
 private observed?:Entry;
 constructor(private browser:Browser){}
 private save(value:Entry,replace:boolean){
  const state=this.browser.history.state;
  this.browser.history[replace?'replaceState':'pushState']({...((state&&typeof state==='object')?state:{}),[key]:value},'',value.hash);
  this.observed=value;
 }
 adopt(eventType?:string){
  const current=entry(this.browser.history.state),hash=this.browser.location.hash||'#atlas';
  if(current?.hash===hash){this.observed=current;return;}
  // Native hash links create their own history entry; mark it without adding one.
  const trail=eventType==='hashchange'&&this.observed&&this.observed.hash!==hash?[...this.observed.trail,this.observed.hash].slice(-80):[];
  this.save({hash,trail},true);
 }
 get hasPrevious(){const current=entry(this.browser.history.state);return current?.hash===(this.browser.location.hash||'#atlas')&&current.trail.length>0;}
 write(hash:string,replace=false){
  const current=entry(this.browser.history.state)??{hash:this.browser.location.hash||'#atlas',trail:[]};
  const trail=replace?current.trail:[...current.trail,current.hash].slice(-80);
  this.save({hash,trail},replace);
 }
 restore(hash:string){this.write(hash,true);this.browser.dispatchEvent(new Event('popstate'));}
 back(route:WorkspaceRoute){
  if(this.hasPrevious){this.browser.history.back();return;}
  const parent=parentWorkspaceRoute(route);if(parent)this.restore(workspaceHash(parent));
 }
}
