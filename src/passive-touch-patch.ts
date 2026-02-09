/**
 * 为 touchstart/touchmove 默认添加 passive: true，消除 Chrome 的 non-passive 警告，
 * 并提升滚动流畅度。wheel 不强制 passive，避免 Element Plus virtual-list 等组件内
 * preventDefault() 触发 "Unable to preventDefault inside passive event listener" 警告。
 */
const supportsPassive = (() => {
  let supported = false;
  try {
    const opts = Object.defineProperty({}, "passive", {
      get() {
        supported = true;
        return false;
      }
    });
    window.addEventListener("test", null as any, opts);
    window.removeEventListener("test", null as any, opts);
  } catch {
    // ignore
  }
  return supported;
})();

if (supportsPassive && typeof window !== "undefined") {
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const passiveScrollBlockingEvents = ["touchstart", "touchmove"];

  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    if (passiveScrollBlockingEvents.includes(type)) {
      const opts: AddEventListenerOptions =
        typeof options === "object" && options !== null
          ? { ...options }
          : { capture: !!options };
      if (opts.passive === undefined) {
        opts.passive = true;
      }
      return originalAddEventListener.call(this, type, listener, opts);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
}
