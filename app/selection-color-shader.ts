import {Color,type Texture} from 'three';
import type {Atlas} from './anatomy';
import type {selectionPalette} from './selection-palette';

export function writeSelectionPalette(data:Float32Array,atlas:Atlas,palette:ReturnType<typeof selectionPalette>){
 data.fill(0);const converted=new Map<string,number[]>();
 atlas.parts.forEach((p,i)=>{const hex=palette.partColors.get(p.id);if(!hex)return;let color=converted.get(hex);if(!color){color=new Color(hex).toArray();converted.set(hex,color);}data.set([...color,1],i*4);});
}
type Shader={uniforms:Record<string,{value:unknown}>;vertexShader:string;fragmentShader:string};
export function applySelectionPalette(shader:Shader,texture:Texture){
 shader.uniforms.selectionColorState={value:texture};
 shader.vertexShader='uniform sampler2D selectionColorState; varying vec4 partSelectionColor;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npartSelectionColor = texture2D(selectionColorState, vec2((partIndex + 0.5) / stateWidth, 0.5));');
 shader.fragmentShader='varying vec4 partSelectionColor;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','if (partSelected > 0.5 && partSelectionColor.a > 0.5) diffuseColor.rgb = partSelectionColor.rgb;\n#include <roughnessmap_fragment>');
}
