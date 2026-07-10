import type { TaskListItem } from "@/api/types";

const TRANSFER_STATE_DICT: Record<string, { field: string }> = {
  任务进行中: { field: "指派人" },
  项目测试任务进行中: { field: "测试部负责人" },
  测试任务进行中: { field: "测试部负责人" }
};

export function isCurrentUser(
  value: string | undefined | null,
  username: string,
  nickname?: string
) {
  const text = String(value || "").trim();
  if (!text) return false;
  return text === username || (!!nickname && text === nickname);
}

export function canTransferTask(
  task: TaskListItem | null | undefined,
  username: string,
  nickname?: string
) {
  if (!task || !username) return false;
  const status = String(task.状态 || task.status || "");
  const config = TRANSFER_STATE_DICT[status];
  if (!config) return false;
  const fieldValue = String(task[config.field] || "").trim();
  return isCurrentUser(fieldValue, username, nickname);
}

export function canFlowTask(
  task: TaskListItem | null | undefined,
  username: string,
  nickname?: string
) {
  if (!task || !username) return false;
  const handler = String(
    task.当前处理人 || task.current_handler || task.assignee || ""
  ).trim();
  if (handler && !isCurrentUser(handler, username, nickname)) return false;
  const nextState = task.next_state;
  return Array.isArray(nextState) && nextState.length > 0;
}

export function getTaskRawStatus(task: TaskListItem) {
  return String(task.状态 || task.status || "");
}

export function getTaskHandler(task: TaskListItem) {
  return String(task.当前处理人 || task.current_handler || task.assignee || "-");
}
