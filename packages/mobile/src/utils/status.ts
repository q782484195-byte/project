/** 任务状态 → 标签样式类名 */
export type StatusTone = "primary" | "success" | "warning" | "danger" | "info";

export type StatusBarTone = "todo" | "doing" | "test" | "done" | "block";

const STATUS_TONE_MAP: Record<string, StatusTone> = {
  草稿: "info",
  进行中: "primary",
  已完成: "success",
  已取消: "danger",
  逾期: "danger",
  待分配给部门负责人: "primary",
  待指派给成员: "primary",
  任务未开始: "info",
  待办: "info",
  任务进行中: "primary",
  待测试: "warning",
  测试中: "warning",
  测试完毕: "success",
  待审阅: "primary",
  审阅中: "warning",
  审阅完毕: "success",
  测试未通过: "danger",
  审阅未通过: "danger",
  未完成: "warning",
  阻塞: "danger"
};

const PRIORITY_TONE_MAP: Record<string, StatusTone> = {
  低: "info",
  中: "info",
  高: "danger",
  紧急: "danger",
  low: "info",
  medium: "info",
  high: "danger"
};

const STATUS_BAR_MAP: Record<string, StatusBarTone> = {
  待办: "todo",
  任务未开始: "todo",
  草稿: "todo",
  进行中: "doing",
  任务进行中: "doing",
  待测试: "test",
  测试中: "test",
  待审阅: "test",
  已完成: "done",
  测试完毕: "done",
  审阅完毕: "done",
  逾期: "block",
  阻塞: "block",
  测试未通过: "block",
  审阅未通过: "block"
};

const SHOW_COLOR_BG: Record<string, string> = {
  red: "#fef2f2",
  green: "#f0fdf4",
  blue: "#eff6ff",
  yellow: "#fefce8",
  orange: "#fff7ed",
  purple: "#f5f3ff",
  gray: "#f8fafc",
  grey: "#f8fafc",
  pink: "#fdf2f8",
  cyan: "#ecfeff"
};

export function getStatusTone(status?: string): StatusTone {
  if (!status) return "info";
  return STATUS_TONE_MAP[status] ?? "info";
}

export function getPriorityTone(priority?: string): StatusTone {
  if (!priority) return "info";
  return PRIORITY_TONE_MAP[priority] ?? "info";
}

export function getStatusBarTone(status?: string): StatusBarTone {
  if (!status) return "todo";
  return STATUS_BAR_MAP[status] ?? "todo";
}

export function getShowColorBg(showColor?: string): string | undefined {
  if (!showColor) return undefined;
  return SHOW_COLOR_BG[showColor.trim().toLowerCase()];
}
