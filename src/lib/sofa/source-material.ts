import { Color, LinearFilter, LinearMipmapLinearFilter, MeshPhysicalMaterial, NoColorSpace, RED_GREEN_RGTC2_Format, RepeatWrapping, RG11_EAC_Format, RGFormat, ShaderChunk, SRGBColorSpace, Texture, Vector2 } from 'three';
import { sourceFabric } from './source-model';
import { HEX_MAP_FRAGMENT, HEX_NORMAL_FRAGMENT_MAPS, HEX_SHEEN_ROUGHNESS_SAMPLE, HEX_TILING_FUNCTIONS } from './source-fabric-shader';

type Fabric = NonNullable<ReturnType<typeof sourceFabric>>;

/** KTX2 may declare sRGB even for a normal map: sampler role overrides file metadata. */
export function fabricTexture(source: Texture, role: 'color' | 'normal' | 'sheen' | 'gi', fabric: Fabric, anisotropy: number) {
  const texture = source.clone();
  texture.colorSpace = role === 'color' ? SRGBColorSpace : NoColorSpace;
  texture.flipY = false;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  if (role === 'gi') {
    texture.channel = 1;
  } else {
    const settings = fabric.settings;
    const repeat = role === 'normal' && 'normalRepeat' in settings ? settings.normalRepeat
      : role === 'sheen' && 'sheenRoughnessRepeat' in settings ? settings.sheenRoughnessRepeat : settings.repeat;
    texture.repeat.set(repeat.x, repeat.y);
    texture.rotation = fabric.rotation;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.anisotropy = Math.min(16, anisotropy);
  }
  texture.needsUpdate = true;
  return texture;
}

/** Keep the original per-fabric response and packed GI/normal interpretation. */
export function createSourceMaterial(fabric: Fabric, sourceTextures: Texture[], anisotropy: number) {
  const [color, normal, gi, sheen] = sourceTextures;
  const settings = fabric.settings;
  const material = new MeshPhysicalMaterial({
    color: '#ffffff',
    map: fabricTexture(color, 'color', fabric, anisotropy),
    normalMap: fabricTexture(normal, 'normal', fabric, anisotropy),
    normalScale: new Vector2(settings.normal.scale.x, settings.normal.scale.y),
    roughness: settings.roughness.value, metalness: settings.metalness.value,
    reflectivity: settings.reflectivity.value, clearcoat: settings.clearcoat.value,
    clearcoatRoughness: settings.clearcoatRoughness.value, iridescence: settings.iridescence.value,
    envMapIntensity: settings.environment.value,
    sheen: settings.sheen.value, sheenRoughness: settings.sheenRoughness.value,
    sheenColor: new Color(fabric.sheenColor),
    sheenRoughnessMap: sheen ? fabricTexture(sheen, 'sheen', fabric, anisotropy) : null,
    lightMap: fabricTexture(gi, 'gi', fabric, anisotropy), lightMapIntensity: settings.lightMapIntensity.value,
    aoMapIntensity: settings.aoMapIntensity.value,
  });
  material.aoMap = material.lightMap;
  const hex = 'hexTiling' in settings && settings.hexTiling.enabled;
  const packedNormal = [RGFormat, RG11_EAC_Format, RED_GREEN_RGTC2_Format].some(format => format === normal.format);
  if (packedNormal) material.defines = { USE_PACKED_NORMALMAP: '' };
  material.onBeforeCompile = shader => {
    shader.uniforms.giScale = { value: settings.giScale.value };
    shader.uniforms.sheenFresnel = { value: settings.sheenFresnel.value };
    shader.uniforms.sheenFresnelPower = { value: settings.sheenFresnelPower.value };
    const normalChunk = ShaderChunk.normal_fragment_maps.replace('mapN.xy *= normalScale;', `
      #ifdef USE_PACKED_NORMALMAP
        mapN.z = sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) );
      #endif
      mapN.xy *= normalScale;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', `uniform float giScale;\nuniform float sheenFresnel;\nuniform float sheenFresnelPower;\n${hex ? HEX_TILING_FUNCTIONS : ''}\nvoid main() {`)
      .replace('#include <map_fragment>', hex ? HEX_MAP_FRAGMENT : ShaderChunk.map_fragment)
      .replace('#include <normal_fragment_maps>', hex ? HEX_NORMAL_FRAGMENT_MAPS : normalChunk)
      .replace('#include <lights_fragment_maps>', ShaderChunk.lights_fragment_maps.replace('lightMapTexel.rgb', 'vec3( lightMapTexel.g ) * giScale'))
      .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>\n#ifdef USE_SHEEN_ROUGHNESSMAP\nmaterial.sheenRoughness = clamp( ${hex ? HEX_SHEEN_ROUGHNESS_SAMPLE : 'texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).g'}, 0.07, 1.0 );\n#endif`)
      .replace('outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;', `float sheenFresnelTerm = pow( saturate( 1.0 - dot( geometryNormal, geometryViewDir ) ), sheenFresnelPower );
        outgoingLight += ( sheenSpecularDirect + sheenSpecularIndirect ) * mix( 1.0, sheenFresnelTerm, sheenFresnel );`);
  };
  material.customProgramCacheKey = () => `sofa-fabric-v2-${fabric.color}-${hex}-${packedNormal}`;
  return material;
}
