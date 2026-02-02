/**
 * 为 touchstart/touchmove/wheel 默认添加 passive: true，消除 Chrome 的 non-passive 警告，
 * 并提升滚动流畅度。若某处需要 preventDefault()（如自定义横向滚轮），请显式使用 { passive: false }。
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
    window.removeEventListener("test", null as any);
  } catch {
    // ignore
  }
  return supported;
})();

if (supportsPassive && typeof window !== "undefined") {
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const passiveScrollBlockingEvents = ["touchstart", "touchmove", "wheel"];

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
