export type TaskListSegment = "all" | "todo" | "doing" | "done";

export interface TaskListFilter {
  segment: TaskListSegment;
  overdueOnly?: boolean;
}

const SEGMENT_LABELS: Record<TaskListSegment, string> = {
  all: "全部",
  todo: "待办",
  doing: "进行中",
  done: "已完成"
};

export function getTaskSegmentLabel(segment: TaskListSegment) {
  return SEGMENT_LABELS[segment] || "全部";
}

export function isValidTaskSegment(value: string): value is TaskListSegment {
  return value === "all" || value === "todo" || value === "doing" || value === "done";
}
