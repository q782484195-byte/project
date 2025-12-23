import type { Directive, DirectiveBinding } from "vue";

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
    console.error("Failed to load hasPerms for directive:", error);
  } finally {
    loadingPerms = false;
  }
}

export const perms: Directive = {
  async mounted(el: HTMLElement, binding: DirectiveBinding<string | Array<string>>) {
    const { value } = binding;
    if (value) {
      // 确保 hasPerms 函数已加载
      await loadHasPerms();
      if (hasPermsFn && !hasPermsFn(value)) {
        el.parentNode?.removeChild(el);
      }
    } else {
      throw new Error(
        "[Directive: perms]: need perms! Like v-perms=\"['btn.add','btn.edit']\""
      );
    }
  }
};
