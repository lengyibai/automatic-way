import { Graphics, type Container, type DisplayObjectEvents } from "pixi.js";

/**
 * 为容器创建并应用一个矩形蒙版，用于隐藏溢出的内容
 * @param container 需要设置蒙版的容器
 */
export const _overflowHidden = (container: Container) => {
  const mask = new Graphics();
  mask.beginFill(0xffffff); // 创建一个白色矩形
  mask.drawRect(0, 0, container.width, container.height);
  mask.endFill();
  container.addChild(mask); // 将蒙版添加到容器
  container.mask = mask; // 设置蒙版
  return mask;
};

/** @description 设置事件 */
export const _setEvent = (
  v: Container,
  eventName: keyof DisplayObjectEvents,
  callback: (...args: any) => void
) => {
  v.cursor = "pointer";
  v.eventMode = "static";
  v.on(eventName, callback);
};

/**
 * @description 按照指定方向（水平或垂直）排列元素，支持固定间隔或自定义每个间隔。
 * @param items 要排列的元素数组。
 * @param gap 元素之间的间隔，可以是固定间隔或自定义的间隔数组。
 * @param direction 排列方向，"x"表示水平，"y"表示垂直，默认为水平。
 */
export const _arrangeLinear = (
  items: Container[],
  gap: number | number[],
  direction: "x" | "y" = "x"
) => {
  if (Array.isArray(gap)) {
    if (gap.length !== items.length - 1) {
      console.error(new Error("间隔的数组长度只能等于元素数组长度-1"));
      return;
    }
  }
  let lastPosition = 0;
  items.forEach((item, index) => {
    const position =
      index === 0
        ? 0
        : lastPosition + (Array.isArray(gap) ? gap[index - 1] : gap);

    if (direction === "x") {
      item.x = position;
      lastPosition = item.x + item.width;
    } else {
      item.y = position;
      lastPosition = item.y + item.height;
    }
  });
};
