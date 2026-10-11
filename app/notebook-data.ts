import {parseWorkspaceRoute,workspaceHash} from './workspace-route';
export interface NotebookEntry {id:string;title:string;note:string;collection:string;hash:string;updatedAt:number;archived:boolean;revision?:number}
export function newNotebookId(){return typeof crypto.randomUUID==='function'?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');}
export function parseNotebookEntry(input:unknown):NotebookEntry|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const p=input as Record<string,unknown>;
 if(typeof p.id!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(p.id)||typeof p.title!=='string'||!p.title.trim()||p.title.length>120||typeof p.note!=='string'||p.note.length>2500||typeof p.collection!=='string'||p.collection.length>60||typeof p.hash!=='string'||!p.hash.startsWith('#')||p.hash.length>1000||typeof p.archived!=='boolean')return null;
 const route=parseWorkspaceRoute(p.hash);if(['notebook','lab'].includes(route.lesson))return null;
 return {...(Number.isInteger(p.revision)&&Number(p.revision)>=0?{revision:Number(p.revision)}:{}),id:p.id,title:p.title.trim(),note:p.note,collection:p.collection.trim(),hash:workspaceHash(route),updatedAt:0,archived:p.archived};
}
