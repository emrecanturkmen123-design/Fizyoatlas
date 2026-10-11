"""Source-triangle extraction for hand/foot study modules. No generated tendon paths.
Run once after v40. Source colour divisions are educational, not histological.
"""
import ast,json,struct,hashlib,gzip,sys
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree
import DracoPy
from PIL import Image
from io import BytesIO
root=Path(__file__).resolve().parents[1];out=root/'public/models';atlas=json.loads((out/'atlas.json').read_text());source=Path(sys.argv[1]);decoded={};digests={}
old=[p for p in atlas['parts'] if p['id'].startswith('O3D-distal-')]
if old:
 assert all(p['chunk']==len(atlas['chunks'])-1 for p in old)
 atlas['triangles']-=sum(p['indexCount']//3 for p in old);atlas['parts']=[p for p in atlas['parts'] if p not in old];atlas['concepts']=[c for c in atlas['concepts'] if not c['id'].startswith('O3D-distal-')];atlas['chunks'].pop()
definitions=ast.parse((root/'scripts/import-open3d-tendons.py').read_text())
exec(compile(ast.Module(body=[n for n in definitions.body if isinstance(n,ast.FunctionDef) and n.name in ['clipped','compact','components']],type_ignores=[]),'<source-clipping>','exec'))
for region in ['upper-limb','lower-limb']:
 b=(source/region/(region+'.glb')).read_bytes();digests[region]=hashlib.sha256(b).hexdigest();n=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+n]);buf=b[28+n:];items={}
 for node in d['nodes']:
  if 'mesh' not in node:continue
  p=d['meshes'][node['mesh']]['primitives'][0];view=d['bufferViews'][p['extensions']['KHR_draco_mesh_compression']['bufferView']];m=DracoPy.decode(buf[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]);assert not any(k in node for k in ['matrix','translation','rotation','scale'])
  score=None;texture=d['materials'][p.get('material',0)].get('pbrMetallicRoughness',{}).get('baseColorTexture')
  if texture and m.tex_coord is not None:
   im=d['images'][d['textures'][texture['index']]['source']];iv=d['bufferViews'][im['bufferView']];pixels=np.asarray(Image.open(BytesIO(buf[iv.get('byteOffset',0):iv.get('byteOffset',0)+iv['byteLength']])).convert('RGB'),dtype=float)/255
   uv=m.tex_coord%1;rgb=pixels[np.clip((uv[:,1]*len(pixels)).astype(int),0,len(pixels)-1),np.clip((uv[:,0]*pixels.shape[1]).astype(int),0,pixels.shape[1]-1)];score=(rgb[:,0]-rgb[:,1])+.5*(rgb[:,0]-rgb[:,2])
  items[node['name']]=(m.points,m.faces,score)
 decoded[region]=items
def base(name):
 p=next(p for p in atlas['parts'] if p['name'].lower()==name);b=(root/'public'/atlas['chunks'][p['chunk']]['url'].lstrip('/')).read_bytes();return np.frombuffer(b,dtype='<f4',count=p['vertexCount']*3,offset=p['positions']).reshape(-1,3).copy()
transforms={}
for side in ['right','left']:
 for region,names in [('hand',[('Radius.r','radius'),('Ulna.r','ulna'),('Scaphoid.r','scaphoid')]),('foot',[('Tibia.r','tibia'),('Fibula.r','fibula'),('Talus.r','talus'),('Calcaneus.r','calcaneus')])]:
  a=[];b=[]
  for name,targetname in names:
   v=decoded['upper-limb' if region=='hand' else 'lower-limb'][name][0].copy()
   if side=='left':v[:,0]*=-1
   target=base(side+' '+targetname)
   if targetname in ['radius','ulna','tibia','fibula']:
    v=v[v[:,1]<v[:,1].min()+.2*np.ptp(v[:,1])];target=target[target[:,1]<target[:,1].min()+.2*np.ptp(target[:,1])]
   a.extend([v.min(0),v.max(0)]);b.extend([target.min(0),target.max(0)])
  a=np.array(a);b=np.array(b);ac=a.mean(0);bc=b.mean(0);scale=np.sum((a-ac)*(b-bc))/np.sum((a-ac)**2);shift=bc-scale*ac;transforms[side+'-'+region]={'scale':float(scale),'translation':shift.tolist(),'envelopeRmsMm':float(np.sqrt(np.mean(np.sum((a*scale+shift-b)**2,axis=1)))*1000)}
