import type { MobileTask } from "@/utils/task-mapper";
import type { TaskListSegment } from "@/utils/task-filter";

export const TODO_STATUSES = ["待办", "任务未开始", "逾期"];
export const DOING_STATUSES = [
  "任务进行中",
  "进行中",
  "待测试",
  "测试中",
  "待审阅",
  "审阅中"
];
export const DONE_STATUSES = ["已完成", "测试完毕", "审阅完毕"];

export function matchTaskSegment(
  task: Pick<MobileTask, "status" | "overdue">,
  segment: TaskListSegment,
  overdueOnly = false
) {
  if (overdueOnly && !task.overdue) return false;

  if (segment === "all") {
    return !overdueOnly || !!task.overdue;
  }
  if (segment === "todo") {
    return TODO_STATUSES.includes(task.status);
  }
  if (segment === "doing") {
    return DOING_STATUSES.includes(task.status);
  }
  if (segment === "done") {
    return DONE_STATUSES.includes(task.status);
  }
  return true;
}

export function filterTasksBySegment(
  tasks: MobileTask[],
  segment: TaskListSegment,
  overdueOnly = false
) {
  return tasks.filter((task) => matchTaskSegment(task, segment, overdueOnly));
}

export function countTasksBySegment(
  tasks: MobileTask[],
  segment: TaskListSegment,
  overdueOnly = false
) {
  return filterTasksBySegment(tasks, segment, overdueOnly).length;
}

export function countOverdueTasks(tasks: MobileTask[]) {
  return tasks.filter((task) => task.overdue).length;
}

export function summarizeTaskSegments(tasks: MobileTask[]) {
  return {
    overdue: countOverdueTasks(tasks),
    todo: countTasksBySegment(tasks, "todo"),
    doing: countTasksBySegment(tasks, "doing"),
    done: countTasksBySegment(tasks, "done")
  };
}
