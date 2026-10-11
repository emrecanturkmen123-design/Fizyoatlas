"""Append four named Z-Anatomy source nerves; keep every existing atlas array unchanged.
Blender --background --disable-autoexec --python SCRIPT -- SOURCE.blend ARCHIVE.zip
"""
import bpy,numpy as np,json,sys,gzip,hashlib,re,datetime
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'public/models'
source,archive=map(Path,sys.argv[sys.argv.index('--')+1:])
archive_hash=hashlib.sha256(archive.read_bytes()).hexdigest()
assert archive_hash=='e029688545627bd0214b269e1063143abb580aad72b2c2445d6d8a9a0d9da736'
bpy.context.preferences.filepaths.use_scripts_auto_execute=False
names=[n+'.'+s for n in ['Lateral pectoral nerve','Medial pectoral nerve'] for s in ['l','r']]
refs=[n+'.'+s for n in ['Humerus','Femur','Scapula'] for s in ['l','r']]
with bpy.data.libraries.load(str(source.resolve()),link=False) as (src,dst):
 assert all(n in src.objects for n in names+refs)
 assert not any('inferior gluteal nerve' in n.lower() for n in src.objects)
 dst.objects=names+refs
for o in dst.objects:
 if o:bpy.context.collection.objects.link(o)
bpy.context.view_layer.update()
a=json.loads((out/'atlas.json').read_text());registration=json.loads((out/'supplement-source.json').read_text())['transform']
assert not any(p['id'].startswith('ZA-pectoral-') for p in a['parts'])
scale=registration['scale'];shift=np.array(registration['translation']);blob=bytearray();parts=[];squared=[]
def vertices(o,m):
 v=np.array([o.matrix_world@x.co for x in m.vertices],dtype=np.float64)[:,[0,2,1]];v[:,2]*=-1
 return v*scale+shift
for name in refs:
 o=bpy.data.objects[name];ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();v=vertices(o,m)
 side='Left' if name.endswith('.l') else 'Right';stem=name[:-2]
 target=next(p for p in a['parts'] if p['name'].lower()==(side+' '+stem).lower())
 squared.extend((np.array([v.min(0),v.max(0)])-np.array(target['bounds'])).ravel()**2);ev.to_mesh_clear()
rms=float(np.sqrt(np.mean(squared)));assert rms<.012,('registration envelope RMS',rms)
for name in names:
 o=bpy.data.objects[name]
 if o.type=='CURVE':o.data.resolution_u=min(o.data.resolution_u,8);o.data.bevel_resolution=min(o.data.bevel_resolution,2)
 ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();m.calc_loop_triangles();v=vertices(o,m)
 f=np.array([t.vertices for t in m.loop_triangles],dtype=np.uint32)
 if o.matrix_world.to_3x3().determinant()<0:f=f[:,[0,2,1]]
 assert len(v)>0 and len(f)>0 and np.isfinite(v).all()
 normals=np.zeros_like(v);tri=v[f];fn=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0])
 for i in range(3):np.add.at(normals,f[:,i],fn)
 normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-12)
 side='Left' if name.endswith('.l') else 'Right';display=side+' '+name[:-2];key='ZA-pectoral-'+re.sub('[^a-z0-9]+','-',display.lower()).strip('-')
 hashes={}
 def add(values,dtype,label):
  while len(blob)%4:blob.append(0)
  b=np.asarray(values,dtype=dtype).tobytes();offset=len(blob);blob.extend(b);hashes[label+'SHA256']=hashlib.sha256(b).hexdigest();return offset
 part={'id':key,'name':display,'conceptId':key,'system':'nervous','chunk':len(a['chunks']),'positions':add(v,'<f4','positions'),'normals':add(np.rint(normals*32767),'<i2','normals'),'indices':add(f,'<u4','indices'),'vertexCount':len(v),'indexCount':f.size,'bounds':[v.min(0).tolist(),v.max(0).tolist()],'source':'Z-Anatomy / BodyParts3D','license':'CC-BY-SA-4.0','sourceObject':name}
 a['parts'].append(part);a['concepts'].append({'id':key,'name':display,'elements':[key]});parts.append({'id':key,'object':name,'vertices':len(v),'triangles':len(f),**hashes});ev.to_mesh_clear()
assert len(parts)==4
for stem in ['Lateral pectoral nerve','Medial pectoral nerve']:
 ids=[p['id'] for p in a['parts'] if p.get('sourceObject') in [stem+'.l',stem+'.r']];a['concepts'].append({'id':'ZA-pectoral-'+stem.lower().replace(' ','-'),'name':stem,'elements':ids})
z=gzip.compress(blob,compresslevel=9,mtime=0);(out/'pectoral-nerves.bin').write_bytes(blob);(out/'pectoral-nerves.bin.gz').write_bytes(z)
a['chunks'].append({'url':'/models/pectoral-nerves.bin','bytes':len(blob),'gzip':'/models/pectoral-nerves.bin.gz','gzipBytes':len(z)})
a['triangles']+=sum(p['triangles'] for p in parts)
(out/'atlas.json').write_text(json.dumps(a,separators=(',',':')))
metadata={'source':'https://github.com/Z-Anatomy/Models-of-human-anatomy','archiveURL':'https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/master/Z-Anatomy.zip','archiveSHA256':archive_hash,'retrieved':str(datetime.date.today()),'license':'CC-BY-SA-4.0','authors':['Gauthier Kervyn / Z-Anatomy','BodyParts3D / The Database Center for Life Science'],'transform':registration,'verifiedBoneEnvelopeRmsMm':rms*1000,'adaptations':['Embedded script execution disabled','Loaded only named source objects and registration bones','Evaluated curves with longitudinal resolution 8 and bevel resolution 2','Applied existing uniform atlas registration; triangulated and quantized normals'],'parts':parts,'missingRequestedObjects':['Inferior gluteal nerve.l','Inferior gluteal nerve.r'],'sha256':hashlib.sha256(blob).hexdigest()}
(out/'pectoral-nerves-source.json').write_text(json.dumps(metadata,indent=2));print('Added',len(parts),'source nerves; gzip bytes',len(z),'bone envelope RMS mm',rms*1000,flush=True)
