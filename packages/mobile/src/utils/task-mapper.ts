import type { TaskListItem } from "@/api/types";
import { getPriorityTone, getStatusTone } from "@/utils/status";
import type { StatusTone } from "@/utils/status";

export interface MobileTaskTag {
  label: string;
  tone: StatusTone;
}

export interface MobileTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: string;
  projectId: string;
  progress: number;
  dueDate: string;
  assignee: string;
  collaborators?: string;
  description: string;
  overdue?: boolean;
  tags: MobileTaskTag[];
  meta: string;
}

function formatDateLabel(value?: string) {
  if (!value) return "-";
  const text = String(value).trim();
  if (!text) return "-";
  const datePart = text.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart.slice(5);
  }
  return text.length > 10 ? text.slice(0, 10) : text;
}

function isOverdue(deadline?: string, status?: string) {
  if (!deadline || !status) return false;
  if (["已完成", "已取消", "审阅完毕", "测试完毕"].includes(status)) return false;
  const end = new Date(deadline);
  if (Number.isNaN(end.getTime())) return status.includes("逾期");
  return end.getTime() < Date.now();
}

export function getTaskTitle(task: TaskListItem) {
  return String(task.任务名 || task.task_name || task.title || "未命名任务");
}

export function getTaskStatus(task: TaskListItem) {
  return String(task.状态 || task.status || "待办");
}

export function getTaskPriority(task: TaskListItem) {
  return String(task.优先级 || task.priority || "中");
}

export function getTaskId(task: TaskListItem) {
  return String(task._id || task.id || "");
}

export function getTaskDescription(task: TaskListItem) {
  const describe = task.describe;
  if (Array.isArray(describe)) {
    return describe
      .map((item) => (typeof item === "object" ? item?.content : ""))
      .filter(Boolean)
      .join("\n");
  }
  if (typeof describe === "string") return describe;
  if (typeof task.description === "string") return task.description;
  if (typeof task.content === "string") return task.content;
  return "";
}

export function mapTaskToMobile(task: TaskListItem): MobileTask {
  const status = getTaskStatus(task);
  const priority = getTaskPriority(task);
  const dueRaw = String(task.task_deadline || task.task_dead_line || "");
  const dueDate = formatDateLabel(dueRaw);
  const progress = Number(task.进度 ?? task.progress ?? 0) || 0;
  const overdue = isOverdue(dueRaw, status);

  const tags: MobileTaskTag[] = [
    { label: overdue ? "逾期" : status, tone: overdue ? "danger" : getStatusTone(status) }
  ];
  if (priority) {
    tags.push({ label: priority, tone: getPriorityTone(priority) });
  }

  return {
    id: getTaskId(task),
    title: getTaskTitle(task),
    status: overdue ? "逾期" : status,
    priority,
    project: String(task.project_name || task.requirement_name || "未关联项目"),
    projectId: String(task.project_id || ""),
    progress,
    dueDate,
    assignee: String(task.当前处理人 || task.default_person || task.creator || "-"),
    collaborators: String(task.指派人 || task.指派给 || ""),
    description: getTaskDescription(task),
    overdue,
    tags,
    meta: `${progress}% · ${dueDate}`
  };
}
