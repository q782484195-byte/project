import { ref, nextTick, type Ref } from "vue";

export function useTableFullscreen(onResize?: () => void) {
  const isFullscreen = ref(false);

  async function toggleFullscreen() {
    isFullscreen.value = !isFullscreen.value;
    await nextTick();
    onResize?.();
  }

  function handleFullscreenChange(value: boolean) {
    isFullscreen.value = value;
    nextTick(() => onResize?.());
  }

  return {
    isFullscreen,
    toggleFullscreen,
    handleFullscreenChange
  };
}

export function recalcTableHeightInFullscreen(
  containerRef: Ref<HTMLElement | { $el?: HTMLElement } | null | undefined>,
  tableHeight: Ref<number>,
  options: {
    isFullscreen: boolean;
    minHeight?: number;
    offset?: number;
  }
) {
  nextTick(() => {
    const el =
      containerRef.value instanceof HTMLElement
        ? containerRef.value
        : (containerRef.value as { $el?: HTMLElement })?.$el;

    if (!el) return;

    if (options.isFullscreen) {
      const toolbarHeight = 48;
      const padding = 32;
      tableHeight.value = Math.max(
        options.minHeight ?? 400,
        window.innerHeight - toolbarHeight - padding
      );
      return;
    }

    const rect = el.getBoundingClientRect();
    const offset = options.offset ?? 80;
    tableHeight.value = Math.max(
      options.minHeight ?? 400,
      window.innerHeight - rect.top - offset
    );
  });
}
