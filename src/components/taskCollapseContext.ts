import type { InjectionKey, ComputedRef } from "vue";

export interface TaskCollapseNode {
  key: string;
  title: string;
  path: string[];
  depth: number;
  node: Record<string, any>;
  children: TaskCollapseNode[];
  taskList: any[];
  processedTasks: any[];
  taskCount: number;
  hasTasks: boolean;
}

export interface TaskCollapseContext {
  expandedKeys: { value: string[] };
  isMobile: ComputedRef<boolean>;
  username: string;
  isAdmin: boolean;
  isProjectManager: boolean;
  getGroupIndentPx: (depth: number) => number;
  getTaskIndentPx: (depth: number) => number;
  getStatusType: (status: string) => "success" | "info" | "warning" | "danger" | "";
  getPriorityType: (priority: string) => "success" | "info" | "warning" | "danger" | "";
  operationColWidth: (buttonCount: number) => number;
  hasPerms: (perms: string[]) => boolean;
  isPendingAssignStatus: (status: string) => boolean;
  canRecordBug: (status: string) => boolean;
  onCommand: (command: string, row: any) => void;
}

export const TASK_COLLAPSE_CTX_KEY: InjectionKey<TaskCollapseContext> = Symbol("taskCollapseCtx");

/** 任务表格列宽（表头与表体共用，保证竖线对齐） */
export const TASK_TABLE_COLUMN_WIDTHS = {
  primary: 120,
  secondary: 120,
  department: 100,
  assignee: 120,
  status: 100,
  priority: 90,
  assignTime: 140,
  remark: 180,
  deadline: 140
} as const;

/** 仅含一条任务的叶子节点：不展示外层折叠标题 */
export const isSingleTaskLeaf = (node: TaskCollapseNode) => node.hasTasks && node.taskCount === 1;

/** 需要折叠标题的节点：仅有子层级的结构分组 */
export const shouldShowCollapseItem = (node: TaskCollapseNode) => node.children.length > 0;

/** 多任务叶子节点：标题在表格首行展示 */
export const isMultiTaskLeaf = (node: TaskCollapseNode) =>
  node.hasTasks && node.taskCount > 1 && node.children.length === 0;

/** 任务行一级分类：单任务/多任务分组标题展示在表格内 */
export const getTaskPrimaryCategory = (node: TaskCollapseNode, row?: any): string => {
  if (row?._isGroupHeader) {
    return node.title || node.path[node.path.length - 1] || "-";
  }
  if (isSingleTaskLeaf(node)) {
    return node.title || node.path[node.path.length - 1] || "-";
  }
  return "";
};

/** 任务行二级分类：多任务分组展示各任务名称，其余留空 */
export const getTaskSecondaryCategory = (node: TaskCollapseNode, row?: any): string => {
  if (row?._isGroupHeader || isSingleTaskLeaf(node)) {
    return "";
  }
  const taskName = row?.任务名 || row?.task_name || row?.title || "";
  return taskName || "-";
};

/** 任务行部门（仅取 department 字段，无值留空） */
export const getTaskDepartment = (row?: any): string => {
  if (!row || row._isGroupHeader) return "";
  const dept = row.department;
  return dept ? String(dept) : "";
};

/** 任务备注（兼容 remark / 备注） */
export const getTaskRemark = (row?: any): string => {
  if (!row || row._isGroupHeader) return "";
  const value = row.remark ?? row.备注;
  return value == null ? "" : String(value);
};
