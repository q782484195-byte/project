import type { Directive, DirectiveBinding } from "vue";

// 延迟加载 hasAuth 函数，避免循环依赖
let hasAuthFn: ((value: any) => boolean) | null = null;
let loadingAuth = false;

async function loadHasAuth() {
  if (hasAuthFn || loadingAuth) return;
  loadingAuth = true;
  try {
    const module = await import("@/router/utils");
    hasAuthFn = module.hasAuth;
  } catch (error) {
    console.error("Failed to load hasAuth for directive:", error);
  } finally {
    loadingAuth = false;
  }
}

export const auth: Directive = {
  async mounted(el: HTMLElement, binding: DirectiveBinding<string | Array<string>>) {
    const { value } = binding;
    if (value) {
      // 确保 hasAuth 函数已加载
      await loadHasAuth();
      if (hasAuthFn && !hasAuthFn(value)) {
        el.parentNode?.removeChild(el);
      }
    } else {
      throw new Error(
        "[Directive: auth]: need auths! Like v-auth=\"['btn.add','btn.edit']\""
      );
    }
  }
};
