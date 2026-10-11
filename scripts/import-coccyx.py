"""Import only the licensed Coccyx mesh; never execute source Blender scripts.
Usage: bpy-python scripts/import-coccyx.py source.blend source.zip
"""
import sys,json,gzip,hashlib
from pathlib import Path
import bpy,numpy as np
out=Path(__file__).resolve().parents[1]/'public/models'
bpy.context.preferences.filepaths.use_scripts_auto_execute=False
bpy.ops.wm.open_mainfile(filepath=str(Path(sys.argv[1]).resolve()),load_ui=False,use_scripts=False)
a=json.loads((out/'atlas.json').read_text());assert not any(p['id']=='ZA-coccyx' for p in a['parts'])
scale=.9850303709151661;shift=np.array([7.034327618495536e-06,.03160419848501905,.0024510506019518874])
def vertices(o):
 v=np.array([o.matrix_world@x.co for x in o.data.vertices],dtype=float)[:,[0,2,1]];v[:,2]*=-1;return v*scale+shift
# Verify the existing registration against a neighbouring native reference bone.
sac=vertices(bpy.data.objects['Sacrum']);target=next(p for p in a['parts'] if p['name']=='Sacrum');rms=float(np.sqrt(np.mean((np.array([sac.min(0),sac.max(0)])-np.array(target['bounds']))**2))*1000);
# Use a local sacral envelope alignment for this separately sourced coccyx.
# It is a reference-mesh registration, not a clinical landmark fit.
raw=(sac-shift)/scale;src=np.array([raw.min(0),raw.max(0)]);dst=np.array(target['bounds']);scale=float(np.sum((src[1]-src[0])*(dst[1]-dst[0]))/np.sum((src[1]-src[0])**2));shift=dst.mean(0)-src.mean(0)*scale
sac=vertices(bpy.data.objects['Sacrum']);rms=float(np.sqrt(np.mean((np.array([sac.min(0),sac.max(0)])-dst)**2))*1000);assert rms<9,rms
obj=bpy.data.objects['Coccyx'];mesh=obj.data;mesh.calc_loop_triangles();pos=vertices(obj);faces=np.array([t.vertices for t in mesh.loop_triangles],dtype=np.uint32)
if obj.matrix_world.to_3x3().determinant()<0:faces=faces[:,[0,2,1]]
norm=np.zeros_like(pos);v=pos[faces];fn=np.cross(v[:,1]-v[:,0],v[:,2]-v[:,0])
for i in range(3):np.add.at(norm,faces[:,i],fn)
norm/=np.maximum(np.linalg.norm(norm,axis=1,keepdims=True),1e-12);blob=bytearray()
def add(v,dtype):
 while len(blob)%4:blob.append(0)
 off=len(blob);blob.extend(np.asarray(v,dtype=dtype).tobytes());return off
po=add(pos,'<f4');no=add(np.rint(norm*32767),'<i2');io=add(faces,'<u4');key='ZA-coccyx'
p={'id':key,'name':'Coccyx','conceptId':key,'system':'skeletal','chunk':len(a['chunks']),'positions':po,'normals':no,'indices':io,'vertexCount':len(pos),'indexCount':faces.size,'bounds':[pos.min(0).tolist(),pos.max(0).tolist()],'source':'Z-Anatomy / BodyParts3D','license':'CC-BY-SA-4.0','sourceObject':'Coccyx'}
a['parts'].append(p);a['concepts'].append({'id':key,'name':'Coccyx','elements':[key]});a['triangles']+=len(faces)
(out/'coccyx.bin').write_bytes(blob);z=gzip.compress(blob,compresslevel=9,mtime=0);(out/'coccyx.bin.gz').write_bytes(z);a['chunks'].append({'url':'/models/coccyx.bin','bytes':len(blob),'gzip':'/models/coccyx.bin.gz','gzipBytes':len(z)})
(out/'atlas.json').write_text(json.dumps(a,separators=(',',':')))
meta={'source':'https://github.com/Z-Anatomy/Models-of-human-anatomy','archiveURL':'https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/master/Z-Anatomy.zip','archiveSHA256':hashlib.sha256(Path(sys.argv[2]).read_bytes()).hexdigest(),'retrieved':'2026-09-14','license':'CC-BY-SA-4.0','authors':['Gauthier Kervyn / Z-Anatomy','BodyParts3D / The Database Center for Life Science'],'sourceObject':'Coccyx','transform':{'axes':'x,z,-y','scale':scale,'translation':shift.tolist(),'registration':'Uniform scale and translation fitted to sacrum envelope for this coccyx only','sacrumEnvelopeRmsMm':rms},'adaptations':['Object world transform','Uniform registration to reference atlas','Triangulation and quantized normals'],'sha256':hashlib.sha256(blob).hexdigest()};(out/'coccyx-source.json').write_text(json.dumps(meta,indent=2));print('Imported coccyx',len(pos),'vertices, sacrum envelope RMS mm:',rms,flush=True)
