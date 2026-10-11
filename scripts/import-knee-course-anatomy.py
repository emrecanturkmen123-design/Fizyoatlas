"""Add licensed whole PCL, collateral ligament and meniscus source objects.
Run with bpy Python: this.py SOURCE.blend SOURCE.zip. Load only requested
objects to limit memory; embedded source scripts are never executed.
Existing atlas geometry and metadata records are preserved exactly.
"""
import bpy, numpy as np, json, gzip, hashlib, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]; out=root/'public/models'
source=Path(sys.argv[1]); archive=Path(sys.argv[2])
bpy.context.preferences.filepaths.use_scripts_auto_execute=False
atlas=json.loads((out/'atlas.json').read_text())
assert not any(p['id'].startswith('ZA-knee-course-') for p in atlas['parts']), 'Already imported'
registration=json.loads((out/'clinical-source.json').read_text())
assert hashlib.sha256(archive.read_bytes()).hexdigest()==registration['archiveSHA256'], 'Unexpected source archive'
requested={
 'posterior cruciate ligament':['Posterior cruciate ligament'],
 'medial collateral ligament':['Superficial part of tibial collateral ligament','Deep part of tibial collateral ligament'],
 'lateral collateral ligament':['Fibular collateral ligament'],
 'medial meniscus':['Medial meniscus'],
 'lateral meniscus':['Lateral meniscus'],
}
names=[n+'.'+side for objects in requested.values() for n in objects for side in ['l','r']]
with bpy.data.libraries.load(str(source.resolve()),link=False) as (available,loaded):
 assert all(n in available.objects for n in names)
 loaded.objects=names
for o in loaded.objects:
 if o and not o.users_collection: bpy.context.scene.collection.objects.link(o)
bpy.context.view_layer.update()
base=registration['baseRegistration']; blob=bytearray();chunk=len(atlas['chunks']);records=[];triangle_count=0
old_parts=json.dumps(atlas['parts'],sort_keys=True);old_chunks=json.dumps(atlas['chunks'],sort_keys=True)
def mesh(o):
 ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get()); m=ev.to_mesh();m.calc_loop_triangles()
 pos=np.array([ev.matrix_world@v.co for v in m.vertices],dtype=np.float64)[:,[0,2,1]];pos[:,2]*=-1
 pos=pos*base['scale']+np.array(base['translation'])
 faces=np.array([t.vertices for t in m.loop_triangles],dtype=np.uint32)
 assert len(pos) and len(faces),o.name
 if ev.matrix_world.to_3x3().determinant()<0: faces=faces[:,[0,2,1]]
 used,inv=np.unique(faces,return_inverse=True);pos=pos[used];faces=inv.reshape(-1,3).astype(np.uint32)
 ev.to_mesh_clear();return pos,faces
for key,objects in requested.items():
 for side,label in [('l','Left'),('r','Right')]:
  positions=[];indices=[];offset=0
  for object_name in objects:
   pos,faces=mesh(bpy.data.objects[object_name+'.'+side]);positions.append(pos);indices.append(faces+offset);offset+=len(pos)
  pos=np.concatenate(positions);faces=np.concatenate(indices)
  tr=registration['localRegistration']['knee'+side];pos=pos*tr['scale']+np.array(tr['translation'])
  normals=np.zeros_like(pos);v=pos[faces];fn=np.cross(v[:,1]-v[:,0],v[:,2]-v[:,0])
  for i in range(3):np.add.at(normals,faces[:,i],fn)
  normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-12)
  assert np.isfinite(pos).all() and np.isfinite(normals).all() and faces.max()<len(pos)
  # Confirm the new reference surfaces remain within the registered knee envelope.
  acl=next(p for p in atlas['parts'] if p['name'].lower()==label.lower()+' anterior cruciate ligament')
  center=np.mean(np.array(acl['bounds']),axis=0);assert np.linalg.norm(pos.mean(0)-center)<.15,(key,side,pos.mean(0),center)
  def add(a,dtype):
   while len(blob)%4:blob.append(0)
   start=len(blob);blob.extend(np.asarray(a,dtype=dtype).tobytes());return start
  ident='ZA-knee-course-'+label.lower()+'-'+key.replace(' ','-')
  part={'id':ident,'name':label+' '+key,'conceptId':ident,'system':'connective','chunk':chunk,'positions':add(pos,'<f4'),'normals':add(np.rint(normals*32767),'<i2'),'indices':add(faces,'<u4'),'vertexCount':len(pos),'indexCount':int(faces.size),'bounds':[pos.min(0).tolist(),pos.max(0).tolist()],'source':'Z-Anatomy / BodyParts3D','license':'CC-BY-SA-4.0','sourceObjects':[o+'.'+side for o in objects],'sourceSelection':'Evaluated whole source objects; superficial and deep MCL components combined without changing geometry'}
  atlas['parts'].append(part);atlas['concepts'].append({'id':ident,'name':part['name'],'elements':[ident]});records.append(part);triangle_count+=len(faces)
  print(part['name'],len(pos),len(faces),flush=True)
assert len(records)==10
assert json.dumps(atlas['parts'][:-10],sort_keys=True)==old_parts
assert json.dumps(atlas['chunks'],sort_keys=True)==old_chunks
(out/'knee-course.bin').write_bytes(blob);compressed=gzip.compress(blob,compresslevel=9,mtime=0);(out/'knee-course.bin.gz').write_bytes(compressed)
atlas['chunks'].append({'url':'/models/knee-course.bin','bytes':len(blob),'gzip':'/models/knee-course.bin.gz','gzipBytes':len(compressed)})
atlas['triangles']+=triangle_count;atlas['scope']+=' Bilateral posterior cruciate and collateral ligaments and medial/lateral menisci from Z-Anatomy; healthy static reference surfaces.'
(out/'atlas.json').write_text(json.dumps(atlas,separators=(',',':')))
metadata={k:registration[k] for k in ['source','archiveURL','archiveSHA256','license','authors','baseRegistration']}
metadata.update({'localRegistration':{k:v for k,v in registration['localRegistration'].items() if k.startswith('knee')},'adaptations':['Loaded requested source objects only with embedded scripts disabled','Evaluated and triangulated whole source surfaces','Combined superficial and deep MCL components without altering either surface','Used the same bone-envelope registration as the existing ACL','Quantized signed-short normals; no pathology, graft or dynamic contact simulation'],'parts':records,'sha256':hashlib.sha256(blob).hexdigest()})
(out/'knee-course-source.json').write_text(json.dumps(metadata,indent=2))
print('DONE',len(records),triangle_count,len(blob),len(compressed),flush=True)
