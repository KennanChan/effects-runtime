import type { Vector3 } from '@galacean/effects-math/es/core/vector3';
import type * as spec from '@galacean/effects-specification';
import { PLAYER_OPTIONS_ENV_EDITOR } from '../../constants';
import type { GPUCapabilityDetail, SharedShaderWithSource } from '../../render';
import { GLSLVersion } from '../../render';
import { itemFrag, itemFrameFrag, itemVert } from '../../shader';
import type { Transform } from '../../transform';
import type { SpriteComponent, SpriteItemRenderInfo } from './sprite-item';

export type SpriteRenderData = {
  life: number,
  transform: Transform,
  visible?: boolean,
  startSize?: Vector3,
  color?: spec.vec4,
  texOffset?: spec.vec4,
  active?: boolean,
  anchor?: spec.vec3,
};

export type SpriteRegionData = {
  color: spec.vec4,
  position: spec.vec3,
  quat: spec.vec4,
  size: spec.vec2,
};

export let maxSpriteMeshItemCount = 8;
export let maxSpriteTextureCount = 8;

export function setSpriteMeshMaxItemCountByGPU (gpuCapability: GPUCapabilityDetail) {
  // 8 or 16
  maxSpriteTextureCount = Math.min(gpuCapability.maxFragmentTextures, 16);
  if (gpuCapability.maxVertexUniforms >= 256) {
    return maxSpriteMeshItemCount = 32;
  } else if (gpuCapability.maxVertexUniforms >= 128) {
    return maxSpriteMeshItemCount = 16;
  }
  maxSpriteTextureCount = 8;
}

export function getImageItemRenderInfo (item: SpriteComponent): SpriteItemRenderInfo {
  const { renderer } = item;
  const { blending, side, occlusion, mask, maskMode, order } = renderer;
  const blendingCache = +blending;
  const cachePrefix = item.cachePrefix || '-';

  return {
    side,
    occlusion,
    blending,
    mask,
    maskMode,
    cachePrefix,
    cacheId: `${cachePrefix}.${+side}+${+occlusion}+${blendingCache}+${order}+${maskMode}.${mask}`,
  };
}

export function spriteMeshShaderFromFilter (level: number, options?: { count?: number, ignoreBlend?: boolean, wireframe?: boolean, env?: string }): SharedShaderWithSource {
  const { count = 2, env = '', ignoreBlend, wireframe } = options ?? {};
  const marcos: [key: string, val: boolean | number][] = [
    ['MAX_ITEM_COUNT', count],
    ['PRE_MULTIPLY_ALPHA', false],
    ['ENV_EDITOR', env === PLAYER_OPTIONS_ENV_EDITOR],
    ['USE_BLEND', !ignoreBlend],
    ['MAX_FRAG_TEX', maxSpriteTextureCount >= 16 ? 16 : 8],
  ];
  const fragment = wireframe ? itemFrameFrag : itemFrag;
  const vertex = itemVert;

  return {
    fragment,
    vertex,
    glslVersion: level === 1 ? GLSLVersion.GLSL1 : GLSLVersion.GLSL3,
    marcos,
    shared: true,
  };
}

export function spriteMeshShaderIdFromRenderInfo (renderInfo: SpriteItemRenderInfo, count: number): string {
  return `${renderInfo.cachePrefix}_effects_sprite_${count}`;
}

export function spriteMeshShaderFromRenderInfo (renderInfo: SpriteItemRenderInfo, count: number, level: number, env?: string): SharedShaderWithSource {
  const { wireframe } = renderInfo;
  const shader = spriteMeshShaderFromFilter(level, {
    count,
    wireframe,
    env,
  });

  shader.shared = true;
  if (!wireframe) {
    shader.cacheId = spriteMeshShaderIdFromRenderInfo(renderInfo, count);
  }

  return shader;
}

// TODO: 只有单测用
export function setMaxSpriteMeshItemCount (count: number) {
  maxSpriteMeshItemCount = count;
}

export function setSpriteMeshMaxFragmentTextures (count: number) {
  maxSpriteTextureCount = count;
}
