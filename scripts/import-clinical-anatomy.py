"""Export licensed Z-Anatomy ligament meshes and source-labelled tendon faces.
Blender: --background --factory-startup --disable-autoexec --python this.py -- SOURCE.blend
No procedural anatomy is fabricated. Existing atlas geometry is untouched.
"""
import bpy,numpy as np,json,re,gzip,hashlib,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'public/models';source=Path(sys.argv[sys.argv.index('--')+1])
bpy.context.preferences.filepaths.use_scripts_auto_execute=False
bpy.ops.wm.open_mainfile(filepath=str(source.resolve()),load_ui=False,use_scripts=False)
atlas=json.loads((out/'atlas.json').read_text());assert not any(p['id'].startswith('ZA-clinical-') for p in atlas['parts'])
scale=.9850303709151661;shift=np.array([7.034327618495536e-06,.03160419848501905,.0024510506019518874])
def source_mesh(name,tendon=False):
 o=bpy.data.objects[name];ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();m.calc_loop_triangles()
 pos=np.array([o.matrix_world@v.co for v in m.vertices],dtype=np.float64)[:,[0,2,1]];pos[:,2]*=-1;pos=pos*scale+shift
 ts=[t for t in m.loop_triangles if not tendon or m.materials[t.material_index] and m.materials[t.material_index].name=='Tendon']
 faces=np.array([t.vertices for t in ts],dtype=np.uint32);assert len(faces),name
 if o.matrix_world.to_3x3().determinant()<0:faces=faces[:,[0,2,1]]
 used,inv=np.unique(faces,return_inverse=True);pos=pos[used];faces=inv.reshape(-1,3).astype(np.uint32);ev.to_mesh_clear();return pos,faces
# Local uniform registration fits each region's corresponding bone envelopes.
# The source/base are reference models; registration is not patient-specific.
regions={'shoulder':['Humerus','Scapula'],'knee':['Femur','Tibia'],'ankle':['Tibia','Fibula','Talus','Calcaneus']}
transforms={}
for side in ['l','r']:
 for region,bones in regions.items():
  src=[];dst=[]
  for b in bones:
   pos,_=source_mesh(b+'.'+side);part=next(p for p in atlas['parts'] if p['name'].lower()==('left' if side=='l' else 'right')+' '+b.lower())
   raw=(out/atlas['chunks'][part['chunk']]['url'].split('/')[-1]).read_bytes();target=np.frombuffer(raw,dtype='<f4',count=part['vertexCount']*3,offset=part['positions']).reshape(-1,3).astype(np.float64)
   def local(points):
    lo=points[:,1].min();hi=points[:,1].max()
    if region=='knee' and b=='Femur' or region=='ankle' and b in ['Tibia','Fibula']:return points[points[:,1]<lo+.25*(hi-lo)]
    if region=='knee' and b=='Tibia' or region=='shoulder' and b=='Humerus':return points[points[:,1]>hi-.25*(hi-lo)]
    return points
   pos=local(pos);target=local(target);src.extend([pos.min(0),pos.max(0)]);dst.extend([target.min(0),target.max(0)])
  a=np.array(src);b=np.array(dst);ac=a.mean(0);bc=b.mean(0);k=float(np.sum((a-ac)*(b-bc))/np.sum((a-ac)**2));translation=bc-k*ac
  rms=float(np.sqrt(np.mean(np.sum((a*k+translation-b)**2,axis=1)))*1000)
  transforms[region+side]={'scale':k,'translation':translation.tolist(),'envelopeRmsMm':rms,'bones':bones};print(region,side,'RMS mm',rms,flush=True)
