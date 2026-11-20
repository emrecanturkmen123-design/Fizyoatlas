import { Color, DataTexture, NearestFilter, RGBAFormat } from 'three';
import { rootGroup, sensoryLevels } from './clinical-model';

// Educational projection of approximate anterior and posterior contours onto the
// packaged skin mesh. Surface territories vary and overlap in individual patients.
export const surfaceLevels = sensoryLevels.map(level => level.id);
const halfWidth = .35, height = 1.73;
const width = 512, rows = 768;
const chestFront = [1.395, 1.366, 1.335, 1.305, 1.275, 1.244, 1.214, 1.183, 1.152, 1.122, 1.092, 1.055, 1.012];
const chestBack = [1.411, 1.386, 1.361, 1.334, 1.307, 1.277, 1.247, 1.216, 1.184, 1.151, 1.119, 1.087, 1.053];

export function dermatomeBand(x: number, y: number, front: boolean): string {
  x = Math.abs(x);
  if (y > 1.512) {
    if (!front) return y > 1.670 ? 'V1' : 'C2';
    return y > 1.605 ? 'V1' : y > 1.554 ? 'V2' : 'V3';
  }
  if (y > 1.467 + .22 * x) return 'C3';
  if (y > 1.405 + .24 * x) return 'C4';

  // The arm runs down and outward in this reference pose.
  const armInner = .155 + .022 * Math.max(0, (y - 1.16) / .23)
    + .029 * Math.max(0, Math.min(1,(1.12-y)/.14));
  if (x > armInner && y > .724 && y < 1.405) {
    if (y > 1.115) {
      const armMiddle = .198 + (1.31-y)*.14;
      return x > armMiddle ? 'C5' : y > 1.285 ? 'T2' : 'T1';
    }
    const wrist = Math.max(0, Math.min(1, (1.115-y)/.275));
    if (x > .232 + .054*wrist) return 'C6';
    if (x > .213 + .035*wrist) return 'C7';
    return y < .97 - .12*(x-.18) ? 'C8' : 'T1';
  }

  if (y >= 1.01 - .12 * x) {
    const centerOffset = front ? x*x*2.1 : -x*.24 + x*x*.4;
    const band = (front ? chestFront : chestBack).findIndex(limit => y + centerOffset > limit);
    return band === 0 ? 'C4' : 'T'+(band < 0 ? 12 : Math.min(12,band));
  }

  if (y >= .71) {
    if (front) return y > .875 + .45*x ? 'L1' : 'L2';
    const spread = Math.hypot(x*1.25, (y-.843)*.72);
    if(Math.hypot(x/.025,(y-.826)/.034)<1) return 'S4–5';
    if (spread < .083) return 'S3';
    if (spread < .137 || (y < .825 && x < .123 + (y-.71)*.07)) return 'S2';
    const waist = y + .30*x;
    if (waist > 1.014) return 'L1';
    if (waist > .982) return 'L2';
    if (waist > .950) return 'L3';
    if (waist > .918) return 'L4';
    return 'L5';
  }

  if (y < .115) {
    if (!front || x > .122 + .1*y) return 'S1';
    return x < .055 ? 'L4' : 'L5';
  }
  if (front) {
    if (y > .565 + .75*x) return 'L2';
    if (y > .443 + .45*x) return 'L3';
    return x < .078 + .025*y ? 'L4' : 'L5';
  }
  const kneeTaper=Math.max(0,Math.min(1,(y-.32)/.16));
  if (y > .32 && x < .059 + .065*kneeTaper && x > .056 - .045*kneeTaper) return 'S2';
  if (x > .094 + .026*y) return 'L5';
  return x > .06 ? 'S1' : 'L4';
}

// Share the same front/back divider between pointer hits and the skin shader.
const divider = (x: number, y: number) =>
  Math.abs(x) > .181 && y < .91 && y > .72 ? .035 : -.029;
export function dermatomeAt(x: number, y: number, z: number) {
  return dermatomeBand(x,y,z >= divider(x,y));
}

export function makeDermatomeTextures() {
  const mask = new Uint8Array(width*rows*2*4);
  const palette = new Uint8Array((surfaceLevels.length+1)*4);
  const color = new Color();
  const shade = new Color('#fcf3e9');
  const ids = new Map(surfaceLevels.map((level,index)=>[level,index+1]));
  for(const [level,index] of ids){
    const group=rootGroup(level)!;
    color.set(group.color).lerp(shade, .32 + (index%3)*.085);
    palette.set([Math.round(color.r*255),Math.round(color.g*255),Math.round(color.b*255),255],index*4);
  }
  for(let row=0;row<rows*2;row++){
    const y=(row%rows+.5)/rows*height,front=row<rows;
    for(let col=0;col<width;col++){
      const x=(col+.5)/width*halfWidth*2-halfWidth;
      mask[(row*width+col)*4]=ids.get(dermatomeBand(x,y,front))??0;
    }
  }
  const prepare=(data:Uint8Array<ArrayBuffer>,w:number,h:number)=>{
    const texture=new DataTexture(data,w,h,RGBAFormat);
    texture.magFilter=texture.minFilter=NearestFilter;
    texture.needsUpdate=true;
    return texture;
  };
  return {mask:prepare(mask,width,rows*2),palette:prepare(palette,surfaceLevels.length+1,1)};
}

export const dermatomeShader = `
vec2 dermUv = vec2(clamp(dermPosition.x / ${halfWidth*2} + 0.5, 0.001, 0.999),
  clamp(dermPosition.y / ${height}, 0.001, 0.999) * 0.5);
float divider = abs(dermPosition.x) > 0.181 && dermPosition.y < 0.91 && dermPosition.y > 0.72 ? 0.035 : -0.029;
dermUv.y += dermPosition.z < divider ? 0.5 : 0.0;
float band = floor(texture2D(dermMask, dermUv).r * 255.0 + 0.5);
if (band > 0.5) {
  vec3 bandColor = texture2D(dermPalette, vec2((band + 0.5) / ${surfaceLevels.length+1}.0, 0.5)).rgb;
  vec2 texel = vec2(${1/width}, ${1/(2*rows)});
  float rx = floor(texture2D(dermMask, dermUv + vec2(texel.x,0.0)).r * 255.0 + 0.5);
  float ry = floor(texture2D(dermMask, dermUv + vec2(0.0,texel.y)).r * 255.0 + 0.5);
  float selected = (1.0 - step(0.5, abs(dermActive - band))) * step(0.0, dermPosition.x * dermSide);
  float edge = max(step(0.5,abs(band-rx)), step(0.5,abs(band-ry)));
  diffuseColor.rgb = mix(bandColor, bandColor * 0.65, selected);
  diffuseColor.rgb = mix(diffuseColor.rgb, bandColor * 0.46, edge * 0.72);
}
`;
