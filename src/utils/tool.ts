/** @description Promise定时器
 * @param delay 延迟时间
 * @param fn 延迟后执行的函数
 */
export const _promiseTimeout = (delay = 1, fn?: () => void) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      fn?.();
      resolve();
    }, delay);
  });
};
