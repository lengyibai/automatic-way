import Decimal from "decimal.js";
import * as PIXI from "pixi.js";

import { LibFillClick } from "./LibFillClick";
import { LibRectBgColor } from "./LibRectBgColor";

import { _isPad, _isPhone, _touchMoveView } from "@/utils/tool";
import { _overflowHidden } from "@/utils/pixiTool";

//输入框
const input = document.createElement("input");
input.type = "text";
document.body.appendChild(input);
input.style.position = "fixed";
input.style.top = "0";
input.style.opacity = "0";
input.style.fontSize = "25px";
// input.style.color = "transparent";
input.style.border = "none";
input.style.outline = "none";
// input.style.width = "25px";
input.style.transform = "translate(-50%, -50%)";
input.style.transformOrigin = "center center";
input.style.pointerEvents = "none";
// input.style.backgroundColor = "transparent";

interface InputFieldOptions {
  /** 字体大小 */
  fontSize?: number;
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
  /** 背景颜色 */
  backgroundColor?: string | number;
  /** 文字颜色 */
  textColor?: string;
  /** 初始值 */
  value?: string;
  /** 是否整数 */
  integer?: boolean;
  /** 是否允许输入负数 */
  isNegative?: boolean;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 对齐方式 */
  align?: "left" | "center";
  /** 失去焦点回调 */
  onBlur?: (text: number | string) => void;
}

export class InputField extends PIXI.Container {
  /** 文本 */
  private text: PIXI.Text;
  /** 光标 */
  private cursorLine: CursorLine;
  /** 内容 */
  private content: string;
  /** 光标位置 */
  private cursorIndex: number;
  /** 是否聚焦 */
  private isFocused: boolean;
  /** 最小值 */
  private min: number;
  /** 最大值 */
  private max: number;
  /** 是否整数 */
  private integer: boolean;
  /** 是否负数 */
  private isNegative: boolean;
  /** 对齐方式 */
  private align: "left" | "center";

