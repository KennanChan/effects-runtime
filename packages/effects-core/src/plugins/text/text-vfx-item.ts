import * as spec from '@galacean/effects-specification';
import { Vector3 } from '@galacean/effects-math/es/core/index';
import { trianglesFromRect } from '../../math';
import { VFXItem } from '../../vfx-item';
import type { Composition } from '../../composition';
import type { HitTestTriangleParams, BoundingBoxTriangle } from '../interact/click-handler';
import { HitTestType } from '../interact/click-handler';
import { TextItem } from './text-item';
import type { SpriteRenderData } from '../sprite/sprite-mesh';
import { TextMesh } from './text-mesh';

export class TextVFXItem extends VFXItem<TextItem> {
  override composition: Composition;
  public cachePrefix?: string;
  textContext: spec.TextContent;

  override get type (): spec.ItemType {
    return spec.ItemType.text;
  }

  override onConstructed (props: spec.TextItem) {
    this.textContext = props.content;
  }

  override onLifetimeBegin (composition: Composition, content: TextItem) {
    content.active = true;
    this.content?.mesh?.setItems([this.content]);
    this.content.updateTexture();
  }

  override onItemRemoved (composition: Composition, content?: TextItem) {
    if (content) {
      delete content.mesh;
      composition.destroyTextures(content.getTextures());
    }
  }

  override onItemUpdate (dt: number, lifetime: number) {
    if (!this.content) {
      return ;
    }
    this.content?.updateTime(this.time);
  }

  override getCurrentPosition () {
    const pos = new Vector3();

    this.transform.assignWorldTRS(pos);

    return pos;
  }

  /**
   * 获取图层包围盒的类型和世界坐标
   * @returns
   */
  override getBoundingBox (): BoundingBoxTriangle | void {
    const item: TextItem = this.content;

    if (!item || !this.transform) {
      return;
    }
    const worldMatrix = this.transform.getWorldMatrix();
    const size = item.startSize;
    const triangles = trianglesFromRect(Vector3.ZERO, size.x / 2, size.y / 2);

    triangles.forEach(triangle => {
      worldMatrix.transformPoint(triangle.p0 as Vector3);
      worldMatrix.transformPoint(triangle.p1 as Vector3);
      worldMatrix.transformPoint(triangle.p2 as Vector3);
    });

    return {
      type: HitTestType.triangle,
      area: triangles,
    };
  }

  override getHitTestParams (force?: boolean): HitTestTriangleParams | void {
    const item = this.content;
    const ui = item && item.interaction;

    if ((force || ui) && item.mesh?.mesh && item) {
      const area = this.getBoundingBox();

      if (area) {
        return {
          behavior: item.interaction?.behavior || 0,
          type: area.type,
          triangles: area.area,
          backfaceCulling: item.renderer.side === spec.SideMode.FRONT,
        };
      }
    }
  }

  override getRenderData (): SpriteRenderData {
    return this.content.getRenderData(this.content.time);
  }

  protected override doCreateContent (composition: Composition) {
    const { emptyTexture } = composition.getRendererOptions();

    return new TextItem(this.textContext, { emptyTexture }, this);
  }

  createWireframeMesh (item: TextItem, color: spec.vec4): TextMesh {
    const spMesh = new TextMesh(this.composition.getEngine(), { wireframe: true, ...item.renderInfo }, this.composition);

    spMesh.mesh.setVisible(true);
    spMesh.setItems([item]);
    spMesh.mesh.material.setVector3('uFrameColor', Vector3.fromArray(color));
    spMesh.mesh.priority = 999;

    return spMesh;
  }
}
