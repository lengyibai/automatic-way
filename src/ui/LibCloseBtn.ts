import { LibImgSprite } from "./LibImgSprite";
import { LibContainerSize } from "./LibContainerSize";

import { _animateC } from "@/utils/animate";

interface Params {
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
  /** 按钮素材 */
  texture: any;
  /** 点击回调 */
  onClick: () => void;
}

/** @description 右上角关闭按钮，支持悬浮旋转动画 */
export class LibCloseBtn extends LibContainerSize {
  /** 按钮 */
  private btn: LibImgSprite;

  constructor(params: Params) {
    super(50, 50);

    this.eventMode = "static";
    this.cursor = "pointer";

    const { width = 70, height = 70, texture, onClick } = params;

    this.btn = new LibImgSprite({
      texture,
      width,
      height,
    });

    this.addChild(this.btn);
    this.btn.x = this.width / 2 - this.btn.width / 2;
    this.btn.y = this.height / 2 - this.btn.height / 2;
    this.btn.tint = "#67707B";

    _animateC(this);
    this.on("pointerup", () => {
      onClick();
    });
  }
}
