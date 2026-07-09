/** 任务状态 → 标签样式类名 */
export type StatusTone = "primary" | "success" | "warning" | "danger" | "info";

const STATUS_TONE_MAP: Record<string, StatusTone> = {
  草稿: "info",
  进行中: "warning",
  已完成: "success",
  已取消: "danger",
  待分配给部门负责人: "primary",
  待指派给成员: "primary",
  任务未开始: "info",
  任务进行中: "warning",
  待测试: "primary",
  测试中: "warning",
  测试完毕: "success",
  待审阅: "primary",
  审阅中: "warning",
  审阅完毕: "success",
  测试未通过: "danger",
  审阅未通过: "danger",
  未完成: "warning"
};

const PRIORITY_TONE_MAP: Record<string, StatusTone> = {
  低: "info",
  中: "warning",
  高: "danger",
  紧急: "danger",
  low: "info",
  medium: "warning",
  high: "danger"
};

const SHOW_COLOR_BG: Record<string, string> = {
  red: "#fef0f0",
  green: "#f0f9eb",
  blue: "#ecf5ff",
  yellow: "#fdfce6",
  orange: "#fdf6ec",
  purple: "#f5f0ff",
  gray: "#f4f4f5",
  grey: "#f4f4f5",
  pink: "#fef0f5",
  cyan: "#e8f8f8"
};

export function getStatusTone(status?: string): StatusTone {
  if (!status) return "info";
  return STATUS_TONE_MAP[status] ?? "info";
}

export function getPriorityTone(priority?: string): StatusTone {
  if (!priority) return "info";
  return PRIORITY_TONE_MAP[priority] ?? "info";
}

export function getShowColorBg(showColor?: string): string | undefined {
  if (!showColor) return undefined;
  return SHOW_COLOR_BG[showColor.trim().toLowerCase()];
}
