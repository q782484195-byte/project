import type { Directive, DirectiveBinding } from "vue";
import { nextTick } from "vue";

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

// 检查权限并移除元素的辅助函数
async function checkAndRemoveElement(el: HTMLElement, value: string | Array<string>, retryCount = 0) {
  if (!value) return;

  // 确保 hasPerms 函数已加载
  await loadHasPerms();

  // 如果 hasPerms 函数还没有加载完成，等待并重试（最多重试5次，每次等待100ms）
  if (!hasPermsFn && retryCount < 5) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return checkAndRemoveElement(el, value, retryCount + 1);
  }

  // 如果还是没有加载完成，直接返回（避免无限重试）
  if (!hasPermsFn) {
    console.warn('[Directive: perms]: hasPerms function not loaded after retries');
    // 恢复显示（如果加载失败，默认显示，避免完全隐藏）
    el.style.display = '';
    el.style.visibility = '';
    return;
  }

  // 检查权限
  if (!hasPermsFn(value)) {
    // 如果没有权限，移除元素
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  } else {
    // 如果有权限，恢复显示
    el.style.display = '';
    el.style.visibility = '';
  }
}

export const perms: Directive = {
  beforeMount(el: HTMLElement, binding: DirectiveBinding<string | Array<string>>) {
    // 在元素挂载之前就隐藏，避免闪烁
    const { value } = binding;
    if (value) {
      el.style.display = 'none';
      el.style.visibility = 'hidden';
    }
  },
  async mounted(el: HTMLElement, binding: DirectiveBinding<string | Array<string>>) {
    const { value } = binding;
    if (value) {
      // 使用 nextTick 确保在 DOM 更新后再检查权限
      await nextTick();
      await checkAndRemoveElement(el, value);
    } else {
      throw new Error(
        "[Directive: perms]: need perms! Like v-perms=\"['btn.add','btn.edit']\""
      );
    }
  },
  async updated(el: HTMLElement, binding: DirectiveBinding<string | Array<string>>) {
    const { value } = binding;
    if (value) {
      // 如果元素已经被移除，不需要再检查
      if (!el.parentNode) return;
      await nextTick();
      await checkAndRemoveElement(el, value);
    }
  }
};