  constructor({
    fontSize = 24,
    width = 300,
    height = 55,
    textColor = "#fff",
    value = "",
    integer = false,
    isNegative = false,
    min = -Infinity,
    max = Infinity,
    maxLength = 10,
    align = "left",
    onBlur = () => {},
  }: InputFieldOptions) {
    super();

    this.x = 5;

    this.eventMode = "static";
    this.cursor = "text";

    this.content = value;
    this.cursorIndex = this.content.length;
    this.isFocused = true;
    this.min = min;
    this.max = max;
    this.integer = integer;
    this.isNegative = isNegative;
    this.align = align;
    input.maxLength = maxLength;

    //如果为电脑，则显示输入框
    if (!_isPhone) {
      input.style.opacity = "0";
    }

    // 背景
    const background = new LibFillClick(width, height);
    this.addChild(background);
    _overflowHidden(this);

    //创建文本
    this.text = new PIXI.Text(this.content, {
      fill: textColor,
      fontSize,
      align: this.align,
    });
    this.text.position.set(10, (height - this.text.height) / 2);
    this.addChild(this.text);

    // 创建光标
    this.cursorLine = new CursorLine(textColor, this.text.height);
    this.updateCursorPos();
    this.addChild(this.cursorLine);

    this.on("pointertap", this.onFocus.bind(this));

    // 键盘事件
    window.addEventListener("keydown", this.onKeyDown.bind(this));
    window.addEventListener("pointerup", this.onGlobalPointerDown.bind(this, onBlur));

    //输入框事件
    input.addEventListener("input", () => {
      if (!this.isFocused) return;
      this.content = input.value;
      this.text.text = this.content;
      this.cursorIndex = this.content.length;
      this.updateCursorPos();
    });

    //禁用原生输入框上下光标移动
    input.addEventListener("keydown", (e) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End",
          "PageUp",
          "PageDown",
        ].includes(e.key)
      ) {
        e.preventDefault();
      }
    });

    // 默认失去焦点
    this.onBlur();
  }

  /** @description 设置最大值 */
  setMax(max: number) {
    this.max = max;
  }

  /** @description 设置值 */
  setValue(value: string | number) {
    this.content = value.toString();
    this.text.text = this.content;
  }

  /** @description 设置禁用状态 */
  setDisabled(disabled: boolean) {
    if (disabled) {
      this.alpha = 0.5;
      this.eventMode = "none";
    } else {
      this.alpha = 1;
      this.eventMode = "static";
    }
  }

  /** @description 聚焦 */
  private onFocus() {
    this.setFocusState(true);
    input.value = this.content;
    this.cursorIndex = this.content.length;
    this.updateCursorPos();

    setTimeout(() => {
      (_isPhone || _isPad) && _touchMoveView.onFocus();
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }, 100);
  }

  /** @description 失去焦点 */
  private onBlur(onBlur?: (text: number | string) => void) {
    if (!this.isFocused) return;

    this.setFocusState(false);
    input.blur();

    if (onBlur) {
      //如果为空，则使用最小值
      if (this.content === "") {
        this.setValue(this.min);
      }

      //如果是正无穷，则不处理
      if (this.content === "∞") return;
      this.setValue(parseFloat(this.content) || 0);

      //如果要求整数，则取整
      if (this.integer) {
        this.setValue(parseInt(this.content));
      }

      //如果存在最大值，且输入值大于最大值，则使用最大值
      if (this.max && Number(this.content) > this.max) {
        this.setValue(this.max);
      }

      //如果不是负数，输入值小于最小值，则使用最小值
      if (!this.isNegative && Number(this.content) < this.min) {
        this.content = this.min.toString();
      }

      //保留两位小数且不四舍五入
      const value = new Decimal(this.content);
      this.content = parseFloat(value.toFixed(2, Decimal.ROUND_DOWN)).toString();

      this.setValue(this.content);
      onBlur(Number(this.content));
    }
  }

  /** @description 设置焦点状态 */
  private setFocusState(isFocused: boolean) {
    this.isFocused = isFocused;
    this.cursorLine.setCursorState(isFocused);
  }

  /** @description 如果点击位置没有在输入框，则设置为失去焦点状态 */
  private onGlobalPointerDown(onBlur: (text: number | string) => void, event: MouseEvent) {
    const bounds = this.getBounds();
    if (!bounds.contains(event.clientX, event.clientY)) {
      this.onBlur(onBlur);
    }
  }

  /** @description 键盘事件 */
  private onKeyDown(event: KeyboardEvent) {
    if (!this.isFocused) return;
    if (event.key === "Backspace") {
      if (this.cursorIndex > 0) {
        this.cursorIndex--;
        this.updateCursorPos();
      }
    }
  }

  /** @description 更新光标位置 */
  private updateCursorPos() {
    input.setSelectionRange(input.value.length, input.value.length);
    const metrics = PIXI.TextMetrics.measureText(
      this.content.slice(0, this.cursorIndex),
      this.text.style,
    );

    let xPos = 10 + metrics.width;

    if (this.align === "center") {
      const textWidth = PIXI.TextMetrics.measureText(this.content, this.text.style).width;
      xPos = (this.width - textWidth) / 2 + metrics.width;
    }

    this.cursorLine.position.set(xPos, this.text.y);
  }
}

/** @description 创建光标 */
class CursorLine extends LibRectBgColor {
  /** 光标闪烁定时器 */
  private cursorBlinkTicker: PIXI.Ticker;
  /** 是否处于聚焦 */
  private isFocused = false;

  constructor(bgColor: string, height: number) {
    super({
      width: 2,
      height,
      bgColor,
    });

    this.eventMode = "static";

    // 光标闪烁
    this.cursorBlinkTicker = new PIXI.Ticker();
    this.cursorBlinkTicker.add(() => {
      if (this.isFocused) {
        this.alpha = Math.sin(Date.now() / 200) > 0 ? 1 : 0;
      }
    });
    this.cursorBlinkTicker.start();
  }

  /** @description 设置光标状态 */
  setCursorState(isFocused: boolean) {
    this.isFocused = isFocused;

    if (isFocused) {
      this.alpha = 1;
      this.cursorBlinkTicker.start();
    } else {
      this.alpha = 0;
      this.cursorBlinkTicker.stop();
    }
  }
}