specs=[
 ('hand','flexor digitorum profundus tendon','Flexor digitorum profundus.r','distal'),
 ('hand','flexor digitorum superficialis tendon','Flexor digitorum superficialis humero-ulnar head.r','distal'),
 ('hand','extensor digitorum tendon','Extensor digitorum.r','distal'),
 ('hand','flexor pollicis longus tendon','Flexor pollicis longus.r','distal'),
 ('hand','extensor pollicis longus tendon','Extensor pollicis longus.r','distal'),
 ('hand','wrist flexor retinaculum','Flexor retinaculum','whole'),
 ('hand','wrist extensor retinaculum','Extensor retinaculum of wrist','whole'),
 ('hand','digital fibrous sheath','Fibrous sheath of digits of hand','whole'),
 ('hand','digital synovial sheath','Synovial sheaths of fingers','whole'),
 ('hand','common flexor tendon sheath','Common flexor tendon sheath','whole'),
 ('foot','tibialis anterior tendon','Tibialis anterior muscle.r','distal'),
 ('foot','tibialis posterior tendon','Tibialis posterior muscle.r','distal-long'),
 ('foot','fibularis longus tendon','Fibularis longus muscle.r','distal'),
 ('foot','fibularis brevis tendon','Fibularis brevis muscle.r','distal'),
 ('foot','ankle flexor retinaculum','Flexor retinaculum of ankle.r','whole'),
 ('foot','ankle extensor retinacula','Superior extensor retinaculum of ankle.r|Inferior extensor retinaculum.r','whole'),
 ('foot','fibular retinacula','Superior fibular retinaculum.r|Inferior fibular retinaculum.r','whole'),
 ('foot','tibialis tendon sheaths','Tibialis anterior tendon sheath.r|Tibialis posterior tendon sheath.r','whole'),
 ('foot','fibular tendon sheaths','Common tendon sheath of fibularis muscles.r|Plantar tendinous sheath of fibularis longus.r','whole'),
]
blob=bytearray();records=[];chunk=len(atlas['chunks'])
for side in ['right','left']:
 for region,key,names,mode in specs:
  vs=[];fs=[];boundaries=[];offset=0
  for name in names.split('|'):
   v,f,score=decoded['upper-limb' if region=='hand' else 'lower-limb'][name]
   if mode!='whole':
    candidates=[]
    p,t=clipped(v,f,score,.20,False);candidates=components(p,t)
    # All distal branches are retained. The source texture's tissue boundary
    # varies in both U and V; a single V threshold would lose most of the tendon.
    joint=decoded['upper-limb' if region=='hand' else 'lower-limb']['Radius.r' if region=='hand' else 'Tibia.r'][0][:,1].min()
    candidates=[(p,t) for p,t in candidates if p[:,1].min()<joint+(.06 if region=='hand' else .10)]
    assert candidates
    v=np.concatenate([p for p,t in candidates]);f=np.concatenate([t+sum(len(a) for a,b in candidates[:i]) for i,(p,t) in enumerate(candidates)])
   tr=transforms[side+'-'+region];v=v.copy()
   if side=='left':v[:,0]*=-1;f=f[:,[0,2,1]]
   v=v*tr['scale']+np.array(tr['translation']);vs.append(v);fs.append(f+offset);offset+=len(v)
  v=np.concatenate(vs);f=np.concatenate(fs);n=np.zeros_like(v);q=v[f];fn=np.cross(q[:,1]-q[:,0],q[:,2]-q[:,0])
  for i in range(3):np.add.at(n,f[:,i],fn)
  n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12)
  def add(a,dtype):
   while len(blob)%4:blob.append(0)
   off=len(blob);data=np.array(a,dtype=dtype).tobytes();blob.extend(data);return off,hashlib.sha256(data).hexdigest()
  po,ph=add(v,'<f4');no,nh=add(np.rint(n*32767),'<i2');io,ih=add(f,'<u4');id='O3D-distal-'+side+'-'+key.replace(' ','-');display=side.title()+' '+key
  part={'id':id,'name':display,'conceptId':id,'system':'connective','clinicalKey':key,'modelRole':'body','chunk':chunk,'positions':po,'normals':no,'indices':io,'vertexCount':len(v),'indexCount':int(f.size),'bounds':[v.min(0).tolist(),v.max(0).tolist()],'source':'Open3DModel / AnatomyTOOL','license':'CC-BY-SA-4.0'}
  atlas['parts'].append(part);atlas['concepts'].append({'id':id,'name':display,'elements':[id]});atlas['triangles']+=len(f)
  records.append({'id':id,'key':key,'side':side,'region':region,'sourceObjects':names.split('|'),'sourceSelection':mode,'vertices':len(v),'triangles':len(f),'positionsSHA256':ph,'normalsSHA256':nh,'indicesSHA256':ih});print(display,len(v),len(f))
url='/models/distal-tendons.bin';(root/'public'/url.lstrip('/')).write_bytes(blob);gz=gzip.compress(blob,compresslevel=9,mtime=0);(root/'public'/(url+'.gz').lstrip('/')).write_bytes(gz);atlas['chunks'].append({'url':url,'bytes':len(blob),'gzip':url+'.gz','gzipBytes':len(gz)})
(out/'atlas.json').write_text(json.dumps(atlas,separators=(',',':')))
(out/'distal-tendon-source.json').write_text(json.dumps({'source':'https://anatomytool.org/open3dmodel-create','credits':'https://anatomytool.org/open3dmodel-credit','license':'CC-BY-SA-4.0','glbSHA256':digests,'sourceSelectionMethod':'GLTF UVs use image top origin. Source tissue colour classified by (R-G)+0.5*(R-B) <= 0.20, triangle edges interpolated at threshold; all distal components retained. Named sheath/retinaculum objects retain all source triangles.','registration':transforms,'parts':records,'limitations':'Source-colour-defined distal tendon surfaces and named source retinacula/sheaths. Uniform bone-envelope registration, left mirrored. Educational tissue boundaries; not microscopic segmentation, strain, tears, gliding or individual pulley reconstruction.'},indent=2))
