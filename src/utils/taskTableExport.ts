import XLSX from "xlsx-js-style";
import {
  getTaskPrimaryCategory,
  getTaskSecondaryCategory,
  getTaskDepartment,
  isMultiTaskLeaf,
  shouldShowCollapseItem,
  TASK_TABLE_COLUMN_WIDTHS,
  type TaskCollapseNode
} from "@/components/taskCollapseContext";

type ExportRowKind =
  | "rootSection"
  | "nestedSection"
  | "columnHeader"
  | "groupHeader"
  | "task";

interface ExportRow {
  kind: ExportRowKind;
  cells: string[];
  mergeAll?: boolean;
}

const COLUMN_HEADERS = [
  "一级分类",
  "二级分类",
  "部门",
  "责任人",
  "状态",
  "优先级",
  "任务分配时间",
  "任务完成期限"
] as const;

function buildTaskCells(node: TaskCollapseNode, task: any): string[] {
  return [
    getTaskPrimaryCategory(node, task),
    getTaskSecondaryCategory(node, task),
    getTaskDepartment(task),
    String(task.当前处理人 || task.assignee || "-"),
    String(task.状态 || task.status || "-"),
    String(task.优先级 || task.priority || "-"),
    String(task.create_time || "-"),
    String(task.task_deadline || "-")
  ];
}

function appendNodeTaskRows(rows: ExportRow[], node: TaskCollapseNode) {
  if (isMultiTaskLeaf(node)) {
    const groupTitle = getTaskPrimaryCategory(node, { _isGroupHeader: true });
    rows.push({
      kind: "groupHeader",
      cells: [groupTitle, "", "", "", "", "", "", ""]
    });
  }

  node.processedTasks.forEach(task => {
    rows.push({
      kind: "task",
      cells: buildTaskCells(node, task)
    });
  });
}

function walkNodes(rows: ExportRow[], nodes: TaskCollapseNode[]) {
  nodes.forEach(node => {
    if (shouldShowCollapseItem(node)) {
      rows.push({
        kind: "nestedSection",
        mergeAll: true,
        cells: [node.title]
      });

      if (node.children.length > 0) {
        walkNodes(rows, node.children);
      }
      if (node.hasTasks && node.children.length === 0) {
        appendNodeTaskRows(rows, node);
      }
    } else if (node.hasTasks) {
      appendNodeTaskRows(rows, node);
    }
  });
}

/** 按页面表格层级与列结构构建导出行 */
export function buildTaskTableExportRows(roots: TaskCollapseNode[]): ExportRow[] {
  const rows: ExportRow[] = [];

  roots.forEach(root => {
    rows.push({
      kind: "rootSection",
      mergeAll: true,
      cells: [root.title]
    });

    rows.push({
      kind: "columnHeader",
      cells: [...COLUMN_HEADERS]
    });

    if (root.children.length > 0) {
      walkNodes(rows, root.children);
    }
    if (root.hasTasks && root.children.length === 0) {
      appendNodeTaskRows(rows, root);
    }
  });

  return rows;
}

export function countTaskExportRows(rows: ExportRow[]): number {
  return rows.filter(row => row.kind === "task").length;
}

/** 导出与页面表格一致的结构（无额外样式与背景色） */
export function exportTaskTableToExcel(
  roots: TaskCollapseNode[],
  filename: string,
  projectName?: string
) {
  const exportRows = buildTaskTableExportRows(roots);
  if (!exportRows.length) return 0;

  const worksheet: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];
  let taskRowIndex = 0;
  const rowOffset = projectName ? 1 : 0;

  if (projectName) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
    worksheet[cellRef] = { v: projectName, t: "s" };
  }

  exportRows.forEach((row, rowIndex) => {
    const actualRowIndex = rowIndex + rowOffset;

    if (row.mergeAll) {
      const cellRef = XLSX.utils.encode_cell({ r: actualRowIndex, c: 0 });
      worksheet[cellRef] = { v: row.cells[0] ?? "", t: "s" };
      merges.push({
        s: { r: actualRowIndex, c: 0 },
        e: { r: actualRowIndex, c: COLUMN_HEADERS.length - 1 }
      });
      return;
    }

    row.cells.forEach((value, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: actualRowIndex, c: colIndex });
      worksheet[cellRef] = { v: value, t: "s" };
    });

    if (row.kind === "task") {
      taskRowIndex += 1;
    }
  });

  worksheet["!cols"] = [
    { wch: Math.round(TASK_TABLE_COLUMN_WIDTHS.primary / 7) },
    { wch: Math.round(TASK_TABLE_COLUMN_WIDTHS.secondary / 7) },
    { wch: Math.round(TASK_TABLE_COLUMN_WIDTHS.department / 7) },
    { wch: Math.round(TASK_TABLE_COLUMN_WIDTHS.assignee / 7) },
    { wch: Math.round(TASK_TABLE_COLUMN_WIDTHS.status / 7) },
    { wch: Math.round(TASK_TABLE_COLUMN_WIDTHS.priority / 7) },
    { wch: Math.round(TASK_TABLE_COLUMN_WIDTHS.assignTime / 7) },
    { wch: Math.round(TASK_TABLE_COLUMN_WIDTHS.deadline / 7) }
  ];
  worksheet["!merges"] = merges;
  worksheet["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: exportRows.length - 1 + rowOffset, c: COLUMN_HEADERS.length - 1 }
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "任务列表");
  XLSX.writeFile(workbook, filename);

  return taskRowIndex;
}
