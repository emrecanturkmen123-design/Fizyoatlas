import type {Atlas} from './anatomy';
/** Prefer a source body over its older footprint without breaking saved routes. */
export function tendonParts(atlas:Atlas,key:string,side:'left'|'right'){
 const candidates=atlas.parts.filter(p=>p.system==='connective'&&new RegExp(`\\b${side}\\b`,'i').test(p.name)&&(p.clinicalKey===key||p.name.toLowerCase()===`${side} ${key}`));
 const bodies=candidates.filter(p=>p.modelRole==='body');
 return bodies.length?bodies:candidates;
}
