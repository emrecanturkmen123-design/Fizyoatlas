"""Append selected CC BY-SA 4.0 Z-Anatomy models to the original atlas.
Run with Blender's Python/bpy: python scripts/import-z-anatomy.py SOURCE.blend
Source URL, content hash and registration coefficients are in public/models/supplement-source.json.
Scripts embedded in the source Blend are never enabled.
"""
import sys,json,re,gzip,hashlib
from pathlib import Path
import bpy,numpy as np
root=Path(__file__).resolve().parents[1];out=root/'public/models'
bpy.context.preferences.filepaths.use_scripts_auto_execute=False
bpy.ops.wm.open_mainfile(filepath=str(Path(sys.argv[1]).resolve()),load_ui=False,use_scripts=False)
atlas=json.loads((out/'atlas.json').read_text())
if any(p['id'].startswith('ZA-') for p in atlas['parts']):raise SystemExit('Supplement already imported; do not append duplicate identities')
base_names=['Axillary nerve','Musculocutaneous nerve','Median nerve','Radial nerve','Ulnar nerve','Long thoracic nerve','Thoracodorsal nerve','Suprascapular nerve','Superior subscapular nerve','Inferior subscapular nerve','Femoral nerve','Obturator nerve','Anterior branch of obturator nerve','Sciatic nerve','Tibial nerve','Common fibular nerve','Deep fibular nerve','Superficial fibular nerve','Superior gluteal nerve','Anterior root of spinal nerve','Posterior root of spinal nerve','Spinal ganglion','Roots of brachial plexus','Superior trunk of brachial plexus','Middle trunk of brachial plexus','Inferior trunk of brachial plexus','Posterior cord of brachial plexus']
# Source anatomy has lateral/medial cords under 'fasciculus' names only in some versions;
# include them only when present. No centreline or nerve path is fabricated.
base_names+=['Lateral cord of brachial plexus','Medial cord of brachial plexus']
base_names += [division+' division of '+trunk+' trunk of brachial plexus' for division in ['Anterior','Posterior'] for trunk in ['superior','middle','inferior']]
requested=['Latissimus dorsi muscle.l','Latissimus dorsi muscle.r']+[n+'.'+side for n in base_names for side in ['l','r']]+['White matter of spinal cord','Cauda equina']
scale=.9850303709151661;shift=np.array([7.034327618495536e-06,.03160419848501905,.0024510506019518874]);blob=bytearray();chunk=len(atlas['chunks']);records=[];missing=[];triangles=0
for name in requested:
 o=bpy.data.objects.get(name)
 if not o or o.type not in ['MESH','CURVE']:missing.append(name);continue
 if o.type=='CURVE':
  o.data.resolution_u=min(o.data.resolution_u,8);o.data.bevel_resolution=min(o.data.bevel_resolution,2)
 deps=bpy.context.evaluated_depsgraph_get();ev=o.evaluated_get(deps);mesh=ev.to_mesh();mesh.calc_loop_triangles()
 if not len(mesh.vertices) or not len(mesh.loop_triangles):missing.append(name);ev.to_mesh_clear();continue
 positions=np.array([o.matrix_world@v.co for v in mesh.vertices],dtype=np.float64)[:,[0,2,1]];positions[:,2]*=-1;positions=positions*scale+shift
 faces=np.array([tri.vertices for tri in mesh.loop_triangles],dtype=np.uint32)
 if o.matrix_world.to_3x3().determinant()<0:faces=faces[:,[0,2,1]]
 normals=np.zeros_like(positions);v=positions[faces];fn=np.cross(v[:,1]-v[:,0],v[:,2]-v[:,0]);
 for i in range(3):np.add.at(normals,faces[:,i],fn)
 normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-12)
 side='Left' if name.endswith('.l') else 'Right' if name.endswith('.r') else ''
 stem=re.sub(r'\.[lr]$','',name);display=(side+' '+stem).strip()
 if 'Latissimus' in display:display=side+' latissimus dorsi'
 if name=='White matter of spinal cord':display='Spinal cord white matter'
 key='ZA-'+re.sub('[^a-z0-9]+','-',display.lower()).strip('-')
 def add(a,dtype):
  while len(blob)%4:blob.append(0)
  offset=len(blob);blob.extend(np.asarray(a,dtype=dtype).tobytes());return offset
 po=add(positions,'<f4');no=add(np.rint(normals*32767),'<i2');io=add(faces,'<u4')
 record={'id':key,'name':display,'conceptId':key,'system':'muscular' if 'Latissimus' in name else 'nervous','chunk':chunk,'positions':po,'normals':no,'indices':io,'vertexCount':len(positions),'indexCount':faces.size,'bounds':[positions.min(0).tolist(),positions.max(0).tolist()],'source':'Z-Anatomy / BodyParts3D','license':'CC-BY-SA-4.0','sourceObject':name}
 atlas['parts'].append(record);atlas['concepts'].append({'id':key,'name':display,'elements':[key]});records.append({'id':key,'object':name,'vertices':len(positions),'triangles':len(faces)});triangles+=len(faces);ev.to_mesh_clear()
 if len(records)%10==0:print('Exported',len(records),flush=True)
lat_ids=[p['id'] for p in atlas['parts'] if p['name'].lower().endswith('latissimus dorsi')];assert len(lat_ids)==2
atlas['concepts'].append({'id':'ZA-latissimus-dorsi','name':'Latissimus dorsi','elements':lat_ids})
(out/'supplement.bin').write_bytes(blob);compressed=gzip.compress(blob,compresslevel=9,mtime=0);(out/'supplement.bin.gz').write_bytes(compressed)
atlas['chunks'].append({'url':'/models/supplement.bin','bytes':len(blob),'gzip':'/models/supplement.bin.gz','gzipBytes':len(compressed)})
atlas['triangles']+=triangles;atlas['scope']='BodyParts3D reference anatomy with registered Z-Anatomy latissimus dorsi and selected spinal/peripheral nerve models. Educational, not patient-specific.'
(out/'atlas.json').write_text(json.dumps(atlas,separators=(',',':')))
metadata={'source':'https://github.com/Z-Anatomy/Models-of-human-anatomy','archive':'Z-Anatomy.zip','archiveURL':'https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/master/Z-Anatomy.zip','archiveSHA256':'8c64759030ba82fead9b41f0ddea476ea81d7652526960d3d9bd8dc1ba91bb66','license':'CC-BY-SA-4.0','authors':['Gauthier Kervyn / Z-Anatomy','BodyParts3D / The Database Center for Life Science'],'transform':{'axes':'x,z,-y','scale':scale,'translation':shift.tolist(),'registration':'Least-squares uniform registration of bilateral humerus, femur and scapula envelopes','envelopeRmsMm':4.780475937381765},'adaptations':['Evaluated selected source meshes and curves','Reduced curve sampling to 8 longitudinal / 2 bevel subdivisions when higher','Applied object transforms and uniform registration','Triangulated and quantized normals','No image textures or third-party ear/kidney assets included'],'parts':records,'missingRequestedObjects':missing,'sha256':hashlib.sha256(blob).hexdigest()}
(out/'supplement-source.json').write_text(json.dumps(metadata,indent=2));print('DONE',len(records),'models',triangles,'triangles',len(blob),'bytes. Missing:',missing,flush=True)
