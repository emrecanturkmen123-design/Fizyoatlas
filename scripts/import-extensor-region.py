"""Append the source-labelled proximal ECRB tendon component unchanged.

This is one contributor to the common extensor origin, not the full shared
tendon. Run with the export-tendon-completion-source.py output directory, then
repack-study-models.mjs. Existing meshes are not rewritten.
"""
import gzip, hashlib, json, sys
from pathlib import Path
import numpy as np

root = Path(__file__).resolve().parents[1]
output = root / 'public/models'
atlas = json.loads((output/'atlas.json').read_text())
registration = json.loads((output/'clinical-source.json').read_text())
local = json.loads((output/'tendon-completion-source.json').read_text())['newLocalRegistration']
assert not any(p['id'].startswith('ZA-extensor-region-') for p in atlas['parts'])
blob, records = bytearray(), []
chunk = len(atlas['chunks'])
for side, short in [('right', 'r'), ('left', 'l')]:
    name = 'Extensor carpi radialis brevis.' + short
    source = json.loads((Path(sys.argv[1])/(short+'.json')).read_text())[name]
    vertices, faces = np.array(source['p']), np.array(source['i'], dtype=np.uint32)
    parents = list(range(len(vertices)))
    def find(i):
        while parents[i] != i:
            parents[i] = parents[parents[i]]
            i = parents[i]
        return i
    for x, y, z in faces:
        parents[find(y)] = find(x)
        parents[find(z)] = find(x)
    components = {}
    for face in faces:
        components.setdefault(find(face[0]), []).append(face)
    candidates = [np.array(f, dtype=np.uint32) for f in components.values() if len(f) > 10]
    faces = max(candidates, key=lambda f: vertices[np.unique(f), 1].mean())
    used, inverse = np.unique(faces, return_inverse=True)
    vertices, faces = vertices[used], inverse.reshape(-1, 3).astype(np.uint32)
    vertices = vertices * registration['baseRegistration']['scale'] + np.array(registration['baseRegistration']['translation'])
    transform = local['elbow'+short]
    vertices = vertices * transform['scale'] + np.array(transform['translation'])
    normals = np.zeros_like(vertices)
    triangle = vertices[faces]
    normal = np.cross(triangle[:,1]-triangle[:,0], triangle[:,2]-triangle[:,0])
    for i in range(3):
        np.add.at(normals, faces[:,i], normal)
    normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-12)
    def append(array, dtype):
        while len(blob) % 4:
            blob.append(0)
        offset, data = len(blob), np.array(array, dtype=dtype).tobytes()
        blob.extend(data)
        return offset, hashlib.sha256(data).hexdigest()
    position, ph = append(vertices, '<f4')
    normal, nh = append(np.rint(normals*32767), '<i2')
    index, ih = append(faces, '<u4')
    key = 'ZA-extensor-region-'+side+'-ecrb-proximal'
    selection = 'Proximal connected component of ECRB Tendon-material faces; one contributor, not the full common extensor tendon'
    part = {'id': key, 'name': side.title()+' extensor carpi radialis brevis proximal tendon', 'conceptId': key, 'system': 'connective', 'chunk': chunk, 'positions': position, 'normals': normal, 'indices': index, 'vertexCount': len(vertices), 'indexCount': int(faces.size), 'bounds': [vertices.min(0).tolist(), vertices.max(0).tolist()], 'source': 'Z-Anatomy / BodyParts3D', 'license': 'CC-BY-SA-4.0', 'sourceObjects': [name], 'sourceSelection': selection}
    atlas['parts'].append(part)
    atlas['concepts'].append({'id': key, 'name': part['name'], 'elements': [key]})
    atlas['triangles'] += len(faces)
    records.append({'id': key, 'name': part['name'], 'sourceObjects': [name], 'sourceSelection': selection, 'registration': 'elbow'+short, 'vertices': len(vertices), 'triangles': len(faces), 'positionsSHA256': ph, 'normalsSHA256': nh, 'indicesSHA256': ih})
url = '/models/extensor-region.bin'
(root/'public'/url.lstrip('/')).write_bytes(blob)
compressed = gzip.compress(blob, compresslevel=9, mtime=0)
(root/'public'/(url+'.gz').lstrip('/')).write_bytes(compressed)
atlas['chunks'].append({'url': url, 'bytes': len(blob), 'gzip': url+'.gz', 'gzipBytes': len(compressed)})
atlas['scope'] += ' Source-labelled proximal ECRB tendon region alongside the common extensor origin footprint; not a full shared extensor tendon.'
(output/'atlas.json').write_text(json.dumps(atlas, separators=(',', ':')))
(output/'extensor-region-source.json').write_text(json.dumps({'source': registration['source'], 'archiveURL': registration['archiveURL'], 'archiveSHA256': registration['archiveSHA256'], 'license': registration['license'], 'authors': registration['authors'], 'parts': records, 'limitations': 'Only the proximal ECRB tendon component is added. Common extensor footprint and body are distinguished. Other contributing tendon bodies and a continuous patient-specific insertion are unavailable.'}, indent=2))
print('Imported', len(records), 'source proximal ECRB components,', len(compressed), 'compressed bytes')
