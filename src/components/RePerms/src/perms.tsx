import { defineComponent, Fragment, ref, onMounted } from "vue";

// 延迟加载 hasPerms 函数，避免循环依赖
let hasPermsFn: ((value: any) => boolean) | null = null;
let loadingPerms = false;

async function loadHasPerms() {
  if (hasPermsFn || loadingPerms) return;
  loadingPerms = true;
  try {
    const module = await import("@/utils/auth");
    hasPermsFn = module.hasPerms;
  } catch (error) {
    console.error("Failed to load hasPerms:", error);
  } finally {
    loadingPerms = false;
  }
}

export default defineComponent({
  name: "Perms",
  props: {
    value: {
      type: undefined,
      default: []
    }
  },
  setup(props, { slots }) {
    const isReady = ref(false);

    onMounted(async () => {
      await loadHasPerms();
      isReady.value = true;
    });

    // 立即尝试加载（如果可能）
    loadHasPerms().then(() => {
      isReady.value = true;
    });

    return () => {
      if (!slots) return null;
      if (!isReady.value || !hasPermsFn) {
        // 如果还没有加载完成，返回 null（不渲染内容）
        return null;
      }
      return hasPermsFn(props.value) ? (
        <Fragment>{slots.default?.()}</Fragment>
      ) : null;
    };
  }
});
