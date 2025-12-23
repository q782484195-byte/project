import { defineComponent, Fragment, ref, onMounted } from "vue";

// 延迟加载 hasAuth 函数，避免循环依赖和初始化顺序问题
let hasAuthFn: ((value: any) => boolean) | null = null;
let loadingAuth = false;

async function loadHasAuth() {
  if (hasAuthFn || loadingAuth) return;
  loadingAuth = true;
  try {
    const module = await import("@/router/utils");
    hasAuthFn = module.hasAuth;
  } catch (error) {
    console.error("Failed to load hasAuth:", error);
  } finally {
    loadingAuth = false;
  }
}

export default defineComponent({
  name: "Auth",
  props: {
    value: {
      type: undefined,
      default: []
    }
  },
  setup(props, { slots }) {
    const isReady = ref(false);

    onMounted(async () => {
      await loadHasAuth();
      isReady.value = true;
    });

    // 立即尝试加载（如果可能）
    loadHasAuth().then(() => {
      isReady.value = true;
    });

    return () => {
      if (!slots) return null;
      if (!isReady.value || !hasAuthFn) {
        // 如果还没有加载完成，返回 null（不渲染内容）
        return null;
      }
      return hasAuthFn(props.value) ? (
        <Fragment>{slots.default?.()}</Fragment>
      ) : null;
    };
  }
});
