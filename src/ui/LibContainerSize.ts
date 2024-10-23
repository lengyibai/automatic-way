import { Container } from "pixi.js";

import { LibFillClick } from "./LibFillClick";
import { LibRectBgColor } from "./LibRectBgColor";

/** @description 可设置大小的容器 */
export class LibContainerSize extends Container {
  /** 填充容器 */
  private fill: LibFillClick;
  /** 背景色填充 */
  private bgColorFill: LibRectBgColor;

  constructor(width: number, height: number, bgColor: string) {
    super();

    this.bgColorFill = new LibRectBgColor({
      width,
      height,
      bgColor,
    });
    this.addChild(this.bgColorFill);
  }
}