requested=[('Anterior cruciate ligament','knee',False),('Anterior talofibular ligament','ankle',False),('Calcaneofibular ligament','ankle',False),('Posterior talofibular ligament','ankle',False)]+[(n+' muscle','shoulder',True) for n in ['Supraspinatus','Infraspinatus','Subscapularis','Teres minor']]
blob=bytearray();chunk=len(atlas['chunks']);records=[];triangles=0
for name,region,tendon in requested:
 for side in ['l','r']:
  footprint=tendon and not name.startswith('Infraspinatus');object_name=name+('.e' if footprint else '.')+side;pos,faces=source_mesh(object_name,tendon and not footprint);tr=transforms[region+side];pos=pos*tr['scale']+np.array(tr['translation'])
  normals=np.zeros_like(pos);v=pos[faces];fn=np.cross(v[:,1]-v[:,0],v[:,2]-v[:,0]);
  for i in range(3):np.add.at(normals,faces[:,i],fn)
  normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-12)
  display=('Left' if side=='l' else 'Right')+' '+(name.replace(' muscle',' tendon insertion surface' if footprint else ' tendon') if tendon else name).lower()
  key='ZA-clinical-'+re.sub('[^a-z0-9]+','-',display.lower()).strip('-')
  def add(a,dtype):
   while len(blob)%4:blob.append(0)
   offset=len(blob);blob.extend(np.asarray(a,dtype=dtype).tobytes());return offset
  po=add(pos,'<f4');no=add(np.rint(normals*32767),'<i2');io=add(faces,'<u4')
  record={'id':key,'name':display,'conceptId':key,'system':'connective','chunk':chunk,'positions':po,'normals':no,'indices':io,'vertexCount':len(pos),'indexCount':int(faces.size),'bounds':[pos.min(0).tolist(),pos.max(0).tolist()],'source':'Z-Anatomy / BodyParts3D','license':'CC-BY-SA-4.0','sourceObject':object_name,'sourceSelection':'Source insertion footprint object; not a complete tendon' if footprint else 'Tendon material faces' if tendon else 'Evaluated whole source object'}
  atlas['parts'].append(record);atlas['concepts'].append({'id':key,'name':display,'elements':[key]});records.append({**record,'registration':region+side});triangles+=len(faces);print(display,len(pos),len(faces),flush=True)
assert len(records)==16
(out/'clinical.bin').write_bytes(blob);compressed=gzip.compress(blob,compresslevel=9,mtime=0);(out/'clinical.bin.gz').write_bytes(compressed)
atlas['chunks'].append({'url':'/models/clinical.bin','bytes':len(blob),'gzip':'/models/clinical.bin.gz','gzipBytes':len(compressed)});atlas['triangles']+=triangles
atlas['scope']+=' Selected clinical ligaments and infraspinatus tendon regions and three rotator cuff insertion footprints from Z-Anatomy; healthy reference anatomy, no pathology or graft simulation.'
(out/'atlas.json').write_text(json.dumps(atlas,separators=(',',':')))
metadata={'source':'https://github.com/Z-Anatomy/Models-of-human-anatomy','archiveURL':'https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/master/Z-Anatomy.zip','archiveSHA256':hashlib.sha256(source.parent.joinpath('z-anatomy-v18.zip').read_bytes()).hexdigest(),'license':'CC-BY-SA-4.0','authors':['Gauthier Kervyn / Z-Anatomy','BodyParts3D / The Database Center for Life Science'],'baseRegistration':{'axes':'x,z,-y','scale':scale,'translation':shift.tolist()},'localRegistration':transforms,'adaptations':['Evaluated source modifiers with embedded scripts disabled','Selected source Tendon faces for infraspinatus; source insertion footprint objects for supraspinatus, subscapularis and teres minor (these are not full tendons)','Applied local uniform bone-envelope registration, triangulation and quantized normals','Reference surface meshes; no invented tears, grafts or ligament fibres'],'existingStructureReused':{'ids':['FJ1405','FJ1405M'],'name':'Calcaneal tendons','source':'Original BodyParts3D atlas; not duplicated'},'parts':records,'sha256':hashlib.sha256(blob).hexdigest()}
(out/'clinical-source.json').write_text(json.dumps(metadata,indent=2));print('DONE',len(records),triangles,len(blob),flush=True)
