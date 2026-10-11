import fs from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root='public',file='public/models/atlas.json',atlas=JSON.parse(fs.readFileSync(file));
const oldChunks=atlas.chunks.map(c=>({meta:c,buffer:fs.readFileSync(path.join(root,c.url))}));
const hash=b=>createHash('sha256').update(b).digest('hex');
const groups=new Map();
for(const p of atlas.parts){
 const side=/\bleft\b/i.test(p.name)?'left':/\bright\b/i.test(p.name)?'right':'central';
 const region=p.bounds[1][1]<.35?'foot':p.bounds[1][1]<.95?'lower':p.bounds[0][1]>1.55?'head':'upper';
 const key=p.system+'-'+side+'-'+region,parts=groups.get(key)??[];parts.push(p);groups.set(key,parts);
}
const chunks=[],checks=[];
for(const [key,parts]of groups){
 let buffers=[],bytes=0,bucket=0,entries=[];
 const flush=()=>{if(!entries.length)return;const url='/models/study-'+key+'-'+bucket+++'.bin',buffer=Buffer.concat(buffers,bytes),compressed=gzipSync(buffer,{level:9});fs.writeFileSync(path.join(root,url),buffer);fs.writeFileSync(path.join(root,url+'.gz'),compressed);chunks.push({url,bytes,gzip:url+'.gz',gzipBytes:compressed.length});buffers=[];bytes=0;entries=[];};
 for(const p of parts){
  const source=oldChunks[p.chunk].buffer;
  const arrays=[['positions',p.vertexCount*12],['normals',p.vertexCount*6],['indices',p.indexCount*4]].map(([field,size])=>({field,data:source.subarray(p[field],p[field]+size)}));
  const size=arrays.reduce((n,a)=>n+a.data.length+3,0);if(bytes+size>2500000&&entries.length)flush();
  p.chunk=chunks.length;
  for(const {field,data}of arrays){const padding=(4-bytes%4)%4;if(padding){buffers.push(Buffer.alloc(padding));bytes+=padding;}p[field]=bytes;buffers.push(data);bytes+=data.length;checks.push({part:p,field,length:data.length,hash:hash(data)});}
  entries.push(p);
 }
 flush();
}
for(const check of checks){const chunk=fs.readFileSync(path.join(root,chunks[check.part.chunk].url));if(hash(chunk.subarray(check.part[check.field],check.part[check.field]+check.length))!==check.hash)throw Error('Geometry changed: '+check.part.id);}
atlas.chunks=chunks;atlas.packing='system-side-region-v1';fs.writeFileSync(file,JSON.stringify(atlas));
const keep=new Set(chunks.flatMap(c=>[c.url,c.gzip]));for(const {meta}of oldChunks)for(const url of [meta.url,meta.gzip])if(url&&!keep.has(url))fs.unlinkSync(path.join(root,url));
console.log('Verified exact arrays for '+atlas.parts.length+' parts; '+chunks.length+' independently loadable system/side/region chunks.');
console.log('Skeleton: '+(chunks.filter(c=>c.url.includes('skeletal')).reduce((n,c)=>n+c.gzipBytes,0)/1e6).toFixed(2)+' MB compressed.');
